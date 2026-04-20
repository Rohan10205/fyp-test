import { useState, useEffect } from "react"
import { ToastProvider } from "./context/ToastContext"
import AuthScreen from "./components/AuthScreen"
import LockScreen from "./components/LockScreen"
import MainApp from "./components/MainApp"
import { chromeGet, chromeSet, chromeSessionGet, chromeSessionSet, chromeSessionRemove } from "./utils/storage"

// Vault stays unlocked for 30 minutes after last use
const SESSION_DURATION = 30 * 60 * 1000

export default function App() {
  // null = still loading from storage
  const [authToken,      setAuthToken]      = useState(null)
  const [masterPassword, setMasterPassword] = useState(null)
  const [hasVault,       setHasVault]       = useState(false)

  useEffect(() => {
    chromeGet(["authToken", "masterPasswordHash"]).then(async (r) => {
      const token = r.authToken || ""
      setAuthToken(token)
      setHasVault(!!r.masterPasswordHash)

      // Restore vault session if still valid (within SESSION_DURATION)
      if (token) {
        const session = await chromeSessionGet(["vaultSession"])
        const vs = session.vaultSession
        if (vs?.masterPassword && vs.expiresAt > Date.now()) {
          setMasterPassword(vs.masterPassword)
          // Refresh the expiry so activity keeps the session alive
          await chromeSessionSet({
            vaultSession: { masterPassword: vs.masterPassword, expiresAt: Date.now() + SESSION_DURATION },
          })
        }
      }
    })
  }, [])

  async function handleAuthenticated() {
    const r = await chromeGet(["authToken", "masterPasswordHash"])
    setAuthToken(r.authToken || "")
    setHasVault(!!r.masterPasswordHash)
  }

  async function handleUnlocked(pwd) {
    await chromeSessionSet({
      vaultSession: { masterPassword: pwd, expiresAt: Date.now() + SESSION_DURATION },
    })
    setHasVault(true)
    setMasterPassword(pwd)
  }

  async function handleLock() {
    await chromeSessionRemove(["vaultSession"])
    setMasterPassword(null)
  }

  async function handleLogout() {
    await chromeSet({ authToken: null })
    await chromeSessionRemove(["vaultSession"])
    setAuthToken("")
    setMasterPassword(null)
  }

  // Still loading initial state
  if (authToken === null) return null

  return (
    <ToastProvider>
      {!authToken ? (
        <AuthScreen onAuthenticated={handleAuthenticated} />
      ) : masterPassword ? (
        <MainApp
          masterPassword={masterPassword}
          onLock={handleLock}
          onLogout={handleLogout}
        />
      ) : (
        <LockScreen
          hasVault={hasVault}
          onUnlocked={handleUnlocked}
          onLogout={handleLogout}
        />
      )}
    </ToastProvider>
  )
}
