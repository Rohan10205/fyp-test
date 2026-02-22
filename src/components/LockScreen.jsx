import { useState } from "react"
import { generateSalt, deriveVerificationHash } from "../utils/crypto"
import { chromeGet, chromeSet } from "../utils/storage"
import { useToast } from "../context/ToastContext"

export default function LockScreen({ hasVault, onUnlocked }) {
  const showToast = useToast()
  const [password, setPassword]   = useState("")
  const [confirm, setConfirm]     = useState("")
  const [error, setError]         = useState("")
  const [loading, setLoading]     = useState(false)
  const [showPw, setShowPw]       = useState(false)

  async function handleSetup(e) {
    e.preventDefault()
    if (!password) { showToast("Enter a master password", "error"); return }
    if (password.length < 6) { showToast("Minimum 6 characters", "error"); return }
    if (password !== confirm)  { showToast("Passwords do not match", "error"); return }
    setLoading(true)
    const salt = generateSalt()
    const hash = await deriveVerificationHash(password, salt)
    await chromeSet({ masterPasswordHash: hash, vaultSalt: salt })
    onUnlocked(password, salt)
    setLoading(false)
  }

  async function handleUnlock(e) {
    e.preventDefault()
    if (!password) return
    setLoading(true)
    const result = await chromeGet(["masterPasswordHash", "vaultSalt"])
    if (!result.vaultSalt) {
      setError("Vault format is outdated. Please clear the extension data and create a new vault.")
      setPassword("")
      setLoading(false)
      return
    }
    const hash   = await deriveVerificationHash(password, result.vaultSalt)
    if (hash === result.masterPasswordHash) {
      setError("")
      onUnlocked(password, result.vaultSalt)
    } else {
      setError("Incorrect password. Try again.")
    }
    setPassword("")
    setLoading(false)
  }

  return (
    <div className="lock-bg">
      <div className="lock-card">
        {/* Animated logo */}
        <div className="lock-logo">
          <div className="lock-logo__ring" />
          <span className="lock-logo__icon"></span>
        </div>
        <h1 className="lock-title">Vaultword</h1>
        <p className="lock-subtitle">
          {hasVault ? "Your vault is locked" : "Create your vault"}
        </p>

        <form onSubmit={hasVault ? handleUnlock : handleSetup} className="lock-form">
          <div className="field">
            <label className="field__label">Master Password</label>
            <div className="field__row">
              <input
                className="field__input"
                type={showPw ? "text" : "password"}
                placeholder={hasVault ? "Enter master password" : "Create master password"}
                value={password}
                onChange={(e) => { setPassword(e.target.value); setError("") }}
                autoFocus
              />
              <button type="button" className="field__eye" onClick={() => setShowPw((v) => !v)}>
                {showPw ? "Hide" : "Show"}
              </button>
            </div>
          </div>

          {!hasVault && (
            <div className="field">
              <label className="field__label">Confirm Password</label>
              <div className="field__row">
                <input
                  className="field__input"
                  type={showPw ? "text" : "password"}
                  placeholder="Repeat master password"
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                />
              </div>
            </div>
          )}

          {error && <p className="lock-error">{error}</p>}

          <button className="btn btn--primary btn--full" type="submit" disabled={loading}>
            {loading ? "Checking…" : hasVault ? "Unlock Vault" : "Create Vault"}
          </button>
        </form>
      </div>
    </div>
  )
}
