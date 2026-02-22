import { useState, useEffect } from "react"
import { ToastProvider } from "./context/ToastContext"
import LockScreen from "./components/LockScreen"
import MainApp from "./components/MainApp"
import { chromeGet } from "./utils/storage"

export default function App() {
  const [masterPassword, setMasterPassword] = useState(null) // null = locked
  const [vaultSalt, setVaultSalt]           = useState(null)
  const [hasVault, setHasVault]             = useState(null) // null = loading

  useEffect(() => {
    chromeGet(["masterPasswordHash"]).then((r) =>
      setHasVault(!!r.masterPasswordHash)
    )
  }, [])

  function handleUnlock(password, salt) {
    setMasterPassword(password)
    setVaultSalt(salt)
  }

  function handleLock() {
    setMasterPassword(null)
    setVaultSalt(null)
  }

  if (hasVault === null) return null // loading

  return (
    <ToastProvider>
      {masterPassword ? (
        <MainApp masterPassword={masterPassword} vaultSalt={vaultSalt} onLock={handleLock} />
      ) : (
        <LockScreen
          hasVault={hasVault}
          onUnlocked={(pwd, salt) => {
            setHasVault(true)
            handleUnlock(pwd, salt)
          }}
        />
      )}
    </ToastProvider>
  )
}
