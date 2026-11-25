import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { Link } from 'react-router-dom'

export type ToastItem = {
  id: number
  title: string
  lines?: string[]
  href?: string
  hrefLabel?: string
  tone?: 'info' | 'ok' | 'warn'
}

type ToastApi = {
  push: (toast: Omit<ToastItem, 'id'>) => void
}

const ToastContext = createContext<ToastApi | null>(null)

let toastId = 0

export function ToastProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([])

  const push = useCallback((toast: Omit<ToastItem, 'id'>) => {
    const id = ++toastId
    setItems((prev) => [...prev, { ...toast, id }])
    window.setTimeout(() => {
      setItems((prev) => prev.filter((t) => t.id !== id))
    }, 10000)
  }, [])

  const dismiss = useCallback((id: number) => {
    setItems((prev) => prev.filter((t) => t.id !== id))
  }, [])

  const value = useMemo(() => ({ push }), [push])

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div
        className="pointer-events-none fixed inset-x-0 top-[4.25rem] z-[60] flex flex-col items-center gap-2 px-3 md:top-[4.75rem]"
        aria-live="polite"
      >
        {items.map((t) => {
          const tone =
            t.tone === 'ok'
              ? 'bg-ok text-white border-ink'
              : t.tone === 'warn'
                ? 'bg-danger text-white border-ink'
                : 'bg-pop text-ink border-ink'
          return (
            <div
              key={t.id}
              className={`pointer-events-auto w-full max-w-lg rounded-2xl border-2 px-4 py-3 shadow-[4px_4px_0_0_#0f172a] ${tone}`}
              role="status"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-display text-lg font-bold leading-tight">{t.title}</p>
                  {t.lines?.map((line) => (
                    <p key={line} className="mt-1 text-sm font-semibold opacity-95">
                      {line}
                    </p>
                  ))}
                  {t.href ? (
                    <Link
                      to={t.href}
                      className="mt-2 inline-block text-sm font-bold underline underline-offset-2"
                      onClick={() => dismiss(t.id)}
                    >
                      {t.hrefLabel || 'Aç'}
                    </Link>
                  ) : null}
                </div>
                <button
                  type="button"
                  className="min-h-8 shrink-0 rounded-full px-2 text-sm font-bold opacity-80 hover:opacity-100"
                  onClick={() => dismiss(t.id)}
                  aria-label="Kapat"
                >
                  ✕
                </button>
              </div>
            </div>
          )
        })}
      </div>
    </ToastContext.Provider>
  )
}

export function useToast() {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast ToastProvider içinde kullanılmalı')
  return ctx
}
