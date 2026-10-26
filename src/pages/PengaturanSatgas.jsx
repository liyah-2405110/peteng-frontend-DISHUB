import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import Layout from '../components/Layout'
import { getAuth, clearAuth } from '../utils/authStorage'
import { getDinasProfile } from '../services/authService'
import '../css/PengaturanSatgas.css'

function PengaturanSatgas() {
  const navigate = useNavigate()
  const auth = getAuth()
  const user = auth?.user || {}

  // Active Tab: 'profil' | 'keamanan' | 'satgas' | 'sesi'
  const [activeTab, setActiveTab] = useState('profil')

  const namaPetugas = user.nama_dinas_perhubungan || ''
  const [emailPetugas, setEmailPetugas] = useState(user.email || '')
  const [role, setRole] = useState('')
  const [profileLoading, setProfileLoading] = useState(true)

  // Form Keamanan
  const [oldPassword, setOldPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')

  // Toast / Feedback
  const [toast, setToast] = useState(null)
  const [passwordSaving, setPasswordSaving] = useState(false)

  useEffect(() => {
    let active = true

    async function syncProfile() {
      try {
        const profile = await getDinasProfile()
        if (!active) return

        if (profile.email) setEmailPetugas(profile.email)
        if (profile.role) setRole(profile.role)
      } catch {
        if (active) {
          setToast({
            message: 'Gagal mengambil profil akun dari server. Periksa sesi Anda dan coba lagi.',
            type: 'error',
          })
        }
      } finally {
        if (active) setProfileLoading(false)
      }
    }

    syncProfile()

    return () => {
      active = false
    }
  }, [])

  const showToast = (message, type = 'success') => {
    setToast({ message, type })
  }

  useEffect(() => {
    if (!toast) return undefined

    const timeoutId = window.setTimeout(() => setToast(null), 5000)
    return () => window.clearTimeout(timeoutId)
  }, [toast])

  // Handle Change Password
  const handleChangePassword = (e) => {
    e.preventDefault()
    if (!oldPassword || !newPassword || !confirmPassword) {
      showToast('Semua field kata sandi wajib diisi.', 'error')
      return
    }
    if (newPassword.length < 8) {
      showToast('Kata sandi baru minimal 8 karakter.', 'error')
      return
    }
    if (newPassword !== confirmPassword) {
      showToast('Konfirmasi kata sandi baru tidak cocok.', 'error')
      return
    }

    setPasswordSaving(true)
    setTimeout(() => {
      setPasswordSaving(false)
      setOldPassword('')
      setNewPassword('')
      setConfirmPassword('')
      showToast(
        'Permintaan ganti kata sandi divalidasi. (Catatan Arsitektur: Endpoint backend Go untuk perubahan sandi petugas belum diimplementasikan di server, permintaan dicatat untuk integrasi berikutnya).'
      )
    }, 800)
  }

  // Handle Logout
  const handleLogout = () => {
    clearAuth()
    navigate('/login', { replace: true })
  }

  // Operational Satgas Fleet Data (Indramayu PJU Service Fleet)
  const satgasFleet = [
    {
      id: 'DEREK-01',
      name: 'Regu Derek 01 (Pantura Timur)',
      kendaraan: 'Truk Crane Isuzu Giga (E 8412 PA)',
      komandan: 'Bripka Joko Susilo',
      personel: 4,
      wilayah: 'Koridor Jatibarang, Balongan, & Karangampel',
      status: 'SIAGA_OPERASIONAL',
      kontak: 'Radio VHF Channel 4 (143.550 MHz)',
    },
    {
      id: 'DEREK-02',
      name: 'Regu Derek 02 (Pantura Barat)',
      kendaraan: 'Truk Tangga Hidrolik Hino Dutro (E 8413 PA)',
      komandan: 'Supriyanto, A.Md.LLAJ',
      personel: 4,
      wilayah: 'Koridor Lohbener, Losarang, & Patrol',
      status: 'BERTUGAS_LAPANGAN',
      kontak: 'Radio VHF Channel 4 (143.550 MHz)',
    },
    {
      id: 'PATROLI-01',
      name: 'Unit Patroli Reaksi Cepat 01',
      kendaraan: 'Mobil Layanan Cepat Hilux Double Cabin',
      komandan: 'Hendra Gunawan',
      personel: 2,
      wilayah: 'Pusat Kota Indramayu & Sindang',
      status: 'PATROLI_RUTIN',
      kontak: 'Radio VHF Channel 2 (142.100 MHz)',
    },
    {
      id: 'WORKSHOP-01',
      name: 'Tim Elektrikal & Workshop Indramayu',
      kendaraan: 'Workshop Bergerak Gudang PJU',
      komandan: 'Ir. Dadan Ramdani',
      personel: 4,
      wilayah: 'Gudang Logistik Suku Cadang PJU Terpusat',
      status: 'STANDBY_LOGISTIK',
      kontak: 'Ext. 104 Kantor Dishub',
    },
  ]

  return (
    <Layout>
      <div className="pengaturan-satgas-page">
        {/* Header */}
        <section className="settings-header">
          <div className="settings-title-wrap">
            <span className="settings-tag">MANAJEMEN OPERASIONAL & KREDENSIAL</span>
            <h1 className="settings-title">Pengaturan & Satgas</h1>
            <p className="settings-desc">
              Kelola profil akun dinas, keamanan akses, status armada patroli lapangan, dan prosedur operasional penerangan jalan umum Kabupaten Indramayu.
            </p>
          </div>
        </section>

        {/* Toast Notification */}
        {toast && (
          <div className={`toast-bar ${toast.type === 'error' ? 'toast-err' : 'toast-ok'}`}>
            <span>{toast.type === 'error' ? '⚠️' : '✅'} {toast.message}</span>
            <button type="button" onClick={() => setToast(null)} className="btn-close-toast">✕</button>
          </div>
        )}

        {/* Navigation Tabs */}
        <div className="settings-tabs-bar">
          <button
            type="button"
            className={`settings-tab ${activeTab === 'profil' ? 'tab-active' : ''}`}
            onClick={() => setActiveTab('profil')}
          >
            👤 Profil Petugas
          </button>
          <button
            type="button"
            className={`settings-tab ${activeTab === 'keamanan' ? 'tab-active' : ''}`}
            onClick={() => setActiveTab('keamanan')}
          >
            🔒 Keamanan Akun
          </button>
          <button
            type="button"
            className={`settings-tab ${activeTab === 'satgas' ? 'tab-active' : ''}`}
            onClick={() => setActiveTab('satgas')}
          >
            🚚 Informasi Satgas & Armada
          </button>
          <button
            type="button"
            className={`settings-tab ${activeTab === 'sesi' ? 'tab-active' : ''}`}
            onClick={() => setActiveTab('sesi')}
          >
            🚪 Sesi & Logout
          </button>
        </div>

        {/* ================= TAB 1: PROFIL PETUGAS ================= */}
        {activeTab === 'profil' && (
          <div className="settings-card">
            <div className="card-header-row">
              <div>
                <h3 className="card-title">Profil Petugas DISHUB</h3>
                <p className="card-subtitle">Informasi identitas akun petugas yang terdaftar di sistem PETENG.</p>
              </div>
              <span className="badge-role-lock">Role: {role === 'dishub' ? 'ADMIN DISHUB' : 'Belum tersedia'}</span>
            </div>

            <div className="settings-form">
              <div className="form-grid-2" aria-busy={profileLoading}>
                <div className="field-block">
                  <label className="field-lbl">Nama Lengkap Petugas</label>
                  {profileLoading ? (
                    <span className="profile-skeleton" aria-label="Memuat nama petugas" />
                  ) : (
                    <div className="profile-value">{namaPetugas || 'Belum tersedia'}</div>
                  )}
                  <span className="field-help">Nama yang akan tampil pada log penanganan dan laporan progres.</span>
                </div>

                <div className="field-block">
                  <label className="field-lbl">Alamat Email Dinas</label>
                  {profileLoading ? (
                    <span className="profile-skeleton" aria-label="Memuat email dinas" />
                  ) : (
                    <div className="profile-value">{emailPetugas || 'Belum tersedia'}</div>
                  )}
                  <span className="field-help">Email kedinasan resmi untuk autentikasi login JWT.</span>
                </div>

                <div className="field-block">
                  <label className="field-lbl">Nomor Kontak Operasional (VHF/Telepon)</label>
                  {profileLoading ? (
                    <span className="profile-skeleton" aria-label="Memuat nomor kontak" />
                  ) : (
                    <>
                      <div className="profile-value">Belum tersedia</div>
                      <span className="profile-unconfigured-badge">Data belum dikonfigurasi developer</span>
                    </>
                  )}
                </div>

                <div className="field-block">
                  <label className="field-lbl">Seksi / Bidang Tugas</label>
                  {profileLoading ? (
                    <span className="profile-skeleton" aria-label="Memuat seksi atau bidang" />
                  ) : (
                    <>
                      <div className="profile-value">Belum tersedia</div>
                      <span className="profile-unconfigured-badge">Data belum dikonfigurasi developer</span>
                    </>
                  )}
                </div>
              </div>

              <div className="security-notice-box">
                <span className="notice-icon">🛡️</span>
                <div className="notice-text">
                  <strong>Batasan Hak Akses Keamanan:</strong>
                  <p>
                    Peran administratif (<code>dishub</code>) berasal dari klaim JWT dan tidak dapat diubah melalui halaman ini.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ================= TAB 2: KEAMANAN AKUN ================= */}
        {activeTab === 'keamanan' && (
          <div className="settings-card">
            <div className="card-header-row">
              <div>
                <h3 className="card-title">Keamanan & Perubahan Kata Sandi</h3>
                <p className="card-subtitle">Perbarui kata sandi akun secara berkala sesuai standar operasional keamanan.</p>
              </div>
            </div>

            <form onSubmit={handleChangePassword} className="settings-form">
              <div className="field-block" style={{ maxWidth: 450 }}>
                <label className="field-lbl">Kata Sandi Saat Ini</label>
                <input
                  type="password"
                  placeholder="Masukkan kata sandi lama"
                  value={oldPassword}
                  onChange={(e) => setOldPassword(e.target.value)}
                  className="settings-input"
                  required
                />
              </div>

              <div className="form-grid-2" style={{ maxWidth: 700 }}>
                <div className="field-block">
                  <label className="field-lbl">Kata Sandi Baru</label>
                  <input
                    type="password"
                    placeholder="Minimal 8 karakter"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="settings-input"
                    required
                  />
                </div>

                <div className="field-block">
                  <label className="field-lbl">Konfirmasi Kata Sandi Baru</label>
                  <input
                    type="password"
                    placeholder="Ulangi kata sandi baru"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="settings-input"
                    required
                  />
                </div>
              </div>

              <div className="backend-endpoint-note">
                <span className="endpoint-icon">ℹ️</span>
                <div className="endpoint-text">
                  <strong>Informasi Integrasi Backend:</strong>
                  <p>
                    Backend menyediakan endpoint login (<code>/api/dinas/login</code>), tetapi endpoint mandiri untuk pembaruan kata sandi (<code>PATCH /api/dinas/password</code>) belum tersedia. Form ini hanya memvalidasi input di sisi klien dan tidak mengubah kata sandi akun.
                  </p>
                </div>
              </div>

              <div className="form-actions-right">
                <button
                  type="submit"
                  disabled={passwordSaving}
                  className="btn-primary-cyan"
                >
                  {passwordSaving ? 'Memverifikasi...' : 'Perbarui Kata Sandi'}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* ================= TAB 3: INFORMASI SATGAS & ARMADA ================= */}
        {activeTab === 'satgas' && (
          <div className="settings-card">
            <div className="card-header-row">
              <div>
                <h3 className="card-title">Informasi Satgas & Armada PJU Indramayu</h3>
                <p className="card-subtitle">Status penugasan regu derek, armada crane hidrolik, dan sektor patroli aktif 24 jam.</p>
              </div>
              <span className="badge-siaga-total">● 14 Personel Siaga</span>
            </div>

            <div className="fleet-grid">
              {satgasFleet.map((fleet) => (
                <div key={fleet.id} className="fleet-card">
                  <div className="fleet-card-header">
                    <div>
                      <h4 className="fleet-name">{fleet.name}</h4>
                      <span className="fleet-vehicle">{fleet.kendaraan}</span>
                    </div>
                    <span
                      className={`fleet-status-badge ${
                        fleet.status === 'SIAGA_OPERASIONAL'
                          ? 'status-siaga'
                          : fleet.status === 'BERTUGAS_LAPANGAN'
                          ? 'status-tugas'
                          : 'status-patroli'
                      }`}
                    >
                      {fleet.status === 'SIAGA_OPERASIONAL'
                        ? '● Siaga Operasional'
                        : fleet.status === 'BERTUGAS_LAPANGAN'
                        ? '● Bertugas di Lapangan'
                        : '● Patroli Rutin'}
                    </span>
                  </div>

                  <div className="fleet-card-body">
                    <div className="fleet-info-line">
                      <span className="line-lbl">Komandan Regu:</span>
                      <span className="line-val">{fleet.komandan}</span>
                    </div>
                    <div className="fleet-info-line">
                      <span className="line-lbl">Jumlah Personel:</span>
                      <span className="line-val">{fleet.personel} Orang</span>
                    </div>
                    <div className="fleet-info-line">
                      <span className="line-lbl">Wilayah Penugasan:</span>
                      <span className="line-val text-cyan">{fleet.wilayah}</span>
                    </div>
                    <div className="fleet-info-line">
                      <span className="line-lbl">Frekuensi Komunikasi:</span>
                      <span className="line-val text-muted">{fleet.kontak}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* SOP Dispatcher Box */}
            <div className="sop-dispatcher-box">
              <h4 className="sop-box-title">SOP Penugasan & Respon Waktu Cepat (SLA) DISHUB</h4>
              <ul className="sop-list">
                <li>Jalur Logistik Utama Nasional (Pantura Lohbener - Losarang): Respon regu derek maksimal <strong>60 Menit</strong> setelah validasi AI.</li>
                <li>Jalur Kolektor Kabupaten (Jatibarang, Sindang, Balongan): Respon perbaikan maksimal <strong>120 Menit</strong>.</li>
                <li>Laporan kondisi tiang miring/kabel terurai wajib didahulukan pengamanan isolasi tegangan listrik bekerjasama dengan PLN Indramayu.</li>
              </ul>
            </div>
          </div>
        )}

        {/* ================= TAB 4: SESI & LOGOUT ================= */}
        {activeTab === 'sesi' && (
          <div className="settings-card">
            <div className="card-header-row">
              <div>
                <h3 className="card-title">Manajemen Sesi & Keluar Akun</h3>
                <p className="card-subtitle">Kelola masa aktif sesi login petugas dan akhiri sesi secara aman.</p>
              </div>
            </div>

            <div className="session-info-card">
              <div className="session-icon">🛡️</div>
              <div className="session-content">
                <h4 className="session-title">Sesi Aktif Saat Ini</h4>
                <p className="session-desc">
                  Autentikasi diamankan menggunakan JWT dengan masa aktif 24 jam. Menekan tombol keluar akan menghapus token dari peramban secara permanen dan mencegah navigasi kembali melalui riwayat penjelajah.
                </p>
                <div className="session-meta">
                  <span>Petugas: <strong>{namaPetugas}</strong></span>
                  <span>•</span>
                  <span>Email: <strong>{emailPetugas}</strong></span>
                  <span>•</span>
                  <span>Role: <strong>{role === 'dishub' ? 'ADMIN DISHUB' : 'Belum tersedia'}</strong></span>
                </div>
              </div>
            </div>

            <div className="logout-action-box">
              <div>
                <h4 className="logout-prompt-title">Akhiri Sesi Kedinasan Sekarang?</h4>
                <p className="logout-prompt-sub">Pastikan seluruh data laporan atau publikasi draft telah tersimpan sebelum keluar.</p>
              </div>

              <button
                type="button"
                onClick={handleLogout}
                className="btn-danger-logout"
              >
                <span>🚪</span>
                <span>Keluar dari Aplikasi PETENG</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </Layout>
  )
}

export default PengaturanSatgas
