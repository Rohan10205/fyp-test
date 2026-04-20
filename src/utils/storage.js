// ── Chrome Storage Helpers ────────────────────────────────────────────────────
export function chromeGet(keys) {
  return new Promise((resolve) => window.chrome.storage.local.get(keys, resolve))
}

export function chromeSet(data) {
  return new Promise((resolve) => window.chrome.storage.local.set(data, resolve))
}

// ── Session Storage Helpers (cleared when browser session ends) ───────────────
export function chromeSessionGet(keys) {
  if (window.chrome?.storage?.session) {
    return new Promise((resolve) => window.chrome.storage.session.get(keys, resolve))
  }
  return Promise.resolve({})
}

export function chromeSessionSet(data) {
  if (window.chrome?.storage?.session) {
    return new Promise((resolve) => window.chrome.storage.session.set(data, resolve))
  }
  return Promise.resolve()
}

export function chromeSessionRemove(keys) {
  if (window.chrome?.storage?.session) {
    return new Promise((resolve) => window.chrome.storage.session.remove(keys, resolve))
  }
  return Promise.resolve()
}
