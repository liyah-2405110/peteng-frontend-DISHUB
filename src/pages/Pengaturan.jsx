import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Layout from '../components/Layout'
import { getDinasProfile } from '../services/authService'
import { clearAuth, getAuth } from '../utils/authStorage'
import '../css/Pengaturan.css'

const TABS = [
  { key: 'profil', label: 'Profil akun' },
  { key: 'tentang', label: 'Tentang aplikasi' },
  { key: 'panduan', label: 'Panduan aplikasi' },
]

// Teks di bawah ditulis dari alur yang ada di kode. Jika alur aplikasi berubah,
// teks ini harus diperbarui manual.
const HOW_IT_WORKS = [
  { title: 'Laporan masuk', text: 'Warga mengirim laporan penerangan jalan beserta foto dan lokasinya.' },
  { title: 'Dicek AI', text: 'Laporan divalidasi otomatis sebelum bisa ditangani petugas.' },
  { title: 'Ditangani petugas', text: 'Petugas Dishub memulai penanganan, lalu mengunggah foto bukti perbaikan.' },
  { title: 'Terbukti selesai', text: 'Bukti dicek otomatis. Laporan dinyatakan selesai bila bukti lolos.' },
]

const FEATURES = [
  { title: 'Monitoring Peta', text: 'Melihat sebaran laporan di peta dan jumlah laporan per status.' },
  { title: 'Laporan Warga', text: 'Mengelola laporan yang masuk dan memulai penanganannya.' },
  { title: 'Publikasi Progres', text: 'Memperbarui status laporan dan menerbitkan informasi jalan.' },
  { title: 'Pengaturan', text: 'Profil akun, informasi aplikasi, dan panduan penggunaan.' },
]

const REPORT_TYPES = ['PJU mati', 'PJU rusak', 'PJU tidak tersedia', 'Lainnya']

const GUIDE = [
  {
    id: 'alur',
    title: 'Menangani sebuah laporan',
    defaultOpen: true,
    intro: 'Ikuti urutan ini untuk setiap laporan.',
    ordered: true,
    items: [
      { term: 'Pilih laporan.', text: 'Buka Publikasi Progres atau Monitoring Peta, lalu klik laporan yang ingin ditangani.' },
      { term: 'Mulai penanganan.', text: 'Untuk laporan berstatus Perlu penanganan, tekan Mulai penanganan.' },
      { term: 'Unggah bukti.', text: 'Setelah perbaikan selesai, isi catatan perbaikan, pilih kondisi penerangan, dan unggah foto bukti.' },
      { term: 'Tunggu validasi.', text: 'Bukti dicek otomatis. Status Selesai ditangani mengikuti hasil pengecekan, bukan ditandai manual.' },
    ],
  },
  {
    id: 'status',
    title: 'Arti status laporan',
    items: [
      { term: 'Perlu penanganan', text: 'Laporan sudah tervalidasi dan belum dikerjakan.' },
      { term: 'Dalam penanganan', text: 'Petugas sudah memulai perbaikan.' },
      { term: 'Menunggu validasi AI', text: 'Bukti perbaikan sudah diunggah dan sedang dicek.' },
      { term: 'Selesai ditangani', text: 'Bukti perbaikan lolos pengecekan.' },
    ],
  },
  {
    id: 'peta',
    title: 'Memakai Monitoring Peta',
    items: [
      { text: 'Saring laporan menurut kategori, status penanganan, dan kondisi penerangan, atau cari dengan ID laporan atau lokasi.' },
      { text: 'Klik penanda di peta atau laporan di daftar untuk melihat detailnya.' },
      { text: 'Gunakan Rute ke lokasi untuk membuka Google Maps, atau Salin koordinat untuk mengirim titiknya.' },
    ],
  },
  {
    id: 'publikasi',
    title: 'Memakai Publikasi Progres',
    items: [
      { term: 'Progres laporan.', text: 'Semua laporan ada di daftar. Klik salah satu untuk melihat foto, catatan, dan riwayat, lalu perbarui statusnya.' },
      { term: 'Informasi jalan.', text: 'Terbitkan informasi, misalnya soal lampu jalan atau kecelakaan, dan hapus bila sudah tidak berlaku.' },
    ],
  },
  {
    id: 'foto',
    title: 'Aturan foto bukti',
    items: [
      { text: 'Format JPEG, PNG, atau WebP, ukuran maksimal 5 MB.' },
      { text: 'Catatan perbaikan diisi minimal 3 karakter.' },
      { text: 'Foto yang jelas, memperlihatkan lampu atau panel yang diperbaiki, lebih mudah divalidasi.' },
    ],
  },
]

function GuideItem({ section }) {
  const List = section.ordered ? 'ol' : 'ul'
  return (
    <details className="guide-item" open={section.defaultOpen || undefined}>
      <summary>{section.title}</summary>
      <div className="guide-body">
        {section.intro && <p>{section.intro}</p>}
        <List>
          {section.items.map((item) => (
            <li key={item.term || item.text}>
              {item.term && <strong>{item.term} </strong>}
              {item.text}
            </li>
          ))}
        </List>
      </div>
    </details>
  )
}

function Pengaturan() {
  const navigate = useNavigate()
  const user = getAuth()?.user || {}
  const [tab, setTab] = useState('profil')
  const [profile, setProfile] = useState(null)
  const [saved, setSaved] = useState(null) // { name, phone } hasil simpan terakhir
  const [draft, setDraft] = useState(null) // { name, phone } selama diedit
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')
  const [messageTone, setMessageTone] = useState('success')

  useEffect(() => {
    let active = true
    getDinasProfile()
      .then((result) => { if (active) setProfile(result) })
      .catch((error) => { console.error('Gagal memuat profil akun:', error) })
    return () => { active = false }
  }, [])

  // Notifikasi sukses hilang sendiri setelah 4 detik. Pesan error tetap sampai form diubah.
  useEffect(() => {
    if (!message || messageTone !== 'success') return undefined
    const timer = setTimeout(() => setMessage(''), 4000)
    return () => clearTimeout(timer)
  }, [message, messageTone])

  // Nilai dasar: hasil simpan > profil > data sesi login
  const baseName = saved?.name ?? profile?.nama_dinas_perhubungan ?? user.nama_dinas_perhubungan ?? ''
  const basePhone = saved?.phone ?? profile?.nomor_telepon ?? user.nomor_telepon ?? ''
  const email = profile?.email || user.email || ''

  const nameValue = draft?.name ?? baseName
  const phoneValue = draft?.phone ?? basePhone
  const dirty = nameValue !== baseName || phoneValue !== basePhone
  const phoneClean = phoneValue.replace(/[\s-]/g, '')
  const nameError = nameValue.trim().length < 3 ? 'Nama minimal 3 karakter.' : ''
  const phoneError = phoneClean && !/^\+?[0-9]{9,15}$/.test(phoneClean) ? 'Nomor telepon tidak valid. Gunakan 9 sampai 15 angka.' : ''
  const canSave = dirty && !nameError && !phoneError && !saving
  const initial = baseName.trim().charAt(0).toUpperCase() || '?'

  const setField = (key) => (event) => {
    setMessage('')
    setDraft({ name: nameValue, phone: phoneValue, [key]: event.target.value })
  }

  const handleCancel = () => { setDraft(null); setMessage('') }

  const handleSave = async (event) => {
    event.preventDefault()
    if (!canSave) return
    setSaving(true)
    setMessage('')
    try {
      // TODO: ganti dengan pemanggilan API ubah profil. Saat ini hanya mengubah tampilan.
      await new Promise((resolve) => setTimeout(resolve, 400))
      setSaved({ name: nameValue.trim(), phone: phoneClean })
      setDraft(null)
      setMessageTone('success')
      setMessage('Perubahan profil disimpan.')
    } catch (error) {
      setMessageTone('error')
      setMessage(error?.message || 'Perubahan gagal disimpan. Coba lagi.')
    } finally {
      setSaving(false)
    }
  }

  const handleLogout = () => {
    clearAuth()
    navigate('/login', { replace: true })
  }

  return (
    <Layout>
      <div className="pengaturan-page">
        <section className="settings-title-wrap">
          <h1 className="settings-title">Pengaturan</h1>
          <p className="settings-desc">Kelola akun Anda dan pelajari cara memakai PETENG.</p>
        </section>

        <div className="settings-tabs-bar" role="tablist" aria-label="Bagian pengaturan">
          {TABS.map((t) => (
            <button
              key={t.key}
              type="button"
              role="tab"
              id={`tab-${t.key}`}
              aria-selected={tab === t.key}
              aria-controls={`panel-${t.key}`}
              className={`settings-tab ${tab === t.key ? 'tab-active' : ''}`}
              onClick={() => setTab(t.key)}
            >
              {t.label}
            </button>
          ))}
        </div>

        {tab === 'profil' && (
          <div id="panel-profil" role="tabpanel" aria-labelledby="tab-profil" className="settings-panel">
            <form className="settings-card" onSubmit={handleSave} noValidate>
              <div className="profile-hero">
                <span className="profile-avatar" aria-hidden="true">{initial}</span>
                <div className="profile-hero-text">
                  <h2 className="card-title">{baseName || 'Nama belum diisi'}</h2>
                  <p className="card-subtitle">{email || 'Email belum tersedia'}</p>
                </div>
              </div>

              <div className="form-grid-2">
                <div className="field-block">
                  <label className="field-lbl" htmlFor="profil-nama">Nama petugas</label>
                  <input id="profil-nama" name="nama" className="settings-input" value={nameValue} onChange={setField('name')} maxLength={100} autoComplete="name" aria-invalid={dirty && Boolean(nameError)} />
                  {dirty && nameError && <small className="field-error">{nameError}</small>}
                </div>
                <div className="field-block">
                  <label className="field-lbl" htmlFor="profil-telepon">Nomor telepon</label>
                  <input id="profil-telepon" name="telepon" type="tel" inputMode="tel" className="settings-input" value={phoneValue} onChange={setField('phone')} placeholder="Contoh: 08123456789" maxLength={20} autoComplete="tel" aria-invalid={dirty && Boolean(phoneError)} />
                  {dirty && phoneError && <small className="field-error">{phoneError}</small>}
                </div>
                <div className="field-block field-block-wide">
                  <label className="field-lbl" htmlFor="profil-email">Email dinas</label>
                  <input id="profil-email" name="email" type="email" className="settings-input" value={email} readOnly aria-readonly="true" autoComplete="email" />
                  <small className="field-hint">Email tidak dapat diubah.</small>
                </div>
              </div>

              {message && <p className={`settings-toast settings-toast-${messageTone}`} role="status">{message}</p>}

              <div className="settings-form-actions">
                <button type="button" className="settings-btn" onClick={handleCancel} disabled={!dirty || saving}>Batal</button>
                <button type="submit" className="settings-btn settings-btn-primary" disabled={!canSave}>{saving ? 'Menyimpan…' : 'Simpan perubahan'}</button>
              </div>
            </form>

            <button type="button" className="settings-btn-logout" onClick={handleLogout}>Keluar dari akun</button>
          </div>
        )}

        {tab === 'tentang' && (
          <div id="panel-tentang" role="tabpanel" aria-labelledby="tab-tentang" className="settings-panel">
            <section className="settings-card">
              <div>
                <span className="settings-tag">TENTANG APLIKASI</span>
                <h2 className="card-title">PETENG</h2>
                <p className="about-text">PETENG adalah aplikasi Dishub Indramayu untuk memantau laporan warga tentang penerangan jalan umum (PJU) dan menindaklanjutinya sampai terbukti selesai. Laporan dikelompokkan menjadi:</p>
              </div>
              <div className="chip-row">
                {REPORT_TYPES.map((label) => <span className="info-chip" key={label}>{label}</span>)}
              </div>
            </section>

            <section className="settings-card">
              <h2 className="card-title">Cara kerja</h2>
              <ol className="step-grid">
                {HOW_IT_WORKS.map((step, index) => (
                  <li className="step-card" key={step.title}>
                    <span className="step-number" aria-hidden="true">{index + 1}</span>
                    <strong>{step.title}</strong>
                    <p>{step.text}</p>
                  </li>
                ))}
              </ol>
            </section>

            <section className="settings-card">
              <h2 className="card-title">Fitur utama</h2>
              <ul className="feature-grid">
                {FEATURES.map((feature) => (
                  <li className="feature-card" key={feature.title}>
                    <strong>{feature.title}</strong>
                    <p>{feature.text}</p>
                  </li>
                ))}
              </ul>
            </section>

            <section className="settings-card">
              <h2 className="card-title">Yang perlu diketahui</h2>
              <ul className="note-list">
                <li>Peta menunjukkan lokasi laporan warga, bukan hasil pengukuran sensor penerangan.</li>
                <li>Status Selesai ditangani ditentukan oleh pengecekan otomatis atas foto bukti, bukan ditandai manual oleh petugas.</li>
              </ul>
            </section>
          </div>
        )}

        {tab === 'panduan' && (
          <div id="panel-panduan" role="tabpanel" aria-labelledby="tab-panduan" className="settings-panel">
            <section className="settings-card">
              <div>
                <h2 className="card-title">Panduan penggunaan</h2>
                <p className="card-subtitle">Klik judul untuk membuka atau menutup penjelasannya.</p>
              </div>
              <div className="guide-list">
                {GUIDE.map((section) => <GuideItem key={section.id} section={section} />)}
              </div>
            </section>
          </div>
        )}
      </div>
    </Layout>
  )
}

export default Pengaturan