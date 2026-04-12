import { API_BASE_URL } from '../config'

// ── Token helpers ─────────────────────────────────────────────────────────────
function getToken() {
  return new Promise((resolve) =>
    window.chrome.storage.local.get(['authToken'], (r) => resolve(r.authToken || null))
  )
}

// ── Core fetch wrapper ────────────────────────────────────────────────────────
async function apiFetch(path, options = {}) {
  const token   = await getToken()
  const headers = { 'Content-Type': 'application/json', ...(options.headers || {}) }
  if (token) headers['Authorization'] = `Bearer ${token}`

  const res = await fetch(`${API_BASE_URL}${path}`, { ...options, headers })

  // 204 No Content — no body to parse
  if (res.status === 204) return null

  const data = await res.json()
  if (!res.ok) throw new Error(data.error || `Request failed with status ${res.status}`)
  return data
}

// ── Auth ──────────────────────────────────────────────────────────────────────
export function apiRegister(email, password) {
  return apiFetch('/auth/register', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  })
}

export function apiLogin(email, password) {
  return apiFetch('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  })
}

// ── Credentials ───────────────────────────────────────────────────────────────
export function apiGetCredentials() {
  return apiFetch('/credentials')
}

export function apiCreateCredential(credential) {
  return apiFetch('/credentials', {
    method: 'POST',
    body: JSON.stringify(credential),
  })
}

export function apiUpdateCredential(id, credential) {
  return apiFetch(`/credentials/${id}`, {
    method: 'PUT',
    body: JSON.stringify(credential),
  })
}

export function apiDeleteCredential(id) {
  return apiFetch(`/credentials/${id}`, { method: 'DELETE' })
}
