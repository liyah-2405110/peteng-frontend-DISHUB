import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Layout from '../components/Layout'
import { getDinasProfile } from '../services/authService'
import { clearAuth, getAuth } from '../utils/authStorage'
import '../css/Pengaturan.css'

function Pengaturan() {
  const navigate = useNavigate()
  const user = getAuth()?.user || {}
  const [profile, setProfile] = useState(null)
  const [profileLoading, setProfileLoading] = useState(true)
  const [profileError, setProfileError] = useState('')

  useEffect(() => {
    let active = true
    getDinasProfile()
      .then((result) => {
        if (active) setProfile(result)
      })
      .catch((error) => {
        console.error('Gagal memuat profil akun:', error)
        if (active) setProfileError(error.message || 'Profil gagal dimuat dari backend.')
      })
      .finally(() => {
        if (active) setProfileLoading(false)
      })
    return () => { active = false }
  }, [])

  const handleLogout = () => {
    clearAuth()
    navigate('/login', { replace: true })
  }

  return (
    <Layout>
      <div className="pengaturan-page">
        <section className="settings-header">
          <div className="settings-title-wrap">
            <span className="settings-tag">PROFIL AKUN</span>
            <h1 className="settings-title">Pengaturan</h1>
            <p className="settings-desc">Informasi akun operasional dibaca dari backend.</p>
          </div>
        </section>

        <section className="settings-card">
          <div className="card-header-row">
            <div>
              <h2 className="card-title">Profil akun DISHUB</h2>
              <p className="card-subtitle">Informasi akun dari sesi login dan backend.</p>
            </div>
            <span className="badge-role-lock">Role: {profile?.role === 'dishub' ? 'ADMIN DISHUB' : 'Belum tersedia'}</span>
          </div>
          <div className="settings-form" aria-busy={profileLoading}>
            {profileError && <div className="backend-endpoint-note" role="alert">{profileError}</div>}
            <div className="form-grid-2">
              <div className="field-block">
                <span className="field-lbl">Nama petugas</span>
                <div className="profile-value">{profileLoading ? 'Memuat...' : profile?.nama_dinas_perhubungan || user.nama_dinas_perhubungan || 'Belum tersedia'}</div>
              </div>
              <div className="field-block">
                <span className="field-lbl">Email dinas</span>
                <div className="profile-value">{profileLoading ? 'Memuat...' : profile?.email || user.email || 'Belum tersedia'}</div>
              </div>
              <div className="field-block">
                <span className="field-lbl">Nomor telepon</span>
                <div className="profile-value">Belum tersedia dari backend</div>
              </div>
            </div>
            <div className="security-notice-box">
              <span className="notice-icon" aria-hidden="true">ℹ</span>
              <div className="notice-text">
                <strong>Profil backend hanya baca</strong>
                <p>API backend belum menyediakan perubahan profil. Tidak ada perubahan lokal yang dilaporkan sebagai data tersimpan di server.</p>
              </div>
            </div>
          </div>
        </section>

        <section className="settings-card logout-settings-card">
          <div>
            <h2 className="card-title">Sesi &amp; Logout</h2>
            <p className="card-subtitle">Akhiri sesi akun PETENG pada perangkat ini.</p>
          </div>
          <div className="logout-action-box">
            <div>
              <h3 className="logout-prompt-title">Keluar dari PETENG?</h3>
              <p className="logout-prompt-sub">Anda perlu login kembali untuk membuka halaman internal.</p>
            </div>
            <button type="button" onClick={handleLogout} className="btn-danger-logout">Keluar dari Aplikasi</button>
          </div>
        </section>
      </div>
    </Layout>
  )
}

export default Pengaturan
