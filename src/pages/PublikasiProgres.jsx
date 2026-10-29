import { useEffect, useMemo, useRef, useState } from 'react'
import Layout from '../components/Layout'
import SafeImage from '../components/SafeImage'
import AuthenticatedImage from '../components/AuthenticatedImage'
import {
  getLaporanDinasBackend,
  getDetailLaporanDinas,
  mulaiPenangananLaporan,
  simpanBuktiPenanganan,
} from '../services/laporanService'
import { getArtikelJalan, buatArtikelJalan, hapusArtikelJalan } from '../services/artikelService'
import { USE_DEMO_DATA, DEMO_REPORTS, DEMO_ARTICLES } from '../data/demoPublikasi'
import '../css/PublikasiProgres.css'

const CATEGORY_LABELS = {
  PJU_MATI: 'PJU mati',
  PJU_RUSAK: 'PJU rusak',
  PJU_TIDAK_ADA: 'PJU tidak tersedia',
  LAINNYA: 'Lainnya',
}

const STAGES = [
  { key: 'baru', label: 'Perlu penanganan' },
  { key: 'proses', label: 'Dalam penanganan' },
  { key: 'verifikasi', label: 'Menunggu validasi AI' },
  { key: 'selesai', label: 'Selesai ditangani' },
]
const STAGE_LABEL = Object.fromEntries(STAGES.map((s) => [s.key, s.label]))

const LIGHTING_LABELS = {
  gelap: 'Gelap / bermasalah',
  redup: 'Redup',
  baik: 'Baik',
  belum_diketahui: 'Belum diketahui',
}
const LIGHTING_OPTIONS = Object.entries(LIGHTING_LABELS).map(([value, label]) => ({ value, label }))

const ARTICLE_CATEGORIES = {
  KECELAKAAN: 'Kecelakaan',
  KRIMINALITAS: 'Rawan Kriminalitas',
  PJU: 'Lampu Jalan (PJU)',
  LAINNYA: 'Lainnya',
}
const EMPTY_FORM = { judul: '', kategori: 'KRIMINALITAS', lokasi: '', isi: '', sumber_url: '' }

const PHOTO_TYPES = ['image/jpeg', 'image/png', 'image/webp']
const MAX_PHOTO_MB = 5
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms))
const isHttpUrl = (value) => /^https?:\/\//i.test(value || '')

// Satu sumber kebenaran untuk tahap laporan (status_penanganan didahulukan, sama seperti MonitoringPeta)
function getStage(report) {
  const key = report?.status_penanganan || report?.status
  if (['selesai', 'selesai_ditangani'].includes(key)) return 'selesai'
  if (key === 'menunggu_verifikasi') return 'verifikasi'
  if (['diproses', 'dalam_penanganan'].includes(key)) return 'proses'
  return 'baru'
}

const timeOf = (report) => new Date(report.updated_at || report.tanggal_laporan).getTime() || 0

function formatDate(value) {
  if (!value) return 'Waktu tidak tersedia'
  const date = new Date(value)
  return Number.isNaN(date.getTime())
    ? 'Waktu tidak tersedia'
    : date.toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' })
}

// URL blob: (pratinjau lokal) tidak bisa lewat AuthenticatedImage
function EvidenceImage({ src, alt, fallback }) {
  if (!src) return null
  return src.startsWith('blob:')
    ? <img src={src} alt={alt} className="pp-photo" />
    : <AuthenticatedImage src={src} alt={alt} fallback={fallback} />
}

/* ===================== Form perbarui status ===================== */
function UpdatePanel({ report, stage, onUpdated }) {
  const [note, setNote] = useState('')
  const [lighting, setLighting] = useState('baik')
  const [photo, setPhoto] = useState(null)
  const [preview, setPreview] = useState('')
  const [state, setState] = useState('idle') // idle | saving | success | error
  const [message, setMessage] = useState('')
  const previewRef = useRef('')
  const handedOff = useRef(false) // pratinjau dipakai laporan (mode demo), jangan dicabut

  useEffect(() => () => {
    if (previewRef.current && !handedOff.current) URL.revokeObjectURL(previewRef.current)
  }, [])

  // Aturan sama dengan MonitoringPeta/Laporan Warga. Mode demo hanya memakai tahap.
  const canStart = USE_DEMO_DATA
    ? stage === 'baru'
    : report.status === 'diterima' && report.status_penanganan === 'perlu_penanganan'
  const canUpload = USE_DEMO_DATA
    ? stage === 'proses'
    : report.status === 'diproses' && ['dalam_penanganan', 'menunggu_verifikasi'].includes(report.status_penanganan)

  const clearPhoto = () => {
    if (previewRef.current && !handedOff.current) URL.revokeObjectURL(previewRef.current)
    previewRef.current = ''
    setPhoto(null)
    setPreview('')
  }

  const handlePhoto = (event) => {
    const input = event.target
    const file = input.files && input.files[0]
    clearPhoto()
    setState('idle')
    setMessage('')
    if (!file) return
    if (!PHOTO_TYPES.includes(file.type)) {
      input.value = ''
      setState('error'); setMessage('Pilih foto JPEG, PNG, atau WebP.')
      return
    }
    if (file.size > MAX_PHOTO_MB * 1024 * 1024) {
      input.value = ''
      setState('error'); setMessage(`Ukuran foto maksimal ${MAX_PHOTO_MB} MB.`)
      return
    }
    const url = URL.createObjectURL(file)
    previewRef.current = url
    setPhoto(file)
    setPreview(url)
  }

  const fail = (error) => { setState('error'); setMessage(error?.message || 'Gagal memperbarui status. Coba lagi.') }

  const startHandling = async () => {
    setState('saving'); setMessage('')
    try {
      if (USE_DEMO_DATA) {
        await sleep(300)
        onUpdated(report.id_laporan, { status: 'diproses', status_penanganan: 'dalam_penanganan' })
      } else {
        await mulaiPenangananLaporan(report.id_laporan)
        onUpdated(report.id_laporan)
      }
      setState('success'); setMessage('Penanganan dimulai.')
    } catch (error) { fail(error) }
  }

  const canSubmit = note.trim().length >= 3 && Boolean(photo) && state !== 'saving'

  const submitProof = async (event) => {
    event.preventDefault()
    if (!canSubmit) return
    setState('saving'); setMessage('')
    try {
      if (USE_DEMO_DATA) {
        await sleep(400)
        handedOff.current = true
        onUpdated(report.id_laporan, {
          status: 'selesai',
          status_penanganan: 'selesai_ditangani',
          kondisi_penerangan: lighting,
          catatan_penanganan: note.trim(),
          foto_bukti_url: preview,
        })
        setPhoto(null); setPreview('')
        setMessage('Status laporan berhasil diperbarui (demo).')
      } else {
        await simpanBuktiPenanganan(report.id_laporan, {
          catatanPenanganan: note.trim(),
          kondisiPenerangan: lighting,
          fotoBukti: photo,
        })
        onUpdated(report.id_laporan)
        setMessage('Bukti tersimpan. Status selesai mengikuti hasil validasi AI otomatis.')
      }
      setState('success')
    } catch (error) { fail(error) }
  }

  return (
    <div className="pp-update">
      <h3>Perbarui status</h3>

      {stage === 'selesai' && !message && <p className="pp-note">Laporan ini sudah selesai ditangani.</p>}

      {canStart && (
        <>
          <p className="pp-note">Laporan sudah siap ditangani. Mulai penanganan agar bukti perbaikan bisa diunggah.</p>
          <button type="button" className="pp-btn pp-btn-primary" onClick={startHandling} disabled={state === 'saving'}>
            {state === 'saving' ? 'Menyimpan…' : 'Mulai penanganan'}
          </button>
        </>
      )}

      {canUpload && (
        <form onSubmit={submitProof} className="pp-form">
          {stage === 'verifikasi' && (
            <p className="pp-note">Bukti sebelumnya sedang divalidasi AI. Mengunggah bukti baru akan menggantikannya.</p>
          )}
          <label htmlFor="pp-note">Catatan perbaikan</label>
          <textarea id="pp-note" className="pp-input" rows="3" maxLength={2000} value={note} onChange={(e) => setNote(e.target.value)} placeholder="Jelaskan tindakan perbaikan yang dilakukan" required />

          <label htmlFor="pp-lighting">Kondisi penerangan setelah perbaikan</label>
          <select id="pp-lighting" className="pp-input" value={lighting} onChange={(e) => setLighting(e.target.value)}>
            {LIGHTING_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>

          <label htmlFor="pp-photo">Foto bukti perbaikan</label>
          <input id="pp-photo" type="file" className="pp-input" accept="image/jpeg,image/png,image/webp" onChange={handlePhoto} required />
          <small>JPEG, PNG, atau WebP, maksimal {MAX_PHOTO_MB} MB.</small>
          {preview && <img src={preview} alt="Pratinjau foto bukti perbaikan" className="pp-photo pp-photo-preview" />}

          <button type="submit" className="pp-btn pp-btn-primary" disabled={!canSubmit}>
            {state === 'saving' ? 'Menyimpan…' : 'Simpan bukti perbaikan'}
          </button>
        </form>
      )}

      {!canStart && !canUpload && stage !== 'selesai' && (
        <p className="pp-note">Laporan ini belum bisa ditangani. Penanganan baru terbuka setelah laporan tervalidasi AI.</p>
      )}

      {message && <p className={`pp-note pp-note-${state}`} role="status">{message}</p>}
    </div>
  )
}

/* ===================== Tab 1: progres laporan ===================== */
function ProgresTab() {
  const [reports, setReports] = useState(USE_DEMO_DATA ? DEMO_REPORTS : [])
  const [loading, setLoading] = useState(!USE_DEMO_DATA)
  const [loadError, setLoadError] = useState('')
  const [reloadKey, setReloadKey] = useState(0)
  const [search, setSearch] = useState('')
  const [stageFilter, setStageFilter] = useState('Semua')
  const [selectedId, setSelectedId] = useState('')
  const [detail, setDetail] = useState(null)
  const [detailLoading, setDetailLoading] = useState(false)
  const [detailError, setDetailError] = useState('')
  const detailRef = useRef(null)

  useEffect(() => {
    if (USE_DEMO_DATA) return undefined
    let active = true
    getLaporanDinasBackend()
      .then((data) => { if (active) { setReports(Array.isArray(data) ? data : []); setLoadError('') } })
      .catch((error) => { if (active) setLoadError(error?.message || 'Laporan gagal dimuat dari backend.') })
      .finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [reloadKey])

  const stageCounts = useMemo(() => {
    const counts = { baru: 0, proses: 0, verifikasi: 0, selesai: 0 }
    reports.forEach((r) => { counts[getStage(r)] += 1 })
    return counts
  }, [reports])

  const visible = useMemo(() => {
    const q = search.trim().toLocaleLowerCase()
    return reports
      .filter((r) => {
        if (stageFilter !== 'Semua' && getStage(r) !== stageFilter) return false
        if (!q) return true
        return [r.id_laporan, r.keterangan_lokasi, r.deskripsi, r.catatan_penanganan]
          .filter(Boolean).join(' ').toLocaleLowerCase().includes(q)
      })
      .sort((a, b) => timeOf(b) - timeOf(a))
  }, [reports, search, stageFilter])

  const selected = visible.find((r) => r.id_laporan === selectedId) || visible[0] || null
  const selectedKey = selected?.id_laporan

  useEffect(() => {
    if (USE_DEMO_DATA || !selectedKey) return undefined
    let active = true
    // eslint-disable-next-line react-hooks/set-state-in-effect -- loading state accompanies the detail request.
    setDetailLoading(true)
    setDetailError('')
    getDetailLaporanDinas(selectedKey)
      .then((result) => { if (active) setDetail(result) })
      .catch((error) => { if (active) { setDetail(null); setDetailError(error?.message || 'Detail progres gagal dimuat.') } })
      .finally(() => { if (active) setDetailLoading(false) })
    return () => { active = false }
  }, [selectedKey, reloadKey])

  // Abaikan detail milik laporan lain yang masih tersisa di state
  const fetched = detail?.laporan?.id_laporan === selectedKey ? detail : null
  const detailReport = USE_DEMO_DATA ? selected : (fetched?.laporan || selected)
  const progress = USE_DEMO_DATA ? [] : (fetched?.progres || [])
  const stage = detailReport ? getStage(detailReport) : 'baru'

  const selectReport = (id) => {
    setSelectedId(id)
    if (window.matchMedia('(max-width: 960px)').matches) {
      detailRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }

  // Demo: ubah state lokal. Backend: muat ulang daftar + detail supaya tidak ada data basi.
  const handleUpdated = (id, patch) => {
    if (USE_DEMO_DATA) setReports((prev) => prev.map((r) => (r.id_laporan === id ? { ...r, ...patch } : r)))
    else setReloadKey((k) => k + 1)
  }

  const retry = () => { setLoading(true); setReloadKey((k) => k + 1) }

  return (
    <>
      <div className="pp-toolbar">
        <input type="search" className="pp-input pp-search" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Cari ID laporan, lokasi, atau catatan" aria-label="Cari laporan" />
        <div className="pp-chips" role="group" aria-label="Filter status penanganan">
          <button type="button" className="pp-chip" aria-pressed={stageFilter === 'Semua'} onClick={() => setStageFilter('Semua')}>
            Semua <b>{reports.length}</b>
          </button>
          {STAGES.map((s) => (
            <button key={s.key} type="button" className="pp-chip" aria-pressed={stageFilter === s.key} onClick={() => setStageFilter(s.key)}>
              <i className={`pp-dot pp-tone-${s.key}`} />{s.label} <b>{stageCounts[s.key]}</b>
            </button>
          ))}
        </div>
      </div>

      {loading ? <div className="pp-empty">Memuat laporan dari backend…</div>
        : loadError ? <div className="pp-empty" role="alert"><p>{loadError}</p><button type="button" className="pp-btn" onClick={retry}>Coba lagi</button></div>
          : reports.length === 0 ? <div className="pp-empty">Belum ada laporan.</div>
            : (
              <div className="pp-split">
                <ul className="pp-list" aria-label="Daftar laporan">
                  {visible.length === 0 && <li className="pp-empty">Tidak ada laporan yang cocok dengan pencarian atau filter.</li>}
                  {visible.map((r) => {
                    const s = getStage(r)
                    return (
                      <li key={r.id_laporan}>
                        <button type="button" className="pp-item" aria-current={selected?.id_laporan === r.id_laporan} onClick={() => selectReport(r.id_laporan)}>
                          <i className={`pp-dot pp-tone-${s}`} />
                          <span className="pp-item-text">
                            <strong>{r.keterangan_lokasi || 'Lokasi tidak tersedia'}</strong>
                            <span>{CATEGORY_LABELS[r.kategori] || r.kategori} · {r.id_laporan}</span>
                            <span>{STAGE_LABEL[s]} · {formatDate(r.updated_at || r.tanggal_laporan)}</span>
                          </span>
                        </button>
                      </li>
                    )
                  })}
                </ul>

                <section className="pp-detail" ref={detailRef} aria-labelledby="pp-detail-title">
                  {selected && detailReport ? (
                    <>
                      <header className="pp-detail-head">
                        <div className="pp-detail-tags">
                          <span className={`pp-badge pp-tone-${stage}`}>{STAGE_LABEL[stage]}</span>
                          <span className="pp-id">{selected.id_laporan}</span>
                        </div>
                        <h2 id="pp-detail-title">{detailReport.keterangan_lokasi || 'Lokasi tidak tersedia'}</h2>
                        <p>{detailReport.deskripsi || 'Deskripsi tidak tersedia'}</p>
                      </header>

                      {detailLoading && <p className="pp-note" role="status">Memuat detail…</p>}
                      {detailError && <p className="pp-note pp-note-error" role="alert">{detailError}</p>}

                      <div className="pp-photos">
                        <figure>
                          <figcaption>Foto laporan awal</figcaption>
                          {detailReport.foto
                            ? <SafeImage src={detailReport.foto} alt={`Foto laporan awal ${selected.id_laporan}`} fallback="Foto laporan awal tidak tersedia" />
                            : <p className="pp-note">Tidak ada foto pada laporan.</p>}
                        </figure>
                        <figure>
                          <figcaption>Foto bukti perbaikan</figcaption>
                          {detailReport.foto_bukti_url
                            ? <EvidenceImage src={detailReport.foto_bukti_url} alt={`Foto bukti perbaikan ${selected.id_laporan}`} fallback="Foto bukti tidak tersedia" />
                            : <p className="pp-note">Belum ada foto bukti perbaikan.</p>}
                        </figure>
                      </div>

                      <dl className="pp-facts">
                        <div><dt>Kategori</dt><dd>{CATEGORY_LABELS[detailReport.kategori] || detailReport.kategori}</dd></div>
                        <div><dt>Dilaporkan</dt><dd>{formatDate(detailReport.tanggal_laporan)}</dd></div>
                        <div><dt>Diperbarui</dt><dd>{formatDate(detailReport.updated_at || detailReport.tanggal_laporan)}</dd></div>
                        <div><dt>Kondisi penerangan</dt><dd>{LIGHTING_LABELS[detailReport.kondisi_penerangan] || detailReport.kondisi_penerangan || 'Belum diketahui'}</dd></div>
                        <div><dt>Catatan perbaikan</dt><dd>{detailReport.catatan_penanganan || 'Belum ada catatan perbaikan.'}</dd></div>
                      </dl>

                      {progress.length > 0 && (
                        <section className="pp-history">
                          <h3>Riwayat progres</h3>
                          <ol>
                            {progress.map((item) => (
                              <li key={item.id_progres}>
                                <strong>{item.judul}</strong>
                                <p>{item.deskripsi}</p>
                                <small>{formatDate(item.tanggal_progres || item.created_at)}</small>
                              </li>
                            ))}
                          </ol>
                        </section>
                      )}

                      <UpdatePanel key={selected.id_laporan} report={detailReport} stage={stage} onUpdated={handleUpdated} />
                    </>
                  ) : <div className="pp-empty">Pilih laporan dari daftar.</div>}
                </section>
              </div>
            )}
    </>
  )
}

/* ===================== Tab 2: informasi jalan (diisi Dishub) ===================== */
function JalanTab() {
  const [items, setItems] = useState(USE_DEMO_DATA ? DEMO_ARTICLES : [])
  const [loading, setLoading] = useState(!USE_DEMO_DATA)
  const [loadError, setLoadError] = useState('')
  const [reloadKey, setReloadKey] = useState(0)
  const [formOpen, setFormOpen] = useState(false)
  const [form, setForm] = useState(EMPTY_FORM)
  const [saving, setSaving] = useState(false)
  const [formError, setFormError] = useState('')
  const [notice, setNotice] = useState('')

  useEffect(() => {
    if (USE_DEMO_DATA) return undefined
    let active = true
    getArtikelJalan()
      .then((data) => { if (active) { setItems(Array.isArray(data) ? data : []); setLoadError('') } })
      .catch((error) => { if (active) setLoadError(error?.message || 'Informasi jalan gagal dimuat.') })
      .finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [reloadKey])

  const sorted = useMemo(
    () => [...items].sort((a, b) => (new Date(b.tanggal_terbit).getTime() || 0) - (new Date(a.tanggal_terbit).getTime() || 0)),
    [items],
  )

  const setField = (name) => (event) => setForm((prev) => ({ ...prev, [name]: event.target.value }))
  const urlValue = form.sumber_url.trim()
  const urlInvalid = urlValue !== '' && !isHttpUrl(urlValue)
  const valid = form.judul.trim().length >= 5 && form.isi.trim().length >= 20 && !urlInvalid

  const submit = async (event) => {
    event.preventDefault()
    if (!valid || saving) return
    setSaving(true); setFormError(''); setNotice('')
    const payload = {
      judul: form.judul.trim(),
      kategori: form.kategori,
      lokasi: form.lokasi.trim(),
      isi: form.isi.trim(),
      sumber_url: urlValue,
    }
    try {
      if (USE_DEMO_DATA) {
        setItems((prev) => [{ ...payload, id_artikel: `demo-${Date.now()}`, tanggal_terbit: new Date().toISOString(), demo: true }, ...prev])
      } else {
        await buatArtikelJalan(payload)
        setReloadKey((k) => k + 1)
      }
      setForm(EMPTY_FORM)
      setFormOpen(false)
    } catch (error) {
      setFormError(error?.message || 'Informasi gagal disimpan.')
    } finally {
      setSaving(false)
    }
  }

  const remove = async (item) => {
    if (!window.confirm(`Hapus informasi "${item.judul}"? Tindakan ini tidak bisa dibatalkan.`)) return
    setNotice('')
    try {
      if (USE_DEMO_DATA) setItems((prev) => prev.filter((i) => i.id_artikel !== item.id_artikel))
      else { await hapusArtikelJalan(item.id_artikel); setReloadKey((k) => k + 1) }
    } catch (error) {
      setNotice(error?.message || 'Informasi gagal dihapus.')
    }
  }

  return (
    <>
      <div className="pp-toolbar pp-toolbar-between">
        <p className="pp-note">Informasi jalan di Indramayu yang ditulis petugas Dishub.</p>
        {!formOpen && <button type="button" className="pp-btn pp-btn-primary" onClick={() => setFormOpen(true)}>Tambah informasi</button>}
      </div>

      {formOpen && (
        <form className="pp-form pp-panel" onSubmit={submit}>
          <h3>Informasi baru</h3>
          <label htmlFor="aj-judul">Judul</label>
          <input id="aj-judul" className="pp-input" value={form.judul} onChange={setField('judul')} maxLength={150} required />
          <div className="pp-form-row">
            <div>
              <label htmlFor="aj-kategori">Kategori</label>
              <select id="aj-kategori" className="pp-input" value={form.kategori} onChange={setField('kategori')}>
                {Object.entries(ARTICLE_CATEGORIES).map(([k, label]) => <option key={k} value={k}>{label}</option>)}
              </select>
            </div>
            <div>
              <label htmlFor="aj-lokasi">Ruas / lokasi (opsional)</label>
              <input id="aj-lokasi" className="pp-input" value={form.lokasi} onChange={setField('lokasi')} maxLength={150} />
            </div>
          </div>
          <label htmlFor="aj-isi">Isi informasi</label>
          <textarea id="aj-isi" className="pp-input" rows="5" value={form.isi} onChange={setField('isi')} maxLength={5000} required />
          <label htmlFor="aj-url">Tautan sumber (opsional)</label>
          <input id="aj-url" type="url" className="pp-input" value={form.sumber_url} onChange={setField('sumber_url')} placeholder="https://" />
          {urlInvalid && <small className="pp-note-error">Tautan harus diawali http:// atau https://</small>}
          {formError && <p className="pp-note pp-note-error" role="alert">{formError}</p>}
          <div className="pp-actions">
            <button type="button" className="pp-btn" onClick={() => { setFormOpen(false); setForm(EMPTY_FORM); setFormError('') }} disabled={saving}>Batal</button>
            <button type="submit" className="pp-btn pp-btn-primary" disabled={!valid || saving}>{saving ? 'Menyimpan…' : 'Terbitkan'}</button>
          </div>
        </form>
      )}

      {notice && <p className="pp-note pp-note-error" role="alert">{notice}</p>}

      {loading ? <div className="pp-empty">Memuat informasi jalan…</div>
        : loadError ? <div className="pp-empty" role="alert"><p>{loadError}</p><button type="button" className="pp-btn" onClick={() => { setLoading(true); setReloadKey((k) => k + 1) }}>Coba lagi</button></div>
          : sorted.length === 0 ? <div className="pp-empty">Belum ada informasi jalan. Gunakan tombol Tambah informasi untuk menerbitkan yang pertama.</div>
            : (
              <div className="pp-articles">
                {sorted.map((item) => (
                  <article key={item.id_artikel} className="pp-article">
                    <div className="pp-article-meta">
                      <span className="pp-badge">{ARTICLE_CATEGORIES[item.kategori] || item.kategori}</span>
                      {item.demo && <span className="pp-badge pp-tone-proses">Contoh</span>}
                      <time>{formatDate(item.tanggal_terbit)}</time>
                    </div>
                    <h2>{item.judul}</h2>
                    {item.lokasi && <p className="pp-article-loc">{item.lokasi}</p>}
                    <p className="pp-article-body">{item.isi}</p>
                    <div className="pp-actions">
                      {isHttpUrl(item.sumber_url) && <a href={item.sumber_url} target="_blank" rel="noopener noreferrer" className="pp-link">Buka sumber</a>}
                      <button type="button" className="pp-btn pp-btn-danger" onClick={() => remove(item)}>Hapus</button>
                    </div>
                  </article>
                ))}
              </div>
            )}
    </>
  )
}

/* ===================== Halaman ===================== */
function PublikasiProgres() {
  const [tab, setTab] = useState('progres')
  return (
    <Layout>
      <main className="pp-page">
        <header className="pp-header">
          <h1>Publikasi Progres</h1>
          <p>Pantau semua laporan warga, perbarui statusnya, dan terbitkan informasi jalan dari Dishub.</p>
        </header>

        <div className="pp-tabs" role="tablist" aria-label="Bagian publikasi">
          <button type="button" role="tab" aria-selected={tab === 'progres'} className="pp-tab" onClick={() => setTab('progres')}>Progres laporan</button>
          <button type="button" role="tab" aria-selected={tab === 'jalan'} className="pp-tab" onClick={() => setTab('jalan')}>Informasi jalan</button>
        </div>

        {tab === 'progres' ? <ProgresTab /> : <JalanTab />}
      </main>
    </Layout>
  )
}

export default PublikasiProgres