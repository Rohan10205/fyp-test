import { useState, useRef, useEffect, useCallback } from "react"
import { useToast } from "../context/ToastContext"

const CLEAR_DELAY = 30_000
const USERNAME_CANDIDATE_LOOKBACK = 5

// Runs inside the target page context (no closure variables allowed)
function fillLoginForm(username, password) {
  function isVisible(el) {
    if (!el) return false
    const r = el.getBoundingClientRect()
    if (r.width === 0 || r.height === 0) return false
    const s = window.getComputedStyle(el)
    return s.display !== "none" && s.visibility !== "hidden" && Number.parseFloat(s.opacity) > 0
  }

  const pwFields = Array.from(document.querySelectorAll('input[type="password"]')).filter(isVisible)
  if (!pwFields.length) return { success: false, error: "No visible password field found on this page" }

  const pwField = pwFields[0]
  const ownerForm = pwField.form
  const inputs = Array.from(
    (ownerForm || document).querySelectorAll(
      'input:not([type="hidden"]):not([type="submit"]):not([type="button"]):not([type="checkbox"]):not([type="radio"]):not([type="password"])'
    )
  ).filter(isVisible)

  let userField = null
  // Prefer inputs that are part of the same form or within 3 DOM siblings above
  const candidates = ownerForm
    ? inputs
    : inputs.slice(Math.max(0, inputs.length - USERNAME_CANDIDATE_LOOKBACK))
  for (let i = candidates.length - 1; i >= 0; i--) {
    const inp = candidates[i]
    const t = (inp.type || "").toLowerCase()
    const name = (inp.name || inp.id || inp.autocomplete || "").toLowerCase()
    if (
      t === "email" ||
      name.includes("user") || name.includes("email") || name.includes("login") ||
      (t === "text" && !name.includes("search") && !name.includes("query"))
    ) {
      userField = inp
      break
    }
  }

  function fill(el, val) {
    const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, "value").set
    setter.call(el, val)
    el.dispatchEvent(new Event("input", { bubbles: true }))
    el.dispatchEvent(new Event("change", { bubbles: true }))
  }

  if (userField) fill(userField, username)
  fill(pwField, password)
  return { success: true, filledUsername: !!userField }
}

export default function PasswordCard({ item, onDelete, autoFill = false }) {
  const showToast  = useToast()
  const clearTimer = useRef(null)
  const autoFilledRef = useRef(false)
  const [showPass, setShowPass] = useState(false)
  const [filling,  setFilling]  = useState(false)

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

  const handleAutofill = useCallback(async ({ automatic = false } = {}) => {
    if (!item.plain) return
    setFilling(true)
    try {
      const tabs = await new Promise((resolve) =>
        window.chrome.tabs.query({ active: true, currentWindow: true }, resolve)
      )
      const tab = tabs?.[0]
      if (!tab?.id) {
        if (!automatic) showToast("No active tab found", "error")
        return
      }

      const results = await window.chrome.scripting.executeScript({
        target: { tabId: tab.id },
        func: fillLoginForm,
        args: [item.username, item.plain],
      })

      const result = results?.[0]?.result
      if (result?.success) {
        if (automatic) {
          showToast(result.filledUsername ? "Auto-filled login form" : "Auto-filled password field", "success")
        } else {
          showToast(
            result.filledUsername ? "Username & password filled!" : "Password filled!",
            "success"
          )
        }
      } else {
        if (!automatic) showToast(result?.error || "No login form found on this page", "error")
      }
    } catch (err) {
      if (!automatic) showToast("Autofill failed: " + (err.message || "Unknown error"), "error")
    } finally {
      setFilling(false)
    }
  }, [item.plain, item.username, showToast])

  useEffect(() => {
    if (!autoFill || !item.plain || autoFilledRef.current) return
    autoFilledRef.current = true
    handleAutofill({ automatic: true })
  }, [autoFill, item.plain, handleAutofill])

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

      {/* Autofill */}
      {item.plain && (
        <div className="card__row">
          <button
            className="btn btn--primary btn--full"
            style={{ marginTop: 4 }}
            onClick={() => handleAutofill()}
            disabled={filling}
            title="Fill username and password into the current page's login form"
          >
            {filling ? "Filling…" : "⚡ Autofill"}
          </button>
        </div>
      )}

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
