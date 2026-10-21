'use client'

import { useTransition, useEffect, useState } from 'react'
import { ExternalLink } from 'lucide-react'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Field } from '@/components/ui/field'
import { Button } from '@/components/ui/button'
import { CopyButton } from '@/components/ui/copy-button'
import { PlaylistManager } from './PlaylistManager'
import { HorarioEditor } from './HorarioEditor'
import { QrCode } from './QrCode'
import { atualizarPonto, forcarAtualizacao } from '@/lib/actions/pontos'
import { tempoRelativo } from '@/lib/utils'

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

interface Ponto {
  id: number
  nome: string
  endereco: string | null
  orientacao: string
  rotacao_graus: number
  repasse_mensal: number
  ativo: boolean
  token_player: string
  horario: Record<string, { inicio: string; fim: string }> | null
}

interface UltimoHeartbeat {
  recebido_em: string
  versao_player: string | null
  info: Record<string, unknown> | null
}

interface PontosTabsProps {
  ponto: Ponto
  playlist: ItemPlaylist[]
  videosDisponiveis: VideoDisponivel[]
  ultimoHeartbeat: UltimoHeartbeat | null
  playerUrl: string
}

function AparelhoTab({
  ponto,
  playerUrl,
  ultimoHeartbeat,
}: {
  ponto: Ponto
  playerUrl: string
  ultimoHeartbeat: UltimoHeartbeat | null
}) {
  const [pending, start] = useTransition()
  const [origin, setOrigin] = useState('')
  useEffect(() => { setOrigin(window.location.origin) }, [])
  const fullUrl = origin ? `${origin}${playerUrl}` : playerUrl

  return (
    <div className="flex flex-col gap-6">
      {/* QR Code */}
      <div className="flex flex-col items-center gap-3 bg-surface border border-border rounded-[12px] p-6">
        <QrCode url={fullUrl} />
        <p className="text-[12px] text-subtle">Escaneie para abrir o player</p>
      </div>

      {/* URL com copiar */}
      <div className="bg-surface border border-border rounded-[12px] p-4">
        <p className="text-[11px] text-subtle uppercase tracking-widest mb-2">Link do player</p>
        <div className="flex items-center gap-2">
          <code className="flex-1 text-[12px] text-online bg-base px-3 py-2 rounded-[6px] truncate font-mono">
            {playerUrl}
          </code>
          <CopyButton value={fullUrl} />
          <a
            href={playerUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 text-[12px] text-info hover:text-info/80 transition-colors flex-shrink-0"
            title="Abrir player em nova aba"
            aria-label="Abrir player em nova aba"
          >
            <ExternalLink size={13} />
          </a>
        </div>
      </div>

      {/* Forçar atualização */}
      <div className="flex flex-col gap-2">
        <Button
          variant="secondary"
          size="sm"
          loading={pending}
          onClick={() => start(() => forcarAtualizacao(ponto.id))}
        >
          Forçar atualização
        </Button>
        <p className="text-[11px] text-subtle">
          Incrementa a versão da programação para forçar o player a recarregar.
        </p>
      </div>

      {/* Último heartbeat */}
      {ultimoHeartbeat && (
        <div className="bg-surface border border-border rounded-[12px] p-4">
          <p className="text-[11px] text-subtle uppercase tracking-widest mb-2">Último sinal</p>
          <p className="text-[13px] text-fg">
            {tempoRelativo(ultimoHeartbeat.recebido_em)}
          </p>
          {ultimoHeartbeat.versao_player && (
            <p className="text-[12px] text-subtle mt-1">
              Versão do player: {ultimoHeartbeat.versao_player}
            </p>
          )}
        </div>
      )}
    </div>
  )
}

export function PontosTabs({
  ponto,
  playlist,
  videosDisponiveis,
  ultimoHeartbeat,
  playerUrl,
}: PontosTabsProps) {
  const atualizarComId = atualizarPonto.bind(null, ponto.id)

  return (
    <Tabs defaultValue="programacao">
      <TabsList className="mb-6">
        <TabsTrigger value="programacao">Programação</TabsTrigger>
        <TabsTrigger value="dados">Dados</TabsTrigger>
        <TabsTrigger value="horario">Horário</TabsTrigger>
        <TabsTrigger value="aparelho">Aparelho</TabsTrigger>
      </TabsList>

      <TabsContent value="programacao">
        <PlaylistManager
          pontoId={ponto.id}
          playlist={playlist as ItemPlaylist[]}
          videosDisponiveis={videosDisponiveis as VideoDisponivel[]}
        />
      </TabsContent>

      <TabsContent value="dados">
        <form action={atualizarComId} className="flex flex-col gap-4 max-w-[480px]">
          <Field label="Nome" required>
            <input name="nome" required defaultValue={ponto.nome} />
          </Field>

          <Field label="Endereço">
            <input name="endereco" defaultValue={ponto.endereco ?? ''} />
          </Field>

          <div className="grid grid-cols-2 gap-4">
            <Field label="Orientação">
              <select name="orientacao" defaultValue={ponto.orientacao}>
                <option value="vertical">Vertical</option>
                <option value="horizontal">Horizontal</option>
              </select>
            </Field>

            <Field label="Rotação">
              <select name="rotacao_graus" defaultValue={String(ponto.rotacao_graus)}>
                <option value="0">0°</option>
                <option value="90">90°</option>
                <option value="180">180°</option>
                <option value="270">270°</option>
              </select>
            </Field>
          </div>

          <Field label="Repasse mensal (R$)">
            <input
              name="repasse_mensal"
              type="number"
              min="0"
              step="0.01"
              defaultValue={String(ponto.repasse_mensal)}
            />
          </Field>

          <Field label="Status">
            <select name="ativo" defaultValue={String(ponto.ativo)}>
              <option value="true">Ativo</option>
              <option value="false">Inativo</option>
            </select>
          </Field>

          <div className="pt-1">
            <Button type="submit" size="md">Salvar</Button>
          </div>
        </form>
      </TabsContent>

      <TabsContent value="horario">
        <HorarioEditor pontoId={ponto.id} horarioAtual={ponto.horario} />
      </TabsContent>

      <TabsContent value="aparelho">
        <AparelhoTab
          ponto={ponto}
          playerUrl={playerUrl}
          ultimoHeartbeat={ultimoHeartbeat}
        />
      </TabsContent>
    </Tabs>
  )
}
