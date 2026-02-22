import { useState } from "react"
import { generatePassword, getPasswordStrength, STRENGTH_META } from "../utils/crypto"
import { useToast } from "../context/ToastContext"

export default function GeneratorTab({ onUsePassword }) {
  const showToast = useToast()
  const [result,  setResult]  = useState("")
  const [length,  setLength]  = useState(16)
  const [upper,   setUpper]   = useState(true)
  const [lower,   setLower]   = useState(true)
  const [numbers, setNumbers] = useState(true)
  const [symbols, setSymbols] = useState(true)

  function handleGenerate() {
    const pwd = generatePassword({ length, upper, lower, numbers, symbols })
    if (!pwd) { showToast("Select at least one character type", "error"); return }
    setResult(pwd)
  }

  function handleCopy() {
    if (!result) { showToast("Generate a password first", "error"); return }
    navigator.clipboard.writeText(result)
      .then(() => showToast("Password copied!", "success"))
      .catch(() => showToast("Failed to copy", "error"))
  }

  function handleUse() {
    if (!result) { showToast("Generate a password first", "error"); return }
    onUsePassword(result)
    showToast("Password sent to Add form", "success")
  }

  const strength = result ? getPasswordStrength(result) : null
  const meta     = strength !== null ? STRENGTH_META[strength] : null

  return (
    <div className="gen-tab">
      <div className="section-card">
        <h2 className="section-title">Password Generator</h2>

        {/* Output box */}
        <div className="gen-output">
          <span className="gen-output__text">
            {result || <span className="gen-output__placeholder">Click Generate…</span>}
          </span>
          <button className="btn btn--copy gen-output__copy" onClick={handleCopy} title="Copy">
            Copy
          </button>
        </div>

        {/* Strength */}
        {meta && (
          <div className="strength" style={{ marginBottom: "12px" }}>
            <div className="strength__bar">
              <div
                className="strength__fill"
                style={{ width: `${(strength + 1) / 5 * 100}%`, background: meta.color }}
              />
            </div>
            <span className="strength__label" style={{ color: meta.color }}>{meta.label}</span>
          </div>
        )}

        {/* Length slider */}
        <div className="gen-option gen-option--slider">
          <span className="gen-option__label">Length</span>
          <input
            type="range"
            min={8}
            max={32}
            value={length}
            onChange={(e) => setLength(Number(e.target.value))}
            className="gen-slider"
          />
          <span className="gen-option__value">{length}</span>
        </div>

        {/* Checkboxes */}
        {[
          { label: "Uppercase (A–Z)",  val: upper,   set: setUpper },
          { label: "Lowercase (a–z)",  val: lower,   set: setLower },
          { label: "Numbers (0–9)",    val: numbers, set: setNumbers },
          { label: "Symbols (!@#…)",   val: symbols, set: setSymbols },
        ].map(({ label, val, set }) => (
          <label key={label} className="gen-option">
            <input
              type="checkbox"
              checked={val}
              onChange={(e) => set(e.target.checked)}
              className="gen-checkbox"
            />
            <span className="gen-option__label">{label}</span>
          </label>
        ))}

        {/* Actions */}
        <div className="gen-actions">
          <button className="btn btn--primary btn--full" onClick={handleGenerate}>
            Generate
          </button>
          <button className="btn btn--secondary btn--full" onClick={handleUse}>
            Use in Add Form
          </button>
        </div>
      </div>
    </div>
  )
}
