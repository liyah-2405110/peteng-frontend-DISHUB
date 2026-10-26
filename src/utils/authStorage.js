const KEY = 'dinas_auth'

export function saveAuth({ token = null, user }) {
  localStorage.setItem(KEY, JSON.stringify({ token, user }))
}

export function getAuth() {
  try {
    return JSON.parse(localStorage.getItem(KEY))
  } catch {
    return null
  }
}

export function getToken() {
  return getAuth()?.token ?? null
}

export function clearAuth() {
  localStorage.removeItem(KEY)
}