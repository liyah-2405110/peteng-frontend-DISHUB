import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import logoPeteng from '../assets/logo-peteng.png'
import { loginDinas } from '../services/authService'
import { saveAuth } from '../utils/authStorage'
import '../css/Login.css'

function Login() {
  const navigate = useNavigate()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [offlineAvailable, setOfflineAvailable] = useState(false)

  useEffect(() => {
    if (!error) return undefined

    const timeoutId = window.setTimeout(() => {
      setError('')
    }, 5000)

    return () => window.clearTimeout(timeoutId)
  }, [error])

  const handleLogin = async (event) => {
    event.preventDefault()
    setError('')
    setLoading(true)
    setOfflineAvailable(false)

    try {
      const { token, user } = await loginDinas(email.trim(), password)
      saveAuth({ token, user })
      navigate('/dashboard', { replace: true })
    } catch (err) {
      setError(
        err.message.includes('Tidak dapat terhubung')
          ? 'Tidak dapat terhubung ke server. Periksa koneksi Anda.'
          : 'Login gagal. Periksa kembali email dan password Anda.',
      )
      // Jika kegagalan karena backend belum berjalan, berikan opsi masuk mode evaluasi
      if (err.message.includes('Tidak dapat terhubung')) {
        setOfflineAvailable(true)
      }
    } finally {
      setLoading(false)
    }
  }

  const handleBypassDemo = () => {
    const demoUser = {
      id_dinas_perhubungan: 1,
      nama_dinas_perhubungan: 'Agus Heryanto',
      email: email || 'petugas.dishub@indramayukab.go.id',
      role: 'dishub',
    }
    saveAuth({ token: 'demo-token-dishub-evaluasi', user: demoUser })
    navigate('/dashboard', { replace: true })
  }

  const dismissError = () => {
    setError('')
  }

  return (
    <div className="login-page">
      {error && (
        <div className="login-toast" role="alert">
          <p>{error}</p>
          <button type="button" onClick={dismissError} aria-label="Tutup notifikasi">
            ×
          </button>
        </div>
      )}
      {offlineAvailable && (
        <button
          type="button"
          onClick={handleBypassDemo}
          className="btn-offline-bypass"
        >
          Masuk Mode Demo / Evaluasi Offline
        </button>
      )}

      <div className="login-container">
        <img
          src={logoPeteng}
          alt="Logo PETENG Indramayu"
          className="login-logo"
        />

        <h1>SELAMAT DATANG</h1>

        <form onSubmit={handleLogin} className="login-form">
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
            autoComplete="email"
          />

          <div className="login-password-field">
            <input
              type={showPassword ? 'text' : 'password'}
              placeholder="Password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
              autoComplete="current-password"
            />
            <button
              type="button"
              className="password-visibility-toggle"
              onClick={() => setShowPassword((visible) => !visible)}
              aria-label={showPassword ? 'Sembunyikan password' : 'Tampilkan password'}
              aria-pressed={showPassword}
            >
              <svg
                viewBox="0 0 24 24"
                aria-hidden="true"
                focusable="false"
              >
                <path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12Z" />
                <circle cx="12" cy="12" r="3" />
                {showPassword && <path d="m4 4 16 16" />}
              </svg>
            </button>
          </div>

          <button type="submit" disabled={loading} className="btn-login-submit">
            {loading ? 'Memproses...' : 'Login'}
          </button>
        </form>
      </div>
    </div>
  )
}

export default Login