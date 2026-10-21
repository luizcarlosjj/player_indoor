import { cn } from '@/lib/utils'

interface FieldProps {
  label: string
  hint?: string
  error?: string
  required?: boolean
  className?: string
  children: React.ReactNode
}

export function Field({ label, hint, error, required, className, children }: FieldProps) {
  return (
    <div className={cn('flex flex-col gap-1', className)}>
      <label className="text-[12px] font-medium text-muted uppercase tracking-wide">
        {label}
        {required && <span className="text-error ml-0.5">*</span>}
      </label>
      {children}
      {hint && !error && <p className="text-[11px] text-subtle">{hint}</p>}
      {error && <p className="text-[11px] text-error">{error}</p>}
    </div>
  )
}
