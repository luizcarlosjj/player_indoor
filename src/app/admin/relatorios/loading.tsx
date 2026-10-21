import { Skeleton } from '@/components/ui/skeleton'

export default function Loading() {
  return (
    <div>
      {/* PageHeader skeleton */}
      <div className="flex items-start justify-between gap-4 mb-6">
        <div className="flex flex-col gap-2">
          <Skeleton className="h-5 w-28" />
          <Skeleton className="h-3 w-52" />
        </div>
      </div>

      {/* Barra de filtros: 4 inputs + 2 botões */}
      <div className="flex flex-wrap items-center gap-2 mb-6">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-9 w-36" />
        ))}
        <Skeleton className="h-9 w-24" />
        <Skeleton className="h-9 w-24" />
      </div>

      {/* 3 KPI cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="bg-surface border border-border rounded-[12px] p-4">
            <Skeleton className="h-3 w-24 mb-3" />
            <Skeleton className="h-7 w-20" />
          </div>
        ))}
      </div>
    </div>
  )
}
