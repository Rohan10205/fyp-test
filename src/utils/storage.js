// ── Chrome Storage Helpers ────────────────────────────────────────────────────
export function chromeGet(keys) {
  return new Promise((resolve) => window.chrome.storage.local.get(keys, resolve))
}

export function chromeSet(data) {
  return new Promise((resolve) => window.chrome.storage.local.set(data, resolve))
}
