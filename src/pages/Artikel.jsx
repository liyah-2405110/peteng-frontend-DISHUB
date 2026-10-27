import { useEffect, useMemo, useState } from 'react'
import Layout from '../components/Layout'
import AuthenticatedImage from '../components/AuthenticatedImage'
import SafeImage from '../components/SafeImage'
import { useDemoData } from '../context/useDemoData'
import { getDetailLaporanDinas, getLaporanDinasBackend } from '../services/laporanService'
import '../css/Artikel.css'

const HANDLING_LABELS = {
  perlu_penanganan: 'Perlu penanganan',
  dalam_penanganan: 'Dalam penanganan',
  menunggu_verifikasi: 'Menunggu verifikasi bukti',
  selesai_ditangani: 'Selesai ditangani',
}
const CATEGORY_LABELS = {
  PJU_MATI: 'PJU mati',
  PJU_RUSAK: 'PJU rusak',
  PJU_TIDAK_ADA: 'PJU tidak tersedia',
  LAINNYA: 'Lainnya',
}

function formatDate(value) {
  if (!value) return 'Tanggal tidak tersedia'
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? 'Tanggal tidak tersedia' : date.toLocaleDateString('id-ID', { dateStyle: 'medium' })
}

function Artikel() {
  const { demoReports, demoNews } = useDemoData()
  const activeTab = 'progress'
  const source = 'backend'
  const [backendReports, setBackendReports] = useState([])
  const [backendLoading, setBackendLoading] = useState(true)
  const [backendError, setBackendError] = useState('')
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('Semua')
  const [selectedReportId, setSelectedReportId] = useState('')
  const [backendDetail, setBackendDetail] = useState(null)
  const [detailLoading, setDetailLoading] = useState(false)
  const [detailError, setDetailError] = useState('')

  useEffect(() => {
    let active = true
    getLaporanDinasBackend()
      .then((reports) => { if (active) setBackendReports(reports) })
      .catch((error) => {
        console.error('Gagal memuat progres dari backend:', error)
        if (active) setBackendError(error.message || 'Progres gagal dimuat dari backend.')
      })
      .finally(() => { if (active) setBackendLoading(false) })
    return () => { active = false }
  }, [])

  useEffect(() => {
    if (source !== 'backend' || !selectedReportId || activeTab !== 'progress') return undefined
    let active = true
    getDetailLaporanDinas(selectedReportId)
      .then((detail) => {
        if (active) {
          setBackendDetail(detail)
          setDetailLoading(false)
        }
      })
      .catch((error) => {
        console.error('Gagal memuat detail progres dari backend:', error)
        if (active) {
          setBackendDetail(null)
          setDetailError(error.message || 'Detail progres gagal dimuat.')
          setDetailLoading(false)
        }
      })
    return () => { active = false }
  }, [source, selectedReportId, activeTab])

  const progressReports = useMemo(() => (source === 'demo' ? demoReports : backendReports)
    .filter((report) => {
      if (source === 'demo') {
        return ['dalam_penanganan', 'menunggu_verifikasi', 'selesai_ditangani'].includes(report.handlingStatus)
      }
      return ['dalam_penanganan', 'menunggu_verifikasi', 'selesai_ditangani'].includes(report.status_penanganan)
        || ['diproses', 'selesai'].includes(report.status)
    })
    .filter((report) => {
      const state = source === 'demo'
        ? report.handlingStatus
        : report.status_penanganan || (report.status === 'diproses' ? 'dalam_penanganan' : report.status === 'selesai' ? 'selesai_ditangani' : '')
      return statusFilter === 'Semua' || state === statusFilter
    })
    .filter((report) => {
      const query = search.trim().toLocaleLowerCase()
      return !query || [report.id_laporan, report.keterangan_lokasi, report.deskripsi, report.handlingNote, report.catatan_penanganan]
        .filter(Boolean).join(' ').toLocaleLowerCase().includes(query)
    })
    .sort((left, right) => new Date(right.updated_at) - new Date(left.updated_at)), [source, demoReports, backendReports, search, statusFilter])

  const newsItems = demoNews.filter((item) => {
    const query = search.trim().toLocaleLowerCase()
    return !query || [item.title, item.sourceName, item.summary, item.category, item.locationName]
      .filter(Boolean).join(' ').toLocaleLowerCase().includes(query)
  })

  const selectedDemoReport = demoReports.find((report) => report.id_laporan === selectedReportId)
  const selectedBackendReport = backendReports.find((report) => report.id_laporan === selectedReportId)
  const selectedReport = source === 'demo' ? selectedDemoReport : selectedBackendReport
  const selectedBackendDetail = backendDetail?.laporan?.id_laporan === selectedReportId ? backendDetail : null
  const getHandlingStatus = (report) => source === 'demo'
    ? report.handlingStatus
    : report.status_penanganan || (report.status === 'diproses' ? 'dalam_penanganan' : report.status === 'selesai' ? 'selesai_ditangani' : '')

  return (
    <Layout>
      <div className="publikasi-progres-page">
        <section className="publikasi-header">
          <div className="header-title-wrap">
            <span className="channel-tag">INFORMASI PROGRES PENANGANAN LAPORAN</span>
            <h1 className="header-title">Publikasi Progres</h1>
            <p className="header-desc">Informasi penyelesaian ditampilkan dari laporan yang sama pada backend.</p>
          </div>
        </section>

        <div className="publication-unavailable" role="status">
          <span className="publication-status-label">PROGRES · BACKEND</span>
          <p>Status, catatan, foto, dan riwayat progres ditampilkan dari backend menggunakan ID laporan yang sama.</p>
        </div>

        <nav className="publication-tabs" aria-label="Tab publikasi">
          <span className="publication-tab active">Laporan selesai dari backend</span>
        </nav>

        <section className="publication-filter-panel">
          <input type="search" className="filter-search-input" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Cari ID laporan, lokasi, atau catatan" aria-label="Cari publikasi" />
          <select className="filter-dropdown" value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)} aria-label="Filter status progres">
              <option value="Semua">Semua status progres</option>
              {Object.entries(HANDLING_LABELS).map(([key, label]) => <option key={key} value={key}>{label}</option>)}
          </select>
        </section>

        {activeTab === 'progress' ? (
          <section className="progress-list">
            {source === 'backend' && backendLoading ? <div className="publication-empty-state">Memuat progres dari backend...</div>
              : source === 'backend' && backendError ? <div className="publication-empty-state" role="alert">Gagal memuat progres backend: {backendError}</div>
                : progressReports.length === 0 ? <div className="publication-empty-state">Belum ada laporan backend yang memiliki progres penanganan sesuai filter.</div>
              : progressReports.map((report) => (
                <button key={report.id_laporan} type="button" className={`progress-card ${selectedReportId === report.id_laporan ? 'progress-card-selected' : ''}`} onClick={() => {
                  setSelectedReportId(report.id_laporan)
                  if (source === 'backend') setDetailLoading(true)
                  setDetailError('')
                }}>
                  <div className="progress-card-image">
                    {source === 'backend' && report.foto_bukti_url
                      ? <AuthenticatedImage src={report.foto_bukti_url} alt={`Foto bukti laporan ${report.id_laporan}`} fallback="Foto bukti tidak tersedia" />
                      : <SafeImage src={source === 'demo' ? report.repairPhoto || report.foto : report.foto} alt={`Foto laporan ${report.id_laporan}`} fallback="Foto tidak tersedia" />}
                    <span>{source === 'demo' ? report.repairPhoto ? 'FOTO BUKTI · DEMO' : 'FOTO LAPORAN · DEMO' : report.foto_bukti_url ? 'FOTO BUKTI · BACKEND' : 'FOTO LAPORAN · BACKEND'}</span>
                  </div>
                  <div className="progress-card-content">
                    <div className="progress-card-meta"><strong>{report.id_laporan}</strong><span className="demo-row-label">{source === 'demo' ? 'DEMO' : 'BACKEND'}</span></div>
                    <h2>{report.keterangan_lokasi || 'Lokasi tidak tersedia'}</h2>
                    <p>{report.deskripsi || 'Deskripsi tidak tersedia'}</p>
                    <div className="progress-card-facts">
                      <span>{CATEGORY_LABELS[report.kategori] || report.kategori}</span>
                      <span>{HANDLING_LABELS[getHandlingStatus(report)] || 'Status tidak tersedia'}</span>
                      <span>Diperbarui {formatDate(report.updated_at)}</span>
                    </div>
                    {(source === 'demo' ? report.handlingNote : report.catatan_penanganan) && <blockquote>{(source === 'demo' ? report.handlingNote : report.catatan_penanganan).split('\n')[0]}</blockquote>}
                    <span className="progress-card-cta">Lihat detail laporan ›</span>
                  </div>
                </button>
              ))}
          </section>
        ) : (
          <section className="news-demo-grid">
            {newsItems.length === 0 ? <div className="publication-empty-state">Publikasi berita belum tersedia dari backend.</div> : newsItems.map((item) => (
              <article className="news-demo-card" key={item.id}>
                {item.imageUrl ? <img src={item.imageUrl} alt="" className="news-demo-image" /> : <div className="news-demo-image news-image-placeholder" aria-hidden="true">ILUSTRASI DEMO</div>}
                <div className="news-demo-content">
                  <span className="news-demo-label">DEMO · BUKAN BERITA TERVERIFIKASI</span>
                  <h2>{item.title}</h2>
                  <p>{item.summary}</p>
                  <div className="news-demo-meta"><span>{item.sourceName}</span><span>{formatDate(item.publishedAt)}</span><span>{item.category}</span><span>{item.locationName}</span></div>
                  <p className="news-source-unavailable">{item.sourceUrl ? <a href={item.sourceUrl} target="_blank" rel="noreferrer">Buka sumber artikel</a> : 'Tautan sumber tidak tersedia; tidak ada tautan contoh yang ditampilkan.'}</p>
                </div>
              </article>
            ))}
          </section>
        )}

        {selectedReport && activeTab === 'progress' && (
          <div className="publication-detail-backdrop" role="presentation" onClick={(event) => { if (event.target === event.currentTarget) setSelectedReportId('') }}>
            <section className="publication-detail-modal" role="dialog" aria-modal="true" aria-labelledby="publication-detail-title">
              <button type="button" className="publication-modal-close" onClick={() => setSelectedReportId('')} aria-label="Tutup detail">×</button>
              <span className="news-demo-label">DETAIL PROGRES · {source === 'demo' ? 'DEMO' : 'BACKEND'}</span>
              <h2 id="publication-detail-title">{selectedReport.id_laporan}</h2>
              <p>{selectedReport.keterangan_lokasi}</p>
              {source === 'backend' && detailLoading ? <p role="status">Memuat detail laporan dari backend...</p>
                : source === 'backend' && detailError ? <p role="alert">Detail progres gagal dimuat: {detailError}</p>
                  : source === 'backend' && !selectedBackendDetail ? <p>Detail laporan belum tersedia dari backend.</p>
                    : <>
                      <div className="progress-before-after">
                        <div>
                          <h3>Foto laporan awal</h3>
                          {source === 'demo'
                            ? <SafeImage src={selectedReport.foto} alt="Foto awal laporan demo" fallback="Foto awal gagal dimuat" />
                            : <SafeImage src={selectedBackendDetail.laporan.foto} alt="Foto awal laporan" fallback="Foto awal tidak tersedia" />}
                        </div>
                        <div>
                          <h3>Foto bukti penanganan</h3>
                          {source === 'demo'
                            ? selectedReport.repairPhoto
                              ? <SafeImage src={selectedReport.repairPhoto} alt="Foto bukti demo" fallback="Foto bukti gagal dimuat" />
                              : <p>Bukti foto belum diunggah pada simulasi.</p>
                            : selectedBackendDetail.laporan.foto_bukti_url
                              ? <AuthenticatedImage src={selectedBackendDetail.laporan.foto_bukti_url} alt="Foto bukti penanganan backend" fallback="Foto bukti gagal dimuat" />
                              : <p>Bukti foto belum tersedia dari backend.</p>}
                        </div>
                      </div>
                      <dl className="publication-detail-facts">
                        <div><dt>Kategori</dt><dd>{CATEGORY_LABELS[selectedReport.kategori] || selectedReport.kategori}</dd></div>
                        <div><dt>Status penanganan</dt><dd>{HANDLING_LABELS[getHandlingStatus(selectedReport)] || 'Tidak tersedia'}</dd></div>
                        <div><dt>Kondisi penerangan</dt><dd>{source === 'demo'
                          ? selectedReport.lightingCondition
                          : selectedBackendDetail.laporan.kondisi_penerangan || 'Belum diketahui'}</dd></div>
                        <div><dt>Catatan penanganan</dt><dd>{source === 'demo'
                          ? selectedReport.handlingNote || 'Belum ada catatan demo.'
                          : selectedBackendDetail.laporan.catatan_penanganan || 'Belum ada catatan dari backend.'}</dd></div>
                        <div><dt>Hasil verifikasi bukti</dt><dd>{source === 'demo'
                          ? selectedReport.repairEvidenceResult ? `${selectedReport.repairEvidenceResult} · SIMULASI` : 'Belum diverifikasi'
                          : selectedReport.status_penanganan === 'selesai_ditangani' ? 'Diverifikasi memenuhi oleh petugas'
                            : selectedReport.status_penanganan === 'menunggu_verifikasi' ? 'Menunggu verifikasi petugas'
                              : 'Belum diverifikasi'}</dd></div>
                      </dl>
                      {source === 'backend' && <section className="progress-history">
                        <h3>Riwayat progres</h3>
                        {selectedBackendDetail.progres?.length ? selectedBackendDetail.progres.map((item) => (
                          <article key={item.id_progres}>
                            <strong>{item.judul}</strong><time>{formatDate(item.tanggal_progres)}</time>
                            <p>{item.deskripsi}</p>
                            {item.foto_url && <AuthenticatedImage src={item.foto_url} alt={`Foto progres ${item.judul}`} fallback="Foto progres gagal dimuat" />}
                          </article>
                        )) : <p>Belum ada riwayat progres dari backend.</p>}
                      </section>}
                      <p className="publication-detail-disclaimer">{source === 'demo'
                        ? 'Status progres demo tidak membuktikan perbaikan fisik di lapangan.'
                        : 'Status dan kondisi penerangan mengikuti data yang dikonfirmasi backend.'}</p>
                    </>}
            </section>
          </div>
        )}
      </div>
    </Layout>
  )
}

export default Artikel
