import type { InputHTMLAttributes, ReactNode, SelectHTMLAttributes, TextareaHTMLAttributes } from 'react'

const base =
  'w-full min-h-11 rounded-xl border-2 border-ink/15 bg-white px-3 py-2 text-ink placeholder:text-ink-soft/70 focus:border-accent'

export function Field({
  label,
  children,
  error,
}: {
  label: string
  children: ReactNode
  error?: string
}) {
  return (
    <label className="block space-y-1.5">
      <span className="text-sm font-bold text-ink">{label}</span>
      {children}
      {error ? <span className="block text-sm text-danger">{error}</span> : null}
    </label>
  )
}

export function Input(props: InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className={`${base} ${props.className ?? ''}`} />
}

export function Select(props: SelectHTMLAttributes<HTMLSelectElement>) {
  return <select {...props} className={`${base} ${props.className ?? ''}`} />
}

export function Textarea(props: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea {...props} className={`${base} min-h-24 ${props.className ?? ''}`} />
}

export function Button({
  children,
  variant = 'primary',
  className = '',
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primary' | 'ghost' | 'danger'
}) {
  const styles =
    variant === 'primary'
      ? 'rounded-2xl border-2 border-ink bg-accent text-white shadow-[4px_4px_0_0_#fde047] hover:-translate-y-0.5 hover:bg-accent-hover hover:shadow-[6px_6px_0_0_#fde047] active:translate-y-0 active:shadow-[2px_2px_0_0_#fde047] disabled:opacity-50 disabled:shadow-none'
      : variant === 'danger'
        ? 'rounded-2xl border-2 border-ink bg-danger text-white shadow-[3px_3px_0_0_#fda4af] hover:-translate-y-0.5 disabled:opacity-50'
        : 'rounded-2xl border-2 border-ink/20 bg-white text-ink hover:border-ink hover:bg-pop/60 disabled:opacity-50'

  return (
    <button
      type="button"
      {...props}
      className={`inline-flex min-h-11 items-center justify-center px-5 text-[0.95rem] font-bold transition ${styles} ${className}`}
    >
      {children}
    </button>
  )
}

export function Alert({ children, tone = 'error' }: { children: ReactNode; tone?: 'error' | 'ok' }) {
  return (
    <div
      className={`rounded-2xl border-2 px-3 py-2 text-sm font-semibold ${
        tone === 'ok'
          ? 'border-ok/50 bg-ok/10 text-ok'
          : 'border-danger/40 bg-danger/10 text-danger'
      }`}
      role="status"
    >
      {children}
    </div>
  )
}
