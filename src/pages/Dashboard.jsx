import { Link } from 'react-router-dom'
import logoPeteng from '../assets/logo-peteng.png'
import '../css/Dashboard.css'

function Dashboard() {
  return (
    <div className="dashboard-page">

      {/* Header */}
      <header className="dashboard-header">
        <img
          src={logoPeteng}
          alt="Logo PETENG Indramayu"
          className="dashboard-logo"
        />

        <nav className="top-menu">
          <Link to="/titik-gelap" className="menu-card dark-point">
            Titik Gelap
          </Link>

          <Link to="/laporan-warga" className="menu-card report">
            Laporan
          </Link>

          <Link to="/artikel" className="menu-card article">
            Artikel
          </Link>
        </nav>
      </header>

      {/* Isi Dashboard */}
      <main className="dashboard-content">

        {/* Sidebar */}
        <aside className="sidebar">

          <Link to="/monitoring-peta" className="sidebar-item map-item">
            <span className="sidebar-icon">🗺️</span>
            <span>Monitoring Peta</span>
          </Link>

          <Link to="/laporan-warga" className="sidebar-item report-item">
            <span className="sidebar-icon">⚠️</span>
            <span>Laporan Warga</span>
          </Link>

          <Link to="/artikel" className="sidebar-item article-item">
            <span className="sidebar-icon">📖</span>
            <span>Artikel</span>
          </Link>

        </aside>

        {/* Area Peta */}
        <section className="map-container">

          <div className="map-placeholder">
            <h2>Peta Indramayu</h2>
            <p>
              Area peta akan dihubungkan dengan API backend PETENG.
            </p>
          </div>

        </section>

      </main>

    </div>
  )
}

export default Dashboard