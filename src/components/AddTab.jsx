import { useState, useEffect, useRef } from "react"
import { encryptPassword, getPasswordStrength, STRENGTH_META } from "../utils/crypto"
import { apiCreateCredential } from "../utils/api"
import { useToast } from "../context/ToastContext"

export default function AddTab({ masterPassword, prefillPassword, onSaved, onClearPrefill }) {
  const showToast = useToast()
  const [site,     setSite]     = useState("")
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [showPw,   setShowPw]   = useState(false)
  const [saving,   setSaving]   = useState(false)
  const autoSaveTimer           = useRef(null)
  const lastAutoSavedSignature  = useRef("")

  // Accept password from generator
  useEffect(() => {
    if (prefillPassword) {
      setPassword(prefillPassword)
      setShowPw(true)
      onClearPrefill()
    }
  }, [prefillPassword])

  const strength = password ? getPasswordStrength(password) : null
  const meta     = strength !== null ? STRENGTH_META[strength] : null

  async function saveCredential(autoSave = false) {
    if (!site || !username || !password || saving) return false
    setSaving(true)
    try {
      const enc = await encryptPassword(password, masterPassword)
      await apiCreateCredential({
        site:               site.trim(),
        username:           username.trim(),
        encrypted_password: enc,
      })
      showToast(autoSave ? "Password auto-saved!" : "Password saved!", "success")
      setSite(""); setUsername(""); setPassword(""); setShowPw(false)
      onSaved()
      return true
    } catch {
      showToast(autoSave ? "Auto-save failed" : "Failed to save password", "error")
      return false
    } finally {
      setSaving(false)
    }
  }

  async function handleSubmit(e) {
    e.preventDefault()
    clearTimeout(autoSaveTimer.current)
    if (!site || !username || !password) {
      showToast("Please fill all fields", "error")
      return
    }
    lastAutoSavedSignature.current = `${site.trim()}|${username.trim()}|${password}`
    await saveCredential(false)
  }

  useEffect(() => {
    clearTimeout(autoSaveTimer.current)
    if (!site || !username || !password || saving) return

    const signature = `${site.trim()}|${username.trim()}|${password}`
    if (signature === lastAutoSavedSignature.current) return

    autoSaveTimer.current = setTimeout(async () => {
      lastAutoSavedSignature.current = signature
      const ok = await saveCredential(true)
      if (!ok) lastAutoSavedSignature.current = ""
    }, 1200)

    return () => clearTimeout(autoSaveTimer.current)
  }, [site, username, password, saving])

  return (
    <div className="add-tab">
      <div className="section-card">
        <h2 className="section-title">Add New Password</h2>
        <form onSubmit={handleSubmit}>
          <div className="field">
            <label className="field__label">Website</label>
            <input
              className="field__input"
              type="text"
              placeholder="e.g. facebook.com"
              value={site}
              onChange={(e) => setSite(e.target.value)}
            />
          </div>

          <div className="field">
            <label className="field__label">Username / Email</label>
            <input
              className="field__input"
              type="text"
              placeholder="e.g. user@example.com"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
            />
          </div>

          <div className="field">
            <label className="field__label">Password</label>
            <div className="field__row">
              <input
                className="field__input"
                type={showPw ? "text" : "password"}
                placeholder="Enter or generate a password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <button type="button" className="field__eye" onClick={() => setShowPw((v) => !v)}>
                {showPw ? "Hide" : "Show"}
              </button>
            </div>
          </div>

          {/* Strength meter */}
          {meta && (
            <div className="strength">
              <div className="strength__bar">
                <div
                  className="strength__fill"
                  style={{
                    width: `${(strength + 1) / 5 * 100}%`,
                    background: meta.color,
                  }}
                />
              </div>
              <span className="strength__label" style={{ color: meta.color }}>
                {meta.label}
              </span>
            </div>
          )}

          <button
            className="btn btn--primary btn--full"
            type="submit"
            disabled={saving}
            style={{ marginTop: "4px" }}
          >
            {saving ? "Saving…" : "Save Password"}
          </button>
        </form>
      </div>
    </div>
  )
}
