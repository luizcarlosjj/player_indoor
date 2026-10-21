'use client'

import { useTransition, useState } from 'react'
import {
  DndContext,
  closestCenter,
  DragEndEvent,
} from '@dnd-kit/core'
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
  arrayMove,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { GripVertical } from 'lucide-react'
import {
  adicionarVideoPlaylist,
  removerItemPlaylist,
  toggleItemPlaylist,
  reordenarPlaylist,
} from '@/lib/actions/playlist'
import { Button } from '@/components/ui/button'

interface ItemPlaylist {
  id: number
  video_id: number
  ordem: number
  ativo: boolean
  titulo: string
  anunciante: string
  duracao_segundos: number | null
}

interface VideoDisponivel {
  id: number
  titulo: string
  anunciante: string
  contrato_id: number | null
}

interface SortableItemProps {
  item: ItemPlaylist
  idx: number
  pending: boolean
  pontoId: number
  onToggle: (id: number, ativo: boolean) => void
  onRemover: (id: number) => void
}

function SortableItem({ item, idx, pending, onToggle, onRemover }: SortableItemProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: String(item.id) })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={[
        'flex items-center gap-3 bg-surface border border-border rounded-[8px] px-3 py-2.5',
        !item.ativo ? 'opacity-50' : '',
        isDragging ? 'z-50 shadow-lg opacity-90' : '',
      ]
        .filter(Boolean)
        .join(' ')}
    >
      <button
        {...attributes}
        {...listeners}
        className="text-subtle hover:text-muted cursor-grab active:cursor-grabbing flex-shrink-0 touch-none"
        tabIndex={-1}
        aria-label="Arrastar para reordenar"
      >
        <GripVertical size={14} />
      </button>

      <span className="text-[11px] text-subtle w-4 flex-shrink-0 text-right">{idx + 1}</span>

      <div className="flex-1 min-w-0">
        <p className="text-[13px] font-medium text-fg truncate">{item.titulo}</p>
        <p className="text-[11px] text-subtle truncate">{item.anunciante}</p>
      </div>

      <button
        disabled={pending}
        onClick={() => onToggle(item.id, !item.ativo)}
        className="text-[12px] text-muted hover:text-fg transition-colors disabled:opacity-40 disabled:cursor-wait flex-shrink-0"
      >
        {item.ativo ? 'Pausar' : 'Ativar'}
      </button>
      <button
        disabled={pending}
        onClick={() => onRemover(item.id)}
        className="text-[12px] text-error hover:text-error/80 transition-colors disabled:opacity-40 disabled:cursor-wait flex-shrink-0"
      >
        Remover
      </button>
    </div>
  )
}

export function PlaylistManager({
  pontoId,
  playlist,
  videosDisponiveis,
}: {
  pontoId: number
  playlist: ItemPlaylist[]
  videosDisponiveis: VideoDisponivel[]
}) {
  const [pending, start] = useTransition()
  const [videoSelecionado, setVideoSelecionado] = useState('')
  const [itens, setItens] = useState<ItemPlaylist[]>(() =>
    [...playlist].sort((a, b) => a.ordem - b.ordem),
  )

  const totalSegundos = itens.reduce((acc, i) => acc + (i.duracao_segundos ?? 0), 0)

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event
    if (!over || active.id === over.id) return

    const oldIndex = itens.findIndex((i) => String(i.id) === active.id)
    const newIndex = itens.findIndex((i) => String(i.id) === over.id)
    if (oldIndex === -1 || newIndex === -1) return

    const reordenados = arrayMove(itens, oldIndex, newIndex).map((item, idx) => ({
      ...item,
      ordem: idx,
    }))
    setItens(reordenados)

    start(() =>
      reordenarPlaylist(
        pontoId,
        reordenados.map((i) => ({ id: i.id, ordem: i.ordem })),
      ),
    )
  }

  function handleToggle(id: number, ativo: boolean) {
    setItens((prev) => prev.map((i) => (i.id === id ? { ...i, ativo } : i)))
    start(() => toggleItemPlaylist(id, ativo, pontoId))
  }

  function handleRemover(id: number) {
    setItens((prev) => prev.filter((i) => i.id !== id))
    start(() => removerItemPlaylist(id, pontoId))
  }

  function adicionar() {
    if (!videoSelecionado) return
    const video = videosDisponiveis.find((v) => String(v.id) === videoSelecionado)
    if (!video) return
    start(() => adicionarVideoPlaylist(pontoId, video.id, video.contrato_id))
    setVideoSelecionado('')
  }

  return (
    <div className="flex flex-col gap-3">
      {itens.length > 0 && (
        <p className="text-[12px] text-subtle">
          {itens.length} {itens.length === 1 ? 'vídeo' : 'vídeos'} · {totalSegundos} segundos total
        </p>
      )}

      {itens.length === 0 ? (
        <p className="text-[13px] text-subtle">Nenhum vídeo na playlist.</p>
      ) : (
        <DndContext collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext
            items={itens.map((i) => String(i.id))}
            strategy={verticalListSortingStrategy}
          >
            <div className="flex flex-col gap-1.5">
              {itens.map((item, idx) => (
                <SortableItem
                  key={item.id}
                  item={item}
                  idx={idx}
                  pending={pending}
                  pontoId={pontoId}
                  onToggle={handleToggle}
                  onRemover={handleRemover}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      )}

      {videosDisponiveis.length > 0 && (
        <div className="flex gap-2">
          <select
            value={videoSelecionado}
            onChange={(e) => setVideoSelecionado(e.target.value)}
            className="flex-1"
          >
            <option value="">Selecionar vídeo...</option>
            {videosDisponiveis.map((v) => (
              <option key={v.id} value={String(v.id)}>
                {v.anunciante} — {v.titulo}
              </option>
            ))}
          </select>
          <Button
            size="sm"
            disabled={pending || !videoSelecionado}
            onClick={adicionar}
          >
            Adicionar
          </Button>
        </div>
      )}

      {videosDisponiveis.length === 0 && (
        <p className="text-[12px] text-subtle">
          Cadastre vídeos em Anunciantes para adicioná-los aqui.
        </p>
      )}
    </div>
  )
}
