import { useState, useEffect } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import logoPeteng from '../assets/logo-peteng.png'
import { getAuth, clearAuth } from '../utils/authStorage'
import '../css/Layout.css'

function Layout({ children, onSearch, searchPlaceholder = 'Cari ruas jalan / ID tiket...' }) {
  const location = useLocation()
  const navigate = useNavigate()
  const auth = getAuth()
  const user = auth?.user || {}

  // Live WIB/GMT+7 clock
  const [timeStr, setTimeStr] = useState('')
  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => {
    const updateTime = () => {
      const now = new Date()
      // Waktu Indonesia Barat (WIB = UTC+7)
      const options = {
        timeZone: 'Asia/Jakarta',
        hour12: false,
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      }
      setTimeStr(new Intl.DateTimeFormat('id-ID', options).format(now))
    }
    updateTime()
    const timer = setInterval(updateTime, 1000)
    return () => clearInterval(timer)
  }, [])

  const handleLogout = () => {
    clearAuth()
    navigate('/login', { replace: true })
  }

  const handleSearchSubmit = (e) => {
    e.preventDefault()
    if (onSearch) {
      onSearch(searchQuery)
    }
  }

  // Hasil pencarian ikut berubah saat mengetik, tanpa perlu menekan Enter
  const handleSearchChange = (e) => {
    const value = e.target.value
    setSearchQuery(value)
    if (onSearch) {
      onSearch(value)
    }
  }

  const currentPath = location.pathname

  const displayName = user.nama_dinas_perhubungan || user.email?.split('@')[0] || 'Petugas DISHUB'
  const displayRole = 'ADMIN DISHUB INDRAMAYU'

  const menuItems = [
    {
      to: '/dashboard',
      paths: ['/dashboard', '/monitoring-peta'],
      label: 'Monitoring Peta',
      icon: (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10" />
          <path d="m16 12-4-4-4 4" />
          <path d="M12 16V8" />
          <circle cx="12" cy="12" r="3" />
        </svg>
      ),
    },
    {
      to: '/laporan-warga',
      paths: ['/laporan-warga'],
      label: 'Laporan Warga',
      icon: (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
          <polyline points="14 2 14 8 20 8" />
          <line x1="16" y1="13" x2="8" y2="13" />
          <line x1="16" y1="17" x2="8" y2="17" />
          <polyline points="10 9 9 9 8 9" />
        </svg>
      ),
    },
    {
      to: '/publikasi-progres',
      paths: ['/publikasi-progres'],
      label: 'Publikasi Progres',
      icon: (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="m3 11 18-5v12L3 13v-2z" />
          <path d="M11.6 16.8a3 3 0 1 1-5.8-1.6" />
        </svg>
      ),
    },
    {
      to: '/pengaturan',
      paths: ['/pengaturan-satgas', '/pengaturan'],
      label: 'Pengaturan',
      icon: (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" />
          <circle cx="12" cy="12" r="3" />
        </svg>
      ),
    },
  ]

  return (
    <div className="peteng-app">
      {/* ===================== TOP HEADER ===================== */}
      <header className="peteng-topbar">
        {/* Left: Brand Identity */}
        <div className="topbar-brand">
          <Link to="/dashboard" className="brand-link">
            <img src={logoPeteng} alt="Logo PETENG" className="brand-logo-img" />
            <div className="brand-text">
              <span className="brand-title">PETENG</span>
              <span className="brand-sub">DISHUB INDRAMAYU</span>
            </div>
          </Link>
        </div>

        {/* Center: Live WIB Clock & Quick Search */}
        <div className="topbar-center">
          <div className="clock-widget" title="Waktu Indonesia Barat (GMT+7)">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#00e5ff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <polyline points="12 6 12 12 16 14" />
            </svg>
            <div className="clock-details">
              <span className="clock-label">WIB / GMT+7:</span>
              <span className="clock-time">{timeStr || '--:--:--'}</span>
            </div>
          </div>

          {/* Kolom cari hanya tampil di halaman yang menyediakan onSearch */}
          {onSearch && (
          <form onSubmit={handleSearchSubmit} className="topbar-search-form">
            <svg className="search-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <input
              type="text"
              className="topbar-search-input"
              placeholder={searchPlaceholder}
              value={searchQuery}
              onChange={handleSearchChange}
            />
          </form>
          )}
        </div>

        {/* Right: Officer Profile Badge */}
        <div className="topbar-user">
          <div className="officer-profile" onClick={() => navigate('/pengaturan')}>
            <div className="officer-meta">
              <span className="officer-name">{displayName}</span>
              <span className="officer-role">{displayRole}</span>
            </div>
            <div className="officer-avatar" title="Lihat Pengaturan & Profil">
              {displayName.charAt(0).toUpperCase()}
            </div>
          </div>

          <button
            type="button"
            className="btn-topbar-logout"
            onClick={handleLogout}
            title="Keluar / Logout dari Aplikasi PETENG"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
              <polyline points="16 17 21 12 16 7" />
              <line x1="21" y1="12" x2="9" y2="12" />
            </svg>
            <span>Keluar</span>
          </button>
        </div>
      </header>

      {/* ===================== BODY: SIDEBAR + CONTENT ===================== */}
      <div className="peteng-main-body">
        {/* Left Sidebar */}
        <aside className="peteng-sidebar">
          <nav className="sidebar-nav">
            {menuItems.map((item) => {
              const isActive = item.paths.includes(currentPath)
              return (
                <Link
                  key={item.to}
                  to={item.to}
                  className={`nav-card ${isActive ? 'nav-card-active' : ''}`}
                >
                  <div className="nav-card-icon">{item.icon}</div>
                  <div className="nav-card-text">
                    <span className="nav-card-title">{item.label}</span>
                  </div>
                </Link>
              )
            })}
          </nav>

        </aside>

        {/* Dynamic Page Content */}
        <main className="peteng-page-viewport">
          {children}
        </main>
      </div>
    </div>
  )
}

export default Layout