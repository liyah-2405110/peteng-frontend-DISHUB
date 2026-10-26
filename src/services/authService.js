import { authFetch, API_URL } from './apiClient'
import { clearAuth } from '../utils/authStorage'

export async function loginDinas(email, password) {
  let res

  try {
    res = await fetch(`${API_URL}/api/dinas/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password_email: password }),
    })
  } catch (err) {
    throw new Error('Tidak dapat terhubung ke server backend. Pastikan server Go berjalan di ' + API_URL, { cause: err })
  }

  const body = await res.json().catch(() => ({}))

  if (!res.ok) {
    throw new Error(body.message || 'Login gagal. Periksa kembali email dan password.')
  }

  // Backend Dinas mengembalikan: { message, token, user }
  return { token: body.token ?? null, user: body.user ?? null }
}

export async function getDinasProfile() {
  const res = await authFetch('/api/dinas/profile')
  if (!res.ok) {
    throw new Error('Gagal mengambil profil dinas')
  }
  return res.json()
}

export function logoutDinas() {
  clearAuth()
}
