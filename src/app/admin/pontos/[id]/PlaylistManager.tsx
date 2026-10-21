'use client'

import { useTransition, useState } from 'react'
import {
  adicionarVideoPlaylist,
  removerItemPlaylist,
  toggleItemPlaylist,
} from '@/lib/actions/playlist'
import { Button } from '@/components/ui/button'

interface ItemPlaylist {
  id: number
  video_id: number
  ordem: number
  ativo: boolean
  titulo: string
  anunciante: string
}

interface VideoDisponivel {
  id: number
  titulo: string
  anunciante: string
  contrato_id: number | null
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

  function adicionar() {
    if (!videoSelecionado) return
    const video = videosDisponiveis.find((v) => String(v.id) === videoSelecionado)
    if (!video) return
    start(() => adicionarVideoPlaylist(pontoId, video.id, video.contrato_id))
    setVideoSelecionado('')
  }

  return (
    <div className="flex flex-col gap-3">
      {playlist.length === 0 ? (
        <p className="text-[13px] text-subtle">Nenhum vídeo na playlist.</p>
      ) : (
        <div className="flex flex-col gap-1.5">
          {playlist.map((item, idx) => (
            <div
              key={item.id}
              className={`flex items-center gap-3 bg-surface border border-border rounded-[8px] px-3 py-2.5 ${!item.ativo ? 'opacity-50' : ''}`}
            >
              <span className="text-[11px] text-subtle w-4 flex-shrink-0 text-right">{idx + 1}</span>
              <div className="flex-1 min-w-0">
                <p className="text-[13px] font-medium text-fg truncate">{item.titulo}</p>
                <p className="text-[11px] text-subtle truncate">{item.anunciante}</p>
              </div>
              <button
                disabled={pending}
                onClick={() => start(() => toggleItemPlaylist(item.id, !item.ativo, pontoId))}
                className="text-[12px] text-muted hover:text-fg transition-colors disabled:opacity-40 disabled:cursor-wait flex-shrink-0"
              >
                {item.ativo ? 'Pausar' : 'Ativar'}
              </button>
              <button
                disabled={pending}
                onClick={() => start(() => removerItemPlaylist(item.id, pontoId))}
                className="text-[12px] text-error hover:text-error/80 transition-colors disabled:opacity-40 disabled:cursor-wait flex-shrink-0"
              >
                Remover
              </button>
            </div>
          ))}
        </div>
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
