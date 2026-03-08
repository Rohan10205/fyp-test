import { useState } from "react"
import PasswordsTab from "./PasswordsTab"
import AddTab from "./AddTab"
import GeneratorTab from "./GeneratorTab"
import iconUrl from "../../icon.jpg"

const TABS = [
  { id: "passwords", label: "Passwords", icon: "" },
  { id: "add",       label: "Add",       icon: "" },
  { id: "generator", label: "Generator", icon: "" },
]

export default function MainApp({ masterPassword, onLock }) {
  const [tab, setTab]                   = useState("passwords")
  const [prefillPassword, setPrefill]   = useState("")

  function handleUsePrefill(pwd) {
    setPrefill(pwd)
    setTab("add")
  }

  return (
    <div className="app">
      {/* Header */}
      <header className="app-header">
        <div className="app-header__brand">
          <img src={iconUrl} alt="Vaultword logo" className="app-header__logo" />
          <span className="app-header__name">Vaultword</span>
        </div>
        <button className="btn btn--ghost btn--icon" title="Lock vault" onClick={onLock}>
          Lock
        </button>
      </header>

      {/* Tabs */}
      <nav className="tabs">
        {TABS.map((t) => (
          <button
            key={t.id}
            className={`tabs__btn${tab === t.id ? " tabs__btn--active" : ""}`}
            onClick={() => setTab(t.id)}
          >
            <span className="tabs__icon">{t.icon}</span>
            <span className="tabs__label">{t.label}</span>
          </button>
        ))}
      </nav>

      {/* Tab panels */}
      <main className="app-body">
        {tab === "passwords" && <PasswordsTab masterPassword={masterPassword} />}
        {tab === "add"       && (
          <AddTab
            masterPassword={masterPassword}
            prefillPassword={prefillPassword}
            onSaved={() => setTab("passwords")}
            onClearPrefill={() => setPrefill("")}
          />
        )}
        {tab === "generator" && <GeneratorTab onUsePassword={handleUsePrefill} />}
      </main>
    </div>
  )
}
