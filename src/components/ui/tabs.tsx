'use client'

import { createContext, useContext, useState } from 'react'
import { cn } from '@/lib/utils'

interface TabsContextValue { active: string; setActive: (v: string) => void }
const TabsContext = createContext<TabsContextValue>({ active: '', setActive: () => {} })

interface TabsProps { defaultValue: string; children: React.ReactNode; className?: string }

export function Tabs({ defaultValue, children, className }: TabsProps) {
  const [active, setActive] = useState(defaultValue)
  return (
    <TabsContext.Provider value={{ active, setActive }}>
      <div className={className}>{children}</div>
    </TabsContext.Provider>
  )
}

export function TabsList({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div
      role="tablist"
      className={cn(
        'flex gap-1 bg-elevated border border-border rounded-[var(--radius-input)] p-1 overflow-x-auto',
        className,
      )}
    >
      {children}
    </div>
  )
}

export function TabsTrigger({ value, children }: { value: string; children: React.ReactNode }) {
  const { active, setActive } = useContext(TabsContext)
  const isActive = active === value
  return (
    <button
      role="tab"
      aria-selected={isActive}
      onClick={() => setActive(value)}
      className={cn(
        'px-3 py-1.5 rounded-[6px] text-[13px] font-medium transition-all duration-150 whitespace-nowrap flex-shrink-0',
        isActive ? 'bg-surface text-fg shadow-sm' : 'text-muted hover:text-fg',
      )}
    >
      {children}
    </button>
  )
}

export function TabsContent({ value, children, className }: { value: string; children: React.ReactNode; className?: string }) {
  const { active } = useContext(TabsContext)
  if (active !== value) return null
  return <div role="tabpanel" className={className}>{children}</div>
}
