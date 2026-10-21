import { Skeleton } from '@/components/ui/skeleton'

export default function Loading() {
  return (
    <div>
      {/* PageHeader skeleton */}
      <div className="flex items-start justify-between gap-4 mb-6">
        <div className="flex flex-col gap-2">
          <Skeleton className="h-5 w-28" />
          <Skeleton className="h-3 w-56" />
        </div>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="bg-surface border border-border rounded-[12px] p-4">
            <Skeleton className="h-3 w-20 mb-3" />
            <Skeleton className="h-7 w-28 mb-2" />
            <Skeleton className="h-2.5 w-14" />
          </div>
        ))}
      </div>

      {/* Chart skeleton */}
      <div className="bg-surface border border-border rounded-[12px] p-4 mb-6">
        <Skeleton className="h-3 w-32 mb-4" />
        <Skeleton className="h-[220px] w-full" />
      </div>

      {/* Investment log skeleton */}
      <div className="bg-surface border border-border rounded-[12px] p-4">
        <div className="flex items-center justify-between mb-4">
          <Skeleton className="h-4 w-40" />
          <Skeleton className="h-8 w-32" />
        </div>
        <div className="flex flex-col gap-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="flex items-center gap-3 px-3 py-2.5">
              <Skeleton className="h-3 w-20 shrink-0" />
              <Skeleton className="h-3 flex-1 max-w-[240px]" />
              <Skeleton className="h-5 w-16 shrink-0" />
              <Skeleton className="h-3 w-20 shrink-0 ml-auto" />
              <Skeleton className="h-7 w-7 shrink-0" />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
