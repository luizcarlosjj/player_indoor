import { cn } from '@/lib/utils'

type BadgeVariant = 'default' | 'online' | 'alert' | 'error' | 'info' | 'muted' | 'accent'

const variants: Record<BadgeVariant, string> = {
  default: 'bg-elevated text-muted border border-border',
  online:  'bg-online/10 text-online border border-online/20',
  alert:   'bg-alert/10 text-alert border border-alert/20',
  error:   'bg-error/10 text-error border border-error/20',
  info:    'bg-info/10 text-info border border-info/20',
  muted:   'bg-elevated text-subtle border border-border',
  accent:  'bg-accent/10 text-accent border border-accent/20',
}

interface BadgeProps {
  variant?: BadgeVariant
  className?: string
  children: React.ReactNode
}

export function Badge({ variant = 'default', className, children }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 px-2 py-0.5 rounded-[6px] text-[11px] font-medium',
        variants[variant],
        className,
      )}
    >
      {children}
    </span>
  )
}
