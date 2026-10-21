import { Skeleton } from '@/components/ui/skeleton'

export default function Loading() {
  return (
    <div>
      {/* PageHeader skeleton */}
      <div className="flex items-start justify-between gap-4 mb-6">
        <div className="flex flex-col gap-2">
          <Skeleton className="h-5 w-32" />
          <Skeleton className="h-3 w-48" />
        </div>
        <Skeleton className="h-9 w-32 flex-shrink-0" />
      </div>

      {/* Filtros / abas */}
      <div className="flex items-center gap-2 mb-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-7 w-20" />
        ))}
      </div>

      {/* 5 linhas de contratos */}
      <div className="flex flex-col gap-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="bg-surface border border-border rounded-[12px] px-4 py-3 flex items-center gap-3">
            <Skeleton className="h-5 w-14 flex-shrink-0" />
            <div className="flex flex-col gap-1.5 flex-1 min-w-0">
              <Skeleton className="h-3.5 w-44" />
              <Skeleton className="h-3 w-32" />
            </div>
            <Skeleton className="h-7 w-20 flex-shrink-0" />
          </div>
        ))}
      </div>
    </div>
  )
}
