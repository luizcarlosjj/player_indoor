'use client'

import { useState, useTransition, useEffect, useCallback } from 'react'
import { GripVertical, RefreshCw } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { StatusDot } from '@/components/ui/status-dot'
import { tempoRelativo } from '@/lib/utils'
import { atualizarDuracaoVideo } from '@/lib/actions/playlist'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type VideoItem = {
  item_id: number
  video_id: number
  ordem: number
  item_ativo: boolean
  titulo: string
  duracao_segundos: number | null
  tipo: string | null
  anunciante: string | null
}

type PontoComPlaylist = {
  ponto_id: number
  ponto_nome: string
  items: VideoItem[]
  ciclo_segundos: number
}

type AoVivoItem = {
  ponto_id: number
  ponto_nome: string
  video_titulo: string
  anunciante_nome: string | null
  inicio: string
  ultimo_heartbeat: string | null
}

interface PlaylistsClientProps {
  pontos: PontoComPlaylist[]
  pontoNomes: { id: number; nome: string }[]
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatCiclo(s: number): string {
  if (s < 60) return `${s}s`
  const m = Math.floor(s / 60)
  const r = s % 60
  return r > 0 ? `${m}min ${r}s` : `${m}min`
}

function isOnline(ultimoHeartbeat: string | null): boolean {
  if (!ultimoHeartbeat) return false
  return Date.now() - new Date(ultimoHeartbeat).getTime() < 5 * 60 * 1000
}

// ---------------------------------------------------------------------------
// Duration input cell
// ---------------------------------------------------------------------------

function DuracaoInput({
  videoId,
  inicial,
  editMap,
  setEditMap,
}: {
  videoId: number
  inicial: number | null
  editMap: Map<number, number>
  setEditMap: React.Dispatch<React.SetStateAction<Map<number, number>>>
}) {
  const [pending, start] = useTransition()
  const [salvo, setSalvo] = useState(false)

  const currentValue = editMap.has(videoId) ? editMap.get(videoId)! : (inicial ?? 0)

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const val = Math.max(0, parseInt(e.target.value, 10) || 0)
    setEditMap((prev) => new Map(prev).set(videoId, val))
  }

  function commit() {
    const val = editMap.has(videoId) ? editMap.get(videoId)! : (inicial ?? 0)
    if (val === (inicial ?? 0)) return
    start(async () => {
      await atualizarDuracaoVideo(videoId, val)
      setSalvo(true)
      setTimeout(() => setSalvo(false), 1000)
    })
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter') {
      e.currentTarget.blur()
    }
  }

  return (
    <div className="flex items-center gap-1 flex-shrink-0">
      <input
        type="number"
        min={0}
        value={currentValue}
        onChange={handleChange}
        onBlur={commit}
        onKeyDown={handleKeyDown}
        disabled={pending}
        className="w-[60px] h-7 px-2 text-[12px] text-fg bg-elevated border border-border rounded-[6px] text-right focus:outline-none focus:ring-1 focus:ring-accent/50 disabled:opacity-50"
        aria-label="Duração em segundos"
      />
      <span className="text-[11px] text-subtle select-none">s</span>
      {salvo && (
        <span className="text-[11px] text-online font-medium select-none">salvo</span>
      )}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Playlist card per ponto
// ---------------------------------------------------------------------------

function PontoCard({
  ponto,
  editMap,
  setEditMap,
}: {
  ponto: PontoComPlaylist
  editMap: Map<number, number>
  setEditMap: React.Dispatch<React.SetStateAction<Map<number, number>>>
}) {
  return (
    <div className="bg-surface border border-border rounded-[12px] overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between gap-3 px-4 py-3 border-b border-border">
        <span className="font-semibold text-fg truncate">{ponto.ponto_nome}</span>
        {ponto.ciclo_segundos > 0 && (
          <Badge variant="muted">ciclo: {formatCiclo(ponto.ciclo_segundos)}</Badge>
        )}
      </div>

      {/* Items */}
      <div className="p-2 flex flex-col gap-1">
        {ponto.items.length === 0 ? (
          <p className="text-[12px] text-muted px-2 py-2">Sem videos</p>
        ) : (
          ponto.items.map((item) => (
            <div
              key={item.item_id}
              className={[
                'flex items-center gap-2.5 px-2 py-2 rounded-[8px] hover:bg-elevated/50 transition-colors',
                !item.item_ativo ? 'opacity-50' : '',
              ]
                .filter(Boolean)
                .join(' ')}
            >
              {/* Drag handle (static indicator only) */}
              <GripVertical size={14} className="text-subtle flex-shrink-0" />

              {/* Active status dot */}
              <StatusDot status={item.item_ativo ? 'online' : 'offline'} />

              {/* Title + anunciante */}
              <div className="flex-1 min-w-0">
                <p className="text-[13px] text-fg truncate leading-snug">{item.titulo}</p>
                {item.anunciante && (
                  <p className="text-[11px] text-subtle truncate leading-snug">{item.anunciante}</p>
                )}
              </div>

              {/* Duration input */}
              <DuracaoInput
                videoId={item.video_id}
                inicial={item.duracao_segundos}
                editMap={editMap}
                setEditMap={setEditMap}
              />

              {/* Type badge (only when not 'anunciante') */}
              {item.tipo && item.tipo !== 'anunciante' && (
                <Badge variant="default" className="flex-shrink-0">
                  {item.tipo}
                </Badge>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Ao vivo panel
// ---------------------------------------------------------------------------

function AoVivoPanel({ pontoNomes }: { pontoNomes: { id: number; nome: string }[] }) {
  const [aoVivo, setAoVivo] = useState<AoVivoItem[]>([])
  const [loading, setLoading] = useState(true)

  const atualizar = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/admin/ao-vivo')
      const data = await res.json()
      setAoVivo(data)
    } catch {
      // silently ignore fetch errors
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    atualizar()
    const interval = setInterval(atualizar, 15000)
    return () => clearInterval(interval)
  }, [atualizar])

  // Build a lookup from ponto_id to ao-vivo data
  const aoVivoMap = new Map<number, AoVivoItem>(aoVivo.map((r) => [r.ponto_id, r]))

  return (
    <div className="bg-surface border border-border rounded-[12px] p-4 flex flex-col gap-4">
      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <div>
          <div className="flex items-center gap-2 mb-0.5">
            <StatusDot status="online" pulse />
            <span className="font-semibold text-fg text-[14px]">Ao vivo</span>
          </div>
          <p className="text-[11px] text-subtle">Atualiza a cada 15s</p>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={atualizar}
          disabled={loading}
          className="flex-shrink-0"
        >
          <RefreshCw size={13} className={loading ? 'animate-spin' : ''} />
          Atualizar
        </Button>
      </div>

      {/* List */}
      <div className="flex flex-col gap-2">
        {loading && aoVivo.length === 0 ? (
          <div className="flex flex-col gap-2">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-14 bg-elevated rounded-[8px] animate-pulse" />
            ))}
          </div>
        ) : pontoNomes.length === 0 ? (
          <p className="text-[12px] text-muted text-center py-4">Nenhuma tela ativa.</p>
        ) : (
          pontoNomes.map((p) => {
            const dado = aoVivoMap.get(p.id)
            const online = dado ? isOnline(dado.ultimo_heartbeat) : false

            return (
              <div
                key={p.id}
                className="flex flex-col gap-1 bg-elevated rounded-[8px] px-3 py-2.5"
              >
                <div className="flex items-center gap-2">
                  <StatusDot status={online ? 'online' : 'offline'} />
                  <span className="text-[13px] font-medium text-fg flex-1 truncate">
                    {p.nome}
                  </span>
                </div>

                {dado ? (
                  <>
                    <p className="text-[12px] text-fg truncate pl-4">{dado.video_titulo}</p>
                    <div className="flex items-center gap-2 pl-4">
                      {dado.anunciante_nome && (
                        <span className="text-[11px] text-subtle truncate flex-1">
                          {dado.anunciante_nome}
                        </span>
                      )}
                      <span className="text-[11px] text-subtle flex-shrink-0">
                        {tempoRelativo(dado.inicio)}
                      </span>
                    </div>
                  </>
                ) : (
                  <p className="text-[11px] text-subtle pl-4">sem sinal</p>
                )}
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export function PlaylistsClient({ pontos, pontoNomes }: PlaylistsClientProps) {
  // Shared map of edited durations keyed by video_id
  const [editMap, setEditMap] = useState<Map<number, number>>(new Map())

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-6 items-start">
      {/* Left column: playlists por tela */}
      <div className="flex flex-col gap-4">
        <h2 className="text-[13px] font-semibold text-muted uppercase tracking-widest">
          Playlists por tela
        </h2>
        {pontos.length === 0 ? (
          <p className="text-[13px] text-subtle">Nenhuma tela ativa encontrada.</p>
        ) : (
          pontos.map((p) => (
            <PontoCard
              key={p.ponto_id}
              ponto={p}
              editMap={editMap}
              setEditMap={setEditMap}
            />
          ))
        )}
      </div>

      {/* Right column: ao vivo */}
      <div className="lg:sticky lg:top-4">
        <AoVivoPanel pontoNomes={pontoNomes} />
      </div>
    </div>
  )
}
