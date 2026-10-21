'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import { Phone, Search } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Avatar } from '@/components/ui/avatar'
import { EmptyState } from '@/components/ui/empty-state'
import { Users } from 'lucide-react'
import { cn } from '@/lib/utils'

type Anunciante = {
  id: number
  nome: string
  contato: string | null
  telefone: string | null
  whatsapp: string | null
  segmento: string | null
  contratos_ativos: string | number
  total_videos: string | number
  vencendo: boolean
}

type TabKey = 'todos' | 'ativos' | 'sem_contrato' | 'vencendo'

const TABS: { key: TabKey; label: string }[] = [
  { key: 'todos', label: 'Todos' },
  { key: 'ativos', label: 'Ativos' },
  { key: 'sem_contrato', label: 'Sem contrato' },
  { key: 'vencendo', label: 'Vencendo' },
]

export function AnunciantesClient({ anunciantes }: { anunciantes: Anunciante[] }) {
  const [busca, setBusca] = useState('')
  const [tab, setTab] = useState<TabKey>('todos')

  const filtrados = useMemo(() => {
    let lista = anunciantes

    if (tab === 'ativos') {
      lista = lista.filter((a) => Number(a.contratos_ativos) > 0)
    } else if (tab === 'sem_contrato') {
      lista = lista.filter((a) => Number(a.contratos_ativos) === 0)
    } else if (tab === 'vencendo') {
      lista = lista.filter((a) => a.vencendo)
    }

    if (busca.trim()) {
      const termo = busca.trim().toLowerCase()
      lista = lista.filter(
        (a) =>
          a.nome.toLowerCase().includes(termo) ||
          (a.contato && a.contato.toLowerCase().includes(termo)) ||
          (a.segmento && a.segmento.toLowerCase().includes(termo)),
      )
    }

    return lista
  }, [anunciantes, tab, busca])

  return (
    <div>
      {/* Busca */}
      <div className="relative mb-4">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-subtle pointer-events-none" />
        <input
          type="search"
          placeholder="Buscar anunciante..."
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          className="w-full pl-8 pr-3 py-2 text-[14px] bg-surface border border-border rounded-[10px] text-fg placeholder:text-subtle focus:outline-none focus:border-accent/50 transition-colors"
        />
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-4 border-b border-border">
        {TABS.map((t) => {
          const count =
            t.key === 'todos'
              ? anunciantes.length
              : t.key === 'ativos'
                ? anunciantes.filter((a) => Number(a.contratos_ativos) > 0).length
                : t.key === 'sem_contrato'
                  ? anunciantes.filter((a) => Number(a.contratos_ativos) === 0).length
                  : anunciantes.filter((a) => a.vencendo).length

          return (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={cn(
                'flex items-center gap-1.5 px-3 py-2 text-[13px] font-medium border-b-2 -mb-px transition-colors',
                tab === t.key
                  ? 'border-accent text-accent'
                  : 'border-transparent text-muted hover:text-fg',
              )}
            >
              {t.label}
              <span
                className={cn(
                  'text-[11px] px-1.5 py-0.5 rounded-full',
                  tab === t.key ? 'bg-accent/15 text-accent' : 'bg-elevated text-subtle',
                )}
              >
                {count}
              </span>
            </button>
          )
        })}
      </div>

      {/* Lista */}
      {filtrados.length === 0 ? (
        <EmptyState
          icon={Users}
          title="Nenhum resultado"
          description={
            busca
              ? `Nenhum anunciante encontrado para "${busca}".`
              : 'Nenhum anunciante nesta categoria.'
          }
        />
      ) : (
        <div className="flex flex-col gap-2">
          {filtrados.map((a) => (
            <div
              key={a.id}
              className="flex items-center justify-between gap-4 bg-surface border border-border rounded-[12px] px-4 py-3 hover:border-border-subtle transition-colors group"
            >
              <Link
                href={`/admin/anunciantes/${a.id}`}
                className="flex items-center gap-3 min-w-0 flex-1"
              >
                <Avatar name={a.nome} className="flex-shrink-0" />
                <div className="min-w-0">
                  <p className="text-[14px] font-medium text-fg group-hover:text-accent transition-colors truncate">
                    {a.nome}
                  </p>
                  <p className="text-[12px] text-subtle truncate">
                    {[a.contato, a.segmento, a.telefone].filter(Boolean).join(' · ')}
                  </p>
                </div>
              </Link>

              <div className="flex items-center gap-2 flex-shrink-0">
                {a.vencendo && Number(a.contratos_ativos) > 0 && (
                  <Badge variant="alert">vencendo</Badge>
                )}
                {Number(a.contratos_ativos) > 0 ? (
                  <Badge variant="online">
                    {a.contratos_ativos} ativo{Number(a.contratos_ativos) !== 1 ? 's' : ''}
                  </Badge>
                ) : (
                  <Badge variant="muted">sem contrato</Badge>
                )}
                {Number(a.total_videos) > 0 && (
                  <Badge variant="default">
                    {a.total_videos} vídeo{Number(a.total_videos) !== 1 ? 's' : ''}
                  </Badge>
                )}
                {a.whatsapp && (
                  <a
                    href={`https://wa.me/${a.whatsapp.replace(/\D/g, '')}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    className="flex items-center justify-center w-7 h-7 rounded-[8px] bg-online/10 text-online hover:bg-online/20 transition-colors"
                    title={`WhatsApp: ${a.whatsapp}`}
                  >
                    <Phone size={13} />
                  </a>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
