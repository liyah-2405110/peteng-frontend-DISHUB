import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import Layout from '../components/Layout'
import { getDaftarLaporanDinas } from '../services/laporanService'
import '../css/Dashboard.css'

const REPORT_STATUS_LABELS = {
  diajukan: 'Menunggu validasi',
  diproses_ai: 'Validasi AI berlangsung',
  diterima: 'Tervalidasi',
  ditolak: 'Ditolak',
  diproses: 'Dalam penanganan',
  selesai: 'Selesai ditangani',
}

const REPORT_CATEGORY_LABELS = {
  PJU_MATI: 'PJU mati',
  PJU_RUSAK: 'PJU rusak',
  PJU_TIDAK_ADA: 'PJU tidak tersedia',
  LAINNYA: 'Lainnya',
}

function Dashboard() {
  const navigate = useNavigate()

  // State
  const [laporanList, setLaporanList] = useState([])
  const [loading, setLoading] = useState(true)
  const [reportDataStatus, setReportDataStatus] = useState('loading')
  const [selectedKecamatan, setSelectedKecamatan] = useState('Semua Wilayah')
  const [selectedKategori, setSelectedKategori] = useState('Semua')
  const [viewMode, setViewMode] = useState('tactical') // 'tactical' | 'thermal' | 'heatmap'
  const [selectedReport, setSelectedReport] = useState(null)

  // Fetch initial data
  useEffect(() => {
    async function loadData() {
      setLoading(true)
      try {
        const laporanRes = await getDaftarLaporanDinas()
        if (laporanRes.source !== 'backend') {
          setLaporanList([])
          setSelectedReport(null)
          setReportDataStatus('unavailable')
          return
        }

        const reports = Array.isArray(laporanRes.data) ? laporanRes.data : []
        setLaporanList(reports)
        setSelectedReport(reports[0] || null)
        setReportDataStatus('backend')
      } catch (err) {
        console.error('Failed to load dashboard data:', err)
        setLaporanList([])
        setSelectedReport(null)
        setReportDataStatus('error')
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [])

  const kecamatanOptions = [
    'Semua Wilayah',
    'Lohbener (Prioritas)',
    'Jatibarang',
    'Indramayu Kota',
    'Sindang',
    'Balongan',
  ]

  // Filtered reports
  const filteredReports = laporanList.filter((item) => {
    const rawKecamatan = item.kecamatan || (item.keterangan_lokasi?.includes('Lohbener') ? 'Lohbener' :
      item.keterangan_lokasi?.includes('Jatibarang') ? 'Jatibarang' :
      item.keterangan_lokasi?.includes('Sindang') ? 'Sindang' :
      item.keterangan_lokasi?.includes('Balongan') ? 'Balongan' : 'Indramayu Kota')

    if (selectedKecamatan !== 'Semua Wilayah') {
      const target = selectedKecamatan.split(' ')[0]
      if (!rawKecamatan.toLowerCase().includes(target.toLowerCase())) {
        return false
      }
    }

    if (selectedKategori !== 'Semua') {
      if (item.kategori !== selectedKategori) return false
    }

    return true
  })

  const handleUnduhLaporan = () => {
    const blob = new Blob([JSON.stringify(laporanList, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `rekap-shift-dishub-${new Date().toISOString().slice(0, 10)}.json`
    a.click()
  }

  const hasBackendReports = reportDataStatus === 'backend'
  const activeDetail = hasBackendReports ? selectedReport : null
  const reportsForMetrics = hasBackendReports ? laporanList : []
  const countByStatuses = (...statuses) =>
    reportsForMetrics.filter((item) => statuses.includes(item.status)).length
  const otherReports = activeDetail
    ? laporanList.filter((item) => item.id_laporan !== activeDetail.id_laporan).slice(0, 3)
    : []
  const activeTicketLabel = activeDetail?.id_laporan
    ? /^[\da-f]{8}(?:-[\da-f]{4}){3}-[\da-f]{12}$/i.test(activeDetail.id_laporan)
      ? 'ID tersedia di log'
      : `#${activeDetail.id_laporan}`
    : ''

  const reportStatusMessage = loading
    ? 'Memuat data laporan...'
    : reportDataStatus === 'error'
      ? 'Data laporan gagal dimuat. Coba muat ulang halaman.'
      : reportDataStatus === 'unavailable'
        ? 'Data laporan backend belum tersedia. Data contoh tidak ditampilkan.'
        : `${laporanList.length} laporan dari backend`

  return (
    <Layout>
      <div className="dashboard-container">
        {/* ================= TOP FILTER & MODE CONTROLS ================= */}
        <section className="dashboard-control-bar">
          <div className="control-left">
            <span className="control-label">KECAMATAN:</span>
            <div className="kecamatan-pills">
              {kecamatanOptions.map((kec) => (
                <button
                  key={kec}
                  type="button"
                  className={`kecamatan-pill ${selectedKecamatan === kec ? 'pill-active' : ''}`}
                  onClick={() => setSelectedKecamatan(kec)}
                >
                  {kec}
                </button>
              ))}
            </div>
          </div>

          <div className="control-right">
            <div className="view-mode-group">
              <button
                type="button"
                className={`mode-btn ${viewMode === 'tactical' ? 'mode-active' : ''}`}
                onClick={() => setViewMode('tactical')}
              >
                Tactical Dark
              </button>
              <button
                type="button"
                className={`mode-btn ${viewMode === 'thermal' ? 'mode-active' : ''}`}
                onClick={() => setViewMode('thermal')}
              >
                Thermal
              </button>
            </div>
          </div>
        </section>

        {/* Status PJU summary bar */}
        <div className="status-summary-bar">
          <div className="status-indicators">
            <span className="status-title">STATUS PJU:</span>
            <span className="status-data-note">Data kondisi aset PJU belum tersedia pada data laporan Dashboard.</span>
            {hasBackendReports && (
              <>
                <span className="status-chip">Tervalidasi ({countByStatuses('diterima')})</span>
                <span className="status-chip">Ditolak ({countByStatuses('ditolak')})</span>
              </>
            )}
          </div>

          <div className="category-filter-select">
            <span className="select-label">Kategori Kerusakan:</span>
            <select
              value={selectedKategori}
              onChange={(e) => setSelectedKategori(e.target.value)}
              className="dark-select"
            >
              <option value="Semua">Semua Jenis Kendala</option>
              <option value="PJU_MATI">PJU Mati Total</option>
              <option value="PJU_RUSAK">PJU Fisik Rusak</option>
              <option value="PJU_TIDAK_ADA">Ketiadaan Tiang PJU</option>
              <option value="LAINNYA">Lainnya / Redup</option>
            </select>
          </div>
        </div>

        {/* ================= 4 METRIC CARDS ================= */}
        <section className="metric-cards-grid">
          <div className="metric-card">
            <div className="metric-card-top">
              <span className="metric-label">RUAS BERMASALAH</span>
            </div>
            <div className="metric-main-value">
              <span className="number">—</span>
              <span className="unit">ruas</span>
            </div>
            <div className="metric-subtext text-muted">
              <span>ID ruas unik belum tersedia pada data laporan.</span>
            </div>
          </div>

          <div className="metric-card">
            <div className="metric-card-top">
              <span className="metric-label">LAPORAN PERLU DIVERIFIKASI</span>
            </div>
            <div className="metric-main-value">
              <span className="number">{hasBackendReports ? countByStatuses('diajukan', 'diproses_ai') : '—'}</span>
              <span className="unit">laporan</span>
            </div>
            <div className="metric-subtext text-muted">
              <span>Status diajukan atau diproses AI</span>
            </div>
          </div>

          <div className="metric-card">
            <div className="metric-card-top">
              <span className="metric-label">DALAM PENANGANAN</span>
            </div>
            <div className="metric-main-value">
              <span className="number">{hasBackendReports ? countByStatuses('diproses') : '—'}</span>
              <span className="unit">laporan</span>
            </div>
            <div className="metric-subtext text-muted">
              <span>Status diproses</span>
            </div>
          </div>

          <div className="metric-card">
            <div className="metric-card-top">
              <span className="metric-label">SELESAI DITANGANI</span>
            </div>
            <div className="metric-main-value">
              <span className="number">{hasBackendReports ? countByStatuses('selesai') : '—'}</span>
              <span className="unit">laporan</span>
            </div>
            <div className="metric-subtext text-muted">
              <span>Status selesai</span>
            </div>
          </div>
        </section>

        {/* ================= MIDDLE SECTION: RADAR MAP & PRIORITY PANEL ================= */}
        <section className="dashboard-middle-grid">
          {/* Left: Tactical Radar Map Area */}
          <div className="radar-map-card">
            <div className="radar-header">
              <div className="radar-title-group">
                <span className="radar-title">Radar Pesisir & Pantura</span>
                <span className="radar-static-badge">
                  VISUALISASI ILUSTRATIF
                </span>
              </div>
              <div className="radar-tools">
                <button
                  type="button"
                  className={`tool-pill ${viewMode === 'heatmap' ? 'tool-active' : ''}`}
                  onClick={() => setViewMode(viewMode === 'heatmap' ? 'tactical' : 'heatmap')}
                >
                  Heatmap Kepadatan
                </button>
                <button type="button" className="tool-pill">Pos Pantau</button>
                <button type="button" className="tool-pill tool-cyan">Derek GPS</button>
              </div>
            </div>

            {/* Interactive Vector GIS Radar Visualizer */}
            <div className={`radar-viewport ${viewMode === 'thermal' ? 'thermal-mode' : ''} ${viewMode === 'heatmap' ? 'heatmap-mode' : ''}`}>
              <svg className="radar-svg" viewBox="0 0 800 420" preserveAspectRatio="xMidYMid meet">
                <defs>
                  {/* Subtle Grid Pattern */}
                  <pattern id="radarGrid" width="40" height="40" patternUnits="userSpaceOnUse">
                    <path d="M 40 0 L 0 0 0 40" fill="none" stroke="rgba(0, 229, 255, 0.05)" strokeWidth="1" />
                  </pattern>

                  {/* Gradient Lines */}
                  <linearGradient id="gradCyan" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#00e5ff" stopOpacity="0.8" />
                    <stop offset="100%" stopColor="#00b4d8" stopOpacity="0.4" />
                  </linearGradient>

                  <linearGradient id="gradRed" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#ef4444" stopOpacity="0.9" />
                    <stop offset="100%" stopColor="#f59e0b" stopOpacity="0.8" />
                  </linearGradient>
                </defs>

                {/* Grid Background */}
                <rect width="100%" height="100%" fill="url(#radarGrid)" />

                {/* Indramayu Coastline Stylized Contour */}
                <path
                  d="M 50,60 Q 220,90 380,50 T 680,80 Q 750,110 790,140"
                  fill="none"
                  stroke="rgba(0, 229, 255, 0.2)"
                  strokeWidth="2"
                  strokeDasharray="4 4"
                />
                <text x="500" y="45" fill="rgba(0, 229, 255, 0.4)" fontSize="11" letterSpacing="2">
                  LAUT JAWA / PESISIR INDRAMAYU
                </text>

                {/* Corridor Arteries */}
                {/* Pantura Utama (Redup/Padam Corridor) */}
                <path
                  d="M 60,280 C 180,260 280,240 380,210 C 440,190 520,240 680,310"
                  fill="none"
                  stroke="url(#gradRed)"
                  strokeWidth="5"
                  className="corridor-line corridor-danger"
                />

                {/* Arterial 2: Sindang - Kota (Terang) */}
                <path
                  d="M 380,210 C 420,170 480,140 560,130"
                  fill="none"
                  stroke="url(#gradCyan)"
                  strokeWidth="4"
                  className="corridor-line corridor-optimal"
                />

                {/* Arterial 3: Lohbener - Jatibarang (Padam Kritis) */}
                <path
                  d="M 380,210 C 390,260 430,320 480,370"
                  fill="none"
                  stroke="#ef4444"
                  strokeWidth="6"
                  className="corridor-line corridor-blackout"
                />

                {/* Nodes & Labels */}
                {/* Node: Kec. Haurgeulis */}
                <g transform="translate(100, 270)">
                  <circle r="4" fill="#94a3b8" />
                  <text x="-40" y="-10" fill="#94a3b8" fontSize="11" fontWeight="600">KEC. HAURGEULIS</text>
                </g>

                {/* Node: Lohbener (Hotspot Kritis) */}
                <g
                  transform="translate(380, 210)"
                  className="map-node node-danger"
                >
                  <circle r="18" fill="rgba(239, 68, 68, 0.25)" className="pulse-ring" />
                  <circle r="9" fill="#ef4444" stroke="#ffffff" strokeWidth="2" />
                  <text x="16" y="5" fill="#ffffff" fontSize="12" fontWeight="700">KEC. LOHBENER</text>
                  <g transform="translate(16, 12)">
                    <rect x="0" y="0" width="160" height="26" rx="4" fill="rgba(15, 23, 42, 0.9)" stroke="rgba(239, 68, 68, 0.5)" />
                    <text x="8" y="16" fill="#fca5a5" fontSize="10">TITIK ILUSTRATIF</text>
                  </g>
                </g>

                {/* Node: Indramayu Kota */}
                <g
                  transform="translate(560, 130)"
                  className="map-node node-optimal"
                >
                  <circle r="7" fill="#00e5ff" stroke="#ffffff" strokeWidth="2" />
                  <text x="14" y="-4" fill="#00e5ff" fontSize="12" fontWeight="700">INDRAMAYU KOTA</text>
                  <text x="14" y="10" fill="#94a3b8" fontSize="10">Titik ilustratif</text>
                </g>

                {/* Node: Sindang */}
                <g
                  transform="translate(480, 180)"
                  className="map-node node-warning"
                >
                  <circle r="6" fill="#f59e0b" stroke="#ffffff" strokeWidth="1.5" />
                  <text x="12" y="4" fill="#fbbf24" fontSize="11" fontWeight="600">KEC. SINDANG</text>
                </g>

                {/* Node: Jatibarang */}
                <g
                  transform="translate(480, 370)"
                  className="map-node node-danger"
                >
                  <circle r="7" fill="#f59e0b" stroke="#ffffff" strokeWidth="2" />
                  <text x="14" y="5" fill="#ffffff" fontSize="11" fontWeight="600">KEC. JATIBARANG</text>
                  <text x="14" y="18" fill="#fca5a5" fontSize="9">Titik ilustratif</text>
                </g>

                {/* Active Fleet Marker (Derek 02) */}
                <g transform="translate(340, 240)" className="fleet-marker">
                  <rect x="-8" y="-8" width="16" height="16" rx="4" fill="#00e5ff" />
                  <text x="14" y="4" fill="#00e5ff" fontSize="10" fontWeight="700">Armada ilustratif</text>
                </g>
              </svg>

              {/* Map Floating Legend */}
              <div className="radar-legend">
                <div className="legend-item"><span className="legend-line line-cyan"></span> Terang</div>
                <div className="legend-item"><span className="legend-line line-amber"></span> Redup/Kedip</div>
                <div className="legend-item"><span className="legend-line line-red"></span> Padam (Bahaya)</div>
              </div>

              {/* Map Zoom Controls */}
              <div className="radar-zoom-controls">
                <button type="button" className="btn-zoom">+</button>
                <button type="button" className="btn-zoom">-</button>
                <button type="button" className="btn-zoom">⛶</button>
              </div>
            </div>

            {/* Radar Footer Status */}
            <div className="radar-footer">
              <div className="radar-update-time">
                <span>Peta statis; bukan lokasi GIS atau posisi armada waktu nyata.</span>
              </div>
            </div>
          </div>

          {/* Right: Selected Report Detail Panel */}
          <div className="priority-detail-card">
            {activeDetail ? (
              <>
                <div className="priority-header">
                  <div className="priority-tags">
                    <span className="report-detail-badge">LAPORAN TERPILIH</span>
                    <span className="ticket-id-tag">{activeTicketLabel}</span>
                  </div>
                  <h3 className="priority-title">
                    {activeDetail.deskripsi || 'Deskripsi laporan tidak tersedia'}
                  </h3>
                  <p className="priority-location">
                    {activeDetail.keterangan_lokasi || 'Lokasi tidak tersedia'}
                  </p>
                  <div className="condition-chips">
                    <span className="report-meta-chip">
                      {REPORT_CATEGORY_LABELS[activeDetail.kategori] || activeDetail.kategori || 'Kategori tidak tersedia'}
                    </span>
                    <span className="report-meta-chip">
                      {REPORT_STATUS_LABELS[activeDetail.status] || activeDetail.status || 'Status tidak tersedia'}
                    </span>
                  </div>
                </div>

                <div className="visual-evidence-box">
                  <div className="visual-evidence-header">
                    <span>FOTO LAPORAN</span>
                  </div>
                  {activeDetail.foto ? (
                    <div className="visual-evidence-img-wrap">
                      <img
                        src={activeDetail.foto}
                        alt="Foto yang dilampirkan pada laporan"
                        className="evidence-thumbnail"
                      />
                    </div>
                  ) : (
                    <p className="report-data-note">Foto tidak tersedia pada laporan ini.</p>
                  )}
                </div>

                <p className="report-data-note">
                  Penugasan armada dan komunikasi Satgas belum terhubung ke backend Dashboard.
                </p>
              </>
            ) : (
              <div className="priority-empty-state">
                {loading ? 'Memuat laporan...' : reportStatusMessage}
              </div>
            )}

            <div className="satgas-queue-sublist">
              <div className="queue-header">
                <span className="queue-title">Laporan lainnya</span>
                <span className="queue-count">{hasBackendReports ? `${otherReports.length} laporan` : '—'}</span>
              </div>

              <div className="queue-items">
                {otherReports.length > 0 ? otherReports.map((item) => (
                  <button
                    key={item.id_laporan}
                    type="button"
                    className="queue-item clickable"
                    onClick={() => setSelectedReport(item)}
                  >
                    <span className="queue-icon">•</span>
                    <span className="queue-text">
                      <span className="queue-item-title">
                        {item.deskripsi || 'Deskripsi laporan tidak tersedia'}
                      </span>
                      <span className="queue-item-sub">
                        {item.keterangan_lokasi || 'Lokasi tidak tersedia'}
                      </span>
                    </span>
                    <span className="queue-arrow">›</span>
                  </button>
                )) : (
                  <p className="report-data-note">
                    {hasBackendReports ? 'Tidak ada laporan lain.' : 'Daftar laporan backend belum tersedia.'}
                  </p>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* ================= BOTTOM TABLE: LOG PANTAUAN & RESPON LAPANGAN ================= */}
        <section className="dashboard-table-section">
          <div className="table-section-header">
            <div className="table-title-group">
              <div className="table-header-icon">📑</div>
              <div>
                <h3 className="table-title">Log Pantauan & Respon Lapangan Terkini</h3>
                <p className="table-subtitle">{reportStatusMessage}</p>
              </div>
            </div>
            <button
              type="button"
              className="btn-download-shift"
              onClick={handleUnduhLaporan}
              disabled={!hasBackendReports || laporanList.length === 0}
            >
              📥 Unduh Laporan Shift
            </button>
          </div>

          <div className="table-responsive">
            <table className="peteng-data-table">
              <thead>
                <tr>
                  <th>ID TIKET</th>
                  <th>RUAS JALAN & LOKASI</th>
                  <th>TIPE GANGGUAN</th>
                  <th>STATUS & VERIFIKASI</th>
                  <th>ARMADA DITUGASKAN</th>
                  <th>AKSI CEPAT</th>
                </tr>
              </thead>
              <tbody>
                {filteredReports.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="table-empty-state">
                      {hasBackendReports
                        ? 'Tidak ada laporan yang sesuai dengan filter saat ini.'
                        : reportStatusMessage}
                    </td>
                  </tr>
                ) : filteredReports.map((item) => {
                  const isSelected = selectedReport?.id_laporan === item.id_laporan
                  return (
                    <tr
                      key={item.id_laporan}
                      className={isSelected ? 'row-selected' : ''}
                      onClick={() => setSelectedReport(item)}
                    >
                      <td>
                        <span className="ticket-id-link">#{item.id_laporan}</span>
                      </td>
                      <td>
                        <div className="table-cell-location">
                          <span className="road-name">
                            {item.keterangan_lokasi?.slice(0, 48) || 'Lokasi tidak tersedia'}
                          </span>
                        </div>
                      </td>
                      <td>
                        <span className={`chip-gangguan ${item.kategori === 'PJU_MATI' ? 'gangguan-padam' : 'gangguan-rusak'}`}>
                          {REPORT_CATEGORY_LABELS[item.kategori] || item.kategori || 'Tidak tersedia'}
                        </span>
                      </td>
                      <td>
                        <div className="table-cell-status">
                          <span className={`status-dot ${item.status === 'diterima' ? 'dot-amber' : item.status === 'diproses' ? 'dot-green' : 'dot-muted'}`}></span>
                          <span>{REPORT_STATUS_LABELS[item.status] || item.status || 'Status tidak tersedia'}</span>
                        </div>
                      </td>
                      <td>
                        <span className="table-fleet-text">
                          {item.armada || 'Belum tersedia'}
                        </span>
                      </td>
                      <td>
                        <button
                          type="button"
                          className="btn-table-action"
                          onClick={(e) => {
                            e.stopPropagation()
                            navigate('/laporan-warga')
                          }}
                        >
                          Detail
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </Layout>
  )
}

export default Dashboard