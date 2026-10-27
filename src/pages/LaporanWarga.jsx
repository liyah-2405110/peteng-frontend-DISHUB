import { useEffect, useMemo, useState } from 'react'
import AuthenticatedImage from '../components/AuthenticatedImage'
import Layout from '../components/Layout'
import SafeImage from '../components/SafeImage'
import { useDemoData } from '../context/useDemoData'
import {
  getLaporanDinasBackend,
  getDetailLaporanDinas,
  getValidasiAITerbaru,
  mulaiValidasiAI,
  mulaiPenangananLaporan,
  prosesValidasiAI,
  simpanBuktiPenanganan,
  verifikasiBuktiPenanganan,
} from '../services/laporanService'
import '../css/LaporanWarga.css'

const STATUS_LABELS = {
  diajukan: 'Menunggu validasi',
  diproses_ai: 'Validasi AI berlangsung',
  diterima: 'Diterima',
  ditolak: 'Ditolak',
  diproses: 'Dalam penanganan',
  selesai: 'Selesai',
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
  menunggu_verifikasi: 'Menunggu verifikasi bukti perbaikan',
  selesai_ditangani: 'Selesai ditangani',
}
const LIGHTING_LABELS = {
  gelap: 'Gelap / lampu tidak berfungsi',
  redup: 'Redup',
  baik: 'Baik',
  belum_diketahui: 'Belum diketahui',
  dark: 'Gelap / lampu tidak berfungsi',
  dim: 'Redup',
  bright: 'Baik',
  unknown: 'Belum diketahui',
}
const FILTER_TABS = [
  { value: 'Semua', label: 'Semua' },
  { value: 'perlu-validasi', label: 'Perlu validasi' },
  { value: 'diterima', label: 'Diterima' },
  { value: 'diproses', label: 'Dalam penanganan' },
  { value: 'selesai', label: 'Selesai' },
  { value: 'ditolak', label: 'Ditolak' },
]

function formatDate(value) {
  if (!value) return 'Waktu tidak tersedia'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return 'Waktu tidak tersedia'
  return date.toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' })
}

function LaporanWarga() {
  const { demoReports, updateDemoReport, storageError } = useDemoData()
  const source = 'backend'
  const [backendReports, setBackendReports] = useState([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState('')
  const [selectedReportId, setSelectedReportId] = useState('')
  const [activeTab, setActiveTab] = useState('Semua')
  const [searchQuery, setSearchQuery] = useState('')
  const [filterKategori, setFilterKategori] = useState('Semua')
  const [dateOrder, setDateOrder] = useState('newest')
  const [notification, setNotification] = useState(null)
  const [actionLoading, setActionLoading] = useState(false)
  const [validationRecord, setValidationRecord] = useState(null)
  const [backendDetail, setBackendDetail] = useState(null)
  const [backendDetailError, setBackendDetailError] = useState('')
  const [verificationNote, setVerificationNote] = useState('')
  const [evidenceDraft, setEvidenceDraft] = useState({
    reportId: '', note: '', photo: '', file: null, condition: 'belum_diketahui', error: '',
  })

  const reports = source === 'demo' ? demoReports : backendReports
  const selectedReport = reports.find((item) => item.id_laporan === selectedReportId) || reports[0] || null
  const demo = source === 'demo'

  useEffect(() => {
    let active = true
    getLaporanDinasBackend()
      .then((result) => {
        if (!active) return
        setBackendReports(Array.isArray(result) ? result : [])
        if (result?.length) setSelectedReportId(result[0].id_laporan)
      })
      .catch((error) => {
        console.error('Gagal memuat laporan warga:', error)
        if (active) setLoadError('Data laporan gagal dimuat dari backend. Coba muat ulang halaman.')
      })
      .finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [])

  useEffect(() => {
    if (source !== 'backend' || !selectedReport?.id_laporan) return undefined
    let active = true
    const reportId = selectedReport.id_laporan
    getValidasiAITerbaru(reportId)
      .then((result) => {
        if (active) setValidationRecord({ reportId, state: result ? 'data' : 'empty', data: result })
      })
      .catch((error) => {
        console.error('Gagal memuat hasil validasi AI:', error)
        if (active) setValidationRecord({ reportId, state: 'error', error: 'Hasil validasi AI gagal dimuat.' })
      })
    return () => { active = false }
  }, [source, selectedReport?.id_laporan])

  useEffect(() => {
    if (source !== 'backend' || !selectedReport?.id_laporan) return undefined
    let active = true
    const reportId = selectedReport.id_laporan
    getDetailLaporanDinas(reportId)
      .then((detail) => {
        if (active) {
          setBackendDetail(detail)
          setBackendDetailError('')
        }
      })
      .catch((error) => {
        console.error('Gagal memuat detail laporan DISHUB:', error)
        if (active) {
          setBackendDetail(null)
          setBackendDetailError(error.message || 'Detail laporan gagal dimuat dari backend.')
        }
      })
    return () => { active = false }
  }, [source, selectedReport?.id_laporan])

  const currentEvidenceDraft = evidenceDraft.reportId === selectedReport?.id_laporan
    ? evidenceDraft
    : {
        reportId: selectedReport?.id_laporan || '',
        note: demo ? selectedReport?.handlingNote || '' : selectedReport?.catatan_penanganan || '',
        photo: '',
        file: null,
        condition: demo
          ? selectedReport?.lightingCondition || 'unknown'
          : selectedReport?.kondisi_penerangan_usulan || selectedReport?.kondisi_penerangan || 'belum_diketahui',
        error: '',
      }

  const counts = useMemo(() => ({
    semua: reports.length,
    perluValidasi: reports.filter((item) => ['diajukan', 'diproses_ai'].includes(item.status)).length,
    diterima: reports.filter((item) => item.status === 'diterima').length,
    diproses: reports.filter((item) => item.status === 'diproses').length,
    selesai: reports.filter((item) => item.status === 'selesai').length,
    ditolak: reports.filter((item) => item.status === 'ditolak').length,
  }), [reports])

  const filteredList = useMemo(() => reports.filter((item) => {
    if (activeTab === 'perlu-validasi' && !['diajukan', 'diproses_ai'].includes(item.status)) return false
    if (activeTab !== 'Semua' && activeTab !== 'perlu-validasi' && item.status !== activeTab) return false
    if (filterKategori !== 'Semua' && item.kategori !== filterKategori) return false
    const query = searchQuery.trim().toLocaleLowerCase()
    const searchable = [item.id_laporan, item.keterangan_lokasi, item.deskripsi].filter(Boolean).join(' ').toLocaleLowerCase()
    if (query && !searchable.includes(query)) return false
    return true
  }).sort((left, right) => {
    const leftDate = new Date(left.tanggal_laporan).getTime()
    const rightDate = new Date(right.tanggal_laporan).getTime()
    const difference = (Number.isNaN(leftDate) ? 0 : leftDate) - (Number.isNaN(rightDate) ? 0 : rightDate)
    return dateOrder === 'newest' ? -difference : difference
  }), [reports, activeTab, filterKategori, searchQuery, dateOrder])

  const showToast = (message, type = 'success') => {
    setNotification({ message, type })
    window.setTimeout(() => setNotification(null), 5000)
  }

  const notifyDemoSave = (message, saved, type = 'success') => {
    showToast(
      saved ? message : 'Penyimpanan lokal gagal. Perubahan hanya tersedia sementara pada sesi ini.',
      saved ? type : 'error',
    )
  }

  const refreshBackendReports = async () => {
    const result = await getLaporanDinasBackend()
    setBackendReports(Array.isArray(result) ? result : [])
  }

  const refreshBackendState = async (idLaporan) => {
    const [reports, detail] = await Promise.all([
      getLaporanDinasBackend(),
      getDetailLaporanDinas(idLaporan),
    ])
    setBackendReports(Array.isArray(reports) ? reports : [])
    setBackendDetail(detail)
    setBackendDetailError('')
  }

  const refreshAfterBackendAction = async (idLaporan) => {
    try {
      await refreshBackendState(idLaporan)
      return true
    } catch (error) {
      console.error('Perubahan backend tersimpan, tetapi data laporan gagal dimuat ulang:', error)
      setBackendDetailError('Perubahan telah dikonfirmasi backend, tetapi daftar/detail gagal diperbarui. Muat ulang halaman.')
      return false
    }
  }

  const handleRunBackendAI = async () => {
    if (!selectedReport) return
    setActionLoading(true)
    try {
      if (selectedReport.status === 'diajukan') {
        await mulaiValidasiAI(selectedReport.id_laporan)
        await refreshBackendReports()
      }
      await prosesValidasiAI(selectedReport.id_laporan)
      await refreshBackendState(selectedReport.id_laporan)
      const latest = await getValidasiAITerbaru(selectedReport.id_laporan)
      setValidationRecord({ reportId: selectedReport.id_laporan, state: latest ? 'data' : 'empty', data: latest })
      showToast(latest ? 'Proses selesai. Hasil ditampilkan dari backend.' : 'Proses selesai, tetapi hasil belum tersedia dari backend.')
    } catch (error) {
      console.error('Gagal menjalankan validasi AI backend:', error)
      showToast(error.message || 'Gagal menjalankan validasi AI.', 'error')
    } finally {
      setActionLoading(false)
    }
  }

  const handleDemoAI = (result) => {
    if (!selectedReport) return
    const accepted = result === 'valid'
    const saved = updateDemoReport(selectedReport.id_laporan, {
      demo_ai_status: result,
      demo_ai_note: accepted
        ? 'Laporan dinyatakan memenuhi kriteria demo untuk diteruskan.'
        : 'Laporan tidak memenuhi kriteria demo. Periksa kembali informasi yang dilaporkan.',
      status: accepted ? 'diterima' : 'ditolak',
    })
    notifyDemoSave(`Validasi ${accepted ? 'valid' : 'ditolak'} disimpan pada simulasi DEMO.`, saved)
  }

  const handleStartBackendHandling = async () => {
    if (!selectedReport) return
    setActionLoading(true)
    try {
      await mulaiPenangananLaporan(selectedReport.id_laporan)
      const refreshed = await refreshAfterBackendAction(selectedReport.id_laporan)
      showToast(refreshed
        ? 'Status penanganan berhasil disimpan oleh backend.'
        : 'Backend mengonfirmasi status tersimpan, tetapi tampilan gagal dimuat ulang.', refreshed ? 'success' : 'error')
    } catch (error) {
      console.error('Gagal memulai penanganan laporan:', error)
      showToast(error.message || 'Gagal memulai penanganan laporan.', 'error')
    } finally {
      setActionLoading(false)
    }
  }

  const handleDemoStart = () => {
    if (!selectedReport) return
    const saved = updateDemoReport(selectedReport.id_laporan, { handlingStatus: 'dalam_penanganan', status: 'diproses' })
    notifyDemoSave('Status penanganan diperbarui pada data DEMO.', saved)
  }

  const handlePhotoChange = (event) => {
    const file = event.target.files?.[0]
    if (!file) return
    const acceptedTypes = ['image/jpeg', 'image/png', 'image/webp']
    if (!acceptedTypes.includes(file.type)) {
      setEvidenceDraft({ ...currentEvidenceDraft, error: 'Format foto yang didukung: JPEG, PNG, atau WebP.', photo: '', file: null })
      return
    }
    const maxSize = demo ? 1_500_000 : 5 * 1024 * 1024
    if (file.size > maxSize) {
      setEvidenceDraft({
        ...currentEvidenceDraft,
        error: demo ? 'Ukuran foto demo maksimal 1,5 MB agar dapat disimpan di peramban.' : 'Ukuran foto maksimal 5 MB.',
        photo: '',
        file: null,
      })
      return
    }
    const reader = new FileReader()
    reader.onload = () => {
      setEvidenceDraft({
        ...currentEvidenceDraft,
        photo: typeof reader.result === 'string' ? reader.result : '',
        file,
        error: '',
      })
    }
    reader.onerror = () => setEvidenceDraft({ ...currentEvidenceDraft, error: 'Foto gagal dibaca oleh peramban.' })
    reader.readAsDataURL(file)
  }

  const handleSaveDemoEvidence = () => {
    if (!selectedReport) return
    if (!currentEvidenceDraft.note.trim() || !currentEvidenceDraft.photo) {
      setEvidenceDraft({ ...currentEvidenceDraft, error: 'Isi catatan penanganan dan unggah foto bukti sebelum menyimpan.' })
      return
    }
    const saved = updateDemoReport(selectedReport.id_laporan, {
      handlingNote: currentEvidenceDraft.note.trim(),
      repairPhoto: currentEvidenceDraft.photo,
      handlingStatus: 'menunggu_verifikasi',
      status: 'diproses',
      repairEvidenceResult: '',
    })
    notifyDemoSave('Catatan dan foto bukti tersimpan sebagai simulasi lokal. Menunggu verifikasi bukti.', saved)
  }

  const handleSaveBackendEvidence = async () => {
    if (!selectedReport) return
    if (!currentEvidenceDraft.note.trim() || !currentEvidenceDraft.file) {
      setEvidenceDraft({ ...currentEvidenceDraft, error: 'Isi catatan penanganan dan pilih foto bukti sebelum menyimpan.' })
      return
    }

    setActionLoading(true)
    try {
      await simpanBuktiPenanganan(selectedReport.id_laporan, {
        catatanPenanganan: currentEvidenceDraft.note.trim(),
        kondisiPenerangan: currentEvidenceDraft.condition,
        fotoBukti: currentEvidenceDraft.file,
      })
      const refreshed = await refreshAfterBackendAction(selectedReport.id_laporan)
      setEvidenceDraft({ reportId: selectedReport.id_laporan, note: '', photo: '', file: null, condition: 'belum_diketahui', error: '' })
      showToast(refreshed
        ? 'Catatan dan foto bukti telah dikonfirmasi tersimpan oleh backend.'
        : 'Backend mengonfirmasi bukti tersimpan, tetapi tampilan gagal dimuat ulang.', refreshed ? 'success' : 'error')
    } catch (error) {
      console.error('Gagal menyimpan bukti penanganan ke backend:', error)
      showToast(error.message || 'Bukti penanganan gagal disimpan.', 'error')
    } finally {
      setActionLoading(false)
    }
  }

  const handleVerifyEvidence = (accepted) => {
    if (!selectedReport) return
    const saved = updateDemoReport(selectedReport.id_laporan, {
      repairEvidenceResult: accepted ? 'bright' : 'followup',
      repairEvidenceVerifiedAt: new Date().toISOString(),
      handlingStatus: accepted ? 'selesai_ditangani' : 'perlu_penanganan',
      status: accepted ? 'selesai' : 'diproses',
      lightingCondition: accepted ? 'bright' : selectedReport.lightingCondition,
      handlingNote: `${selectedReport.handlingNote || ''}${selectedReport.handlingNote ? '\n' : ''}${accepted
        ? 'Bukti memenuhi verifikasi simulasi.'
        : 'Bukti tidak memenuhi kriteria simulasi; perlu tindak lanjut.'}`,
    })
    notifyDemoSave(accepted
      ? 'Bukti lolos verifikasi demo; kondisi penerangan demo diperbarui menjadi baik.'
      : 'Bukti belum memenuhi kriteria demo; status kembali perlu penanganan dan kondisi penerangan tidak berubah.',
    saved, accepted ? 'success' : 'error')
  }

  const handleVerifyBackendEvidence = async (accepted) => {
    if (!selectedReport) return
    if (!accepted && !verificationNote.trim()) {
      showToast('Catatan alasan tindak lanjut wajib diisi.', 'error')
      return
    }

    setActionLoading(true)
    try {
      await verifikasiBuktiPenanganan(selectedReport.id_laporan, {
        hasil: accepted ? 'memenuhi' : 'perlu_tindak_lanjut',
        catatan: verificationNote.trim(),
      })
      const refreshed = await refreshAfterBackendAction(selectedReport.id_laporan)
      setVerificationNote('')
      showToast(accepted
        ? refreshed
          ? 'Verifikasi petugas dan kondisi penerangan terbaru tersimpan di backend.'
          : 'Backend mengonfirmasi verifikasi tersimpan, tetapi tampilan gagal dimuat ulang.'
        : refreshed
          ? 'Bukti dikembalikan ke status penanganan; kondisi penerangan tidak berubah.'
          : 'Backend mengonfirmasi tindak lanjut, tetapi tampilan gagal dimuat ulang.',
      refreshed ? 'success' : 'error')
    } catch (error) {
      console.error('Gagal menyimpan verifikasi bukti backend:', error)
      showToast(error.message || 'Verifikasi bukti gagal disimpan.', 'error')
    } finally {
      setActionLoading(false)
    }
  }

  const handleExport = () => {
    const rows = [
      ['ID laporan', 'Lokasi', 'Kategori', 'Tingkat kegelapan', 'Status', 'Tanggal laporan', 'Latitude', 'Longitude'],
      ...filteredList.map((item) => [item.id_laporan, item.keterangan_lokasi, item.kategori, item.tingkat_kegelapan, item.status, item.tanggal_laporan, item.latitude, item.longitude]),
    ]
    const csv = rows.map((row) => row.map((value) => `"${String(value ?? '').replaceAll('"', '""')}"`).join(',')).join('\n')
    const link = document.createElement('a')
    link.href = URL.createObjectURL(new Blob([`\uFEFF${csv}`], { type: 'text/csv;charset=utf-8' }))
    link.download = `rekap-laporan-peteng-${source}-${new Date().toISOString().slice(0, 10)}.csv`
    link.click()
    URL.revokeObjectURL(link.href)
  }

  const validation = validationRecord?.reportId === selectedReport?.id_laporan
    ? validationRecord
    : selectedReport && !demo
      ? { state: 'loading' }
      : null
  const canHandleDemo = demo && selectedReport?.demo_ai_status === 'valid' && selectedReport.status !== 'ditolak'

  return (
    <Layout>
      <div className="laporan-warga-page">
        <section className="laporan-top-header">
          <div className="header-title-block">
            <span className="section-eyebrow">PENGELOLAAN PENGADUAN</span>
            <h1 className="header-main-title">Laporan Warga</h1>
            <p className="header-desc">Lihat laporan operasional dari backend, validasi AI yang tersedia, dan bukti penanganan.</p>
          </div>
          <div className="header-stats-row">
            <div className="stat-box"><span className="stat-label">TOTAL LAPORAN</span><strong className="stat-number">{demo ? counts.semua : loading ? 'Memuat...' : loadError ? 'Gagal dimuat' : counts.semua}</strong></div>
            <button type="button" className="btn-export-rekap" onClick={handleExport} disabled={loading && !demo || !!loadError && !demo || !reports.length}>Unduh rekap CSV</button>
          </div>
        </section>

        <p className="data-source-note">Sumber data operasional: API backend PETENG.</p>

        {notification && <div className={`toast-notification ${notification.type === 'error' ? 'toast-error' : 'toast-success'}`} role="status">
          <span>{notification.message}</span>
          <button type="button" onClick={() => setNotification(null)} className="btn-close-toast" aria-label="Tutup notifikasi">×</button>
        </div>}
        {demo && storageError && <p className="demo-storage-warning" role="alert">{storageError}</p>}

        <section className="laporan-filter-bar">
          <div className="filter-controls-row">
            <input type="search" placeholder="Cari ID laporan, lokasi, atau deskripsi" value={searchQuery} onChange={(event) => setSearchQuery(event.target.value)} className="filter-search-input" aria-label="Cari laporan" />
            <select value={filterKategori} onChange={(event) => setFilterKategori(event.target.value)} className="filter-dropdown" aria-label="Filter kategori laporan">
              <option value="Semua">Semua kategori</option>
              {Object.entries(CATEGORY_LABELS).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
            </select>
            <select value={dateOrder} onChange={(event) => setDateOrder(event.target.value)} className="filter-dropdown" aria-label="Urutkan laporan berdasarkan tanggal">
              <option value="newest">Tanggal terbaru</option><option value="oldest">Tanggal terlama</option>
            </select>
          </div>
          <div className="filter-tabs-row" aria-label="Filter status laporan">
            {FILTER_TABS.map((tab) => {
              const tabCount = tab.value === 'Semua' ? counts.semua : tab.value === 'perlu-validasi' ? counts.perluValidasi : counts[tab.value]
              return <button key={tab.value} type="button" className={`filter-tab ${activeTab === tab.value ? 'tab-active' : ''}`} onClick={() => setActiveTab(tab.value)}>{tab.label} <span className="tab-count">{tabCount}</span></button>
            })}
          </div>
        </section>

        <div className="laporan-grid-layout">
          <section className="queue-list-card">
            <div className="queue-list-header">
              <div><h2 className="queue-list-title">Daftar laporan</h2><span className="queue-list-sub">{filteredList.length} dari {reports.length} laporan</span></div>
              <span className="data-source-note">{demo ? 'SUMBER: DEMO / SIMULASI' : 'Sumber: backend PETENG'}</span>
            </div>
            {!demo && loading ? <div className="loading-state">Memuat laporan...</div>
              : !demo && loadError ? <div className="error-state" role="alert">{loadError}</div>
                : reports.length === 0 ? <div className="empty-state">{demo ? 'Belum ada laporan demo.' : 'Belum ada laporan pada backend.'}</div>
                  : filteredList.length === 0 ? <div className="empty-state">Tidak ada laporan yang sesuai dengan pencarian atau filter.</div>
                    : <div className="queue-table-wrap"><table className="queue-table">
                      <thead><tr><th>ID laporan</th><th>Foto</th><th>Lokasi</th><th>Kategori</th><th>Status</th><th>Tanggal</th></tr></thead>
                      <tbody>{filteredList.map((item) => <tr key={item.id_laporan} className={`queue-row ${selectedReport?.id_laporan === item.id_laporan ? 'queue-row-active' : ''}`} onClick={() => setSelectedReportId(item.id_laporan)}>
                        <td>{item.id_laporan}{demo && <span className="demo-row-label">DEMO</span>}</td>
                        <td>{item.foto ? <SafeImage className="report-table-thumb" src={item.foto} alt={`Foto laporan ${item.id_laporan}`} fallback="Foto gagal dimuat" /> : '—'}</td>
                        <td>{item.keterangan_lokasi || 'Lokasi tidak tersedia'}</td>
                        <td>{CATEGORY_LABELS[item.kategori] || item.kategori || 'Tidak tersedia'}</td>
                        <td><span className={`status-pill status-${item.status || 'unknown'}`}>{STATUS_LABELS[item.status] || item.status || 'Tidak tersedia'}</span>
                          {!demo && item.status_penanganan && <small className="handling-state-label">{HANDLING_LABELS[item.status_penanganan] || item.status_penanganan}</small>}</td>
                        <td>{formatDate(item.tanggal_laporan)}</td>
                      </tr>)}</tbody>
                    </table></div>}
          </section>

          <aside className="detail-panel-card">
            {!selectedReport ? <div className="empty-state">{!demo && loading ? 'Memuat detail laporan...' : !demo && loadError ? loadError : 'Pilih laporan untuk melihat detail.'}</div> : <>
              <div className="detail-header">
                <span className="section-eyebrow">DETAIL LAPORAN {demo ? '· DEMO' : ''}</span>
                <h2 className="detail-ticket-id">{selectedReport.id_laporan}</h2>
                <p className="detail-road-title">{selectedReport.keterangan_lokasi || 'Lokasi tidak tersedia'}</p>
                <span className={`status-pill status-${selectedReport.status || 'unknown'}`}>{STATUS_LABELS[selectedReport.status] || selectedReport.status || 'Status tidak tersedia'}</span>
              </div>
              <dl className="report-facts">
                <div><dt>Pelapor</dt><dd>{selectedReport.pelapor_nama || (demo ? 'Warga demo' : 'Tidak tersedia')}</dd></div>
                <div><dt>Kategori gangguan</dt><dd>{CATEGORY_LABELS[selectedReport.kategori] || selectedReport.kategori || 'Tidak tersedia'}</dd></div>
                <div><dt>Tingkat kegelapan</dt><dd>{selectedReport.tingkat_kegelapan ?? 'Belum tersedia'}</dd></div>
                <div><dt>Kondisi penerangan</dt><dd>{demo ? LIGHTING_LABELS[selectedReport.lightingCondition] : LIGHTING_LABELS[selectedReport.kondisi_penerangan] || 'Belum diketahui'}</dd></div>
                <div><dt>Tanggal laporan</dt><dd>{formatDate(selectedReport.tanggal_laporan)}</dd></div>
                <div><dt>Deskripsi</dt><dd>{selectedReport.deskripsi || 'Deskripsi tidak tersedia'}</dd></div>
                {Number.isFinite(Number(selectedReport.latitude)) && selectedReport.latitude != null && Number.isFinite(Number(selectedReport.longitude)) && selectedReport.longitude != null && <div><dt>Koordinat</dt><dd>{selectedReport.latitude}, {selectedReport.longitude}</dd></div>}
              </dl>

              <div className="report-photo">
                <h3>Foto laporan awal</h3>
                {selectedReport.foto ? <SafeImage src={selectedReport.foto} alt={`Foto awal laporan ${selectedReport.id_laporan}`} fallback="Foto laporan gagal dimuat" /> : <p className="empty-state">Foto tidak tersedia pada data laporan.</p>}
              </div>

              <section className="validation-panel">
                <h3>Hasil validasi AI</h3>
                {demo ? <>
                  <p className="simulation-notice">SIMULASI DEMO — hasil ini bukan keluaran model AI sungguhan.</p>
                  <dl className="report-facts">
                    <div><dt>Status validasi</dt><dd>{selectedReport.demo_ai_status === 'waiting' ? 'Menunggu' : selectedReport.demo_ai_status === 'valid' ? 'Valid · SIMULASI' : 'Ditolak · SIMULASI'}</dd></div>
                    <div><dt>Catatan</dt><dd>{selectedReport.demo_ai_note || 'Belum ada hasil validasi.'}</dd></div>
                  </dl>
                  {selectedReport.demo_ai_status === 'waiting' && <div className="report-actions">
                    <button type="button" className="btn-primary" onClick={() => handleDemoAI('valid')}>Simulasikan hasil valid</button>
                    <button type="button" className="btn-secondary" onClick={() => handleDemoAI('ditolak')}>Simulasikan ditolak</button>
                  </div>}
                </> : <>
                  <p className="validation-warning">Hasil AI ditampilkan hanya jika tersedia dari backend. Pemrosesan tidak disimulasikan pada data operasional.</p>
                  {validation?.state === 'loading' && <p>Memuat hasil validasi...</p>}
                  {validation?.state === 'error' && <p role="alert">{validation.error}</p>}
                  {validation?.state === 'empty' && <p>Hasil validasi belum tersedia.</p>}
                  {validation?.state === 'data' && validation.data && <dl className="report-facts">
                    <div><dt>Hasil</dt><dd>{validation.data.hasil_validasi || 'Tidak tersedia'}</dd></div>
                    <div><dt>Tingkat kegelapan AI</dt><dd>{validation.data.tingkat_kegelapan_ai ?? 'Tidak tersedia'}</dd></div>
                    {validation.data.cnn_confidence != null && <div><dt>CNN confidence</dt><dd>{validation.data.cnn_confidence}</dd></div>}
                    {validation.data.yolo_confidence != null && <div><dt>YOLO confidence</dt><dd>{validation.data.yolo_confidence}</dd></div>}
                    {validation.data.model_version && <div><dt>Versi model</dt><dd>{validation.data.model_version}</dd></div>}
                    {validation.data.catatan && <div><dt>Catatan</dt><dd>{validation.data.catatan}</dd></div>}
                  </dl>}
                </>}
              </section>

              {demo && <section className="demo-handling-panel">
                <h3>Penanganan laporan · SIMULASI</h3>
                <div className="demo-handling-status">
                  <span>Status penanganan</span><strong>{HANDLING_LABELS[selectedReport.handlingStatus] || 'Perlu penanganan'}</strong>
                </div>
                <p className="simulation-notice">Status penanganan berbeda dari kondisi penerangan. Perubahan data ini hanya berlaku pada laporan demo.</p>
                {canHandleDemo && selectedReport.handlingStatus === 'perlu_penanganan' && <button type="button" className="btn-primary" onClick={handleDemoStart}>Mulai penanganan demo</button>}
                {canHandleDemo && ['dalam_penanganan', 'perlu_penanganan'].includes(selectedReport.handlingStatus) && <div className="evidence-form">
                  <label htmlFor="handling-note">Catatan penanganan</label>
                  <textarea id="handling-note" value={currentEvidenceDraft.note} onChange={(event) => setEvidenceDraft({ ...currentEvidenceDraft, note: event.target.value })} rows="3" placeholder="Catatan simulasi penanganan..." />
                  <label htmlFor="repair-photo">Foto bukti perbaikan (JPEG, PNG, atau WebP; maks. 1,5 MB)</label>
                  <input id="repair-photo" type="file" accept="image/jpeg,image/png,image/webp" onChange={handlePhotoChange} />
                  {currentEvidenceDraft.error && <p className="error-state" role="alert">{currentEvidenceDraft.error}</p>}
                  {currentEvidenceDraft.photo && <div className="photo-preview"><span>Preview foto bukti</span><img src={currentEvidenceDraft.photo} alt="Pratinjau foto bukti perbaikan" /></div>}
                  <button type="button" className="btn-primary" onClick={handleSaveDemoEvidence}>Simpan bukti demo</button>
                </div>}
                {selectedReport.repairPhoto && <div className="before-after-photos">
                  <div><span>Foto awal</span><SafeImage src={selectedReport.foto} alt="Foto awal laporan" fallback="Foto awal gagal dimuat" /></div>
                  <div><span>Foto bukti penanganan · DEMO</span><SafeImage src={selectedReport.repairPhoto} alt="Foto bukti penanganan simulasi" fallback="Foto bukti gagal dimuat" /></div>
                </div>}
                {selectedReport.handlingStatus === 'menunggu_verifikasi' && <div className="report-actions verification-actions">
                  <p>Bukti menunggu verifikasi. Pilih hasil simulasi berikut.</p>
                  <button type="button" className="btn-primary" onClick={() => handleVerifyEvidence(true)}>Simulasikan bukti memenuhi</button>
                  <button type="button" className="btn-secondary" onClick={() => handleVerifyEvidence(false)}>Simulasikan perlu tindak lanjut</button>
                </div>}
                {selectedReport.repairEvidenceResult && <p className="completion-note">
                  Hasil verifikasi bukti: {selectedReport.repairEvidenceResult === 'bright' ? 'memenuhi · SIMULASI' : 'perlu tindak lanjut · SIMULASI'}.
                  {selectedReport.repairEvidenceVerifiedAt && ` ${formatDate(selectedReport.repairEvidenceVerifiedAt)}`}
                </p>}
                {selectedReport.handlingNote && <div className="handling-note-view"><strong>Catatan</strong><p>{selectedReport.handlingNote}</p></div>}
              </section>}

              {!demo && <section className="demo-handling-panel backend-handling-panel">
                <h3>Penanganan laporan</h3>
                <div className="demo-handling-status">
                  <span>Status penanganan</span>
                  <strong>{HANDLING_LABELS[selectedReport.status_penanganan] || 'Belum tersedia'}</strong>
                </div>
                <dl className="report-facts">
                  <div><dt>Kondisi penerangan saat ini</dt><dd>{LIGHTING_LABELS[selectedReport.kondisi_penerangan] || 'Belum diketahui'}</dd></div>
                  {selectedReport.kondisi_penerangan_usulan && <div><dt>Kondisi usulan (menunggu verifikasi)</dt><dd>{LIGHTING_LABELS[selectedReport.kondisi_penerangan_usulan] || selectedReport.kondisi_penerangan_usulan}</dd></div>}
                </dl>
                {backendDetailError && <p className="error-state" role="alert">Detail/riwayat backend gagal dimuat: {backendDetailError}</p>}
                {backendDetail?.laporan?.id_laporan === selectedReport.id_laporan && <>
                  {selectedReport.status_penanganan === 'perlu_penanganan' && selectedReport.status === 'diterima' && <button type="button" className="btn-primary" onClick={handleStartBackendHandling} disabled={actionLoading}>
                    {actionLoading ? 'Menyimpan...' : 'Mulai penanganan'}
                  </button>}
                  {selectedReport.status_penanganan === 'dalam_penanganan' && <div className="evidence-form">
                    <label htmlFor="backend-handling-note">Catatan penanganan</label>
                    <textarea id="backend-handling-note" value={currentEvidenceDraft.note} onChange={(event) => setEvidenceDraft({ ...currentEvidenceDraft, note: event.target.value })} rows="3" maxLength="2000" placeholder="Catatan pekerjaan yang dilakukan..." />
                    <label htmlFor="backend-lighting-condition">Kondisi penerangan hasil penanganan</label>
                    <select id="backend-lighting-condition" value={currentEvidenceDraft.condition} onChange={(event) => setEvidenceDraft({ ...currentEvidenceDraft, condition: event.target.value })}>
                      {['gelap', 'redup', 'baik', 'belum_diketahui'].map((condition) => <option key={condition} value={condition}>{LIGHTING_LABELS[condition]}</option>)}
                    </select>
                    <label htmlFor="backend-repair-photo">Foto bukti (JPEG, PNG, atau WebP; maks. 5 MB)</label>
                    <input id="backend-repair-photo" type="file" accept="image/jpeg,image/png,image/webp" onChange={handlePhotoChange} />
                    {currentEvidenceDraft.error && <p className="error-state" role="alert">{currentEvidenceDraft.error}</p>}
                    {currentEvidenceDraft.photo && <div className="photo-preview"><span>Pratinjau lokal · belum tersimpan</span><img src={currentEvidenceDraft.photo} alt="Pratinjau foto bukti sebelum diunggah" /></div>}
                    <button type="button" className="btn-primary" onClick={handleSaveBackendEvidence} disabled={actionLoading}>
                      {actionLoading ? 'Mengunggah...' : 'Kirim Bukti Penyelesaian'}
                    </button>
                  </div>}
                  {selectedReport.status_penanganan === 'menunggu_verifikasi' && <div className="report-actions verification-actions">
                    <p>Bukti tersimpan pada laporan ini. Validasi AI untuk foto bukti belum tersedia; status Selesai tidak boleh ditetapkan hanya dari pemeriksaan manual.</p>
                    <label htmlFor="backend-verification-note">Catatan verifikasi atau alasan tindak lanjut</label>
                    <textarea id="backend-verification-note" value={verificationNote} onChange={(event) => setVerificationNote(event.target.value)} rows="2" maxLength="2000" placeholder="Catatan verifikasi (opsional jika memenuhi, wajib jika perlu tindak lanjut)" />
                    <button type="button" className="btn-primary" disabled title="Validasi AI untuk foto bukti belum tersedia">{actionLoading ? 'Memeriksa...' : 'Verifikasi: memenuhi (AI belum tersedia)'}</button>
                    <button type="button" className="btn-secondary" onClick={() => handleVerifyBackendEvidence(false)} disabled={actionLoading}>Perlu tindak lanjut</button>
                  </div>}
                  {selectedReport.foto_bukti_url && <div className="before-after-photos">
                    <div><span>Foto awal</span><SafeImage src={selectedReport.foto} alt="Foto awal laporan" fallback="Foto awal gagal dimuat" /></div>
                    <div><span>Foto bukti penanganan</span><AuthenticatedImage src={selectedReport.foto_bukti_url} alt="Foto bukti penanganan" fallback="Foto bukti gagal dimuat atau tidak dapat diakses" /></div>
                  </div>}
                  {selectedReport.catatan_penanganan && <div className="handling-note-view"><strong>Catatan penanganan</strong><p>{selectedReport.catatan_penanganan}</p></div>}
                  <div className="handling-history">
                    <h4>Riwayat progres laporan</h4>
                    {backendDetail.progres?.length ? backendDetail.progres.map((item) => (
                      <article key={item.id_progres} className="handling-history-item">
                        <strong>{item.judul}</strong>
                        <time>{formatDate(item.tanggal_progres)}</time>
                        <p>{item.deskripsi}</p>
                        {item.foto_url && <AuthenticatedImage src={item.foto_url} alt={`Foto progres ${item.judul}`} fallback="Foto progres gagal dimuat" />}
                      </article>
                    )) : <p className="empty-state">Belum ada riwayat progres dari backend.</p>}
                  </div>
                </>}
              </section>}

              {!demo && <div className="report-actions">
                {['diajukan', 'diproses_ai'].includes(selectedReport.status) && <button type="button" onClick={handleRunBackendAI} disabled={actionLoading} className="btn-primary">{actionLoading ? 'Memproses...' : 'Jalankan validasi AI backend'}</button>}
              </div>}
              {!demo && <p className="completion-note">Status Selesai mensyaratkan validasi bukti yang tersedia dan persetujuan penanganan. Kondisi penerangan tetap terpisah dari status laporan.</p>}
            </>}
          </aside>
        </div>
      </div>
    </Layout>
  )
}

export default LaporanWarga
