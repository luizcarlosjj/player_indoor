import { forwardRef } from 'react'
import { Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger'
  size?: 'sm' | 'md'
  loading?: boolean
  asChild?: boolean
}

const variants = {
  primary:   'bg-accent text-accent-fg font-semibold hover:opacity-90',
  secondary: 'bg-elevated text-fg border border-border hover:bg-surface',
  ghost:     'text-muted hover:text-fg hover:bg-elevated',
  danger:    'bg-error/10 text-error border border-error/30 hover:bg-error/20',
}

const sizes = {
  sm: 'h-8 px-3 text-[12px] gap-1.5',
  md: 'h-9 px-4 text-[13px] gap-2',
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', loading, disabled, children, ...props }, ref) => {
    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        className={cn(
          'inline-flex items-center justify-center rounded-[var(--radius-input)] font-medium transition-all duration-150',
          'border-0 cursor-pointer select-none whitespace-nowrap',
          'disabled:opacity-50 disabled:cursor-not-allowed',
          variants[variant],
          sizes[size],
          className,
        )}
        {...props}
      >
        {loading && <Loader2 className="animate-spin" size={14} />}
        {children}
      </button>
    )
  }
)
Button.displayName = 'Button'
