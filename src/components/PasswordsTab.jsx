import { useState, useEffect } from "react"
import { chromeGet, chromeSet } from "../utils/storage"
import { decryptPassword } from "../utils/crypto"
import { useToast } from "../context/ToastContext"
import PasswordCard from "./PasswordCard"

export default function PasswordsTab({ masterPassword, vaultSalt }) {
  const showToast    = useToast()
  const [items, setItems]       = useState([])
  const [search, setSearch]     = useState("")
  const [loading, setLoading]   = useState(true)

  useEffect(() => {
    loadAll()
  }, [])

  async function loadAll() {
    setLoading(true)
    const result   = await chromeGet(["passwords"])
    const raw      = result.passwords || []
    const decrypted = await Promise.all(
      raw.map(async (p) => {
        try {
          return { ...p, plain: await decryptPassword(p.password, masterPassword, vaultSalt) }
        } catch {
          return { ...p, plain: null }
        }
      })
    )
    setItems(decrypted)
    setLoading(false)
  }

  async function handleDelete(id) {
    if (!confirm("Delete this password? This cannot be undone.")) return
    const result = await chromeGet(["passwords"])
    const updated = (result.passwords || []).filter((p) => p.id !== id)
    await chromeSet({ passwords: updated })
    setItems((prev) => prev.filter((p) => p.id !== id))
    showToast("Password deleted", "success")
  }

  const filtered = search
    ? items.filter(
        (p) =>
          p.website.toLowerCase().includes(search.toLowerCase()) ||
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
