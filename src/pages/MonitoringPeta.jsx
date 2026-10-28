import { useEffect, useMemo, useState } from 'react'
import { MapContainer, Marker, Popup, TileLayer, useMap } from 'react-leaflet'
import L from 'leaflet'
import { useNavigate } from 'react-router-dom'
import SafeImage from '../components/SafeImage'
import Layout from '../components/Layout'
import { getLaporanDinasBackend, updateStatusLaporan, simpanBuktiPenanganan } from '../services/laporanService'
import 'leaflet/dist/leaflet.css'
import '../css/MonitoringPeta.css'

const CATEGORY_LABELS = {
  PJU_MATI: 'PJU mati',
  PJU_RUSAK: 'PJU rusak',
  PJU_TIDAK_ADA: 'PJU tidak tersedia',
  LAINNYA: 'Lainnya',
}

const STATUS_LABELS = {
  diproses: 'Dalam penanganan',
  dalam_penanganan: 'Dalam penanganan',
  selesai: 'Selesai ditangani',
  selesai_ditangani: 'Selesai ditangani',
  menunggu_verifikasi: 'Dalam penanganan',
}

const DONE_STATUSES = ['selesai', 'selesai_ditangani']
const HANDLING_STATUSES = ['diproses', 'dalam_penanganan', 'menunggu_verifikasi']

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

// ===========================================================================
// MODE DEMO: true = tampilan memakai DEMO_REPORTS (belum memanggil backend).
// Saat backend siap, ubah jadi false. Tidak ada kode lain yang perlu diubah.
// ===========================================================================
const USE_DEMO_DATA = true

// Data contoh untuk mencoba alur aplikasi. Koordinat hanya perkiraan area.
const DEMO_REPORTS = [
  { id_laporan: 'LP-2610-001', kategori: 'PJU_MATI', status: 'diajukan', keterangan_lokasi: 'Jl. Raya Lohbener, dekat pertigaan Pantura', deskripsi: 'Lampu jalan padam sepanjang sekitar 450 meter', foto: null, latitude: -6.3880, longitude: 108.2570, kondisi_penerangan: 'gelap', tanggal_laporan: '2026-10-27T19:20:00+07:00' },
  { id_laporan: 'LP-2610-002', kategori: 'PJU_RUSAK', status: 'diproses', keterangan_lokasi: 'Jl. Raya Siliwangi, Karangampel', deskripsi: 'Tiang lampu miring dan lampu berkedip', foto: null, latitude: -6.4686, longitude: 108.4333, kondisi_penerangan: 'redup', tanggal_laporan: '2026-10-26T18:45:00+07:00' },
  { id_laporan: 'LP-2610-003', kategori: 'PJU_MATI', status: 'selesai', keterangan_lokasi: 'Jl. Mayor Dasuki, Sindang', deskripsi: 'Tiga titik lampu mati di dekat alun-alun', foto: null, latitude: -6.3330, longitude: 108.2820, kondisi_penerangan: 'baik', tanggal_laporan: '2026-10-24T20:05:00+07:00' },
  { id_laporan: 'LP-2610-004', kategori: 'PJU_TIDAK_ADA', status: 'diajukan', keterangan_lokasi: 'Jl. Raya Jatibarang, area persawahan', deskripsi: 'Ruas jalan gelap, belum ada lampu jalan', foto: null, latitude: -6.4730, longitude: 108.3010, kondisi_penerangan: 'gelap', tanggal_laporan: '2026-10-27T21:10:00+07:00' },
  { id_laporan: 'LP-2610-005', kategori: 'PJU_RUSAK', status: 'diproses', keterangan_lokasi: 'Jl. Jenderal Sudirman, Indramayu Kota', deskripsi: 'Panel lampu rusak, penerangan tidak stabil', foto: null, latitude: -6.3264, longitude: 108.3200, kondisi_penerangan: 'redup', tanggal_laporan: '2026-10-25T19:30:00+07:00' },
  { id_laporan: 'LP-2610-006', kategori: 'LAINNYA', status: 'diajukan', keterangan_lokasi: 'Jl. Raya Haurgeulis, dekat pasar', deskripsi: 'Kabel PJU menjuntai di pinggir jalan', foto: null, latitude: -6.4440, longitude: 108.1000, kondisi_penerangan: 'belum_diketahui', tanggal_laporan: '2026-10-28T06:40:00+07:00' },
  { id_laporan: 'LP-2610-007', kategori: 'PJU_MATI', status: 'selesai', keterangan_lokasi: 'Jl. Raya Lohbener Barat, KM 14', deskripsi: 'Lampu mati di tikungan rawan kecelakaan', foto: null, latitude: -6.3950, longitude: 108.2380, kondisi_penerangan: 'baik', tanggal_laporan: '2026-10-22T20:15:00+07:00' },
  { id_laporan: 'LP-2610-008', kategori: 'PJU_MATI', status: 'diproses', keterangan_lokasi: 'Jl. Pahlawan, Sindang', deskripsi: 'Dua lampu mati dekat sekolah', foto: null, latitude: -6.3400, longitude: 108.2950, kondisi_penerangan: 'gelap', tanggal_laporan: '2026-10-26T19:50:00+07:00' },
]

// Pusat peta cadangan (Indramayu) supaya peta tetap tampil walau belum ada laporan berkoordinat
const DEFAULT_CENTER = [-6.3264, 108.32]

// Kondisi penerangan yang dicatat petugas setelah penanganan selesai
const BUKTI_LIGHTING_OPTIONS = [
  { value: 'gelap', label: 'Gelap / lampu tidak berfungsi' },
  { value: 'redup', label: 'Redup' },
  { value: 'baik', label: 'Baik' },
]
const MAX_PHOTO_MB = 5

const UPDATE_STATUS_OPTIONS = [
  { value: 'diproses', label: 'Dalam penanganan' },
  { value: 'selesai', label: 'Selesai ditangani' },
]

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

function getStatusKey(report) {
  return report.status_penanganan || report.status
}

function getStatusLabel(report) {
  return STATUS_LABELS[getStatusKey(report)] || 'Belum ditangani'
}

function getStatusTone(report) {
  const key = getStatusKey(report)
  if (DONE_STATUSES.includes(key)) return 'green'
  if (HANDLING_STATUSES.includes(key)) return 'amber'
  return 'muted'
}

function formatDate(value) {
  if (!value) return 'Tidak tersedia'
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? 'Tidak tersedia' : date.toLocaleString('id-ID')
}

function createMarkerIcon(condition, selected) {
  return L.divIcon({
    className: 'peteng-leaflet-marker',
    html: `<span class="map-marker-dot ${selected ? 'map-marker-selected' : ''}" style="--marker-color:${LIGHTING_COLORS[condition] || LIGHTING_COLORS.unknown}"></span>`,
    iconSize: [24, 24],
    iconAnchor: [12, 12],
  })
}

// Pindahkan peta ke laporan terpilih (koordinat bisa berupa string dari backend)
function MapFocus({ report }) {
  const map = useMap()
  useEffect(() => {
    if (!report) return
    const lat = Number(report.latitude)
    const lng = Number(report.longitude)
    if (Number.isFinite(lat) && Number.isFinite(lng)) {
      map.flyTo([lat, lng], map.getZoom(), { duration: 0.4 })
    }
  }, [report, map])
  return null
}

// Pastikan Leaflet menghitung ulang ukuran saat layout grid berubah (responsif)
function MapResizer() {
  const map = useMap()
  useEffect(() => {
    const container = map.getContainer()
    if (typeof ResizeObserver === 'undefined') return undefined
    const observer = new ResizeObserver(() => map.invalidateSize())
    observer.observe(container)
    return () => observer.disconnect()
  }, [map])
  return null
}

function MonitoringPeta() {
  const navigate = useNavigate()
  const [backendReports, setBackendReports] = useState(USE_DEMO_DATA ? DEMO_REPORTS : [])
  const [backendState, setBackendState] = useState(USE_DEMO_DATA ? 'data' : 'loading')
  const [lastUpdated, setLastUpdated] = useState(USE_DEMO_DATA ? new Date() : null)
  const [selectedReportId, setSelectedReportId] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('Semua')
  const [statusFilter, setStatusFilter] = useState('Semua')
  const [lightingFilter, setLightingFilter] = useState('Semua')
  const [tilesFailed, setTilesFailed] = useState(false)
  const [copied, setCopied] = useState(false)
  const [updateOpen, setUpdateOpen] = useState(false)
  const [updateStatus, setUpdateStatus] = useState('')
  const [updateTitle, setUpdateTitle] = useState('')
  const [updateNote, setUpdateNote] = useState('')
  const [updateLighting, setUpdateLighting] = useState('')
  const [updatePhoto, setUpdatePhoto] = useState(null)
  const [updatePhotoPreview, setUpdatePhotoPreview] = useState('')
  const [updateState, setUpdateState] = useState('idle') // idle | saving | success | error
  const [updateMessage, setUpdateMessage] = useState('')

  useEffect(() => {
    if (USE_DEMO_DATA) return undefined
    let active = true
    getLaporanDinasBackend()
      .then((reports) => {
        if (!active) return
        setBackendReports(Array.isArray(reports) ? reports : [])
        setBackendState(Array.isArray(reports) ? (reports.length ? 'data' : 'empty') : 'unavailable')
        setLastUpdated(new Date())
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
    if (statusFilter !== 'Semua') {
      const group = statusFilter === 'selesai' ? DONE_STATUSES : HANDLING_STATUSES
      if (!group.includes(report.status) && !group.includes(report.status_penanganan)) return false
    }
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
    : DEFAULT_CENTER
  const state = backendState

  const countStatus = (statuses) => filteredReports.filter((report) => (
    statuses.includes(report.status) || statuses.includes(report.status_penanganan)
  )).length
  const darkCount = filteredReports.filter((report) => (
    ['PJU_MATI', 'PJU_RUSAK', 'PJU_TIDAK_ADA'].includes(report.kategori)
  )).length
  const lightingCounts = useMemo(() => {
    const counts = { dark: 0, dim: 0, bright: 0, unknown: 0 }
    filteredReports.forEach((report) => { counts[getLightingCondition(report)] += 1 })
    return counts
  }, [filteredReports])

  const mapStateLabel = state === 'error'
    ? 'Data backend gagal dimuat'
    : state === 'empty'
      ? 'Belum ada laporan dari backend'
      : state === 'loading'
        ? 'Memuat data backend...'
        : 'DATA BACKEND'

  const selectReport = (report) => {
    setSelectedReportId(report.id_laporan)
    setUpdateOpen(false)
  }

  const clearPhoto = () => {
    if (updatePhotoPreview) URL.revokeObjectURL(updatePhotoPreview)
    setUpdatePhoto(null)
    setUpdatePhotoPreview('')
  }

  const resetUpdateFields = () => {
    clearPhoto()
    setUpdateStatus('')
    setUpdateTitle('')
    setUpdateNote('')
    setUpdateLighting('')
    setUpdateState('idle')
    setUpdateMessage('')
  }

  const openUpdateForm = () => {
    resetUpdateFields()
    setUpdateOpen(true)
  }

  const closeUpdateForm = () => {
    resetUpdateFields()
    setUpdateOpen(false)
  }

  const handleStatusChange = (value) => {
    setUpdateStatus(value)
    setUpdateState('idle')
    setUpdateMessage('')
    if (value !== 'selesai') clearPhoto()
  }

  const handlePhotoChange = (event) => {
    const input = event.target
    const file = input.files && input.files[0]
    clearPhoto()
    setUpdateState('idle')
    setUpdateMessage('')
    if (!file) return
    if (!file.type.startsWith('image/')) {
      input.value = ''
      setUpdateState('error')
      setUpdateMessage('File harus berupa gambar (JPG, PNG, atau WebP).')
      return
    }
    if (file.size > MAX_PHOTO_MB * 1024 * 1024) {
      input.value = ''
      setUpdateState('error')
      setUpdateMessage(`Ukuran foto maksimal ${MAX_PHOTO_MB} MB.`)
      return
    }
    setUpdatePhoto(file)
    setUpdatePhotoPreview(URL.createObjectURL(file))
  }

  const isDoneUpdate = updateStatus === 'selesai'
  const canSubmitUpdate = Boolean(updateStatus)
    && Boolean(updateNote.trim())
    && (isDoneUpdate ? Boolean(updatePhoto && updateLighting) : Boolean(updateTitle.trim()))
    && updateState !== 'saving'

  const submitStatusUpdate = async (event) => {
    event.preventDefault()
    if (!selectedReport || !canSubmitUpdate) return
    const reportId = selectedReport.id_laporan
    setUpdateState('saving')
    setUpdateMessage('')
    try {
      if (USE_DEMO_DATA) {
        await new Promise((resolve) => setTimeout(resolve, 400))
        const buktiUrl = isDoneUpdate ? updatePhotoPreview : ''
        setBackendReports((prev) => prev.map((report) => (
          report.id_laporan === reportId
            ? {
              ...report,
              status: updateStatus,
              status_penanganan: updateStatus,
              ...(buktiUrl ? { foto_bukti: buktiUrl, kondisi_penerangan: updateLighting } : {}),
            }
            : report
        )))
        // URL pratinjau kini dipakai laporan, jadi jangan dicabut
        if (buktiUrl) {
          setUpdatePhoto(null)
          setUpdatePhotoPreview('')
        }
        setLastUpdated(new Date())
        setUpdateState('success')
        setUpdateMessage('Status laporan berhasil diperbarui.')
        setTimeout(() => setUpdateOpen(false), 900)
        return
      }

      let successMessage = 'Status laporan berhasil diperbarui.'
      if (isDoneUpdate) {
        // Selesai ditangani = unggah bukti penanganan (foto + kondisi penerangan + catatan)
        await simpanBuktiPenanganan(reportId, {
          catatanPenanganan: updateNote.trim(),
          kondisiPenerangan: updateLighting,
          fotoBukti: updatePhoto,
        })
        successMessage = 'Bukti penanganan berhasil disimpan.'
      } else {
        // updateStatusLaporan tidak melempar error; hasilnya { success, message | error }
        const result = await updateStatusLaporan(reportId, {
          status: updateStatus,
          judul: updateTitle.trim(),
          deskripsi: updateNote.trim(),
        })
        if (!result.success) throw new Error(result.error)
        successMessage = result.message || successMessage
      }

      // Muat ulang dari backend supaya peta, daftar, tabel, dan kartu ikut sinkron
      const fresh = await getLaporanDinasBackend()
      setBackendReports(fresh)
      setLastUpdated(new Date())
      setUpdateState('success')
      setUpdateMessage(successMessage)
      setTimeout(() => setUpdateOpen(false), 900)
    } catch (error) {
      console.error('Gagal memperbarui status laporan:', error)
      setUpdateState('error')
      setUpdateMessage(error?.message || 'Gagal memperbarui status. Coba lagi.')
    }
  }

  const routeUrl = selectedReport && hasCoordinates(selectedReport)
    ? `https://www.google.com/maps/dir/?api=1&destination=${Number(selectedReport.latitude)},${Number(selectedReport.longitude)}`
    : null

  const copyCoordinates = async () => {
    if (!selectedReport || !hasCoordinates(selectedReport)) return
    try {
      await navigator.clipboard.writeText(`${selectedReport.latitude}, ${selectedReport.longitude}`)
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    } catch (error) {
      console.error('Gagal menyalin koordinat:', error)
    }
  }

  return (
    <Layout>
      <div className="monitoringpeta-container">
        {/* ===== BAGIAN ATAS (tidak diubah) ===== */}
        <section className="monitoringpeta-page-heading">
          <div>
            <span className="section-eyebrow">PEMETAAN LAPORAN AREA RAWAN GELAP</span>
            <h1>Monitoring Peta</h1>
            <p>Peta menunjukkan lokasi laporan, bukan pengukuran sensor kondisi penerangan.</p>
          </div>
        </section>

        {!USE_DEMO_DATA && (
          <div className="monitoringpeta-source-banner" role="status">
            <strong>{mapStateLabel}</strong>
            <span>
              {state === 'error'
                ? 'Kegagalan memuat API berbeda dari kondisi data kosong.'
                : 'Hanya laporan yang diterima dari API backend yang ditampilkan.'}
            </span>
          </div>
        )}

        <section className="status-summary-bar monitoringpeta-map-filters">
          <div className="category-filter-select">
            <div className="map-filter-field">
              <label className="select-label" htmlFor="map-category-filter">Kategori</label>
              <select id="map-category-filter" value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)} className="dark-select">
                <option value="Semua">Semua kategori</option>
                {Object.entries(CATEGORY_LABELS).map(([key, label]) => <option key={key} value={key}>{label}</option>)}
              </select>
            </div>
            <div className="map-filter-field">
              <label className="select-label" htmlFor="map-status-filter">Status penanganan</label>
              <select id="map-status-filter" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="dark-select">
                <option value="Semua">Semua status</option>
                {UPDATE_STATUS_OPTIONS.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
              </select>
            </div>
            <div className="map-filter-field">
              <label className="select-label" htmlFor="map-light-filter">Kondisi penerangan</label>
              <select id="map-light-filter" value={lightingFilter} onChange={(e) => setLightingFilter(e.target.value)} className="dark-select">
                <option value="Semua">Semua kondisi</option>
                {Object.entries(LIGHTING_LABELS).map(([key, label]) => <option key={key} value={key}>{label}</option>)}
              </select>
            </div>
          </div>
        </section>

        <section className="metric-cards-grid">
          {[
            ['TITIK GELAP AKTIF', darkCount, 'lokasi gangguan PJU berdasarkan data yang tersedia'],
            ['LAPORAN WARGA', filteredReports.length, 'Laporan warga dari backend sesuai filter'],
            ['DALAM PENANGANAN', countStatus(HANDLING_STATUSES), 'Laporan warga yang sedang ditangani oleh petugas'],
            ['SELESAI DITANGANI', countStatus(DONE_STATUSES), 'Laporan warga yang telah selesai ditangani oleh petugas'],
          ].map(([label, count, note]) => (
            <div className="metric-card" key={label}>
              <div className="metric-card-top"><span className="metric-label">{label}</span></div>
              <div className="metric-main-value"><span className="number">{state === 'loading' ? '...' : state === 'error' ? '—' : count}</span><span className="unit">laporan</span></div>
              <div className="metric-subtext text-muted"><span>{note}</span></div>
            </div>
          ))}
        </section>

        {/* ===== PETA + DETAIL (layout mengikuti mockup) ===== */}
        <section className="monitoringpeta-middle-grid">
          <div className="radar-map-card">
            <div className="radar-header">
              <div className="radar-title-group">
                <h2 className="radar-title">Peta lokasi laporan</h2>
                {!USE_DEMO_DATA && <span className="radar-static-badge">BACKEND</span>}
              </div>
              <span className="map-layer-note">OpenStreetMap · © OpenStreetMap contributors</span>
            </div>

            <div className="map-toolbar" aria-label="Ringkasan kondisi penerangan">
              {Object.entries(LIGHTING_LABELS).map(([key, label]) => (
                <span className="map-toolbar-pill" key={key}>
                  <i style={{ backgroundColor: LIGHTING_COLORS[key] }} />
                  {label}
                  <b>{lightingCounts[key]}</b>
                </span>
              ))}
            </div>

            {tilesFailed && <p className="map-network-warning" role="status">Tile peta tidak dapat dimuat. Periksa koneksi internet; marker laporan tetap tersedia.</p>}

            <div className="leaflet-map-shell">
              <MapContainer center={center} zoom={11} scrollWheelZoom zoomControl>
                  <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">OpenStreetMap</a> contributors'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    eventHandlers={{ tileerror: () => setTilesFailed(true) }}
                  />
                  <MapResizer />
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
              </MapContainer>
              {coordinateReports.length === 0 && (
                <div className="map-placeholder-message map-empty-message">
                  <strong>{state === 'error' ? 'Data backend gagal dimuat' : state === 'loading' ? 'Memuat laporan...' : 'Tidak ada koordinat pada hasil filter'}</strong>
                  <span>{state === 'error' ? 'Coba muat ulang halaman.' : 'Ubah filter atau tunggu laporan dengan koordinat tersedia.'}</span>
                </div>
              )}
            </div>

            <div className="radar-footer">
              <span><strong>{coordinateReports.length}</strong> marker dari <strong>{filteredReports.length}</strong> laporan sesuai filter</span>
              <span>{lastUpdated ? `Data dimuat ${lastUpdated.toLocaleTimeString('id-ID')}` : 'Kondisi penerangan tidak disimpulkan dari status laporan.'}</span>
            </div>
          </div>

          <div className="monitoringpeta-side-column">
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
                      <span className="report-meta-chip">{CATEGORY_LABELS[selectedReport.kategori] || selectedReport.kategori || 'Kategori tidak tersedia'}</span>
                      <span className="report-meta-chip">{getStatusLabel(selectedReport)}</span>
                    </div>
                  </div>

                  <div className="visual-evidence-box">
                    <div className="visual-evidence-header"><span>FOTO LAPORAN</span></div>
                    {selectedReport.foto
                      ? <SafeImage src={selectedReport.foto} alt={`Foto laporan ${selectedReport.id_laporan}`} className="evidence-thumbnail" fallback="Foto laporan gagal dimuat" />
                      : <p className="report-data-note">Foto tidak tersedia pada data laporan.</p>}
                  </div>

                  {selectedReport.foto_bukti && (
                    <div className="visual-evidence-box">
                      <div className="visual-evidence-header"><span>FOTO BUKTI PENANGANAN</span></div>
                      <img src={selectedReport.foto_bukti} alt={`Foto bukti penanganan ${selectedReport.id_laporan}`} className="evidence-thumbnail" />
                    </div>
                  )}

                  <dl className="map-report-facts">
                    <div><dt>Kondisi penerangan</dt><dd>{LIGHTING_LABELS[getLightingCondition(selectedReport)]}</dd></div>
                    <div><dt>Koordinat</dt><dd>{hasCoordinates(selectedReport) ? `${selectedReport.latitude}, ${selectedReport.longitude}` : 'Tidak tersedia'}</dd></div>
                    <div><dt>Tanggal</dt><dd>{formatDate(selectedReport.tanggal_laporan)}</dd></div>
                  </dl>

                  <div className="priority-actions">
                    {!updateOpen && (
                      <button type="button" className="btn-primary" onClick={openUpdateForm}>Perbarui status</button>
                    )}
                    {updateOpen && (
                      <form className="status-update-form" onSubmit={submitStatusUpdate}>
                        <div className="status-update-current">
                          Status saat ini: <strong>{getStatusLabel(selectedReport)}</strong>
                        </div>
                        <label className="select-label" htmlFor="update-status-select">Status baru</label>
                        <select
                          id="update-status-select"
                          className="dark-select"
                          value={updateStatus}
                          onChange={(e) => handleStatusChange(e.target.value)}
                          required
                        >
                          <option value="" disabled>Pilih status</option>
                          {UPDATE_STATUS_OPTIONS.map((option) => (
                            <option key={option.value} value={option.value}>{option.label}</option>
                          ))}
                        </select>
                        {!isDoneUpdate && (
                          <>
                            <label className="select-label" htmlFor="update-title">Judul update</label>
                            <input
                              id="update-title"
                              type="text"
                              className="dark-select"
                              maxLength={120}
                              value={updateTitle}
                              onChange={(e) => setUpdateTitle(e.target.value)}
                              placeholder="Contoh: Perbaikan lampu dimulai"
                              required
                            />
                          </>
                        )}
                        <label className="select-label" htmlFor="update-note">Keterangan</label>
                        <textarea
                          id="update-note"
                          className="dark-textarea"
                          rows="3"
                          maxLength={500}
                          value={updateNote}
                          onChange={(e) => setUpdateNote(e.target.value)}
                          placeholder={isDoneUpdate ? 'Contoh: lampu diganti, kini menyala normal.' : 'Contoh: petugas menuju lokasi untuk perbaikan.'}
                          required
                        />
                        {isDoneUpdate && (
                          <>
                            <label className="select-label" htmlFor="update-lighting">Kondisi penerangan setelah ditangani</label>
                            <select
                              id="update-lighting"
                              className="dark-select"
                              value={updateLighting}
                              onChange={(e) => setUpdateLighting(e.target.value)}
                              required
                            >
                              <option value="" disabled>Pilih kondisi</option>
                              {BUKTI_LIGHTING_OPTIONS.map((option) => (
                                <option key={option.value} value={option.value}>{option.label}</option>
                              ))}
                            </select>
                            <label className="select-label" htmlFor="update-photo">Foto bukti penanganan</label>
                            <input
                              id="update-photo"
                              type="file"
                              accept="image/*"
                              className="file-input"
                              onChange={handlePhotoChange}
                              required
                            />
                            <p className="update-hint">Format gambar, maksimal {MAX_PHOTO_MB} MB.</p>
                            {updatePhotoPreview && (
                              <img src={updatePhotoPreview} alt="Pratinjau foto bukti penanganan" className="update-photo-preview" />
                            )}
                          </>
                        )}
                        {updateMessage && (
                          <p className={`update-message update-${updateState}`} role="status">{updateMessage}</p>
                        )}
                        <div className="secondary-action-row">
                          <button type="button" className="btn-sec-action" onClick={closeUpdateForm} disabled={updateState === 'saving'}>Batal</button>
                          <button type="submit" className="btn-primary" disabled={!canSubmitUpdate}>
                            {updateState === 'saving' ? 'Menyimpan...' : 'Simpan'}
                          </button>
                        </div>
                      </form>
                    )}
                    <button type="button" className="btn-sec-action" onClick={() => navigate('/laporan-warga')}>Buka pengelolaan laporan</button>
                    <div className="secondary-action-row">
                      <a
                        className={`btn-sec-action ${routeUrl ? '' : 'is-disabled'}`}
                        href={routeUrl || undefined}
                        target="_blank"
                        rel="noreferrer"
                        aria-disabled={!routeUrl}
                      >
                        Rute ke lokasi
                      </a>
                      <button type="button" className="btn-sec-action" onClick={copyCoordinates} disabled={!hasCoordinates(selectedReport)}>
                        {copied ? 'Tersalin' : 'Salin koordinat'}
                      </button>
                    </div>
                  </div>
                </>
              ) : (
                <div className="priority-empty-state">{state === 'error' ? 'Data backend gagal dimuat.' : state === 'loading' ? 'Memuat laporan...' : 'Tidak ada laporan untuk ditampilkan.'}</div>
              )}
            </aside>

            <aside className="other-reports-list">
              <div className="queue-header">
                <span className="queue-title">Daftar Laporan</span>
                <span className="queue-count">{filteredReports.length} laporan</span>
              </div>
              <div className="queue-items report-list-scroll">
                {filteredReports.length === 0 && (
                  <p className="report-data-note">{state === 'loading' ? 'Memuat laporan...' : state === 'error' ? 'Data backend gagal dimuat.' : 'Tidak ada laporan untuk filter ini.'}</p>
                )}
                {filteredReports.map((report) => (
                  <button
                    type="button"
                    key={report.id_laporan}
                    className={`queue-item clickable ${selectedReport?.id_laporan === report.id_laporan ? 'queue-item-active' : ''}`}
                    onClick={() => selectReport(report)}
                  >
                    <i className={`status-dot tone-${getStatusTone(report)}`} />
                    <span className="queue-text">
                      <span className="queue-item-title">{CATEGORY_LABELS[report.kategori] || report.kategori || 'Kategori tidak tersedia'} · {report.id_laporan}</span>
                      <span className="queue-item-sub">{report.keterangan_lokasi || 'Lokasi tidak tersedia'}</span>
                      <span className="queue-item-sub">{getStatusLabel(report)}</span>
                    </span>
                    <span className="queue-arrow" aria-hidden="true">›</span>
                  </button>
                ))}
              </div>
            </aside>
          </div>
        </section>

        {/* ===== TABEL LOG ===== */}
        <section className="monitoringpeta-table-section">
          <div className="table-section-header">
            <div>
              <h2 className="table-title">Log Laporan pada Peta</h2>
              <p className="table-subtitle">{USE_DEMO_DATA ? '' : `${mapStateLabel} · `}{filteredReports.length} laporan</p>
            </div>
          </div>
          <div className="table-responsive">
            <table className="peteng-data-table">
              <thead>
                <tr>
                  <th>ID LAPORAN</th>
                  <th>LOKASI</th>
                  <th>TIPE GANGGUAN</th>
                  <th>STATUS</th>
                  <th>KONDISI PENERANGAN</th>
                  <th>TANGGAL</th>
                </tr>
              </thead>
              <tbody>
                {filteredReports.map((report) => {
                  const condition = getLightingCondition(report)
                  const isSelected = selectedReport?.id_laporan === report.id_laporan
                  return (
                    <tr
                      key={report.id_laporan}
                      onClick={() => selectReport(report)}
                      className={`monitoringpeta-report-row ${isSelected ? 'row-selected' : ''}`}
                    >
                      <td><span className="ticket-id-link">{report.id_laporan}</span></td>
                      <td>{report.keterangan_lokasi || 'Lokasi tidak tersedia'}</td>
                      <td><span className="chip-gangguan">{CATEGORY_LABELS[report.kategori] || report.kategori || 'Tidak tersedia'}</span></td>
                      <td>
                        <span className="table-cell-status">
                          <i className={`status-dot tone-${getStatusTone(report)}`} />
                          {getStatusLabel(report)}
                        </span>
                      </td>
                      <td>
                        <span className="table-cell-status">
                          <i className="status-dot" style={{ backgroundColor: LIGHTING_COLORS[condition] }} />
                          {LIGHTING_LABELS[condition]}
                        </span>
                      </td>
                      <td>{formatDate(report.tanggal_laporan)}</td>
                    </tr>
                  )
                })}
                {filteredReports.length === 0 && (
                  <tr><td colSpan="6" className="table-empty-state">{state === 'error' ? 'Permintaan data backend gagal.' : 'Tidak ada data untuk filter ini.'}</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </Layout>
  )
}

export default MonitoringPeta