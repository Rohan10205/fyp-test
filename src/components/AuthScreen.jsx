import { useState } from "react"
import { apiLogin, apiRegister } from "../utils/api"
import { chromeSet } from "../utils/storage"
import { useToast } from "../context/ToastContext"
import iconUrl from "../../icon.jpg"

export default function AuthScreen({ onAuthenticated }) {
  const showToast = useToast()

  const [mode,    setMode]    = useState("login") // "login" | "register"
  const [email,   setEmail]   = useState("")
  const [password, setPassword] = useState("")
  const [confirm, setConfirm] = useState("")
  const [showPw,  setShowPw]  = useState(false)
  const [loading, setLoading] = useState(false)
  const [error,   setError]   = useState("")

  async function handleSubmit(e) {
    e.preventDefault()
    setError("")
    if (!email || !password) { setError("Email and password are required"); return }
    if (mode === "register") {
      if (password.length < 8) { setError("Password must be at least 8 characters"); return }
      if (password !== confirm) { setError("Passwords do not match"); return }
    }

    setLoading(true)
    try {
      const fn        = mode === "login" ? apiLogin : apiRegister
      const { token } = await fn(email, password)
      await chromeSet({ authToken: token })
      showToast(mode === "login" ? "Signed in!" : "Account created!", "success")
      onAuthenticated()
    } catch (err) {
      setError(err.message)
    }
    setLoading(false)
  }

  function switchMode() {
    setMode((m) => (m === "login" ? "register" : "login"))
    setError("")
    setPassword("")
    setConfirm("")
  }

  return (
    <div className="lock-bg">
      <div className="lock-card">
        <div className="lock-logo">
          <div className="lock-logo__ring" />
          <img src={iconUrl} alt="Vaultword logo" className="lock-logo__img" />
        </div>
        <h1 className="lock-title">Vaultword</h1>
        <p className="lock-subtitle">
          {mode === "login" ? "Sign in to your account" : "Create your account"}
        </p>

        <form onSubmit={handleSubmit} className="lock-form">
          <div className="field">
            <label className="field__label">Email</label>
            <input
              className="field__input"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => { setEmail(e.target.value); setError("") }}
              autoFocus
              autoComplete="email"
            />
          </div>

          <div className="field">
            <label className="field__label">Password</label>
            <div className="field__row">
              <input
                className="field__input"
                type={showPw ? "text" : "password"}
                placeholder="Enter password"
                value={password}
                onChange={(e) => { setPassword(e.target.value); setError("") }}
                autoComplete={mode === "login" ? "current-password" : "new-password"}
              />
              <button
                type="button"
                className="field__eye"
                onClick={() => setShowPw((v) => !v)}
              >
                {showPw ? "Hide" : "Show"}
              </button>
            </div>
          </div>

          {mode === "register" && (
            <div className="field">
              <label className="field__label">Confirm Password</label>
              <div className="field__row">
                <input
                  className="field__input"
                  type={showPw ? "text" : "password"}
                  placeholder="Repeat password"
                  value={confirm}
                  onChange={(e) => { setConfirm(e.target.value); setError("") }}
                  autoComplete="new-password"
                />
              </div>
            </div>
          )}

          {error && <p className="lock-error">{error}</p>}

          <button
            className="btn btn--primary btn--full"
            type="submit"
            disabled={loading}
          >
            {loading
              ? (mode === "login" ? "Signing in…" : "Creating account…")
              : (mode === "login" ? "Sign In" : "Create Account")}
          </button>

          <button
            type="button"
            className="btn btn--ghost btn--full"
            onClick={switchMode}
          >
            {mode === "login"
              ? "Don't have an account? Register"
              : "Already have an account? Sign In"}
          </button>
        </form>
      </div>
    </div>
  )
}
