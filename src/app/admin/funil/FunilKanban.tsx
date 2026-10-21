'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import { Plus } from 'lucide-react'
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  useDroppable,
  useDraggable,
  type DragEndEvent,
  type DragStartEvent,
} from '@dnd-kit/core'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { NovoLeadModal } from './NovoLeadModal'
import { moverLead } from '@/lib/actions/leads'
import { cn } from '@/lib/utils'

export type Lead = {
  id: number
  empresa: string
  segmento: string | null
  telefone: string | null
  proxima_acao: string | null
  etapa: string
}

const ETAPAS: { key: string; label: string; cor: string }[] = [
  { key: 'a_contatar', label: 'A contatar', cor: 'text-subtle' },
  { key: 'mensagem_enviada', label: 'Mensagem enviada', cor: 'text-accent' },
  { key: 'respondeu', label: 'Respondeu', cor: 'text-online' },
  { key: 'pediu_preco', label: 'Pediu preco', cor: 'text-alert' },
  { key: 'fechado', label: 'Fechado', cor: 'text-online' },
  { key: 'recusou', label: 'Recusou', cor: 'text-error' },
]

function LeadCard({ lead, isDragging }: { lead: Lead; isDragging?: boolean }) {
  return (
    <div
      className={cn(
        'bg-elevated border border-border rounded-[10px] px-3 py-3 flex flex-col gap-2 cursor-grab active:cursor-grabbing select-none',
        isDragging && 'opacity-50',
      )}
    >
      <p className="text-[13px] font-medium text-fg leading-snug">{lead.empresa}</p>
      <div className="flex flex-wrap gap-1">
        {lead.segmento && (
          <Badge variant="default" className="text-[10px]">
            {lead.segmento}
          </Badge>
        )}
        {lead.telefone && (
          <span className="text-[11px] text-subtle">{lead.telefone}</span>
        )}
      </div>
      {lead.proxima_acao && (
        <p className="text-[11px] text-muted leading-snug">{lead.proxima_acao}</p>
      )}
      <div className="flex justify-end">
        <Link
          href={`/admin/funil/${lead.id}`}
          className="text-[11px] text-subtle hover:text-accent transition-colors"
          onClick={(e) => e.stopPropagation()}
        >
          Editar
        </Link>
      </div>
    </div>
  )
}

function DraggableLead({ lead }: { lead: Lead }) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: String(lead.id),
    data: { lead },
  })

  return (
    <div ref={setNodeRef} {...attributes} {...listeners}>
      <LeadCard lead={lead} isDragging={isDragging} />
    </div>
  )
}

function KanbanColumn({
  etapa,
  leads,
  isOver,
}: {
  etapa: { key: string; label: string; cor: string }
  leads: Lead[]
  isOver: boolean
}) {
  const { setNodeRef } = useDroppable({ id: etapa.key })

  return (
    <div
      ref={setNodeRef}
      className={cn(
        'flex flex-col gap-2 min-w-[220px] w-[220px] flex-shrink-0',
        isOver && 'ring-2 ring-accent/30 rounded-[12px]',
      )}
    >
      <div className="flex items-center justify-between px-1 pb-1 border-b border-border">
        <span className={cn('text-[12px] font-semibold uppercase tracking-wide', etapa.cor)}>
          {etapa.label}
        </span>
        <span className="text-[11px] text-subtle bg-elevated px-1.5 py-0.5 rounded-full">
          {leads.length}
        </span>
      </div>
      <div className="flex flex-col gap-2 min-h-[80px]">
        {leads.map((lead) => (
          <DraggableLead key={lead.id} lead={lead} />
        ))}
      </div>
    </div>
  )
}

export function FunilKanban({ leads: leadsInicial }: { leads: Lead[] }) {
  const [leads, setLeads] = useState<Lead[]>(leadsInicial)
  const [activeId, setActiveId] = useState<string | null>(null)
  const [overColumn, setOverColumn] = useState<string | null>(null)
  const [modalAberto, setModalAberto] = useState(false)
  const [, startTransition] = useTransition()

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
  )

  const activeLead = activeId ? leads.find((l) => String(l.id) === activeId) ?? null : null

  function handleDragStart(event: DragStartEvent) {
    setActiveId(String(event.active.id))
  }

  function handleDragOver(event: { over: { id?: string | number } | null }) {
    setOverColumn(event.over ? String(event.over.id) : null)
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event
    setActiveId(null)
    setOverColumn(null)

    if (!over) return

    const leadId = Number(active.id)
    const novaEtapa = String(over.id)

    const lead = leads.find((l) => l.id === leadId)
    if (!lead || lead.etapa === novaEtapa) return

    setLeads((prev) =>
      prev.map((l) => (l.id === leadId ? { ...l, etapa: novaEtapa } : l)),
    )

    startTransition(async () => {
      await moverLead(leadId, novaEtapa)
    })
  }

  return (
    <div>
      <div className="flex justify-end mb-4">
        <Button size="sm" onClick={() => setModalAberto(true)}>
          <Plus size={14} className="mr-1" />
          Novo lead
        </Button>
      </div>

      <DndContext
        sensors={sensors}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver as any}
        onDragEnd={handleDragEnd}
      >
        <div className="overflow-x-auto pb-4">
          <div className="flex gap-4 min-w-max">
            {ETAPAS.map((etapa) => (
              <KanbanColumn
                key={etapa.key}
                etapa={etapa}
                leads={leads.filter((l) => l.etapa === etapa.key)}
                isOver={overColumn === etapa.key}
              />
            ))}
          </div>
        </div>

        <DragOverlay>
          {activeLead ? <LeadCard lead={activeLead} /> : null}
        </DragOverlay>
      </DndContext>

      <NovoLeadModal open={modalAberto} onClose={() => setModalAberto(false)} />
    </div>
  )
}
