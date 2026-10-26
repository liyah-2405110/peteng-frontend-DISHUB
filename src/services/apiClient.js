import { getToken, clearAuth } from '../utils/authStorage'

export const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:8080'

export async function authFetch(path, options = {}) {
  const token = getToken()
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  }

  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }

  let res
  try {
    res = await fetch(`${API_URL}${path}`, {
      ...options,
      headers,
    })
  } catch (netErr) {
    throw new Error(`Tidak dapat terhubung ke server backend (${API_URL}). Pastikan backend aktif.`, { cause: netErr })
  }

  if (res.status === 401) {
    clearAuth()
    if (window.location.pathname !== '/login') {
      window.location.href = '/login'
    }
    throw new Error('Sesi berakhir atau tidak memiliki izin, silakan login kembali.')
  }

  return res
}