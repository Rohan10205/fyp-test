import { useState, useEffect, useCallback } from "react"
import { chromeGet, chromeSet } from "../utils/storage"
import { decryptPassword } from "../utils/crypto"
import { useToast } from "../context/ToastContext"
import PasswordCard from "./PasswordCard"

function normalizeHost(hostname) {
  return (hostname || "").toLowerCase().replace(/^www\./, "")
}

export default function PasswordsTab({ masterPassword }) {
  const showToast    = useToast()
  const [items, setItems]       = useState([])
  const [search, setSearch]     = useState("")
  const [loading, setLoading]   = useState(true)
  const [activeTab, setActiveTab] = useState({ id: null, url: "", hostname: "" })

  const loadActiveTab = useCallback(async () => {
    if (!window.chrome?.tabs?.query) return
    try {
      const tabs = await window.chrome.tabs.query({ active: true, currentWindow: true })
      const tab = tabs?.[0]
      const url = tab?.url || ""
      let hostname = ""
      try {
        hostname = normalizeHost(new URL(url).hostname)
      } catch {
        hostname = ""
      }
      setActiveTab({ id: tab?.id ?? null, url, hostname })
    } catch {
      setActiveTab({ id: null, url: "", hostname: "" })
    }
  }, [])

  const loadAll = useCallback(async () => {
    setLoading(true)
    const result   = await chromeGet(["passwords"])
    const raw      = result.passwords || []
    const decrypted = await Promise.all(
      raw.map(async (p) => {
        try {
          return { ...p, plain: await decryptPassword(p.password, masterPassword) }
        } catch {
          return { ...p, plain: null }
        }
      })
    )
    setItems(decrypted)
    setLoading(false)
  }, [masterPassword])

  useEffect(() => {
    loadAll()
    loadActiveTab()
  }, [loadAll, loadActiveTab])

  useEffect(() => {
    const handleFocus = () => loadActiveTab()
    window.addEventListener("focus", handleFocus)
    return () => window.removeEventListener("focus", handleFocus)
  }, [loadActiveTab])

  async function handleDelete(id) {
    if (!confirm("Delete this password? This cannot be undone.")) return
    const result = await chromeGet(["passwords"])
    const updated = (result.passwords || []).filter((p) => p.id !== id)
    await chromeSet({ passwords: updated })
    setItems((prev) => prev.filter((p) => p.id !== id))
    showToast("Password deleted", "success")
  }

  function normalizeWebsite(value) {
    const raw = (value || "").trim().toLowerCase()
    if (!raw) return ""
    const withScheme = /^https?:\/\//.test(raw) ? raw : `https://${raw}`
    try {
      return normalizeHost(new URL(withScheme).hostname)
    } catch {
      return normalizeHost(raw.split("/")[0])
    }
  }

  function isWebsiteMatch(website) {
    const savedHost = normalizeWebsite(website)
    if (!savedHost || !activeTab.hostname) return false
    return activeTab.hostname === savedHost
  }

  async function handleAutofill(item) {
    if (!item?.plain) {
      showToast("Password unavailable for autofill", "error")
      return
    }
    if (!activeTab.id) {
      showToast("No active tab found", "error")
      return
    }
    if (!/^https?:\/\//i.test(activeTab.url)) {
      showToast("Autofill works on website pages only", "error")
      return
    }
    if (!confirm("Autofill and automatically submit this page's login form?")) return

    try {
      const [execution] = await window.chrome.scripting.executeScript({
        target: { tabId: activeTab.id },
        args: [{
          username: item.username,
          password: item.plain,
          autoSubmit: true,
          usernameFallbackSelector: [
            'input[autocomplete="username"]',
            'input[type="email"]',
            'input[name*="user" i]',
            'input[name*="email" i]',
            'input[id*="user" i]',
            'input[id*="email" i]',
            'input[type="text"]',
          ].join(", "),
        }],
        func: (fillConfig) => {
          const usernameTypes = new Set(["text", "email", "tel", "url", "search", ""])

          const isEditableField = (el) =>
            el &&
            !el.disabled &&
            !el.readOnly &&
            !["hidden", "submit", "button", "checkbox", "radio", "file"].includes(el.type)

          const isUsernameField = (el) => {
            const type = (el.type || "").toLowerCase()
            return usernameTypes.has(type)
          }

          const isVisible = (el) => {
            const style = window.getComputedStyle(el)
            const rect = el.getBoundingClientRect()
            return (
              style.display !== "none" &&
              style.visibility !== "hidden" &&
              style.opacity !== "0" &&
              rect.width > 0 &&
              rect.height > 0
            )
          }

          const setFieldValue = (el, value) => {
            const proto = el instanceof HTMLTextAreaElement ? HTMLTextAreaElement.prototype : HTMLInputElement.prototype
            const setter = Object.getOwnPropertyDescriptor(proto, "value")?.set
            if (setter) setter.call(el, value)
            else el.value = value
            el.dispatchEvent(new Event("input", { bubbles: true }))
            el.dispatchEvent(new Event("change", { bubbles: true }))
          }

          try {
            const submitSelector = 'button[type="submit"], input[type="submit"]'
            const passwordInputs = Array.from(document.querySelectorAll('input[type="password"]'))
              .filter((el) => isEditableField(el) && isVisible(el))

            const passwordField = passwordInputs[0]
            if (!passwordField) return { status: "no-password-field" }

            const form = passwordField.form || passwordField.closest("form")
            let usernameField = null

            if (form) {
              const formInputs = Array.from(form.querySelectorAll("input"))
                .filter((el) => isEditableField(el) && isVisible(el))
              for (const input of formInputs) {
                if (input === passwordField) break
                if (isUsernameField(input)) usernameField = input
              }
            }

            if (!usernameField) {
              usernameField = Array.from(
                document.querySelectorAll(fillConfig.usernameFallbackSelector)
              ).find((el) => isEditableField(el) && isVisible(el) && isUsernameField(el) && el !== passwordField)
            }

            if (usernameField) setFieldValue(usernameField, fillConfig.username || "")
            setFieldValue(passwordField, fillConfig.password || "")

            if (!fillConfig.autoSubmit) return { status: "filled" }

            if (form) {
              if (typeof form.requestSubmit === "function") form.requestSubmit()
              else {
                const submitBtn = form.querySelector(submitSelector)
                if (submitBtn) submitBtn.click()
                else form.submit()
              }
              return { status: "submitted" }
            }

            const submitBtn = document.querySelector(submitSelector)
            if (submitBtn) {
              submitBtn.click()
              return { status: "submitted" }
            }

            return { status: "filled-no-submit" }
          } catch {
            return { status: "error" }
          }
        },
      })

      const status = execution?.result?.status
      if (status === "submitted") showToast("Autofilled and submitted", "success")
      else if (status === "filled") showToast("Autofilled successfully", "success")
      else if (status === "filled-no-submit") showToast("Autofilled (submit button not found)", "success")
      else if (status === "no-password-field") showToast("No login form found on this page", "error")
      else showToast("Autofill failed. Ensure a visible login form exists.", "error")
    } catch {
      showToast("Autofill failed. Refresh the tab and try again.", "error")
    }
  }

  const filtered = search
    ? items.filter(
        (p) =>
          p.website.toLowerCase().includes(search.toLowerCase()) ||
          p.username.toLowerCase().includes(search.toLowerCase())
      )
    : items

  return (
    <div className="passwords-tab">
      {/* Search */}
      <div className="search">
        <span className="search__icon"></span>
        <input
          className="search__input"
          type="text"
          placeholder="Search by website or username…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        {search && (
          <button className="search__clear" onClick={() => setSearch("")}>✕</button>
        )}
      </div>

      {/* Count badge */}
      {!loading && items.length > 0 && (
        <div className="list-meta">
          {filtered.length} of {items.length} saved
        </div>
      )}

      {/* List */}
      <div className="card-list">
        {loading ? (
          <div className="state-msg">Loading…</div>
        ) : filtered.length === 0 ? (
          <div className="state-msg">
            {search ? "No results found" : (
              <>
                <span className="state-msg__icon"></span>
                <p>No passwords yet</p>
                <p className="state-msg__hint">Switch to the Add tab to save one.</p>
              </>
            )}
          </div>
        ) : (
          filtered.map((item) => (
            <PasswordCard
              key={item.id}
              item={item}
              onDelete={handleDelete}
              onAutofill={handleAutofill}
              canAutofill={isWebsiteMatch(item.website)}
            />
          ))
        )}
      </div>
    </div>
  )
}
