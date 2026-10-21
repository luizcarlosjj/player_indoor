'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import {
  LayoutDashboard, Monitor, Plus, Users, FileText, Kanban, BarChart2,
} from 'lucide-react'

interface NavLink {
  href: string
  label: string
  icon: React.ElementType
  hint?: string
}

const LINKS: NavLink[] = [
  { href: '/admin',                label: 'Início',            icon: LayoutDashboard },
  { href: '/admin/pontos',         label: 'Telas',             icon: Monitor },
  { href: '/admin/pontos/novo',    label: 'Nova tela',         icon: Plus },
  { href: '/admin/anunciantes',    label: 'Anunciantes',       icon: Users },
  { href: '/admin/anunciantes/novo', label: 'Novo anunciante', icon: Plus },
  { href: '/admin/contratos',      label: 'Contratos',         icon: FileText },
  { href: '/admin/funil',          label: 'Funil de vendas',   icon: Kanban },
  { href: '/admin/relatorios',     label: 'Relatórios',        icon: BarChart2 },
]

export function CommandPalette() {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)
  const router = useRouter()

  const close = useCallback(() => {
    setOpen(false)
    setQuery('')
  }, [])

  // Ouve Cmd+K / Ctrl+K para abrir a paleta
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        setOpen((prev) => !prev)
      }
      if (e.key === 'Escape') {
        close()
      }
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [close])

  // Foca no campo de busca ao abrir
  useEffect(() => {
    if (open) {
      // Aguarda o próximo frame para garantir que o elemento está montado
      requestAnimationFrame(() => {
        inputRef.current?.focus()
      })
    }
  }, [open])

  function handleNavigate(href: string) {
    close()
    router.push(href)
  }

  const filtered = query.trim()
    ? LINKS.filter((link) =>
        link.label.toLowerCase().includes(query.toLowerCase())
      )
    : LINKS

  if (!open) return null

  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 bg-black/50 z-50"
        aria-hidden="true"
        onClick={close}
      />

      {/* Painel */}
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Paleta de comandos — navegação rápida"
        className="fixed top-[20%] left-1/2 -translate-x-1/2 z-50 w-full max-w-[400px] bg-surface border border-border rounded-[16px] shadow-2xl overflow-hidden"
      >
        {/* Campo de busca */}
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Ir para..."
          aria-label="Pesquisar destino"
          className="px-4 py-3 border-b border-border text-[14px] bg-transparent outline-none placeholder:text-subtle text-fg w-full"
        />

        {/* Lista de links */}
        <ul
          role="listbox"
          aria-label="Destinos disponíveis"
          className="max-h-[320px] overflow-y-auto"
        >
          {filtered.length === 0 && (
            <li className="px-4 py-3 text-[13px] text-muted">
              Nenhum resultado para &quot;{query}&quot;
            </li>
          )}
          {filtered.map((link) => {
            const Icon = link.icon
            return (
              <li key={link.href} role="option" aria-selected="false">
                <button
                  onClick={() => handleNavigate(link.href)}
                  className="group flex items-center gap-3 px-4 py-2.5 hover:bg-elevated cursor-pointer text-[13px] text-fg transition-colors w-full text-left"
                >
                  <Icon size={15} className="text-muted flex-shrink-0" />
                  <span className="flex-1">{link.label}</span>
                  <span className="text-subtle text-[11px] opacity-0 group-hover:opacity-100 transition-opacity ml-auto">
                    ↵ abrir
                  </span>
                </button>
              </li>
            )
          })}
        </ul>
      </div>
    </>
  )
}
