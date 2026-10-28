import { useEffect, useMemo, useState } from 'react'
import Layout from '../components/Layout'
import SafeImage from '../components/SafeImage'
import AuthenticatedImage from '../components/AuthenticatedImage'
import { getLaporanDinasBackend, getDetailLaporanDinas } from '../services/laporanService'
import '../css/Artikel.css'

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

function formatDate(value) {
  if (!value) return 'Waktu tidak tersedia'
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? 'Waktu tidak tersedia' : date.toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' })
}

function Artikel() {
  const [reports, setReports] = useState([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState('')
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('Semua')
  const [selectedId, setSelectedId] = useState('')
  const [detail, setDetail] = useState(null)
  const [detailLoading, setDetailLoading] = useState(false)
  const [detailError, setDetailError] = useState('')

  useEffect(() => {
    let active = true
    getLaporanDinasBackend()
      .then((data) => {
        if (!active) return
        const rows = Array.isArray(data) ? data : []
        setReports(rows)
        const completed = rows.find((row) => row.status === 'selesai' || row.status_penanganan === 'selesai_ditangani')
        if (completed) setSelectedId(completed.id_laporan)
      })
      .catch((error) => { if (active) setLoadError(error.message || 'Publikasi progres gagal dimuat dari backend.') })
      .finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [])

  const progressReports = useMemo(() => reports.filter((report) => {
    const status = report.status_penanganan || (report.status === 'selesai' ? 'selesai_ditangani' : '')
    const q = search.trim().toLocaleLowerCase()
    const text = [report.id_laporan, report.keterangan_lokasi, report.deskripsi, report.catatan_penanganan].filter(Boolean).join(' ').toLocaleLowerCase()
    return (!q || text.includes(q)) && (statusFilter === 'Semua' || status === statusFilter)
  }).sort((a, b) => new Date(b.updated_at || b.tanggal_laporan) - new Date(a.updated_at || a.tanggal_laporan)), [reports, search, statusFilter])

  const selectedReport = progressReports.find((report) => report.id_laporan === selectedId) || progressReports[0] || null

  useEffect(() => {
    if (!selectedReport?.id_laporan) return undefined
    let active = true
    // eslint-disable-next-line react-hooks/set-state-in-effect -- loading state accompanies the detail request.
    setDetailLoading(true)
    setDetailError('')
    getDetailLaporanDinas(selectedReport.id_laporan)
      .then((result) => { if (active) setDetail(result) })
      .catch((error) => { if (active) { setDetail(null); setDetailError(error.message || 'Detail progres gagal dimuat.') } })
      .finally(() => { if (active) setDetailLoading(false) })
    return () => { active = false }
  }, [selectedReport?.id_laporan])

  const detailReport = detail?.laporan
  const progress = detail?.progres || []

  return (
    <Layout>
      <main className="publikasi-progres-page">
        <section className="publikasi-header">
          <div className="header-title-wrap">
            <span className="channel-tag">INFORMASI PROGRES PENANGANAN LAPORAN</span>
            <h1 className="header-title">Publikasi Progres</h1>
            <p className="header-desc">Progres ditampilkan dari laporan operasional yang sama di backend PETENG.</p>
          </div>
        </section>

        <div className="publication-unavailable" role="status">
          <span className="publication-status-label">DATA BACKEND</span>
          <p>Halaman ini tidak memakai artikel contoh. Laporan, status, catatan, dan foto progres diambil dari backend. Feed berita eksternal belum terhubung ke API sehingga tidak ditampilkan sebagai berita nyata.</p>
        </div>

        <section className="publication-filter-panel">
          <input type="search" className="filter-search-input" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Cari ID laporan, lokasi, atau catatan" aria-label="Cari publikasi progres" />
          <select className="filter-dropdown" value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)} aria-label="Filter status progres">
            <option value="Semua">Semua status</option>
            {Object.entries(HANDLING_LABELS).map(([key, label]) => <option key={key} value={key}>{label}</option>)}
          </select>
        </section>

        {loading ? <div className="publication-empty-state">Memuat progres dari backend…</div>
          : loadError ? <div className="publication-empty-state" role="alert">{loadError}<button type="button" onClick={() => window.location.reload()}>Coba lagi</button></div>
            : progressReports.length === 0 ? <div className="publication-empty-state">Belum ada progres laporan yang cocok dengan pencarian atau filter.</div>
              : <section className="progress-list">
                {progressReports.map((report) => {
                  const status = report.status_penanganan || (report.status === 'selesai' ? 'selesai_ditangani' : '')
                  return <button key={report.id_laporan} type="button" className={`progress-card ${selectedReport?.id_laporan === report.id_laporan ? 'progress-card-selected' : ''}`} onClick={() => setSelectedId(report.id_laporan)}>
                    <div className="progress-card-image">
                      {report.foto_bukti_url ? <AuthenticatedImage src={report.foto_bukti_url} alt={`Foto bukti laporan ${report.id_laporan}`} fallback="Foto bukti tidak tersedia" /> : <SafeImage src={report.foto} alt={`Foto laporan ${report.id_laporan}`} fallback="Foto laporan tidak tersedia" />}
                      <span>{report.foto_bukti_url ? 'FOTO BUKTI' : 'FOTO LAPORAN'}</span>
                    </div>
                    <div className="progress-card-content">
                      <div className="progress-card-meta"><strong>{report.id_laporan}</strong><span>{formatDate(report.updated_at || report.tanggal_laporan)}</span></div>
                      <h2>{report.keterangan_lokasi || 'Lokasi tidak tersedia'}</h2>
                      <p>{report.deskripsi || 'Deskripsi tidak tersedia'}</p>
                      <div className="progress-card-facts"><span>{CATEGORY_LABELS[report.kategori] || report.kategori}</span><span>{HANDLING_LABELS[status] || report.status || 'Status belum tersedia'}</span></div>
                      {report.catatan_penanganan && <blockquote>{report.catatan_penanganan.split('\n')[0]}</blockquote>}
                      <span className="progress-card-cta">Lihat detail progres</span>
                    </div>
                  </button>
                })}
              </section>}

        {selectedReport && <section className="publication-detail-inline" aria-labelledby="publication-detail-title">
          <div className="publication-detail-heading"><span className="channel-tag">DETAIL PROGRES</span><h2 id="publication-detail-title">{selectedReport.id_laporan} · {selectedReport.keterangan_lokasi}</h2></div>
          {detailLoading ? <p role="status">Memuat detail laporan…</p> : detailError ? <p role="alert">{detailError}</p> : detailReport && <>
            <div className="progress-before-after">
              <div><h3>Foto laporan awal</h3><SafeImage src={detailReport.foto} alt="Foto laporan awal" fallback="Foto laporan awal tidak tersedia" /></div>
              <div><h3>Foto bukti perbaikan</h3>{detailReport.foto_bukti_url ? <AuthenticatedImage src={detailReport.foto_bukti_url} alt="Foto bukti perbaikan" fallback="Foto bukti tidak tersedia" /> : <p>Belum ada foto bukti perbaikan.</p>}</div>
            </div>
            <dl className="publication-detail-facts">
              <div><dt>Kategori</dt><dd>{CATEGORY_LABELS[detailReport.kategori] || detailReport.kategori}</dd></div>
              <div><dt>Status</dt><dd>{HANDLING_LABELS[detailReport.status_penanganan] || detailReport.status || 'Belum tersedia'}</dd></div>
              <div><dt>Kondisi penerangan</dt><dd>{detailReport.kondisi_penerangan || 'Belum diketahui'}</dd></div>
              <div><dt>Catatan perbaikan</dt><dd>{detailReport.catatan_penanganan || 'Belum ada catatan perbaikan.'}</dd></div>
            </dl>
            {progress.length > 0 && <section className="report-progress-history"><h3>Riwayat progres</h3>{progress.map((item) => <article key={item.id_progres}><strong>{item.judul}</strong><p>{item.deskripsi}</p><small>{formatDate(item.tanggal_progres || item.created_at)}</small></article>)}</section>}
          </>}
        </section>}
      </main>
    </Layout>
  )
}

export default Artikel
