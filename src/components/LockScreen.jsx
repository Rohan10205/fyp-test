import { useState, useEffect } from "react"
import { hashString } from "../utils/crypto"
import { chromeGet, chromeSet } from "../utils/storage"
import { useToast } from "../context/ToastContext"
import iconUrl from "../../icon.jpg"

const MAX_ATTEMPTS = 5

function generateRecoveryCode() {
  // 32 unambiguous characters (no 0/O, 1/I/l).
  // Uint8Array values are 0-255 (256 total); 256 / 32 = 8 exactly, so no modulo bias.
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"
  const array = new Uint8Array(10)
  crypto.getRandomValues(array)
  return Array.from(array, (b) => chars[b % chars.length]).join("")
}

export default function LockScreen({ hasVault, onUnlocked }) {
  const showToast = useToast()

  // Shared
  const [loading, setLoading]           = useState(false)
  const [error, setError]               = useState("")
  const [showPw, setShowPw]             = useState(false)

  // Attempt limiting
  const [attempts, setAttempts]         = useState(0)
  const [isLockedOut, setIsLockedOut]   = useState(false)
  const [hasRecoveryCode, setHasRecoveryCode] = useState(false)

  // Screen: "setup" | "unlock" | "showRecovery" | "otpReset"
  const [screen, setScreen]             = useState(hasVault ? "unlock" : "setup")
  const [pendingPassword, setPendingPassword] = useState("")

  // Setup fields
  const [setupPw, setSetupPw]           = useState("")
  const [setupConfirm, setSetupConfirm] = useState("")

  // Unlock field
  const [unlockPw, setUnlockPw]         = useState("")

  // Recovery code display
  const [recoveryCode, setRecoveryCode] = useState("")
  const [codeCopied, setCodeCopied]     = useState(false)
  const [codeConfirmed, setCodeConfirmed] = useState(false)

  // OTP reset fields
  const [otpInput, setOtpInput]         = useState("")
  const [newPw, setNewPw]               = useState("")
  const [newConfirm, setNewConfirm]     = useState("")
  const [showNewPw, setShowNewPw]       = useState(false)

  useEffect(() => {
    if (hasVault) {
      chromeGet(["failedAttempts", "recoveryCodeHash"]).then((r) => {
        const fa = r.failedAttempts || 0
        setAttempts(fa)
        if (fa >= MAX_ATTEMPTS) setIsLockedOut(true)
        setHasRecoveryCode(!!r.recoveryCodeHash)
      })
    }
  }, [hasVault])

  // ── Setup ──────────────────────────────────────────────────────────────────
  async function handleSetup(e) {
    e.preventDefault()
    if (!setupPw)              { showToast("Enter a master password", "error"); return }
    if (setupPw.length < 6)   { showToast("Minimum 6 characters", "error"); return }
    if (setupPw !== setupConfirm) { showToast("Passwords do not match", "error"); return }
    setLoading(true)
    const code     = generateRecoveryCode()
    const hash     = await hashString(setupPw)
    const codeHash = await hashString(code)
    await chromeSet({ masterPasswordHash: hash, recoveryCodeHash: codeHash, failedAttempts: 0 })
    setPendingPassword(setupPw)
    setRecoveryCode(code)
    setCodeCopied(false)
    setCodeConfirmed(false)
    setScreen("showRecovery")
    setLoading(false)
  }

  // ── Unlock ─────────────────────────────────────────────────────────────────
  async function handleUnlock(e) {
    e.preventDefault()
    if (!unlockPw || isLockedOut) return
    setLoading(true)
    const result = await chromeGet(["masterPasswordHash", "failedAttempts"])
    const hash   = await hashString(unlockPw)
    if (hash === result.masterPasswordHash) {
      await chromeSet({ failedAttempts: 0 })
      setError("")
      onUnlocked(unlockPw)
    } else {
      const newAttempts = (result.failedAttempts || 0) + 1
      await chromeSet({ failedAttempts: newAttempts })
      setAttempts(newAttempts)
      if (newAttempts >= MAX_ATTEMPTS) {
        setIsLockedOut(true)
        setError("")
      } else {
        const remaining = MAX_ATTEMPTS - newAttempts
        setError(
          `Incorrect password. ${remaining} attempt${remaining === 1 ? "" : "s"} remaining.`
        )
      }
    }
    setUnlockPw("")
    setLoading(false)
  }

  // ── OTP Reset ──────────────────────────────────────────────────────────────
  async function handleOTPReset(e) {
    e.preventDefault()
    const normalizedOtp = otpInput.toUpperCase().replace(/[\s-]/g, "")
    if (!normalizedOtp)      { setError("Enter your recovery code"); return }
    if (!newPw)              { setError("Enter a new master password"); return }
    if (newPw.length < 6)   { setError("Minimum 6 characters"); return }
    if (newPw !== newConfirm) { setError("Passwords do not match"); return }
    setLoading(true)
    const result    = await chromeGet(["recoveryCodeHash"])
    const inputHash = await hashString(normalizedOtp)
    if (inputHash === result.recoveryCodeHash) {
      const code     = generateRecoveryCode()
      const hash     = await hashString(newPw)
      const codeHash = await hashString(code)
      await chromeSet({
        masterPasswordHash: hash,
        recoveryCodeHash: codeHash,
        passwords: [],
        failedAttempts: 0,
      })
      setPendingPassword(newPw)
      setRecoveryCode(code)
      setCodeCopied(false)
      setCodeConfirmed(false)
      setNewPw("")
      setNewConfirm("")
      setOtpInput("")
      setError("")
      setAttempts(0)
      setIsLockedOut(false)
      setScreen("showRecovery")
    } else {
      setError("Invalid recovery code.")
    }
    setLoading(false)
  }

  // ── Recovery code confirmed ────────────────────────────────────────────────
  function handleRecoveryContinue() {
    if (!codeConfirmed) {
      showToast("Please confirm you have saved the recovery code", "error")
      return
    }
    onUnlocked(pendingPassword)
  }

  async function copyRecoveryCode() {
    try {
      await navigator.clipboard.writeText(recoveryCode)
      setCodeCopied(true)
      showToast("Recovery code copied!", "success")
    } catch {
      showToast("Copy failed — please copy manually", "error")
    }
  }

  // ── Logo helper ────────────────────────────────────────────────────────────
  function Logo() {
    return (
      <>
        <div className="lock-logo">
          <div className="lock-logo__ring" />
          <img src={iconUrl} alt="Vaultword logo" className="lock-logo__img" />
        </div>
        <h1 className="lock-title">Vaultword</h1>
      </>
    )
  }

  // ── Screen: show recovery code ─────────────────────────────────────────────
  if (screen === "showRecovery") {
    return (
      <div className="lock-bg">
        <div className="lock-card">
          <Logo />
          <p className="lock-subtitle">Save your recovery code</p>

          <div className="recovery-box">
            <span className="recovery-code">{recoveryCode}</span>
            <button
              type="button"
              className="btn btn--ghost"
              style={{ marginTop: 6, padding: "6px 18px" }}
              onClick={copyRecoveryCode}
            >
              {codeCopied ? "✓ Copied" : "Copy"}
            </button>
          </div>

          <p className="recovery-warning" role="alert">
            ⚠️ This code is shown <strong>only once</strong>. Store it somewhere safe — you will need it to reset your master password if you forget it.
          </p>

          <label className="recovery-confirm-label">
            <input
              type="checkbox"
              checked={codeConfirmed}
              onChange={(e) => setCodeConfirmed(e.target.checked)}
            />
            I have saved my recovery code
          </label>

          <button
            className="btn btn--primary btn--full"
            style={{ marginTop: 12 }}
            onClick={handleRecoveryContinue}
            disabled={loading}
          >
            Continue to Vault
          </button>
        </div>
      </div>
    )
  }

  // ── Screen: OTP reset ──────────────────────────────────────────────────────
  if (screen === "otpReset") {
    return (
      <div className="lock-bg">
        <div className="lock-card">
          <Logo />
          <p className="lock-subtitle">Reset master password</p>

          <p className="recovery-warning" role="alert">
            ⚠️ Resetting your master password will permanently <strong>delete all saved passwords</strong>, as they cannot be decrypted without the old password.
          </p>

          <form onSubmit={handleOTPReset} className="lock-form" style={{ marginTop: 12 }}>
            <div className="field">
              <label className="field__label">Recovery Code (OTP)</label>
              <div className="field__row">
                <input
                  className="field__input"
                  type="text"
                  placeholder="Enter your recovery code"
                  value={otpInput}
                  onChange={(e) => { setOtpInput(e.target.value); setError("") }}
                  autoFocus
                  autoComplete="off"
                />
              </div>
            </div>

            <div className="field">
              <label className="field__label">New Master Password</label>
              <div className="field__row">
                <input
                  className="field__input"
                  type={showNewPw ? "text" : "password"}
                  placeholder="New master password"
                  value={newPw}
                  onChange={(e) => { setNewPw(e.target.value); setError("") }}
                />
                <button
                  type="button"
                  className="field__eye"
                  onClick={() => setShowNewPw((v) => !v)}
                >
                  {showNewPw ? "Hide" : "Show"}
                </button>
              </div>
            </div>

            <div className="field">
              <label className="field__label">Confirm New Password</label>
              <div className="field__row">
                <input
                  className="field__input"
                  type={showNewPw ? "text" : "password"}
                  placeholder="Repeat new password"
                  value={newConfirm}
                  onChange={(e) => { setNewConfirm(e.target.value); setError("") }}
                />
              </div>
            </div>

            {error && <p className="lock-error">{error}</p>}

            <button className="btn btn--primary btn--full" type="submit" disabled={loading}>
              {loading ? "Resetting…" : "Reset & Unlock"}
            </button>

            <button
              type="button"
              className="btn btn--ghost btn--full"
              onClick={() => {
                setScreen("unlock")
                setError("")
                setOtpInput("")
                setNewPw("")
                setNewConfirm("")
              }}
            >
              ← Back
            </button>
          </form>
        </div>
      </div>
    )
  }

  // ── Screen: setup or unlock ────────────────────────────────────────────────
  return (
    <div className="lock-bg">
      <div className="lock-card">
        <Logo />
        <p className="lock-subtitle">
          {screen === "setup" ? "Create your vault" : "Your vault is locked"}
        </p>

        {isLockedOut ? (
          <div className="lockout-box">
            <p className="lock-error" style={{ marginBottom: 14 }}>
              🔒 Too many failed attempts. Your vault is locked.
            </p>
            <button
              className="btn btn--primary btn--full"
              onClick={() => { setScreen("otpReset"); setError("") }}
            >
              Reset with Recovery Code
            </button>
          </div>
        ) : (
          <form onSubmit={screen === "setup" ? handleSetup : handleUnlock} className="lock-form">
            <div className="field">
              <label className="field__label">Master Password</label>
              <div className="field__row">
                <input
                  className="field__input"
                  type={showPw ? "text" : "password"}
                  placeholder={screen === "setup" ? "Create master password" : "Enter master password"}
                  value={screen === "setup" ? setupPw : unlockPw}
                  onChange={(e) => {
                    screen === "setup"
                      ? setSetupPw(e.target.value)
                      : setUnlockPw(e.target.value)
                    setError("")
                  }}
                  autoFocus
                />
                <button type="button" className="field__eye" onClick={() => setShowPw((v) => !v)}>
                  {showPw ? "Hide" : "Show"}
                </button>
              </div>
            </div>

            {screen === "setup" && (
              <div className="field">
                <label className="field__label">Confirm Password</label>
                <div className="field__row">
                  <input
                    className="field__input"
                    type={showPw ? "text" : "password"}
                    placeholder="Repeat master password"
                    value={setupConfirm}
                    onChange={(e) => setSetupConfirm(e.target.value)}
                  />
                </div>
              </div>
            )}

            {error && <p className="lock-error">{error}</p>}

            <button className="btn btn--primary btn--full" type="submit" disabled={loading}>
              {loading
                ? "Checking…"
                : screen === "setup"
                  ? "Create Vault"
                  : "Unlock Vault"}
            </button>

            {screen === "unlock" && hasRecoveryCode && (
              <button
                type="button"
                className="btn btn--ghost btn--full"
                onClick={() => { setScreen("otpReset"); setError("") }}
              >
                Forgot password?
              </button>
            )}
          </form>
        )}
      </div>
    </div>
  )
}
