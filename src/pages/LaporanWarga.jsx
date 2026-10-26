import { useState, useEffect } from 'react'
import Layout from '../components/Layout'
import {
  getDaftarLaporanDinas,
  updateStatusLaporan,
  mulaiValidasiAI,
  simpanHasilMockAI,
} from '../services/laporanService'
import '../css/LaporanWarga.css'

function LaporanWarga() {
  const [laporanList, setLaporanList] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedReportId, setSelectedReportId] = useState(null)
  const [activeTab, setActiveTab] = useState('Semua') // 'Semua' | 'diajukan' | 'diterima' | 'diproses' | 'selesai'
  const [searchQuery, setSearchQuery] = useState('')
  const [filterKategori, setFilterKategori] = useState('Semua')
  const [filterKecamatan, setFilterKecamatan] = useState('Semua')
  const [notification, setNotification] = useState(null)
  const [actionLoading, setActionLoading] = useState(false)
  const [showRejectModal, setShowRejectModal] = useState(false)
  const [rejectReason, setRejectReason] = useState('')

  useEffect(() => {
    let active = true
    getDaftarLaporanDinas()
      .then((res) => {
        if (!active) return
        setLaporanList(res.data || [])
        if (res.data && res.data.length > 0) {
          setSelectedReportId((prev) => prev || res.data[0].id_laporan)
        }
        setLoading(false)
      })
      .catch((err) => {
        console.error(err)
        if (active) setLoading(false)
      })

    return () => {
      active = false
    }
  }, [])

  // Currently selected report
  const selectedReport =
    laporanList.find((r) => r.id_laporan === selectedReportId) ||
    laporanList[0] ||
    null

  // Tab Counts
  const countSemua = laporanList.length
  const countMenungguAI = laporanList.filter((r) => r.status === 'diajukan' || r.status === 'diproses_ai').length
  const countTervalidasi = laporanList.filter((r) => r.status === 'diterima').length
  const countDalamPenanganan = laporanList.filter((r) => r.status === 'diproses').length
  const countSelesai = laporanList.filter((r) => r.status === 'selesai').length

  // Filter logic
  const filteredList = laporanList.filter((item) => {
    // Tab filter
    if (activeTab === 'diajukan' && item.status !== 'diajukan' && item.status !== 'diproses_ai') return false
    if (activeTab === 'diterima' && item.status !== 'diterima') return false
    if (activeTab === 'diproses' && item.status !== 'diproses') return false
    if (activeTab === 'selesai' && item.status !== 'selesai') return false

    // Search filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase()
      const matchId = item.id_laporan?.toLowerCase().includes(q)
      const matchLoc = item.keterangan_lokasi?.toLowerCase().includes(q)
      const matchDesc = item.deskripsi?.toLowerCase().includes(q)
      const matchPelapor = item.pelapor_nama?.toLowerCase().includes(q)
      if (!matchId && !matchLoc && !matchDesc && !matchPelapor) return false
    }

    // Category filter
    if (filterKategori !== 'Semua') {
      if (item.kategori !== filterKategori) return false
    }

    // Subdistrict filter
    if (filterKecamatan !== 'Semua') {
      const loc = (item.kecamatan || item.keterangan_lokasi || '').toLowerCase()
      if (!loc.includes(filterKecamatan.toLowerCase())) return false
    }

    return true
  })

  // Show Toast
  const showToast = (message, type = 'success') => {
    setNotification({ message, type })
    setTimeout(() => setNotification(null), 5000)
  }

  // Action: Disposisi ke Satgas Derek (Transisi: diterima -> diproses)
  const handleDisposisi = async () => {
    if (!selectedReport) return
    setActionLoading(true)

    // Jika status masih diajukan, jalankan validasi AI dulu otomatis
    if (selectedReport.status === 'diajukan') {
      await mulaiValidasiAI(selectedReport.id_laporan)
      await simpanHasilMockAI(selectedReport.id_laporan, {
        hasil_validasi: 'valid',
        tingkat_kegelapan_ai: selectedReport.tingkat_kegelapan || 3,
        catatan: 'Validasi AI otomatis: Disetujui untuk disposisi tim Derek Dishub.',
      })
    }

    const res = await updateStatusLaporan(selectedReport.id_laporan, {
      status: 'diproses',
      judul: 'Disposisi Armada Satgas Derek 02',
      deskripsi: 'Laporan telah diteruskan ke Regu Derek 02 untuk penanganan di lokasi.',
    })

    if (res.success) {
      showToast(`Tiket #${selectedReport.id_laporan} berhasil didisposisikan ke Satgas Derek 02!`)
      // Update local state
      setLaporanList((prev) =>
        prev.map((r) =>
          r.id_laporan === selectedReport.id_laporan
            ? { ...r, status: 'diproses', armada: 'Regu Derek 02 (Menuju Lokasi)' }
            : r
        )
      )
    } else {
      showToast(res.error || 'Gagal mengubah status', 'error')
    }
    setActionLoading(false)
  }

  // Action: Tandai Sedang Dikerjakan (Transisi: diterima -> diproses)
  const handleSedangDikerjakan = async () => {
    if (!selectedReport) return
    setActionLoading(true)

    const res = await updateStatusLaporan(selectedReport.id_laporan, {
      status: 'diproses',
      judul: 'Pengerjaan Fisik Dimulai',
      deskripsi: 'Teknisi di lapangan sedang melakukan penggantian armatur dan pengecekan kabel.',
    })

    if (res.success) {
      showToast(`Status #${selectedReport.id_laporan} diubah menjadi: Sedang Dikerjakan.`)
      setLaporanList((prev) =>
        prev.map((r) =>
          r.id_laporan === selectedReport.id_laporan ? { ...r, status: 'diproses' } : r
        )
      )
    } else {
      showToast(res.error || 'Gagal memperbarui status', 'error')
    }
    setActionLoading(false)
  }

  // Action: Selesai & Terbitkan Bukti (Transisi: diproses -> selesai)
  const handleSelesai = async () => {
    if (!selectedReport) return
    setActionLoading(true)

    const res = await updateStatusLaporan(selectedReport.id_laporan, {
      status: 'selesai',
      judul: 'Perbaikan Selesai & Lampu Menyala Normal',
      deskripsi: 'Penggantian unit PJU telah tuntas dan diverifikasi terang 35 Lux oleh mandor Satgas.',
    })

    if (res.success) {
      showToast(`Tiket #${selectedReport.id_laporan} berhasil diselesaikan & siap diterbitkan bukti!`)
      setLaporanList((prev) =>
        prev.map((r) =>
          r.id_laporan === selectedReport.id_laporan
            ? { ...r, status: 'selesai', armada: 'Selesai (Regu Derek 02)' }
            : r
        )
      )
    } else {
      showToast(res.error || 'Gagal menyelesaikan tiket', 'error')
    }
    setActionLoading(false)
  }

  // Action: Jalankan Validasi AI
  const handleJalankanValidasiAI = async () => {
    if (!selectedReport) return
    setActionLoading(true)

    try {
      await mulaiValidasiAI(selectedReport.id_laporan)
      await simpanHasilMockAI(selectedReport.id_laporan, {
        hasil_validasi: 'valid',
        tingkat_kegelapan_ai: selectedReport.tingkat_kegelapan || 3,
        catatan: 'Validasi AI tuntas: Geotag akurat, tingkat kegelapan terkonfirmasi.',
      })

      showToast(`Validasi AI untuk #${selectedReport.id_laporan} selesai: Status Diterima (Siap Disposisi)`)
      setLaporanList((prev) =>
        prev.map((r) =>
          r.id_laporan === selectedReport.id_laporan
            ? { ...r, status: 'diterima' }
            : r
        )
      )
    } catch (err) {
      showToast(err.message || 'Gagal menjalankan validasi AI', 'error')
    } finally {
      setActionLoading(false)
    }
  }

  // Action: Tolak Laporan
  const handleConfirmReject = async () => {
    if (!selectedReport) return
    setActionLoading(true)

    try {
      if (selectedReport.status === 'diajukan') {
        await mulaiValidasiAI(selectedReport.id_laporan)
      }
      await simpanHasilMockAI(selectedReport.id_laporan, {
        hasil_validasi: 'tidak_valid',
        tingkat_kegelapan_ai: 1,
        catatan: rejectReason || 'Foto tidak memenuhi syarat / lokasi bukan aset jalan Dishub.',
      })

      showToast(`Laporan #${selectedReport.id_laporan} ditolak dengan alasan: ${rejectReason || 'Tidak memenuhi kriteria'}`)
      setLaporanList((prev) =>
        prev.map((r) =>
          r.id_laporan === selectedReport.id_laporan
            ? { ...r, status: 'ditolak' }
            : r
        )
      )
      setShowRejectModal(false)
      setRejectReason('')
    } catch (err) {
      showToast(err.message || 'Gagal menolak laporan', 'error')
    } finally {
      setActionLoading(false)
    }
  }

  // Export Rekap
  const handleEksporRekap = () => {
    const csvContent =
      'data:text/csv;charset=utf-8,' +
      ['ID Laporan,Pelapor,Lokasi,Kategori,Tingkat Kegelapan,Status,Waktu']
        .concat(
          laporanList.map(
            (l) =>
              `"${l.id_laporan}","${l.pelapor_nama || 'Warga'}","${l.keterangan_lokasi}","${l.kategori}","${l.tingkat_kegelapan}","${l.status}","${l.tanggal_laporan}"`
          )
        )
        .join('\n')

    const encodedUri = encodeURI(csvContent)
    const link = document.createElement('a')
    link.setAttribute('href', encodedUri)
    link.setAttribute('download', `rekap_laporan_dishub_${new Date().toISOString().slice(0, 10)}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  return (
    <Layout>
      <div className="laporan-warga-page">
        {/* ================= HEADER SECTION ================= */}
        <section className="laporan-top-header">
          <div className="header-title-block">
            <div className="header-stream-tag">
              <span className="stream-dot"></span>
              <span className="stream-text">LIVE COMPUTER VISION STREAM</span>
              <span className="sop-text">SOP-DIS-PJU/2024</span>
            </div>
            <h1 className="header-main-title">Manajemen Laporan Warga & Audit AI</h1>
            <p className="header-desc">
              Daftar pengaduan jalan gelap dan kerusakan PJU Kabupaten Indramayu terintegrasi Computer Vision AI & GIS Dishub.
            </p>
          </div>

          <div className="header-stats-row">
            <div className="stat-box">
              <span className="stat-label">TOTAL ADUAN MASUK</span>
              <div className="stat-val-row">
                <span className="stat-number">{countSemua}</span>
                <span className="stat-badge">+11 hari ini</span>
              </div>
            </div>

            <div className="stat-box">
              <span className="stat-label">AKURASI AUDIT AI</span>
              <div className="stat-val-row">
                <span className="stat-number cyan-number">97.8%</span>
              </div>
            </div>

            <div className="stat-box">
              <span className="stat-label">ZONA RAWAN GELAP</span>
              <div className="stat-val-row">
                <span className="stat-number amber-number">7 Sektor</span>
              </div>
            </div>

            <button
              type="button"
              className="btn-export-rekap"
              onClick={handleEksporRekap}
            >
              <span>📥</span>
              <span>Ekspor Rekap Laporan</span>
            </button>
          </div>
        </section>

        {/* Notification Toast */}
        {notification && (
          <div className={`toast-notification ${notification.type === 'error' ? 'toast-error' : 'toast-success'}`}>
            <span>{notification.type === 'error' ? '⚠️' : '✅'} {notification.message}</span>
            <button type="button" onClick={() => setNotification(null)} className="btn-close-toast">✕</button>
          </div>
        )}

        {/* ================= FILTER & SEARCH BAR ================= */}
        <section className="laporan-filter-bar">
          <div className="filter-controls-row">
            <div className="filter-search-input-wrap">
              <span className="search-icon">🔍</span>
              <input
                type="text"
                placeholder="Cari ID tiket (#IDM-...), nama jalan, pelapor"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="filter-search-input"
              />
            </div>

            <select
              value={filterKategori}
              onChange={(e) => setFilterKategori(e.target.value)}
              className="filter-dropdown"
            >
              <option value="Semua">Semua Kategori Kerusakan</option>
              <option value="PJU_MATI">PJU Mati Total</option>
              <option value="PJU_RUSAK">PJU Fisik Rusak</option>
              <option value="PJU_TIDAK_ADA">PJU Tidak Ada</option>
              <option value="LAINNYA">Lainnya</option>
            </select>

            <select
              value={filterKecamatan}
              onChange={(e) => setFilterKecamatan(e.target.value)}
              className="filter-dropdown"
            >
              <option value="Semua">Semua Kecamatan</option>
              <option value="Lohbener">Kecamatan Lohbener</option>
              <option value="Jatibarang">Kecamatan Jatibarang</option>
              <option value="Sindang">Kecamatan Sindang</option>
              <option value="Karangampel">Kecamatan Karangampel</option>
              <option value="Indramayu">Indramayu Kota</option>
            </select>

            <select className="filter-dropdown">
              <option value="urgent">Urutan: Paling Mendesak</option>
              <option value="newest">Urutan: Terbaru</option>
            </select>
          </div>

          {/* Status Tabs */}
          <div className="filter-tabs-row">
            <button
              type="button"
              className={`filter-tab ${activeTab === 'Semua' ? 'tab-active' : ''}`}
              onClick={() => setActiveTab('Semua')}
            >
              Semua Pengaduan <span className="tab-count">{countSemua}</span>
            </button>
            <button
              type="button"
              className={`filter-tab ${activeTab === 'diajukan' ? 'tab-active' : ''}`}
              onClick={() => setActiveTab('diajukan')}
            >
              ● Menunggu Validasi AI <span className="tab-count">{countMenungguAI}</span>
            </button>
            <button
              type="button"
              className={`filter-tab ${activeTab === 'diterima' ? 'tab-active' : ''}`}
              onClick={() => setActiveTab('diterima')}
            >
              ● Tervalidasi AI (Siap Disposisi) <span className="tab-count">{countTervalidasi}</span>
            </button>
            <button
              type="button"
              className={`filter-tab ${activeTab === 'diproses' ? 'tab-active' : ''}`}
              onClick={() => setActiveTab('diproses')}
            >
              ● Dalam Penanganan Armada <span className="tab-count">{countDalamPenanganan}</span>
            </button>
            <button
              type="button"
              className={`filter-tab ${activeTab === 'selesai' ? 'tab-active' : ''}`}
              onClick={() => setActiveTab('selesai')}
            >
              ● Selesai <span className="tab-count">{countSelesai}</span>
            </button>
          </div>
        </section>

        {/* ================= MAIN 2-COLUMN VIEW ================= */}
        <div className="laporan-grid-layout">
          {/* ================= LEFT COLUMN: QUEUE & TABLE ================= */}
          <div className="laporan-left-column">
            <div className="queue-list-card">
              <div className="queue-list-header">
                <div className="queue-list-title-wrap">
                  <span className="queue-list-icon">📋</span>
                  <div>
                    <h3 className="queue-list-title">Daftar Antrean Tiket Prioritas</h3>
                    <span className="queue-list-sub">
                      (Menampilkan {filteredList.length} dari {laporanList.length} Laporan)
                    </span>
                  </div>
                </div>
                <div className="queue-live-sync">
                  <span className="sync-dot"></span> Live Sync 2s
                </div>
              </div>

              {loading ? (
                <div className="loading-state">Memuat data laporan...</div>
              ) : filteredList.length === 0 ? (
                <div className="empty-state">Tidak ada laporan yang sesuai dengan filter.</div>
              ) : (
                <div className="queue-table-wrap">
                  <table className="queue-table">
                    <thead>
                      <tr>
                        <th>ID & PELAPOR</th>
                        <th>LOKASI RUAS JALAN</th>
                        <th>KENDALA & JARAK</th>
                        <th>AUDIT AI</th>
                        <th>STATUS</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredList.map((item) => {
                        const isSelected = selectedReport?.id_laporan === item.id_laporan
                        return (
                          <tr
                            key={item.id_laporan}
                            className={`queue-row ${isSelected ? 'queue-row-active' : ''}`}
                            onClick={() => setSelectedReportId(item.id_laporan)}
                          >
                            <td>
                              <div className="col-id-pelapor">
                                <span className="row-id">#{item.id_laporan}</span>
                                <span className="row-reporter">{item.pelapor_nama || 'Ahmad S.'}</span>
                                <span className="row-time">18:45 WIB</span>
                              </div>
                            </td>
                            <td>
                              <div className="col-location">
                                <span className="row-road">{item.keterangan_lokasi?.slice(0, 36)}</span>
                                <span className="row-subdistrict">{item.kecamatan || 'Kec. Lohbener'} • KM 14</span>
                                <span className="row-tag-logistik">Jalur Utama Logistik</span>
                              </div>
                            </td>
                            <td>
                              <div className="col-problem">
                                <span className="row-problem-title">
                                  {item.kategori === 'PJU_MATI' ? 'Mati Total (6 Tiang)' : item.kategori === 'PJU_RUSAK' ? 'Kedip / Redup' : 'Tiang Rusak'}
                                </span>
                                <span className="row-problem-distance">420 Meter gelap</span>
                                <span className="row-lux">&lt; 3 Lux</span>
                              </div>
                            </td>
                            <td>
                              <div className="col-ai">
                                <span className="ai-match-badge">98.4% Match</span>
                                <span className="ai-sub">Vision & GIS OK</span>
                              </div>
                            </td>
                            <td>
                              <span
                                className={`status-pill ${
                                  item.status === 'diterima'
                                    ? 'pill-kritis'
                                    : item.status === 'diproses'
                                    ? 'pill-proses'
                                    : item.status === 'selesai'
                                    ? 'pill-selesai'
                                    : 'pill-menunggu'
                                }`}
                              >
                                {item.status === 'diterima'
                                  ? 'Prioritas Kritis'
                                  : item.status === 'diproses'
                                  ? 'Sedang Ditangani'
                                  : item.status === 'selesai'
                                  ? 'Selesai'
                                  : 'Menunggu AI'}
                              </span>
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Pagination */}
              <div className="queue-pagination">
                <span className="pagination-info">Menampilkan 1-4 dari 42 Laporan Warga</span>
                <div className="pagination-buttons">
                  <button type="button" className="btn-page">Sebelumnya</button>
                  <button type="button" className="btn-page btn-page-active">1</button>
                  <button type="button" className="btn-page">2</button>
                  <button type="button" className="btn-page">3</button>
                  <button type="button" className="btn-page">Berikutnya</button>
                </div>
              </div>
            </div>

            {/* Spatial Corridor Info Card */}
            <div className="spatial-corridor-card">
              <div className="spatial-header">
                <div>
                  <h4 className="spatial-title">Sebaran Spasial Koridor Lohbener - Jatibarang</h4>
                  <span className="gis-layer-tag">GIS MAP LAYER IDM-04</span>
                </div>
              </div>
              <p className="spatial-desc">
                Sistem mendeteksi konsentrasi aduan tertinggi malam ini berada pada Koridor Pantura Lohbener sejauh 3.8 KM, memicu rekomendasi patroli armada Derek Unit 02 Dishub.
              </p>

              <div className="spatial-mini-map">
                <div className="map-point point-cangkring">Cangkring</div>
                <div className="map-point point-indramayu">Indramayu Kota</div>
                <div className="map-point point-mall">Mall Indramayu</div>
                <div className="map-point point-mangga">Bunderan Mangga</div>
                <div className="map-point point-balongan">Balongan</div>

                <div className="map-corridor-bar">
                  <span>● 6 Titik Padam Beruntun Teridentifikasi</span>
                  <a href="/dashboard" className="link-open-radar">Buka Radar Peta Full ↗</a>
                </div>
              </div>
            </div>
          </div>

          {/* ================= RIGHT COLUMN: DETAIL & ACTION ================= */}
          {selectedReport && (
            <div className="laporan-right-column">
              <div className="detail-panel-card">
                {/* Header */}
                <div className="detail-header">
                  <div className="detail-header-top">
                    <span className="badge-kritis">● PRIORITAS KRITIS</span>
                    <span className="badge-kecamatan">{selectedReport.kecamatan || 'Kec. Lohbener'}</span>
                    <div className="detail-icons">
                      <span className="icon-action" title="Simpan Bookmark">🔖</span>
                      <span className="icon-action" title="Cetak Disposisi">🖨️</span>
                    </div>
                  </div>
                  <h2 className="detail-ticket-id">#{selectedReport.id_laporan}</h2>
                  <p className="detail-road-title">{selectedReport.keterangan_lokasi}</p>
                </div>

                {/* Citizen Profile */}
                <div className="citizen-profile-section">
                  <div className="section-label">
                    <span>PROFIL PELAPOR WARGA</span>
                    <span className="nik-badge">✓ NIK Terverifikasi Dukcapil</span>
                  </div>

                  <div className="citizen-info-row">
                    <div className="citizen-avatar">AS</div>
                    <div className="citizen-meta">
                      <span className="citizen-name">{selectedReport.pelapor_nama || 'Ahmad Suhendra'}</span>
                      <span className="citizen-phone">{selectedReport.pelapor_phone || '+62 812-3981-XXXX (WhatsApp Aktif)'}</span>
                    </div>
                    <button
                      type="button"
                      className="btn-whatsapp-hubungi"
                      onClick={() => alert(`Membuka tautan chat WhatsApp ke ${selectedReport.pelapor_phone || 'pelapor'}...`)}
                    >
                      💬 Hubungi
                    </button>
                  </div>

                  <div className="citizen-stats-row">
                    <div className="citizen-stat">
                      <span className="stat-label">Waktu Lapor:</span>
                      <span className="stat-val">18:45:22 WIB</span>
                    </div>
                    <div className="citizen-stat">
                      <span className="stat-label">Kredibilitas Warga:</span>
                      <span className="stat-val stat-green">{selectedReport.pelapor_skor || 'Skor 9.6 / 10'}</span>
                    </div>
                  </div>
                </div>

                {/* Camera Evidence & CV-AI Detection */}
                <div className="cv-evidence-section">
                  <div className="section-label">
                    <span>BUKTI KAMERA WARGA & DETEKSI CV-AI</span>
                    <span className="model-badge">MODEL: PJU-YOLOV8-INDRAMAYU</span>
                  </div>

                  <div className="cv-image-container">
                    <img
                      src={selectedReport.foto || 'https://images.unsplash.com/photo-1509114397022-ed747cca3f65?auto=format&fit=crop&w=800&q=80'}
                      alt="Bukti foto lapangan"
                      className="cv-photo-img"
                    />

                    {/* AI Bounding Box Overlay */}
                    <div className="ai-bounding-box">
                      <div className="bounding-tag">PJU Mati [ID: T-LHB-08]</div>
                      <div className="bounding-zone">Zone: Zero-Luminance (&lt;3 Lux)</div>
                      <div className="bounding-conf">Conf: 98.4%</div>
                      <div className="bounding-area">Area: 420m Void</div>
                    </div>

                    <div className="exif-gps-overlay">
                      <span>📍 EXIF GPS: -6.40284, 108.28913 (Sinkron Ruas Jalan)</span>
                    </div>
                  </div>
                </div>

                {/* AI Automatic Validation Checkmarks */}
                <div className="ai-validation-box">
                  <div className="ai-validation-header">
                    <span className="ai-val-title">✨ Hasil Validasi Otomatis AI</span>
                    <span className="ai-confidence-pill">Skor Kepercayaan: 98.4%</span>
                  </div>

                  <div className="ai-checks-grid">
                    <div className="ai-check-item">
                      <span className="check-icon">✓</span>
                      <span>Geotag Akurat (Toleransi 4m)</span>
                    </div>
                    <div className="ai-check-item">
                      <span className="check-icon">✓</span>
                      <span>Bukan Gambar Duplikat / Hoaks</span>
                    </div>
                    <div className="ai-check-item">
                      <span className="check-icon">✓</span>
                      <span>Satelit Night Vision Match</span>
                    </div>
                    <div className="ai-check-item">
                      <span className="check-icon">✓</span>
                      <span>Korelasi GIS Aset Dishub</span>
                    </div>
                  </div>

                  <div className="ai-recommendation-block">
                    <div className="rec-header">
                      <span className="rec-label">REKOMENDASI TINDAKAN CEPAT AI</span>
                      <span className="rec-eta">Estimasi Pengerjaan: 45 Menit</span>
                    </div>
                    <p className="rec-text">
                      Dibutuhkan penggantian <strong>4 Unit Lampu LED Smart 120W</strong> dan perbaikan jumper kabel pada tiang nomor <strong>T-LHB-08 s/d T-LHB-14</strong>. Jalur rawan laka malam.
                    </p>
                  </div>
                </div>

                {/* Action Buttons: Tindakan Eksekusi Satgas */}
                <div className="action-buttons-section">
                  <span className="action-section-label">TINDAKAN EKSEKUSI SATGAS</span>

                  <div className="action-buttons-grid">
                    {/* Disposisi Button */}
                    <button
                      type="button"
                      className="btn-act btn-disposisi"
                      disabled={actionLoading || selectedReport.status === 'diproses' || selectedReport.status === 'selesai'}
                      onClick={handleDisposisi}
                    >
                      <span className="act-icon">🚚</span>
                      <span>Disposisi ke Satgas Derek</span>
                    </button>

                    {/* Tandai Sedang Dikerjakan */}
                    <button
                      type="button"
                      className="btn-act btn-sedang-kerja"
                      disabled={actionLoading || selectedReport.status === 'selesai'}
                      onClick={handleSedangDikerjakan}
                    >
                      <span className="act-icon">👷</span>
                      <span>Tandai Sedang Dikerjakan</span>
                    </button>

                    {/* Selesai & Terbitkan Bukti */}
                    <button
                      type="button"
                      className="btn-act btn-selesai"
                      disabled={actionLoading || selectedReport.status === 'selesai'}
                      onClick={handleSelesai}
                    >
                      <span className="act-icon">✅</span>
                      <span>Selesai & Terbitkan Bukti</span>
                    </button>

                    {/* Tolak Laporan */}
                    <button
                      type="button"
                      className="btn-act btn-tolak"
                      disabled={actionLoading || selectedReport.status === 'selesai'}
                      onClick={() => setShowRejectModal(true)}
                    >
                      <span className="act-icon">🚫</span>
                      <span>Tolak Laporan (Beri Alasan)</span>
                    </button>
                  </div>

                  {/* Trigger Validasi AI button if status is diajukan */}
                  {selectedReport.status === 'diajukan' && (
                    <button
                      type="button"
                      className="btn-run-ai-full"
                      onClick={handleJalankanValidasiAI}
                      disabled={actionLoading}
                    >
                      ⚡ Jalankan Validasi Model AI Sekarang
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Tolak Laporan */}
        {showRejectModal && (
          <div className="modal-backdrop">
            <div className="modal-card">
              <h3 className="modal-title">Tolak Laporan #{selectedReport?.id_laporan}</h3>
              <p className="modal-subtitle">
                Berikan alasan penolakan yang jelas untuk dicatat dalam log progres dan disampaikan kepada pelapor.
              </p>

              <textarea
                className="modal-textarea"
                rows="4"
                placeholder="Misal: Foto tidak memperlihatkan kerusakan lampu PJU, atau tiang bukan kewenangan Dishub Indramayu..."
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
              />

              <div className="modal-buttons">
                <button
                  type="button"
                  className="btn-modal-cancel"
                  onClick={() => setShowRejectModal(false)}
                >
                  Batal
                </button>
                <button
                  type="button"
                  className="btn-modal-confirm-reject"
                  onClick={handleConfirmReject}
                  disabled={actionLoading}
                >
                  {actionLoading ? 'Menyimpan...' : 'Konfirmasi Penolakan'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  )
}

export default LaporanWarga