'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, Monitor, Users, TrendingUp, Tv } from 'lucide-react'
import { cn } from '@/lib/utils'

const NAV = [
  { href: '/admin',             label: 'Início',      icon: LayoutDashboard, exact: true },
  { href: '/admin/pontos',      label: 'Telas',       icon: Monitor },
  { href: '/admin/anunciantes', label: 'Anunciantes', icon: Users },
  { href: '/admin/financeiro',  label: 'Financeiro',  icon: TrendingUp },
  { href: '/admin/playlists',   label: 'Playlists',   icon: Tv },
]

export function MobileNav() {
  const pathname = usePathname()

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-surface border-t border-border">
      <div className="grid grid-cols-5 h-[60px]">
        {NAV.map((item) => {
          const Icon = item.icon
          const active = item.exact ? pathname === item.href : pathname.startsWith(item.href)
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex flex-col items-center justify-center gap-0.5 min-h-[44px]',
                'text-[10px] font-medium transition-colors duration-150',
                active ? 'text-accent' : 'text-subtle hover:text-muted',
              )}
            >
              <Icon size={20} strokeWidth={active ? 2.2 : 1.8} />
              <span>{item.label}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
