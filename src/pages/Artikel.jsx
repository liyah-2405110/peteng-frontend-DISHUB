import { useState, useEffect } from 'react'
import Layout from '../components/Layout'
import { getDaftarLaporanDinas } from '../services/laporanService'
import '../css/Artikel.css'

const INITIAL_ARTICLES = [
  {
    id: 'PUB-LOH-098',
    tiket_id: 'IDM-2024-8812',
    judul: 'Pemkab & Dishub Indramayu Tuntaskan 45 Titik PJU Baru di Jalur Lohbener',
    kategori: 'PROGRES PERBAIKAN',
    status_lapangan: 'SELESAI & MENYALA',
    kecamatan: 'Kec. Lohbener',
    foto_sebelum: 'https://images.unsplash.com/photo-1509114397022-ed747cca3f65?auto=format&fit=crop&w=800&q=80',
    foto_sesudah: 'https://images.unsplash.com/photo-1508873696983-2df5293cb32f?auto=format&fit=crop&w=800&q=80',
    ringkasan: 'Penuntasan pemasangan penerangan jalan umum bertenaga surya guna menekan angka kriminalitas dan laka lantas di koridor logistik Pantura.',
    waktu: 'Hari ini, 19:30 WIB',
    pembaca: '1.8k',
    rating: '94% Positif',
    geo_fenced_warga: 1840,
  },
  {
    id: 'PUB-BAL-094',
    tiket_id: 'IDM-2024-8790',
    judul: 'Perbaikan Tiang Ambruk di Ruas Balongan',
    kategori: 'PROGRES PERBAIKAN',
    status_lapangan: 'SELESAI & MENYALA',
    kecamatan: 'Kec. Balongan',
    foto_sebelum: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=800&q=80',
    foto_sesudah: 'https://images.unsplash.com/photo-1517457373958-b7bdd4587205?auto=format&fit=crop&w=800&q=80',
    ringkasan: 'Tiang PJU yang tertabrak kendaraan muatan telah diganti dengan tiang galvanis oktagonal baru dan jaringan grounding diperbaiki.',
    waktu: '3 jam lalu',
    pembaca: '920',
    rating: '98% Positif',
    geo_fenced_warga: 720,
  },
  {
    id: 'PUB-KRG-091',
    tiket_id: 'IDM-2024-8755',
    judul: 'Penggantian Trafo Pesisir Karangampel',
    kategori: 'PROGRES PERBAIKAN',
    status_lapangan: 'SEDANG DIKERJAKAN',
    kecamatan: 'Kec. Karangampel',
    foto_sebelum: 'https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?auto=format&fit=crop&w=800&q=80',
    foto_sesudah: 'https://images.unsplash.com/photo-1508873696983-2df5293cb32f?auto=format&fit=crop&w=800&q=80',
    ringkasan: 'Satgas Regu 3 sedang mengganti unit trafo step-down yang terbakar akibat lonjakan petir malam kemarin.',
    waktu: '5 jam lalu',
    pembaca: '1.1k',
    rating: '89% Positif',
    geo_fenced_warga: 950,
  },
]

function Artikel() {
  const [articles, setArticles] = useState(() => {
    try {
      const saved = localStorage.getItem('peteng_published_articles')
      return saved ? JSON.parse(saved) : INITIAL_ARTICLES
    } catch {
      return INITIAL_ARTICLES
    }
  })

  const [availableTickets, setAvailableTickets] = useState([])
  const [selectedTicket, setSelectedTicket] = useState('IDM-2024-8812')
  const [judul, setJudul] = useState('Pemkab & Dishub Indramayu Tuntaskan 45 Titik PJU Baru di Jalur Lohbener')
  const [kategori, setKategori] = useState('PROGRES PERBAIKAN')
  const [statusLapangan, setStatusLapangan] = useState('SELESAI & MENYALA')
  const [ringkasan, setRingkasan] = useState(
    'Pemasangan 45 unit lampu LED Solar 120 Watt pada ruas Lohbener km 12 hingga km 15 telah rampung 100%. Tim Satgas PJU Dishub Indramayu juga memperbarui kabel grounding serta mengaktifkan sensor otomatis photocell untuk proteksi tegangan saat musim hujan.'
  )
  const [kirimPush, setKirimPush] = useState(true)
  const [filterKategori, setFilterKategori] = useState('Semua')
  const [toastMessage, setToastMessage] = useState(null)

  // Fetch available tickets to link
  useEffect(() => {
    async function loadTickets() {
      try {
        const res = await getDaftarLaporanDinas()
        if (res.data) {
          setAvailableTickets(res.data)
        }
      } catch (err) {
        console.error(err)
      }
    }
    loadTickets()
  }, [])

  const showToast = (msg, type = 'success') => {
    setToastMessage({ msg, type })
    setTimeout(() => setToastMessage(null), 5000)
  }

  // Handle Save Draft
  const handleSimpanDraft = () => {
    showToast('Draft publikasi disimpan di penyimpanan lokal (Menunggu kesiapan API endpoint artikel backend).')
  }

  // Handle Publish
  const handlePublikasikan = (e) => {
    e.preventDefault()
    if (!judul.trim() || !ringkasan.trim()) {
      showToast('Judul dan ringkasan wajib diisi.', 'error')
      return
    }

    const newArticle = {
      id: `PUB-DISHUB-${Date.now().toString().slice(-4)}`,
      tiket_id: selectedTicket,
      judul,
      kategori,
      status_lapangan: statusLapangan,
      kecamatan: 'Kec. Indramayu',
      foto_sebelum: 'https://images.unsplash.com/photo-1509114397022-ed747cca3f65?auto=format&fit=crop&w=800&q=80',
      foto_sesudah: 'https://images.unsplash.com/photo-1508873696983-2df5293cb32f?auto=format&fit=crop&w=800&q=80',
      ringkasan,
      waktu: 'Baru saja',
      pembaca: '1',
      rating: '100% Positif',
      geo_fenced_warga: kirimPush ? 1840 : 0,
    }

    const updated = [newArticle, ...articles]
    setArticles(updated)
    try {
      localStorage.setItem('peteng_published_articles', JSON.stringify(updated))
    } catch {
      // ignore
    }

    showToast('Publikasi berhasil dirilis dan disiarkan ke buletin warga! (Catatan: Data tersimpan lokal karena endpoint /api/publikasi belum tersedia di backend Go).')
  }

  const filteredArticles = articles.filter((a) => {
    if (filterKategori === 'Semua') return true
    if (filterKategori === 'Progres') return a.kategori === 'PROGRES PERBAIKAN'
    if (filterKategori === 'Edukasi') return a.kategori === 'EDUKASI JALAN'
    return true
  })

  return (
    <Layout>
      <div className="publikasi-progres-page">
        {/* ================= HEADER ================= */}
        <section className="publikasi-header">
          <div className="header-meta-row">
            <span className="breadcrumb-text">📢 Publikasi & Edukasi / Pusat Buletin Warga</span>
            <div className="header-badges">
              <span className="badge-sindikasi">● PORTAL SINDIKASI WARGA AKTIF</span>
              <button
                type="button"
                className="btn-rss-blast"
                onClick={() => showToast('Konfigurasi RSS & SMS Blast telah disinkronkan dengan gateway Kominfo.')}
              >
                ⚙ Pengaturan RSS & SMS Blast
              </button>
            </div>
          </div>

          <div className="header-title-wrap">
            <span className="channel-tag">DISHUB KAB. INDRAMAYU • KANAL INFORMASI RESMI TERPADU</span>
            <h1 className="header-title">Pusat Publikasi Progres & Buletin Warga</h1>
            <p className="header-desc">
              Rilis pengumuman resmi perbaikan lampu jalan, agenda pemeliharaan PJU, dan edukasi keselamatan berkendara malam hari untuk masyarakat Kabupaten Indramayu.
            </p>
          </div>
        </section>

        {/* Toast */}
        {toastMessage && (
          <div className={`toast-alert ${toastMessage.type === 'error' ? 'toast-err' : 'toast-ok'}`}>
            <span>{toastMessage.type === 'error' ? '⚠️' : '✅'} {toastMessage.msg}</span>
            <button type="button" onClick={() => setToastMessage(null)} className="btn-close-toast">✕</button>
          </div>
        )}

        {/* ================= TWO COLUMN LAYOUT ================= */}
        <div className="publikasi-grid">
          {/* ================= LEFT COLUMN: EDITOR ================= */}
          <div className="publikasi-left-col">
            <div className="editor-card">
              <div className="editor-header">
                <div className="editor-title-wrap">
                  <span className="editor-dot">●</span>
                  <h3 className="editor-title">Editor Publikasi & Hasil Eksekusi</h3>
                </div>
                <span className="form-id-badge">FORM ID: #PUB-LOH-098</span>
              </div>

              <form onSubmit={handlePublikasikan} className="editor-form">
                {/* Field 1: Hubungkan dengan Tiket */}
                <div className="form-group">
                  <div className="form-label-row">
                    <label className="field-label">🔗 Hubungkan dengan Tiket Laporan</label>
                    <span className="badge-verified-satgas">✓ Terverifikasi Satgas</span>
                  </div>
                  <select
                    value={selectedTicket}
                    onChange={(e) => setSelectedTicket(e.target.value)}
                    className="editor-select"
                  >
                    <option value="IDM-2024-8812">
                      #IDM-2024-8812 - Ruas Lohbener (45 Tiang Baru Selesai Dipasang)
                    </option>
                    <option value="IDM-2024-8809">
                      #IDM-2024-8809 - Jl. Mayor Dasuki Jatibarang (Lampu Kedip Tuntas)
                    </option>
                    <option value="IDM-2024-8798">
                      #IDM-2024-8798 - Jl. Pantura Karangampel (Penggantian LED 120W)
                    </option>
                    {availableTickets.map((t) => (
                      <option key={t.id_laporan} value={t.id_laporan}>
                        #{t.id_laporan} - {t.keterangan_lokasi?.slice(0, 40)}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Field 2: Judul Publikasi */}
                <div className="form-group">
                  <div className="form-label-row">
                    <label className="field-label">T Judul Publikasi / Berita Resmi</label>
                    <span className="char-counter">{judul.length}/120 Karakter</span>
                  </div>
                  <input
                    type="text"
                    maxLength={120}
                    value={judul}
                    onChange={(e) => setJudul(e.target.value)}
                    placeholder="Contoh: Pemkab & Dishub Indramayu Tuntaskan 45 Titik PJU Baru di Jalur Lohbener"
                    className="editor-input"
                    required
                  />
                </div>

                {/* Field 3: Kategori Artikel */}
                <div className="form-group">
                  <label className="field-label">📁 Kategori Artikel</label>
                  <div className="category-pills-row">
                    {['PROGRES PERBAIKAN', 'EDUKASI JALAN', 'INFRASTRUKTUR PJU'].map((cat) => (
                      <button
                        key={cat}
                        type="button"
                        className={`cat-pill ${kategori === cat ? 'cat-pill-active' : ''}`}
                        onClick={() => setKategori(cat)}
                      >
                        {cat === 'PROGRES PERBAIKAN' ? '🛠️ PROGRES PERBAIKAN' : cat === 'EDUKASI JALAN' ? '📖 EDUKASI JALAN' : '🏗️ INFRASTRUKTUR PJU'}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Field 4: Status Pengerjaan Lapangan */}
                <div className="form-group">
                  <div className="form-label-row">
                    <label className="field-label">› Status Pengerjaan Lapangan</label>
                    <span className="field-result-tag">HASIL: TERPASANG NYALA</span>
                  </div>
                  <div className="status-radio-row">
                    {[
                      { val: 'BELUM DIPERBAIKI', label: 'Belum Diperbaiki', color: 'red' },
                      { val: 'SEDANG DIKERJAKAN', label: 'Sedang Dikerjakan', color: 'amber' },
                      { val: 'SELESAI & MENYALA', label: 'Selesai & Menyala', color: 'green' },
                    ].map((st) => (
                      <button
                        key={st.val}
                        type="button"
                        className={`status-radio-btn ${statusLapangan === st.val ? `radio-active-${st.color}` : ''}`}
                        onClick={() => setStatusLapangan(st.val)}
                      >
                        <span className={`radio-dot dot-${st.color}`}></span>
                        <span>{st.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Field 5: Bukti Lapangan Foto Sebelum vs Sesudah */}
                <div className="form-group">
                  <div className="form-label-row">
                    <label className="field-label">📷 Bukti Lapangan (Foto Sebelum vs Sesudah PJU Menyala)</label>
                    <span className="field-hint">Format JPG/PNG &lt; 5MB</span>
                  </div>
                  <div className="before-after-grid">
                    {/* Box 1: Kondisi Awal */}
                    <div className="photo-preview-card">
                      <img
                        src="https://images.unsplash.com/photo-1509114397022-ed747cca3f65?auto=format&fit=crop&w=800&q=80"
                        alt="Kondisi Awal Gelap"
                        className="preview-img"
                      />
                      <div className="photo-card-overlay">
                        <span className="overlay-badge red-badge">KONDISI AWAL (GELAP)</span>
                        <span className="overlay-desc">Foto Titik Gelap Lohbener</span>
                        <button type="button" className="btn-change-photo">✏ Ganti File</button>
                      </div>
                    </div>

                    {/* Box 2: Hasil Perbaikan */}
                    <div className="photo-preview-card">
                      <img
                        src="https://images.unsplash.com/photo-1508873696983-2df5293cb32f?auto=format&fit=crop&w=800&q=80"
                        alt="Hasil Perbaikan Terang"
                        className="preview-img"
                      />
                      <div className="photo-card-overlay">
                        <span className="overlay-badge green-badge">HASIL PERBAIKAN (TERANG)</span>
                        <span className="overlay-desc">45 PJU Aktif Beroperasi</span>
                        <span className="verified-stamp">✓ Terverifikasi Tim Lapangan</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Field 6: Ringkasan Berita */}
                <div className="form-group">
                  <div className="form-label-row">
                    <label className="field-label">📝 Ringkasan Berita & Catatan Komponen Teknisi</label>
                    <span className="badge-feed-public">Tampil di feed publik</span>
                  </div>
                  <textarea
                    rows="4"
                    value={ringkasan}
                    onChange={(e) => setRingkasan(e.target.value)}
                    className="editor-textarea"
                    placeholder="Tuliskan komponen yang diganti, nomor tiang, dan hasil pengukuran pencahayaan..."
                    required
                  />
                </div>

                {/* Field 7: Checkbox Push Notification */}
                <div className="push-checkbox-card">
                  <input
                    type="checkbox"
                    id="chkPush"
                    checked={kirimPush}
                    onChange={(e) => setKirimPush(e.target.checked)}
                    className="custom-checkbox"
                  />
                  <label htmlFor="chkPush" className="checkbox-label">
                    <div className="chk-title-row">
                      <strong>Kirim Notifikasi Push ke 1.840 Warga</strong>
                      <span className="badge-geo">Geo-Fenced</span>
                    </div>
                    <span className="chk-desc">
                      Warga di radius 5Km Kec. Lohbener & pengendara yang menyimpan rute ini akan menerima pembaruan instan pada ponsel mereka.
                    </span>
                  </label>
                </div>

                {/* Action Buttons */}
                <div className="editor-actions-row">
                  <button
                    type="button"
                    className="btn-simpan-draft"
                    onClick={handleSimpanDraft}
                  >
                    Simpan Draft
                  </button>

                  <button
                    type="submit"
                    className="btn-publish-warga"
                  >
                    <span>🚀</span>
                    <span>Publikasikan ke Aplikasi Warga</span>
                  </button>
                </div>
              </form>

              {/* SOP Footer Card */}
              <div className="sop-info-box">
                <span className="sop-icon">🛡️</span>
                <div className="sop-text-wrap">
                  <strong className="sop-header">SOP Verifikasi Foto Dishub</strong>
                  <p className="sop-desc">
                    Foto hasil pekerjaan wajib mencantumkan metadata GPS dan tanggal pengerjaan yang tervalidasi oleh mandor Satgas PJU.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* ================= RIGHT COLUMN: LIST & REACH ================= */}
          <div className="publikasi-right-col">
            {/* Reach Stats */}
            <div className="reach-stats-card">
              <div className="reach-stat-item">
                <span className="reach-label">TOTAL TERBIT</span>
                <div className="reach-val-row">
                  <span className="reach-number">{articles.length}</span>
                  <span className="reach-unit">Rilis</span>
                </div>
              </div>

              <div className="reach-stat-item">
                <span className="reach-label">JANGKAUAN WARGA</span>
                <div className="reach-val-row">
                  <span className="reach-number cyan-text">24.6k</span>
                  <span className="reach-unit">User</span>
                </div>
              </div>

              <div className="reach-stat-item">
                <span className="reach-label">RESPON RATING</span>
                <div className="reach-val-row">
                  <span className="reach-number amber-text">98.2%</span>
                  <span className="reach-unit">Puas</span>
                </div>
              </div>
            </div>

            {/* Published List Section */}
            <div className="published-list-card">
              <div className="published-list-header">
                <div className="published-title-wrap">
                  <span className="published-icon">📑</span>
                  <h3 className="published-title">Daftar Publikasi Terbit</h3>
                  <span className="published-badge-count">{articles.length} Terpublikasi</span>
                </div>

                <div className="filter-pill-group">
                  <button
                    type="button"
                    className={`pill-btn ${filterKategori === 'Semua' ? 'pill-btn-active' : ''}`}
                    onClick={() => setFilterKategori('Semua')}
                  >
                    Semua Terbit ({articles.length})
                  </button>
                  <button
                    type="button"
                    className={`pill-btn ${filterKategori === 'Progres' ? 'pill-btn-active' : ''}`}
                    onClick={() => setFilterKategori('Progres')}
                  >
                    Progres Perbaikan (12)
                  </button>
                  <button
                    type="button"
                    className={`pill-btn ${filterKategori === 'Edukasi' ? 'pill-btn-active' : ''}`}
                    onClick={() => setFilterKategori('Edukasi')}
                  >
                    Edukasi (6)
                  </button>
                </div>
              </div>

              <div className="articles-feed">
                {/* Hero Featured Article */}
                {filteredArticles[0] && (
                  <div className="article-hero-card">
                    <div className="hero-img-wrap">
                      <img
                        src={filteredArticles[0].foto_sesudah}
                        alt="Hero publication"
                        className="hero-img"
                      />
                      <span className="hero-badge-status">● {filteredArticles[0].status_lapangan}</span>
                      <span className="hero-badge-loc">{filteredArticles[0].kecamatan}</span>
                    </div>

                    <div className="hero-content">
                      <div className="hero-meta-row">
                        <span>{filteredArticles[0].waktu}</span>
                        <span>• 👁 {filteredArticles[0].pembaca} Pembaca</span>
                        <span className="hero-rating">• 👍 {filteredArticles[0].rating}</span>
                      </div>
                      <h4 className="hero-title">{filteredArticles[0].judul}</h4>
                      <p className="hero-excerpt">{filteredArticles[0].ringkasan?.slice(0, 110)}...</p>

                      <div className="hero-action-buttons">
                        <button type="button" className="btn-hero-action" onClick={() => showToast('Membuka mode pengeditan draft...')}>
                          ✏ Edit
                        </button>
                        <button type="button" className="btn-hero-action" onClick={() => showToast('Membuka simulasi tampilan di aplikasi mobile warga...')}>
                          ↗ Lihat di Aplikasi
                        </button>
                        <button type="button" className="btn-hero-action" onClick={() => showToast('Membuka analitik pembaca dan sentimen warga...')}>
                          📊 Statistik
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* Sub Articles */}
                {filteredArticles.slice(1).map((art) => (
                  <div key={art.id} className="article-sub-card">
                    <img src={art.foto_sesudah} alt={art.judul} className="sub-thumb" />
                    <div className="sub-content">
                      <div className="sub-meta-row">
                        <span className={`sub-status ${art.status_lapangan.includes('SELESAI') ? 'sub-green' : 'sub-amber'}`}>
                          {art.status_lapangan.includes('SELESAI') ? 'SELESAI' : 'SEDANG DIKERJAKAN'}
                        </span>
                        <span className="sub-time">• {art.waktu}</span>
                        <span className="sub-ticket">• Tiket #{art.tiket_id}</span>
                      </div>
                      <h5 className="sub-title">{art.judul}</h5>
                      <p className="sub-excerpt">{art.ringkasan?.slice(0, 95)}...</p>

                      <div className="sub-footer">
                        <span className="sub-sent-info">
                          📡 Terkirim ke {art.geo_fenced_warga} Warga
                        </span>
                        <div className="sub-icons">
                          <button type="button" className="btn-icon-sub" title="Edit">✏</button>
                          <button type="button" className="btn-icon-sub" title="Statistik">📊</button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}

                <button
                  type="button"
                  className="btn-view-archive"
                  onClick={() => showToast('Memuat seluruh arsip publikasi dinas perhubungan...')}
                >
                  Lihat Arsip Lengkap ›
                </button>
              </div>
            </div>

            {/* Popular Education Topics */}
            <div className="popular-topics-card">
              <div className="topics-header">
                <span className="topics-title">TOPIK EDUKASI TERPOPULER MINGGU INI</span>
                <span className="topics-arrow">↗</span>
              </div>
              <div className="topic-item">
                <span className="topic-num">01</span>
                <div className="topic-content">
                  <h6 className="topic-title">Tips Aman Melewati Jalur Pantura Tanpa Lampu Jalan</h6>
                  <span className="topic-views">Dibaca 5.420 kali oleh pengemudi roda dua</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  )
}

export default Artikel