import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import Login from './pages/Login'
import LaporanWarga from './pages/LaporanWarga'
import Artikel from './pages/Artikel'
import Dashboard from './pages/Dashboard'
import Pengaturan from './pages/Pengaturan'
import ProtectedRoute from './components/ProtectedRoute'
import { DemoDataProvider } from './context/DemoDataProvider'

function App() {
  return (
    <DemoDataProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Login />} />
          <Route path="/login" element={<Login />} />

          <Route
            path="/dashboard"
            element={<ProtectedRoute><Dashboard /></ProtectedRoute>}
          />
          <Route
            path="/monitoring-peta"
            element={<ProtectedRoute><Dashboard /></ProtectedRoute>}
          />
          <Route
            path="/laporan-warga"
            element={<ProtectedRoute><LaporanWarga /></ProtectedRoute>}
          />
          <Route
            path="/artikel"
            element={<ProtectedRoute><Artikel /></ProtectedRoute>}
          />
          <Route
            path="/pengaturan-satgas"
            element={<ProtectedRoute><Pengaturan /></ProtectedRoute>}
          />
          <Route
            path="/pengaturan"
            element={<ProtectedRoute><Pengaturan /></ProtectedRoute>}
          />

          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </BrowserRouter>
    </DemoDataProvider>
  )
}

export default App