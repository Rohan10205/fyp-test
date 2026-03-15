import { useState, useEffect } from "react"
import { ToastProvider } from "./context/ToastContext"
import AuthScreen from "./components/AuthScreen"
import LockScreen from "./components/LockScreen"
import MainApp from "./components/MainApp"
import { chromeGet, chromeSet } from "./utils/storage"

export default function App() {
  // null = still loading from storage
  const [authToken,      setAuthToken]      = useState(null)
  const [masterPassword, setMasterPassword] = useState(null)
  const [hasVault,       setHasVault]       = useState(false)

  useEffect(() => {
    chromeGet(["authToken", "masterPasswordHash"]).then((r) => {
      setAuthToken(r.authToken || "")
      setHasVault(!!r.masterPasswordHash)
    })
  }, [])

  async function handleAuthenticated() {
    const r = await chromeGet(["authToken", "masterPasswordHash"])
    setAuthToken(r.authToken || "")
    setHasVault(!!r.masterPasswordHash)
  }

  async function handleLogout() {
    await chromeSet({ authToken: null })
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
          onLock={() => setMasterPassword(null)}
          onLogout={handleLogout}
        />
      ) : (
        <LockScreen
          hasVault={hasVault}
          onUnlocked={(pwd) => {
            setHasVault(true)
            setMasterPassword(pwd)
          }}
          onLogout={handleLogout}
        />
      )}
    </ToastProvider>
  )
}
