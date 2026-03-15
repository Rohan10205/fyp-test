import { useState, useEffect } from "react"
import { apiGetCredentials, apiDeleteCredential } from "../utils/api"
import { decryptPassword } from "../utils/crypto"
import { useToast } from "../context/ToastContext"
import PasswordCard from "./PasswordCard"

export default function PasswordsTab({ masterPassword }) {
  const showToast  = useToast()
  const [items, setItems]     = useState([])
  const [search, setSearch]   = useState("")
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadAll()
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

  const filtered = search
    ? items.filter(
        (p) =>
          p.site.toLowerCase().includes(search.toLowerCase()) ||
          p.username.toLowerCase().includes(search.toLowerCase())
      )
    : items

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
          onChange={(e) => setSearch(e.target.value)}
        />
        {search && (
          <button className="search__clear" onClick={() => setSearch("")}>✕</button>
        )}
      </div>

      {/* Count badge */}
      {!loading && items.length > 0 && (
        <div className="list-meta">
          {filtered.length} of {items.length} saved
        </div>
      )}

      {/* List */}
      <div className="card-list">
        {loading ? (
          <div className="state-msg">Loading…</div>
        ) : filtered.length === 0 ? (
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
          filtered.map((item) => (
            <PasswordCard key={item.id} item={item} onDelete={handleDelete} />
          ))
        )}
      </div>
    </div>
  )
}
