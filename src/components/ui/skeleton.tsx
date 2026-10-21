import { cn } from '@/lib/utils'

export function Skeleton({ className }: { className?: string }) {
  return (
    <div
      className={cn('skeleton-shimmer rounded-[var(--radius-sm)]', className)}
      aria-hidden
    />
  )
}

export function SkeletonCard() {
  return (
    <div className="bg-surface border border-border rounded-[var(--radius-card)] p-4 space-y-3">
      <Skeleton className="h-3 w-24" />
      <Skeleton className="h-7 w-16" />
    </div>
  )
}

export function SkeletonRow() {
  return (
    <div className="bg-surface border border-border rounded-[var(--radius-input)] px-4 py-3 flex items-center gap-3">
      <Skeleton className="h-4 w-4 rounded-full" />
      <Skeleton className="h-4 flex-1 max-w-[180px]" />
      <Skeleton className="h-4 w-20 ml-auto" />
    </div>
  )
}
