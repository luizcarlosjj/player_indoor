import { Skeleton } from '@/components/ui/skeleton'

export default function Loading() {
  return (
    <div>
      {/* PageHeader skeleton */}
      <div className="flex items-start justify-between gap-4 mb-6">
        <div className="flex flex-col gap-2">
          <Skeleton className="h-5 w-48" />
          <Skeleton className="h-3 w-72" />
        </div>
      </div>

      {/* KPIs — linha 1: 4 cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="bg-surface border border-border rounded-[12px] p-4">
            <Skeleton className="h-3 w-24 mb-3" />
            <Skeleton className="h-7 w-20" />
          </div>
        ))}
      </div>

      {/* KPIs — linha 2: 2 cards */}
      <div className="grid grid-cols-2 gap-3 mb-6">
        {Array.from({ length: 2 }).map((_, i) => (
          <div key={i} className="bg-surface border border-border rounded-[12px] p-4">
            <Skeleton className="h-3 w-24 mb-3" />
            <Skeleton className="h-7 w-20" />
          </div>
        ))}
      </div>

      {/* Gráfico */}
      <div className="bg-surface border border-border rounded-[12px] p-4 mb-6">
        <Skeleton className="h-3 w-40 mb-4" />
        <Skeleton className="h-48 w-full" />
      </div>
    </div>
  )
}
