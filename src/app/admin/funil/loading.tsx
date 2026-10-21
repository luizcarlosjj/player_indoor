import { Skeleton } from '@/components/ui/skeleton'

export default function Loading() {
  return (
    <div>
      {/* PageHeader skeleton */}
      <div className="flex items-start justify-between gap-4 mb-6">
        <div className="flex flex-col gap-2">
          <Skeleton className="h-5 w-24" />
          <Skeleton className="h-3 w-56" />
        </div>
      </div>

      {/* 6 colunas do funil */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {Array.from({ length: 6 }).map((_, col) => (
          <div key={col} className="flex flex-col gap-2">
            {/* Cabeçalho da coluna */}
            <Skeleton className="h-3 w-20 mb-1" />
            {/* 2-3 cards por coluna */}
            {Array.from({ length: col % 2 === 0 ? 3 : 2 }).map((_, card) => (
              <div key={card} className="bg-surface border border-border rounded-[12px] p-3 flex flex-col gap-2">
                <Skeleton className="h-3 w-full" />
                <Skeleton className="h-3 w-2/3" />
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  )
}
