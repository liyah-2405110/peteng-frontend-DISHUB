import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import AuthenticatedImage from '../components/AuthenticatedImage'
import Layout from '../components/Layout'
import SafeImage from '../components/SafeImage'
import {
  getLaporanDinasBackend,
  getDetailLaporanDinas,
  mulaiValidasiAI,
  mulaiPenangananLaporan,
  prosesValidasiAI,
  simpanBuktiPenanganan,
} from '../services/laporanService'
import '../css/LaporanWarga.css'

const STATUS_LABELS = {
  diajukan: 'Menunggu divalidasi AI',
  diproses_ai: 'AI sedang memvalidasi',
  diterima: 'Tervalidasi AI',
  ditolak: 'Laporan tidak valid',
  diproses: 'Dalam penanganan',
  selesai: 'Selesai ditangani',
}
const CATEGORY_LABELS = {
  PJU_MATI: 'PJU mati',
  PJU_RUSAK: 'PJU rusak',
  PJU_TIDAK_ADA: 'PJU tidak tersedia',
  LAINNYA: 'Lainnya',
}
const HANDLING_LABELS = {
  perlu_penanganan: 'Perlu penanganan',
  dalam_penanganan: 'Dalam penanganan',
  menunggu_verifikasi: 'Menunggu validasi AI atas bukti',
  selesai_ditangani: 'Selesai ditangani',
}
const LIGHTING_LABELS = {
  gelap: 'Gelap / lampu tidak berfungsi',
  redup: 'Redup',
  baik: 'Baik',
  belum_diketahui: 'Belum diketahui',
}
const FILTER_TABS = [
  { value: 'Semua', label: 'Semua' },
  { value: 'ai', label: 'Menunggu divalidasi AI' },
  { value: 'diproses', label: 'Dalam penanganan' },
  { value: 'selesai', label: 'Selesai ditangani' },
  { value: 'ditolak', label: 'Laporan tidak valid' },
]

// ===========================================================================
// MODE DEMO: true = halaman memakai DEMO_REPORTS (belum memanggil backend).
// Saat backend siap, ubah jadi false. Tidak ada kode lain yang perlu diubah.
// ===========================================================================
const USE_DEMO_DATA = true

const DEMO_REPORTS = [
  { id_laporan: 'LP-2610-101', kategori: 'PJU_MATI', status: 'diterima', status_penanganan: 'perlu_penanganan', keterangan_lokasi: 'Jl. Raya Lohbener, dekat pertigaan Pantura', deskripsi: 'Lampu jalan padam sepanjang sekitar 450 meter', pelapor_nama: 'Budi Santoso', tingkat_kegelapan: 'Tinggi', foto: null, latitude: -6.388, longitude: 108.257, kondisi_penerangan: 'gelap', tanggal_laporan: '2026-10-27T19:20:00+07:00' },
  { id_laporan: 'LP-2610-102', kategori: 'PJU_RUSAK', status: 'diproses', status_penanganan: 'dalam_penanganan', keterangan_lokasi: 'Jl. Raya Siliwangi, Karangampel', deskripsi: 'Tiang lampu miring dan lampu berkedip', pelapor_nama: 'Siti Aminah', tingkat_kegelapan: 'Sedang', foto: null, latitude: -6.4686, longitude: 108.4333, kondisi_penerangan: 'redup', tanggal_laporan: '2026-10-26T18:45:00+07:00', progres: [{ id_progres: 'p1', judul: 'Penanganan dimulai', deskripsi: 'Petugas menuju lokasi untuk memeriksa tiang.', tanggal_progres: '2026-10-27T08:30:00+07:00' }] },
  { id_laporan: 'LP-2610-103', kategori: 'PJU_MATI', status: 'selesai', status_penanganan: 'selesai_ditangani', keterangan_lokasi: 'Jl. Mayor Dasuki, Sindang', deskripsi: 'Tiga titik lampu mati di dekat alun-alun', pelapor_nama: 'Rudi Hartono', tingkat_kegelapan: 'Tinggi', foto: null, latitude: -6.333, longitude: 108.282, kondisi_penerangan: 'baik', tanggal_laporan: '2026-10-24T20:05:00+07:00', catatan_penanganan: 'Tiga lampu diganti dan kini menyala normal.', progres: [{ id_progres: 'p2', judul: 'Penanganan dimulai', deskripsi: 'Petugas menuju lokasi.', tanggal_progres: '2026-10-25T09:00:00+07:00' }, { id_progres: 'p3', judul: 'Bukti perbaikan diunggah', deskripsi: 'Tiga lampu diganti dan kini menyala normal.', tanggal_progres: '2026-10-25T14:10:00+07:00' }] },
  { id_laporan: 'LP-2610-104', kategori: 'PJU_TIDAK_ADA', status: 'diajukan', keterangan_lokasi: 'Jl. Raya Jatibarang, area persawahan', deskripsi: 'Ruas jalan gelap, belum ada lampu jalan', pelapor_nama: 'Agus Salim', tingkat_kegelapan: 'Tinggi', foto: null, latitude: -6.473, longitude: 108.301, kondisi_penerangan: 'gelap', tanggal_laporan: '2026-10-28T21:10:00+07:00' },
  { id_laporan: 'LP-2610-105', kategori: 'LAINNYA', status: 'diproses_ai', keterangan_lokasi: 'Jl. Raya Haurgeulis, dekat pasar', deskripsi: 'Kabel PJU menjuntai di pinggir jalan', pelapor_nama: 'Dewi Lestari', tingkat_kegelapan: 'Rendah', foto: null, latitude: -6.444, longitude: 108.1, kondisi_penerangan: 'belum_diketahui', tanggal_laporan: '2026-10-28T06:40:00+07:00' },
  { id_laporan: 'LP-2610-106', kategori: 'PJU_MATI', status: 'ditolak', keterangan_lokasi: 'Jl. Jenderal Sudirman, Indramayu Kota', deskripsi: 'Lampu jalan mati (foto tidak jelas)', pelapor_nama: 'Anonim', tingkat_kegelapan: 'Rendah', foto: null, latitude: -6.3264, longitude: 108.32, kondisi_penerangan: 'belum_diketahui', tanggal_laporan: '2026-10-23T22:15:00+07:00' },
  { id_laporan: 'LP-2610-107', kategori: 'PJU_MATI', status: 'diterima', status_penanganan: 'perlu_penanganan', keterangan_lokasi: 'Jl. Pahlawan, Sindang', deskripsi: 'Dua lampu mati dekat sekolah', pelapor_nama: 'Hendra', tingkat_kegelapan: 'Sedang', foto: null, latitude: -6.34, longitude: 108.295, kondisi_penerangan: 'gelap', tanggal_laporan: '2026-10-26T19:50:00+07:00' },
  { id_laporan: 'LP-2610-108', kategori: 'PJU_RUSAK', status: 'diproses', status_penanganan: 'menunggu_verifikasi', keterangan_lokasi: 'Jl. Raya Lohbener Barat, KM 14', deskripsi: 'Lampu di tikungan rawan kecelakaan berkedip', pelapor_nama: 'Yusuf', tingkat_kegelapan: 'Sedang', foto: null, latitude: -6.395, longitude: 108.238, kondisi_penerangan: 'redup', tanggal_laporan: '2026-10-25T20:15:00+07:00', catatan_penanganan: 'Lampu diganti, menunggu validasi bukti.' },
  { id_laporan: 'LP-2610-109', kategori: 'PJU_RUSAK', status: 'selesai', status_penanganan: 'selesai_ditangani', keterangan_lokasi: 'Jl. Jenderal Sudirman, depan kantor kecamatan', deskripsi: 'Panel lampu rusak, penerangan tidak stabil', pelapor_nama: 'Lina', tingkat_kegelapan: 'Sedang', foto: null, latitude: -6.329, longitude: 108.318, kondisi_penerangan: 'baik', tanggal_laporan: '2026-10-21T19:30:00+07:00', catatan_penanganan: 'Panel diperbaiki, lampu menyala stabil.' },
]

function formatDate(value) {
  if (!value) return 'Waktu tidak tersedia'
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? 'Waktu tidak tersedia' : date.toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' })
}

function LaporanWarga() {
  const [reports, setReports] = useState(USE_DEMO_DATA ? DEMO_REPORTS : [])
  const [loading, setLoading] = useState(!USE_DEMO_DATA)
  const [loadError, setLoadError] = useState('')
  const [selectedReportId, setSelectedReportId] = useState('')
  const [activeTab, setActiveTab] = useState('Semua')
  const [searchQuery, setSearchQuery] = useState('')
  const [filterKategori, setFilterKategori] = useState('Semua')
  const [dateOrder, setDateOrder] = useState('newest')
  const [notification, setNotification] = useState(null)
  const [actionLoading, setActionLoading] = useState(false)
  const [detail, setDetail] = useState(null)
  const [detailError, setDetailError] = useState('')
  const [evidenceNote, setEvidenceNote] = useState('')
  const [evidenceCondition, setEvidenceCondition] = useState('baik')
  const [evidenceFile, setEvidenceFile] = useState(null)
  const [evidencePreview, setEvidencePreview] = useState('')
  const [evidenceError, setEvidenceError] = useState('')
  const autoValidationStarted = useRef(new Set())

  const selectedReport = reports.find((item) => item.id_laporan === selectedReportId) || reports[0] || null

  const showToast = useCallback((message, type = 'success') => {
    setNotification({ message, type })
    window.setTimeout(() => setNotification(null), 4500)
  }, [])

  const refreshReports = useCallback(async (selectId = '') => {
    if (USE_DEMO_DATA) {
      if (selectId) setSelectedReportId(selectId)
      return []
    }
    const result = await getLaporanDinasBackend()
    const rows = Array.isArray(result) ? result : []
    setReports(rows)
    setLoadError('')
    if (selectId && rows.some((item) => item.id_laporan === selectId)) setSelectedReportId(selectId)
    else if (!selectedReportId && rows.length) setSelectedReportId(rows[0].id_laporan)
    return rows
  }, [selectedReportId])

  useEffect(() => {
    if (USE_DEMO_DATA) return undefined
    let active = true
    getLaporanDinasBackend()
      .then((result) => {
        if (!active) return
        const rows = Array.isArray(result) ? result : []
        setReports(rows)
        if (rows.length) setSelectedReportId(rows[0].id_laporan)
      })
      .catch((error) => {
        if (active) setLoadError(error.message || 'Data laporan gagal dimuat dari backend.')
      })
      .finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [])

  useEffect(() => {
    if (!selectedReport?.id_laporan) return undefined
    let active = true
    const id = selectedReport.id_laporan
    if (USE_DEMO_DATA) {
      setDetail({ laporan: selectedReport, progres: selectedReport.progres || [] })
      setDetailError('')
      return undefined
    }
    // eslint-disable-next-line react-hooks/set-state-in-effect -- clear detail from the previously selected report.
    setDetail(null)
    setDetailError('')
    getDetailLaporanDinas(id)
      .then((result) => { if (active) setDetail(result) })
      .catch((error) => { if (active) setDetailError(error.message || 'Detail laporan gagal dimuat.') })
    return () => { active = false }
  }, [selectedReport?.id_laporan])

  // Otomatis mencoba validasi laporan yang belum selesai diproses. Tidak ada tombol validasi manual.
  const selectedReportStatus = selectedReport?.status
  useEffect(() => {
    if (USE_DEMO_DATA || !selectedReport?.id_laporan || !['diajukan', 'diproses_ai'].includes(selectedReportStatus)) return
    const id = selectedReport.id_laporan
    if (autoValidationStarted.current.has(id)) return
    autoValidationStarted.current.add(id)
    ;(async () => {
      setActionLoading(true)
      try {
        if (selectedReportStatus === 'diajukan') await mulaiValidasiAI(id)
        await prosesValidasiAI(id)
        await refreshReports(id)
        const freshDetail = await getDetailLaporanDinas(id)
        setDetail(freshDetail)
        showToast('Sistem telah menjalankan validasi AI otomatis dan memperbarui status laporan.')
      } catch (error) {
        showToast(error.message || 'Validasi otomatis belum berhasil. Status tidak diubah menjadi valid tanpa hasil AI.', 'error')
      } finally {
        setActionLoading(false)
      }
    })()
  }, [selectedReport?.id_laporan, selectedReportStatus, refreshReports, showToast])

  const counts = useMemo(() => ({
    semua: reports.length,
    ai: reports.filter((item) => ['diajukan', 'diproses_ai'].includes(item.status)).length,
    // tervalidasi = sudah lolos validasi AI (diterima, sedang ditangani, atau selesai)
    valid: reports.filter((item) => ['diterima', 'diproses', 'selesai'].includes(item.status)).length,
    diproses: reports.filter((item) => item.status === 'diproses').length,
    selesai: reports.filter((item) => item.status === 'selesai').length,
    ditolak: reports.filter((item) => item.status === 'ditolak').length,
  }), [reports])

  const filteredReports = useMemo(() => reports.filter((item) => {
    if (activeTab === 'ai' && !['diajukan', 'diproses_ai'].includes(item.status)) return false
    if (activeTab !== 'Semua' && activeTab !== 'ai' && item.status !== activeTab) return false
    if (filterKategori !== 'Semua' && item.kategori !== filterKategori) return false
    const q = searchQuery.trim().toLocaleLowerCase()
    const searchable = [item.id_laporan, item.keterangan_lokasi, item.deskripsi].filter(Boolean).join(' ').toLocaleLowerCase()
    return !q || searchable.includes(q)
  }).sort((a, b) => {
    const diff = new Date(a.tanggal_laporan).getTime() - new Date(b.tanggal_laporan).getTime()
    return dateOrder === 'newest' ? -diff : diff
  }), [reports, activeTab, filterKategori, searchQuery, dateOrder])

  const handleStartHandling = async () => {
    if (!selectedReport) return
    if (USE_DEMO_DATA) {
      const entry = { id_progres: `demo-${Date.now()}`, judul: 'Penanganan dimulai', deskripsi: 'Petugas DISHUB mulai menangani laporan.', tanggal_progres: new Date().toISOString() }
      const updated = { ...selectedReport, status: 'diproses', status_penanganan: 'dalam_penanganan', progres: [...(selectedReport.progres || []), entry] }
      setReports((prev) => prev.map((item) => (item.id_laporan === updated.id_laporan ? updated : item)))
      setDetail({ laporan: updated, progres: updated.progres })
      showToast('Penanganan dimulai.')
      return
    }
    setActionLoading(true)
    try {
      await mulaiPenangananLaporan(selectedReport.id_laporan)
      await refreshReports(selectedReport.id_laporan)
      setDetail(await getDetailLaporanDinas(selectedReport.id_laporan))
      showToast('Penanganan dimulai dan tersimpan di backend.')
    } catch (error) {
      showToast(error.message || 'Gagal memulai penanganan.', 'error')
    } finally {
      setActionLoading(false)
    }
  }

  const handleEvidenceFile = (event) => {
    const file = event.target.files?.[0] || null
    setEvidenceError('')
    setEvidenceFile(null)
    setEvidencePreview('')
    if (!file) return
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      setEvidenceError('Pilih foto JPEG, PNG, atau WebP.')
      event.target.value = ''
      return
    }
    if (file.size > 5 * 1024 * 1024) {
      setEvidenceError('Ukuran foto maksimal 5 MB.')
      event.target.value = ''
      return
    }
    setEvidenceFile(file)
    setEvidencePreview(URL.createObjectURL(file))
  }

  useEffect(() => () => {
    if (evidencePreview.startsWith('blob:')) URL.revokeObjectURL(evidencePreview)
  }, [evidencePreview])

  const handleSaveEvidence = async (event) => {
    event.preventDefault()
    if (!selectedReport) return
    if (evidenceNote.trim().length < 3 || !evidenceFile) {
      setEvidenceError('Isi catatan minimal 3 karakter dan pilih foto bukti perbaikan.')
      return
    }
    if (USE_DEMO_DATA) {
      const entry = { id_progres: `demo-${Date.now()}`, judul: 'Bukti perbaikan diunggah', deskripsi: evidenceNote.trim(), tanggal_progres: new Date().toISOString() }
      const updated = {
        ...selectedReport,
        status: 'selesai',
        status_penanganan: 'selesai_ditangani',
        kondisi_penerangan: evidenceCondition,
        catatan_penanganan: evidenceNote.trim(),
        foto_bukti_url: URL.createObjectURL(evidenceFile),
        progres: [...(selectedReport.progres || []), entry],
      }
      setReports((prev) => prev.map((item) => (item.id_laporan === updated.id_laporan ? updated : item)))
      setDetail({ laporan: updated, progres: updated.progres })
      setEvidenceNote('')
      setEvidenceFile(null)
      setEvidencePreview('')
      setEvidenceError('')
      showToast('Bukti tersimpan. Penanganan selesai.')
      return
    }
    setActionLoading(true)
    setEvidenceError('')
    try {
      await simpanBuktiPenanganan(selectedReport.id_laporan, {
        catatanPenanganan: evidenceNote.trim(),
        kondisiPenerangan: evidenceCondition,
        fotoBukti: evidenceFile,
      })
      await refreshReports(selectedReport.id_laporan)
      setDetail(await getDetailLaporanDinas(selectedReport.id_laporan))
      setEvidenceNote('')
      setEvidenceFile(null)
      setEvidencePreview('')
      showToast('Bukti tersimpan. Status akan mengikuti hasil validasi AI otomatis.')
    } catch (error) {
      setEvidenceError(error.message || 'Gagal menyimpan bukti ke backend.')
    } finally {
      setActionLoading(false)
    }
  }

  const handleExport = () => {
    const rows = [
      ['ID laporan', 'Lokasi', 'Kategori', 'Status', 'Status penanganan', 'Tanggal laporan', 'Latitude', 'Longitude'],
      ...filteredReports.map((item) => [item.id_laporan, item.keterangan_lokasi, item.kategori, item.status, item.status_penanganan, item.tanggal_laporan, item.latitude, item.longitude]),
    ]
    const csv = rows.map((row) => row.map((value) => `"${String(value ?? '').replaceAll('"', '""')}"`).join(',')).join('\n')
    const link = document.createElement('a')
    link.href = URL.createObjectURL(new Blob([`\uFEFF${csv}`], { type: 'text/csv;charset=utf-8' }))
    link.download = `rekap-laporan-peteng-${new Date().toISOString().slice(0, 10)}.csv`
    link.click()
    URL.revokeObjectURL(link.href)
  }

  const reportDetail = detail?.laporan
  const progress = detail?.progres || []
  const canStartHandling = selectedReport?.status === 'diterima' && selectedReport?.status_penanganan === 'perlu_penanganan'
  const canUploadEvidence = selectedReport?.status === 'diproses' && ['dalam_penanganan', 'menunggu_verifikasi'].includes(selectedReport?.status_penanganan)

  return (
    <Layout>
      <main className="laporan-warga-page">
        <section className="laporan-top-header">
          <div className="header-title-block">
            <span className="section-eyebrow">PENGELOLAAN PENGADUAN</span>
            <h1 className="header-main-title">Laporan Warga</h1>
            <p className="header-desc">AI memvalidasi laporan dan bukti secara otomatis. DISHUB berfokus pada tindak lanjut perbaikan.</p>
          </div>
          <div className="header-stats-row">
            <div className="stat-box"><span className="stat-label">TOTAL LAPORAN</span><strong className="stat-number">{loading ? '…' : loadError ? '—' : counts.semua}</strong></div>
            <button type="button" className="btn-export-rekap" onClick={handleExport} disabled={loading || !!loadError || !reports.length}>Unduh rekap CSV</button>
            <button type="button" className="btn-export-rekap" onClick={() => { setLoading(true); refreshReports().catch((e) => setLoadError(e.message)).finally(() => setLoading(false)) }}>Muat ulang</button>
          </div>
        </section>

        <section className="metric-cards-grid report-stats-grid">
          {[['MENUNGGU DIVALIDASI AI', counts.ai], ['LAPORAN TERVALIDASI', counts.valid], ['DALAM PENANGANAN', counts.diproses], ['SELESAI DITANGANI', counts.selesai]].map(([label, value]) => (
            <div className="metric-card" key={label}><span className="metric-label">{label}</span><strong className="metric-main-value">{loading ? '…' : value}</strong></div>
          ))}
        </section>

        <section className="report-workspace-grid">
          <div className="report-list-panel">
            <div className="report-list-toolbar">
              <input type="search" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Cari ID, lokasi, atau deskripsi" aria-label="Cari laporan" />
              <select value={filterKategori} onChange={(e) => setFilterKategori(e.target.value)} aria-label="Filter kategori">
                <option value="Semua">Semua kategori</option>
                {Object.entries(CATEGORY_LABELS).map(([key, label]) => <option key={key} value={key}>{label}</option>)}
              </select>
              <select value={dateOrder} onChange={(e) => setDateOrder(e.target.value)} aria-label="Urutan tanggal">
                <option value="newest">Terbaru</option><option value="oldest">Terlama</option>
              </select>
            </div>
            <div className="publication-tabs report-filter-tabs" role="tablist" aria-label="Filter status laporan">
              {FILTER_TABS.map((tab) => <button type="button" key={tab.value} className={`publication-tab ${activeTab === tab.value ? 'active' : ''}`} onClick={() => setActiveTab(tab.value)}>{tab.label}</button>)}
            </div>
            {loading ? <p className="empty-state">Memuat laporan dari backend…</p>
              : loadError ? <div className="error-state" role="alert">{loadError}<button type="button" onClick={() => { setLoading(true); refreshReports().catch((e) => setLoadError(e.message)).finally(() => setLoading(false)) }}>Coba lagi</button></div>
                : filteredReports.length === 0 ? <p className="empty-state">Belum ada laporan untuk filter ini.</p>
                  : <div className="table-responsive"><table className="queue-table">
                    <thead><tr><th>ID</th><th>Lokasi</th><th>Kategori</th><th>Status</th><th>Tanggal</th></tr></thead>
                    <tbody>{filteredReports.map((item) => <tr key={item.id_laporan} className={`queue-row ${selectedReport?.id_laporan === item.id_laporan ? 'queue-row-active' : ''}`} onClick={() => setSelectedReportId(item.id_laporan)} tabIndex={0} onKeyDown={(e) => { if (e.key === 'Enter') setSelectedReportId(item.id_laporan) }}>
                      <td>{item.id_laporan}</td><td>{item.keterangan_lokasi || 'Lokasi tidak tersedia'}</td><td>{CATEGORY_LABELS[item.kategori] || item.kategori || '—'}</td>
                      <td><span className={`status-pill status-${item.status || 'unknown'}`}>{STATUS_LABELS[item.status] || item.status || '—'}</span>{item.status_penanganan && <small className="handling-state-label">{HANDLING_LABELS[item.status_penanganan] || item.status_penanganan}</small>}</td><td>{formatDate(item.tanggal_laporan)}</td>
                    </tr>)}</tbody>
                  </table></div>}
          </div>

          <aside className="detail-panel-card">
            {!selectedReport ? <p className="empty-state">Pilih laporan untuk melihat detail.</p> : <>
              <div className="detail-header"><span className="section-eyebrow">DETAIL LAPORAN</span><h2 className="detail-ticket-id">{selectedReport.id_laporan}</h2><p className="detail-road-title">{selectedReport.keterangan_lokasi || 'Lokasi tidak tersedia'}</p><span className={`status-pill status-${selectedReport.status || 'unknown'}`}>{STATUS_LABELS[selectedReport.status] || selectedReport.status}</span></div>
              {detailError && <p className="error-state" role="alert">{detailError}</p>}
              <dl className="report-facts">
                <div><dt>Pelapor</dt><dd>{selectedReport.pelapor_nama || 'Tidak tersedia'}</dd></div>
                <div><dt>Kategori</dt><dd>{CATEGORY_LABELS[selectedReport.kategori] || selectedReport.kategori}</dd></div>
                <div><dt>Tingkat kegelapan</dt><dd>{selectedReport.tingkat_kegelapan ?? '—'}</dd></div>
                <div><dt>Kondisi penerangan</dt><dd>{LIGHTING_LABELS[reportDetail?.kondisi_penerangan || selectedReport.kondisi_penerangan] || 'Belum diketahui'}</dd></div>
                <div><dt>Tanggal laporan</dt><dd>{formatDate(selectedReport.tanggal_laporan)}</dd></div>
                <div><dt>Deskripsi</dt><dd>{selectedReport.deskripsi || 'Deskripsi tidak tersedia'}</dd></div>
                <div><dt>Koordinat</dt><dd>{selectedReport.latitude}, {selectedReport.longitude}</dd></div>
              </dl>

              <section className="report-photo"><h3>Foto laporan awal</h3>{selectedReport.foto ? <SafeImage src={selectedReport.foto} alt={`Foto laporan ${selectedReport.id_laporan}`} fallback="Foto laporan tidak tersedia" /> : <p className="empty-state">Foto tidak tersedia.</p>}</section>

              <section className="validation-panel"><h3>Validasi otomatis</h3>
                <p>AI memvalidasi laporan dan bukti perbaikan secara otomatis. DISHUB tidak perlu memeriksa hasil AI atau menolak laporan secara manual.</p>
                {['diajukan', 'diproses_ai'].includes(selectedReport.status) && <p role="status">{actionLoading ? 'Sistem sedang menjalankan validasi AI…' : 'Menunggu hasil validasi AI.'}</p>}
              </section>

              <section className="handling-panel backend-handling-panel"><h3>Penanganan oleh DISHUB</h3>
                <div className="handling-status"><span>Status penanganan</span><strong>{HANDLING_LABELS[selectedReport.status_penanganan] || 'Belum tersedia'}</strong></div>
                {canStartHandling && <button type="button" className="btn-primary" disabled={actionLoading} onClick={handleStartHandling}>Mulai penanganan</button>}
                {canUploadEvidence && <form className="evidence-form" onSubmit={handleSaveEvidence}>
                  <label htmlFor="handling-note">Catatan perbaikan</label><textarea id="handling-note" value={evidenceNote} onChange={(e) => setEvidenceNote(e.target.value)} rows={3} maxLength={2000} required placeholder="Jelaskan tindakan perbaikan yang dilakukan…" />
                  <label htmlFor="lighting-condition">Kondisi penerangan setelah perbaikan</label><select id="lighting-condition" value={evidenceCondition} onChange={(e) => setEvidenceCondition(e.target.value)}><option value="baik">Baik</option><option value="redup">Redup</option><option value="gelap">Masih gelap / bermasalah</option><option value="belum_diketahui">Belum diketahui</option></select>
                  <label htmlFor="repair-photo">Foto bukti perbaikan (JPEG/PNG/WebP, maks. 5 MB)</label><input id="repair-photo" type="file" accept="image/jpeg,image/png,image/webp" onChange={handleEvidenceFile} required />
                  {evidencePreview && <div className="photo-preview"><span>Pratinjau bukti</span><img src={evidencePreview} alt="Pratinjau foto bukti perbaikan" /></div>}
                  {evidenceError && <p className="error-state" role="alert">{evidenceError}</p>}
                  <button type="submit" className="btn-primary" disabled={actionLoading}>{actionLoading ? 'Menyimpan…' : 'Kirim bukti untuk validasi AI otomatis'}</button>
                </form>}
                {selectedReport.foto_bukti_url && <div className="before-after-photos"><div><span>Foto bukti perbaikan</span>{selectedReport.foto_bukti_url.startsWith('blob:') ? <img src={selectedReport.foto_bukti_url} alt="Foto bukti perbaikan" /> : <AuthenticatedImage src={selectedReport.foto_bukti_url} alt="Foto bukti perbaikan" fallback="Foto bukti tidak tersedia" />}</div></div>}
                {reportDetail?.catatan_penanganan && <div className="handling-note-view"><strong>Catatan penanganan</strong><p>{reportDetail.catatan_penanganan}</p></div>}
                {progress.length > 0 && <div className="report-progress-history"><h4>Riwayat progres</h4>{progress.map((item) => <article key={item.id_progres}><strong>{item.judul}</strong><p>{item.deskripsi}</p><small>{formatDate(item.tanggal_progres || item.created_at)}</small></article>)}</div>}
              </section>
            </>}
          </aside>
        </section>
        {notification && <div className={`toast-notification toast-${notification.type}`} role="status">{notification.message}</div>}
      </main>
    </Layout>
  )
}

export default LaporanWarga