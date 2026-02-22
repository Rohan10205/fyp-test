// ── Salt generation ───────────────────────────────────────────────────────────
// Generates a cryptographically random 16-byte salt encoded as base64.
// Call once when creating a new vault and persist it in chrome.storage.local.
export function generateSalt() {
  return btoa(String.fromCharCode(...Array.from(crypto.getRandomValues(new Uint8Array(16)))))
}

// ── Master-password verification hash ────────────────────────────────────────
// Uses PBKDF2 (slow KDF) instead of raw SHA-256 so that brute-force attacks
// against the stored hash are computationally expensive.
export async function deriveVerificationHash(password, salt) {
  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(password),
    { name: "PBKDF2" },
    false,
    ["deriveBits"]
  )
  const bits = await crypto.subtle.deriveBits(
    {
      name: "PBKDF2",
      salt: new TextEncoder().encode(salt),
      iterations: 100000,
      hash: "SHA-256",
    },
    keyMaterial,
    256
  )
  return btoa(String.fromCharCode(...new Uint8Array(bits)))
}

// ── Key derivation ────────────────────────────────────────────────────────────
// `salt` must be the per-vault random salt returned by generateSalt().
async function getEncryptionKey(masterPassword, salt) {
  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(masterPassword),
    { name: "PBKDF2" },
    false,
    ["deriveBits", "deriveKey"]
  )
  return crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      salt: new TextEncoder().encode(salt),
      iterations: 100000,
      hash: "SHA-256",
    },
    keyMaterial,
    { name: "AES-GCM", length: 256 },
    true,
    ["encrypt", "decrypt"]
  )
}

// ── Encrypt ───────────────────────────────────────────────────────────────────
export async function encryptPassword(password, masterPassword, salt) {
  const key = await getEncryptionKey(masterPassword, salt)
  const iv = crypto.getRandomValues(new Uint8Array(12))
  const encrypted = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv },
    key,
    new TextEncoder().encode(password)
  )
  const combined = new Uint8Array(iv.length + encrypted.byteLength)
  combined.set(iv)
  combined.set(new Uint8Array(encrypted), iv.length)
  return btoa(String.fromCharCode(...combined))
}

// ── Decrypt ───────────────────────────────────────────────────────────────────
export async function decryptPassword(encryptedPassword, masterPassword, salt) {
  const key = await getEncryptionKey(masterPassword, salt)
  const combined = Uint8Array.from(atob(encryptedPassword), (c) => c.charCodeAt(0))
  const decrypted = await crypto.subtle.decrypt(
    { name: "AES-GCM", iv: combined.slice(0, 12) },
    key,
    combined.slice(12)
  )
  return new TextDecoder().decode(decrypted)
}

// ── Password strength ─────────────────────────────────────────────────────────
export function getPasswordStrength(password) {
  let score = 0
  if (password.length >= 8) score++
  if (password.length >= 12) score++
  if (/[A-Z]/.test(password) && /[a-z]/.test(password)) score++
  if (/[0-9]/.test(password)) score++
  if (/[^A-Za-z0-9]/.test(password)) score++
  return Math.min(score, 4)
}

export const STRENGTH_META = [
  { label: "Very Weak", color: "#ef4444", bg: "#fee2e2" },
  { label: "Weak",      color: "#f97316", bg: "#ffedd5" },
  { label: "Fair",      color: "#eab308", bg: "#fef9c3" },
  { label: "Strong",    color: "#84cc16", bg: "#f0fdf4" },
  { label: "Very Strong", color: "#22c55e", bg: "#dcfce7" },
]

// ── Password generator ────────────────────────────────────────────────────────
export function generatePassword({ length, upper, lower, numbers, symbols }) {
  let chars = ""
  if (upper)   chars += "ABCDEFGHIJKLMNOPQRSTUVWXYZ"
  if (lower)   chars += "abcdefghijklmnopqrstuvwxyz"
  if (numbers) chars += "0123456789"
  if (symbols) chars += "!@#$%^&*()_+-=[]{}|;:,.<>?"
  if (!chars) return null
  const arr = new Uint32Array(length)
  crypto.getRandomValues(arr)
  return Array.from(arr, (v) => chars[v % chars.length]).join("")
}
