import { Navigate } from 'react-router-dom'
import { getAuth } from '../utils/authStorage'

const BYPASS = import.meta.env.DEV && import.meta.env.VITE_BYPASS_AUTH === 'true'

function ProtectedRoute({ children }) {
  if (!BYPASS && !getAuth()) {
    return <Navigate to="/login" replace />
  }

  return children
}

export default ProtectedRoute