import { useEffect, useMemo, useState } from 'react'
import { MapContainer, Marker, Popup, TileLayer, useMap } from 'react-leaflet'
import L from 'leaflet'
import { useNavigate } from 'react-router-dom'
import SafeImage from '../components/SafeImage'
import Layout from '../components/Layout'
import { getLaporanDinasBackend } from '../services/laporanService'
import 'leaflet/dist/leaflet.css'
import '../css/Dashboard.css'

const CATEGORY_LABELS = {
  PJU_MATI: 'PJU mati',
  PJU_RUSAK: 'PJU rusak',
  PJU_TIDAK_ADA: 'PJU tidak tersedia',
  LAINNYA: 'Lainnya',
}

const STATUS_LABELS = {
  diajukan: 'Menunggu validasi',
  diproses_ai: 'Validasi AI berlangsung',
  diterima: 'Diterima',
  ditolak: 'Ditolak',
  diproses: 'Dalam penanganan',
  selesai: 'Selesai ditangani',
  perlu_penanganan: 'Perlu penanganan',
  dalam_penanganan: 'Dalam penanganan',
  menunggu_verifikasi: 'Menunggu verifikasi bukti',
  selesai_ditangani: 'Selesai ditangani',
}

const LIGHTING_LABELS = {
  dark: 'Gelap / lampu tidak berfungsi',
  dim: 'Redup',
  bright: 'Baik',
  unknown: 'Belum diketahui',
}

const LIGHTING_COLORS = {
  dark: '#ef4444',
  dim: '#f59e0b',
  bright: '#10b981',
  unknown: '#94a3b8',
}

function getLightingCondition(report) {
  return ({
    gelap: 'dark',
    redup: 'dim',
    baik: 'bright',
    belum_diketahui: 'unknown',
  })[report.kondisi_penerangan] || 'unknown'
}

function hasCoordinates(report) {
  return report.latitude !== null && report.latitude !== undefined && report.latitude !== ''
    && report.longitude !== null && report.longitude !== undefined && report.longitude !== ''
    && Number.isFinite(Number(report.latitude)) && Number.isFinite(Number(report.longitude))
}

function createMarkerIcon(condition, selected) {
  return L.divIcon({
    className: 'peteng-leaflet-marker',
    html: `<span class="map-marker-dot ${selected ? 'map-marker-selected' : ''}" style="--marker-color:${LIGHTING_COLORS[condition] || LIGHTING_COLORS.unknown}"></span>`,
    iconSize: [24, 24],
    iconAnchor: [12, 12],
  })
}

function MapFocus({ report }) {
  const map = useMap()
  useEffect(() => {
    if (report && Number.isFinite(report.latitude) && Number.isFinite(report.longitude)) {
      map.flyTo([report.latitude, report.longitude], Math.max(map.getZoom(), 14), { duration: 0.4 })
    }
  }, [report, map])
  return null
}

function Dashboard() {
  const navigate = useNavigate()
  const [backendReports, setBackendReports] = useState([])
  const [backendState, setBackendState] = useState('loading')
  const [selectedReportId, setSelectedReportId] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('Semua')
  const [statusFilter, setStatusFilter] = useState('Semua')
  const [lightingFilter, setLightingFilter] = useState('Semua')
  const [tilesFailed, setTilesFailed] = useState(false)

  useEffect(() => {
    let active = true
    getLaporanDinasBackend()
      .then((reports) => {
        if (!active) return
        setBackendReports(Array.isArray(reports) ? reports : [])
        setBackendState(Array.isArray(reports) ? (reports.length ? 'data' : 'empty') : 'unavailable')
      })
      .catch((error) => {
        console.error('Gagal memuat laporan untuk monitoring peta:', error)
        if (active) setBackendState('error')
      })
    return () => { active = false }
  }, [])

  const reports = backendReports
  const filteredReports = useMemo(() => reports.filter((report) => {
    if (categoryFilter !== 'Semua' && report.kategori !== categoryFilter) return false
    if (statusFilter !== 'Semua' && report.status !== statusFilter && report.status_penanganan !== statusFilter) return false
    if (lightingFilter !== 'Semua') {
      if (getLightingCondition(report) !== lightingFilter) return false
    }
    return true
  }), [reports, categoryFilter, statusFilter, lightingFilter])

  const coordinateReports = filteredReports.filter(hasCoordinates)
  const selectedReport = filteredReports.find((report) => report.id_laporan === selectedReportId)
    || coordinateReports[0]
    || filteredReports[0]
    || null
  const mapCenter = selectedReport && hasCoordinates(selectedReport)
    ? selectedReport
    : coordinateReports[0]
  const center = mapCenter
    ? [Number(mapCenter.latitude), Number(mapCenter.longitude)]
    : null
  const state = backendState
  const countStatus = (statuses) => filteredReports.filter((report) => (
    statuses.includes(report.status) || statuses.includes(report.status_penanganan)
  )).length
  const darkCount = filteredReports.filter((report) => (
    ['PJU_MATI', 'PJU_RUSAK', 'PJU_TIDAK_ADA'].includes(report.kategori)
  )).length
  const mapStateLabel = state === 'error'
      ? 'Data backend gagal dimuat'
      : state === 'empty'
        ? 'Belum ada laporan dari backend'
        : state === 'loading'
          ? 'Memuat data backend...'
          : 'DATA BACKEND'

  const selectReport = (report) => setSelectedReportId(report.id_laporan)

  return (
    <Layout>
      <div className="dashboard-container">
        <section className="dashboard-page-heading">
          <div>
            <span className="section-eyebrow">PEMETAAN LAPORAN AREA RAWAN GELAP</span>
            <h1>Monitoring Peta</h1>
            <p>Peta menunjukkan lokasi laporan, bukan pengukuran sensor kondisi penerangan.</p>
          </div>
        </section>

        <div className="dashboard-source-banner" role="status">
          <strong>{mapStateLabel}</strong>
          <span>
            {state === 'error'
                ? 'Kegagalan memuat API berbeda dari kondisi data kosong.'
                : 'Hanya laporan yang diterima dari API backend yang ditampilkan.'}
          </span>
        </div>

        <section className="status-summary-bar dashboard-map-filters">
          <div className="category-filter-select">
            <label className="select-label" htmlFor="map-category-filter">Kategori</label>
            <select id="map-category-filter" value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)} className="dark-select">
              <option value="Semua">Semua kategori</option>
              {Object.entries(CATEGORY_LABELS).map(([key, label]) => <option key={key} value={key}>{label}</option>)}
            </select>
            <label className="select-label" htmlFor="map-status-filter">Status penanganan</label>
            <select id="map-status-filter" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="dark-select">
              <option value="Semua">Semua status</option>
              {Object.entries(STATUS_LABELS).map(([key, label]) => <option key={key} value={key}>{label}</option>)}
            </select>
            <label className="select-label" htmlFor="map-light-filter">Kondisi penerangan</label>
            <select id="map-light-filter" value={lightingFilter} onChange={(e) => setLightingFilter(e.target.value)} className="dark-select">
              <option value="Semua">Semua kondisi</option>
              {Object.entries(LIGHTING_LABELS).map(([key, label]) => <option key={key} value={key}>{label}</option>)}
            </select>
          </div>
        </section>

        <section className="metric-cards-grid">
          {[
            ['LAPORAN JALAN GELAP', darkCount, 'Jumlah laporan kategori gangguan PJU'],
            ['PERLU DIVERIFIKASI', countStatus(['diajukan', 'diproses_ai']), 'Mengikuti status laporan dari backend'],
            ['DALAM PENANGANAN', countStatus(['diproses']), 'Status laporan dari backend'],
            ['SELESAI DITANGANI', countStatus(['selesai']), 'Status laporan; tidak menyatakan pengukuran fisik'],
          ].map(([label, count, note]) => (
            <div className="metric-card" key={label}>
              <div className="metric-card-top"><span className="metric-label">{label}</span></div>
              <div className="metric-main-value"><span className="number">{state === 'loading' ? '...' : state === 'error' ? '—' : count}</span><span className="unit">laporan</span></div>
              <div className="metric-subtext text-muted"><span>{note}</span></div>
            </div>
          ))}
        </section>

        <section className="dashboard-middle-grid">
          <div className="radar-map-card">
            <div className="radar-header">
              <div className="radar-title-group">
                <h2 className="radar-title">Peta lokasi laporan</h2>
                <span className="radar-static-badge">BACKEND</span>
              </div>
              <span className="map-layer-note">OpenStreetMap · © OpenStreetMap contributors</span>
            </div>
            {tilesFailed && <p className="map-network-warning" role="status">Tile peta tidak dapat dimuat. Periksa koneksi internet; marker laporan tetap tersedia.</p>}
            <div className="leaflet-map-shell">
              {coordinateReports.length > 0 && center ? <MapContainer center={center} zoom={13} scrollWheelZoom zoomControl>
                <TileLayer
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">OpenStreetMap</a> contributors'
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  eventHandlers={{ tileerror: () => setTilesFailed(true) }}
                />
                <MapFocus report={mapCenter} />
                {coordinateReports.map((report) => {
                  const condition = getLightingCondition(report)
                  return (
                    <Marker
                      key={report.id_laporan}
                      position={[Number(report.latitude), Number(report.longitude)]}
                      icon={createMarkerIcon(condition, selectedReport?.id_laporan === report.id_laporan)}
                      eventHandlers={{ click: () => selectReport(report) }}
                    >
                      <Popup>
                        <strong>{report.id_laporan}</strong><br />
                        {report.keterangan_lokasi || 'Lokasi tidak tersedia'}<br />
                        {CATEGORY_LABELS[report.kategori] || report.kategori || 'Kategori tidak tersedia'}<br />
                        Kondisi: {LIGHTING_LABELS[condition] || 'Belum diketahui'}
                      </Popup>
                    </Marker>
                  )
                })}
              </MapContainer> : <div className="map-placeholder-message map-empty-message">
                <strong>{state === 'error' ? 'Data backend gagal dimuat' : state === 'loading' ? 'Memuat laporan...' : 'Tidak ada koordinat pada hasil filter'}</strong>
                <span>{state === 'error' ? 'Coba muat ulang halaman.' : 'Ubah filter atau tunggu laporan dengan koordinat tersedia.'}</span>
              </div>}
            </div>
            <div className="map-legend" aria-label="Legenda kondisi penerangan">
              <strong>Kondisi penerangan dari backend</strong>
              {Object.entries(LIGHTING_LABELS).map(([key, label]) => (
                <span key={key}><i style={{ backgroundColor: LIGHTING_COLORS[key] }} />{label}</span>
              ))}
            </div>
            <div className="radar-footer">
              <span>{coordinateReports.length} marker dari {filteredReports.length} laporan sesuai filter.</span>
              <span>Kondisi penerangan tidak disimpulkan dari status laporan.</span>
            </div>
          </div>

          <aside className="priority-detail-card">
            {selectedReport ? (
              <>
                <div className="priority-header">
                  <div className="priority-tags">
                    <span className="report-detail-badge">LAPORAN TERPILIH</span>
                    <span className="ticket-id-tag">{selectedReport.id_laporan}</span>
                  </div>
                  <h3 className="priority-title">{selectedReport.deskripsi || 'Deskripsi tidak tersedia'}</h3>
                  <p className="priority-location">{selectedReport.keterangan_lokasi || 'Lokasi tidak tersedia'}</p>
                  <div className="condition-chips">
                    <span className="report-meta-chip">{CATEGORY_LABELS[selectedReport.kategori] || selectedReport.kategori}</span>
                    <span className="report-meta-chip">{STATUS_LABELS[selectedReport.status] || selectedReport.status || 'Status tidak tersedia'}</span>
                  </div>
                </div>
                <div className="visual-evidence-box">
                  <div className="visual-evidence-header"><span>FOTO LAPORAN</span></div>
                  {selectedReport.foto
                    ? <SafeImage src={selectedReport.foto} alt={`Foto laporan ${selectedReport.id_laporan}`} className="evidence-thumbnail" fallback="Foto laporan gagal dimuat" />
                    : <p className="report-data-note">Foto tidak tersedia pada data laporan.</p>}
                </div>
                <dl className="map-report-facts">
                  <div><dt>Kondisi penerangan</dt><dd>{LIGHTING_LABELS[getLightingCondition(selectedReport)]}</dd></div>
                  <div><dt>Koordinat</dt><dd>{selectedReport.latitude}, {selectedReport.longitude}</dd></div>
                  <div><dt>Tanggal</dt><dd>{selectedReport.tanggal_laporan ? new Date(selectedReport.tanggal_laporan).toLocaleString('id-ID') : 'Tidak tersedia'}</dd></div>
                </dl>
                <button type="button" className="btn-primary" onClick={() => navigate('/laporan-warga')}>Buka pengelolaan laporan</button>
              </>
            ) : (
              <div className="priority-empty-state">{state === 'error' ? 'Data backend gagal dimuat.' : state === 'loading' ? 'Memuat laporan...' : 'Tidak ada laporan untuk ditampilkan.'}</div>
            )}
          </aside>
        </section>

        <section className="dashboard-table-section">
          <div className="table-section-header">
            <div>
              <h2 className="table-title">Daftar laporan pada peta</h2>
              <p className="table-subtitle">{mapStateLabel} · {filteredReports.length} laporan</p>
            </div>
          </div>
          <div className="table-responsive">
            <table className="peteng-data-table">
              <thead><tr><th>ID LAPORAN</th><th>LOKASI</th><th>KATEGORI</th><th>STATUS</th><th>KONDISI PENERANGAN</th></tr></thead>
              <tbody>
                {filteredReports.map((report) => (
                  <tr key={report.id_laporan} onClick={() => selectReport(report)} className="dashboard-report-row">
                    <td>{report.id_laporan}</td>
                    <td>{report.keterangan_lokasi || 'Lokasi tidak tersedia'}</td>
                    <td>{CATEGORY_LABELS[report.kategori] || report.kategori || 'Tidak tersedia'}</td>
                    <td>{STATUS_LABELS[report.status_penanganan] || STATUS_LABELS[report.status] || report.status || 'Tidak tersedia'}</td>
                    <td>{LIGHTING_LABELS[getLightingCondition(report)]}</td>
                  </tr>
                ))}
                {filteredReports.length === 0 && <tr><td colSpan="5" className="table-empty-state">{state === 'error' ? 'Permintaan data backend gagal.' : 'Tidak ada data untuk filter ini.'}</td></tr>}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </Layout>
  )
}

export default Dashboard
