import { useState, useEffect } from "react"
import { apiGetCredentials, apiDeleteCredential } from "../utils/api"
import { decryptPassword } from "../utils/crypto"
import { useToast } from "../context/ToastContext"
import PasswordCard from "./PasswordCard"

function extractHostname(url) {
  try {
    return new URL(url).hostname.replace(/^www\./, "")
  } catch {
    return null
  }
}

function siteMatches(credSite, pageHost) {
  if (!pageHost || !credSite) return false
  const s = credSite.toLowerCase().replace(/^www\./, "").replace(/^https?:\/\//, "")
  const h = pageHost.toLowerCase()
  return h === s || h.endsWith("." + s) || s.endsWith("." + h)
}

export default function PasswordsTab({ masterPassword }) {
  const showToast  = useToast()
  const [items, setItems]           = useState([])
  const [search, setSearch]         = useState("")
  const [loading, setLoading]       = useState(true)
  const [currentHost, setCurrentHost] = useState(null)
  const [showAllSites, setShowAllSites] = useState(false)

  useEffect(() => {
    loadAll()
    // Detect the current tab's hostname for page-aware matching
    if (window.chrome?.tabs?.query) {
      window.chrome.tabs.query({ active: true, currentWindow: true }, ([tab]) => {
        if (tab?.url) setCurrentHost(extractHostname(tab.url))
      })
    }
  }, [])

  async function loadAll() {
    setLoading(true)
    try {
      const raw       = await apiGetCredentials()
      const decrypted = await Promise.all(
        raw.map(async (p) => {
          try {
            return { ...p, plain: await decryptPassword(p.encrypted_password, masterPassword) }
          } catch {
            return { ...p, plain: null }
          }
        })
      )
      setItems(decrypted)
    } catch {
      showToast("Failed to load passwords", "error")
    }
    setLoading(false)
  }

  async function handleDelete(id) {
    if (!confirm("Delete this password? This cannot be undone.")) return
    try {
      await apiDeleteCredential(id)
      setItems((prev) => prev.filter((p) => p.id !== id))
      showToast("Password deleted", "success")
    } catch {
      showToast("Failed to delete password", "error")
    }
  }

  const searchFiltered = search
    ? items.filter(
        (p) =>
          p.site.toLowerCase().includes(search.toLowerCase()) ||
          p.username.toLowerCase().includes(search.toLowerCase())
      )
    : items

  const siteMatched = currentHost
    ? searchFiltered.filter((p) => siteMatches(p.site, currentHost))
    : []

  const showingSiteMatches = !search && !showAllSites && siteMatched.length > 0
  const displayItems = showingSiteMatches ? siteMatched : searchFiltered

  return (
    <div className="passwords-tab">
      {/* Search */}
      <div className="search">
        <span className="search__icon"></span>
        <input
          className="search__input"
          type="text"
          placeholder="Search by website or username…"
          value={search}
          onChange={(e) => { setSearch(e.target.value); setShowAllSites(false) }}
        />
        {search && (
          <button className="search__clear" onClick={() => setSearch("")}>✕</button>
        )}
      </div>

      {/* Page-match banner */}
      {!search && siteMatched.length > 0 && (
        <div className="site-match-banner">
          <span className="site-match-banner__text">
            {showAllSites
              ? `Showing all ${items.length} saved`
              : `${siteMatched.length} match${siteMatched.length === 1 ? "" : "es"} for ${currentHost}`}
          </span>
          <button
            className="btn btn--ghost site-match-banner__toggle"
            onClick={() => setShowAllSites((v) => !v)}
          >
            {showAllSites ? "Show matches" : "Show all"}
          </button>
        </div>
      )}

      {/* Count badge (when not showing site-match banner) */}
      {!loading && items.length > 0 && (search || (!siteMatched.length)) && (
        <div className="list-meta">
          {displayItems.length} of {items.length} saved
        </div>
      )}

      {/* List */}
      <div className="card-list">
        {loading ? (
          <div className="state-msg">Loading…</div>
        ) : displayItems.length === 0 ? (
          <div className="state-msg">
            {search ? "No results found" : (
              <>
                <span className="state-msg__icon"></span>
                <p>No passwords yet</p>
                <p className="state-msg__hint">Switch to the Add tab to save one.</p>
              </>
            )}
          </div>
        ) : (
          displayItems.map((item) => (
            <PasswordCard key={item.id} item={item} onDelete={handleDelete} />
          ))
        )}
      </div>
    </div>
  )
}
