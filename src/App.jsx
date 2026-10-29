import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import Login from './pages/Login'
import LaporanWarga from './pages/LaporanWarga'
import PublikasiProgres from './pages/PublikasiProgres'
import MonitoringPeta from './pages/MonitoringPeta'
import Pengaturan from './pages/Pengaturan'
import ProtectedRoute from './components/ProtectedRoute'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/login" element={<Login />} />
        <Route path="/dashboard" element={<Navigate to="/monitoring-peta" replace />} />
        <Route path="/monitoring-peta" element={<ProtectedRoute><MonitoringPeta /></ProtectedRoute>} />
        <Route path="/laporan-warga" element={<ProtectedRoute><LaporanWarga /></ProtectedRoute>} />
        <Route path="/publikasi-progres" element={<ProtectedRoute><PublikasiProgres /></ProtectedRoute>} />
        <Route path="/pengaturan-satgas" element={<ProtectedRoute><Pengaturan /></ProtectedRoute>} />
        <Route path="/pengaturan" element={<ProtectedRoute><Pengaturan /></ProtectedRoute>} />
        <Route path="*" element={<Navigate to="/monitoring-peta" replace />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
