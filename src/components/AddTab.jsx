import { useState, useEffect } from "react"
import { encryptPassword, getPasswordStrength, STRENGTH_META } from "../utils/crypto"
import { chromeGet, chromeSet } from "../utils/storage"
import { useToast } from "../context/ToastContext"

export default function AddTab({ masterPassword, vaultSalt, prefillPassword, onSaved, onClearPrefill }) {
  const showToast = useToast()
  const [website,  setWebsite]  = useState("")
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [showPw,   setShowPw]   = useState(false)
  const [saving,   setSaving]   = useState(false)

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

  async function handleSubmit(e) {
    e.preventDefault()
    if (!website || !username || !password) {
      showToast("Please fill all fields", "error")
      return
    }
    setSaving(true)
    try {
      const result = await chromeGet(["passwords"])
      const list   = result.passwords || []
      const enc    = await encryptPassword(password, masterPassword, vaultSalt)
      list.push({
        id: Date.now(),
        website:   website.trim(),
        username:  username.trim(),
        password:  enc,
        createdAt: new Date().toLocaleDateString(),
      })
      await chromeSet({ passwords: list })
      showToast("Password saved!", "success")
      setWebsite(""); setUsername(""); setPassword(""); setShowPw(false)
      onSaved()
    } catch {
      showToast("Failed to save password", "error")
    }
    setSaving(false)
  }

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
              value={website}
              onChange={(e) => setWebsite(e.target.value)}
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
