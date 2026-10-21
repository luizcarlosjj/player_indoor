'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState, useEffect } from 'react'
import {
  LayoutDashboard, Monitor, Users, FileText, TrendingUp, BarChart2, Tv,
  ChevronLeft, ChevronRight, LogOut, Sun, Moon,
} from 'lucide-react'
import Image from 'next/image'
import { cn } from '@/lib/utils'
import { useTheme } from '@/components/providers/theme-provider'
import { StatusDot } from '@/components/ui/status-dot'
import { signOut } from 'next-auth/react'

interface NavItem {
  href: string
  label: string
  icon: React.ElementType
  exact?: boolean
}

const NAV: NavItem[] = [
  { href: '/admin',            label: 'Início',       icon: LayoutDashboard, exact: true },
  { href: '/admin/pontos',     label: 'Telas',        icon: Monitor },
  { href: '/admin/anunciantes',label: 'Anunciantes',  icon: Users },
  { href: '/admin/contratos',   label: 'Contratos',    icon: FileText },
  { href: '/admin/financeiro',  label: 'Financeiro',   icon: TrendingUp },
  { href: '/admin/playlists',   label: 'Playlists',    icon: Tv },
  { href: '/admin/relatorios',  label: 'Relatórios',   icon: BarChart2 },
]

interface SidebarProps {
  tvsOnline: number
  tvsTotal: number
}

export function Sidebar({ tvsOnline, tvsTotal }: SidebarProps) {
  const pathname = usePathname()
  const { theme, toggle } = useTheme()
  const [collapsed, setCollapsed] = useState(false)

  useEffect(() => {
    const saved = localStorage.getItem('sidebar-collapsed')
    if (saved === 'true') setCollapsed(true)
  }, [])

  function toggleCollapse() {
    setCollapsed((v) => {
      localStorage.setItem('sidebar-collapsed', String(!v))
      return !v
    })
  }

  function isActive(item: NavItem) {
    return item.exact ? pathname === item.href : pathname.startsWith(item.href)
  }

  return (
    <aside
      className={cn(
        'hidden lg:flex flex-col h-screen sticky top-0',
        'bg-surface border-r border-border transition-all duration-200 ease-in-out flex-shrink-0',
        collapsed ? 'w-[64px]' : 'w-[220px]',
      )}
    >
      {/* Logo */}
      <div className={cn(
        'flex items-center justify-center border-b border-border flex-shrink-0',
        collapsed ? 'px-3 py-3' : 'px-4 py-3',
      )}>
        {collapsed ? (
          <span className="text-[13px] font-black text-fg tracking-tighter leading-none select-none">TS</span>
        ) : (
          <Image
            src={theme === 'dark' ? '/logo-escuro.jpeg' : '/logo-claro.jpeg'}
            alt="Tenax Sistemas"
            width={160}
            height={56}
            className="h-10 w-auto object-contain"
            priority
          />
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 p-2 space-y-0.5 overflow-y-auto">
        {NAV.map((item) => {
          const Icon = item.icon
          const active = isActive(item)
          return (
            <Link
              key={item.href}
              href={item.href}
              title={collapsed ? item.label : undefined}
              className={cn(
                'flex items-center gap-2.5 px-2.5 py-2 rounded-[8px] transition-colors duration-150',
                'text-[13px] font-medium',
                collapsed && 'justify-center',
                active
                  ? 'bg-accent/10 text-accent'
                  : 'text-muted hover:text-fg hover:bg-elevated',
              )}
            >
              <Icon size={16} className="flex-shrink-0" />
              {!collapsed && <span>{item.label}</span>}
            </Link>
          )
        })}
      </nav>

      {/* Rodapé */}
      <div className="border-t border-border p-2 space-y-1 flex-shrink-0">
        {/* TVs online */}
        {!collapsed && tvsTotal > 0 && (
          <div className="px-2.5 py-2">
            <StatusDot
              status={tvsOnline > 0 ? 'online' : 'offline'}
              label={`${tvsOnline} de ${tvsTotal} no ar`}
              pulse={tvsOnline > 0}
            />
          </div>
        )}

        {/* Dica de atalho */}
        {!collapsed && (
          <div className="px-2.5 py-1.5">
            <p className="text-[11px] text-subtle">
              <kbd className="font-mono bg-elevated px-1 rounded text-[10px]">⌘K</kbd> navegação rápida
            </p>
          </div>
        )}

        {/* Theme toggle */}
        <button
          onClick={toggle}
          title={theme === 'dark' ? 'Tema claro' : 'Tema escuro'}
          aria-label={theme === 'dark' ? 'Alternar para tema claro' : 'Alternar para tema escuro'}
          className={cn(
            'flex items-center gap-2.5 px-2.5 py-2 rounded-[8px] w-full',
            'text-[13px] text-muted hover:text-fg hover:bg-elevated transition-colors duration-150',
            collapsed && 'justify-center',
          )}
        >
          {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
          {!collapsed && <span>{theme === 'dark' ? 'Tema claro' : 'Tema escuro'}</span>}
        </button>

        {/* Recolher/expandir */}
        <button
          onClick={toggleCollapse}
          title={collapsed ? 'Expandir menu' : 'Recolher menu'}
          aria-label={collapsed ? 'Expandir menu lateral' : 'Recolher menu lateral'}
          className={cn(
            'flex items-center gap-2.5 px-2.5 py-2 rounded-[8px] w-full',
            'text-[13px] text-subtle hover:text-fg hover:bg-elevated transition-colors duration-150',
            collapsed && 'justify-center',
          )}
        >
          {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
          {!collapsed && <span>Recolher</span>}
        </button>

        {/* Sair */}
        <button
          onClick={() => signOut({ callbackUrl: '/admin/login' })}
          title="Sair"
          aria-label="Sair da conta"
          className={cn(
            'flex items-center gap-2.5 px-2.5 py-2 rounded-[8px] w-full',
            'text-[13px] text-subtle hover:text-error hover:bg-error/10 transition-colors duration-150',
            collapsed && 'justify-center',
          )}
        >
          <LogOut size={16} />
          {!collapsed && <span>Sair</span>}
        </button>
      </div>
    </aside>
  )
}
