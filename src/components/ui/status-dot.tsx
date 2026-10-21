import { cn } from '@/lib/utils'

interface StatusDotProps {
  status: 'online' | 'offline' | 'alert'
  label?: string
  className?: string
  pulse?: boolean
}

const colors = {
  online:  'bg-online',
  offline: 'bg-subtle',
  alert:   'bg-alert',
}

export function StatusDot({ status, label, className, pulse }: StatusDotProps) {
  return (
    <span className={cn('inline-flex items-center gap-1.5', className)}>
      <span
        className={cn(
          'inline-block w-2 h-2 rounded-full flex-shrink-0',
          colors[status],
          status === 'online' && pulse && 'animate-pulse-dot',
        )}
        aria-hidden
      />
      {label && (
        <span className="text-[12px] text-muted">{label}</span>
      )}
    </span>
  )
}
