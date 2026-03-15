import { useState, useRef } from "react"
import { useToast } from "../context/ToastContext"

const CLEAR_DELAY = 30_000

export default function PasswordCard({ item, onDelete }) {
  const showToast  = useToast()
  const clearTimer = useRef(null)
  const [showPass, setShowPass] = useState(false)

  function copyText(text, label) {
    navigator.clipboard.writeText(text).then(() => {
      showToast(`${label} copied!`, "success")
      clearTimeout(clearTimer.current)
      clearTimer.current = setTimeout(
        () => navigator.clipboard.writeText("").catch(() => {}),
        CLEAR_DELAY
      )
    }).catch(() => showToast("Failed to copy", "error"))
  }

  const faviconSrc = `https://www.google.com/s2/favicons?domain=${item.site}&sz=32`

  return (
    <div className="card">
      {/* Card header */}
      <div className="card__header">
        <img
          className="card__favicon"
          src={faviconSrc}
          alt=""
          onError={(e) => { e.currentTarget.style.display = "none" }}
        />
        <span className="card__site">{item.site}</span>
        <button
          className="btn btn--danger-ghost btn--icon"
          title="Delete"
          onClick={() => onDelete(item.id)}
        >
          Del
        </button>
      </div>

      {/* Username */}
      <div className="card__row">
        <span className="card__badge card__badge--user">User</span>
        <span className="card__value" title={item.username}>{item.username}</span>
        <button className="btn btn--copy" onClick={() => copyText(item.username, "Username")}>
          Copy
        </button>
      </div>

      {/* Password */}
      <div className="card__row">
        <span className="card__badge card__badge--pass">Pass</span>
        <span className={`card__value${showPass ? "" : " card__value--masked"}`}>
          {showPass ? (item.plain ?? "Decryption failed") : "••••••••"}
        </span>
        <button
          className="btn btn--reveal"
          onClick={() => setShowPass((v) => !v)}
        >
          {showPass ? "Hide" : "Show"}
        </button>
        {item.plain && (
          <button className="btn btn--copy" onClick={() => copyText(item.plain, "Password")}>
            Copy
          </button>
        )}
      </div>

      {/* Date */}
      {item.created_at && (() => {
        const d = new Date(item.created_at)
        return isNaN(d.getTime()) ? null : (
          <span className="card__date">Added {d.toLocaleDateString()}</span>
        )
      })()}
    </div>
  )
}
