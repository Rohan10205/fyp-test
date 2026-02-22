import { createContext, useContext, useState, useCallback, useRef } from "react"

const ToastCtx = createContext(null)

export function ToastProvider({ children }) {
  const [toast, setToast] = useState(null)
  const timer = useRef(null)

  const showToast = useCallback((message, type = "success") => {
    clearTimeout(timer.current)
    setToast({ message, type })
    timer.current = setTimeout(() => setToast(null), 2500)
  }, [])

  return (
    <ToastCtx.Provider value={showToast}>
      {children}
      {toast && (
        <div className={`toast toast--${toast.type}`}>{toast.message}</div>
      )}
    </ToastCtx.Provider>
  )
}

export function useToast() {
  return useContext(ToastCtx)
}
