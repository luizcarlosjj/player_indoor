'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import { AlertTriangle, RefreshCw } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Modal } from '@/components/ui/modal'
import { formatBRL, formatDate } from '@/lib/utils'
import { renovarContrato } from '@/lib/actions/anunciantes'

interface Contrato {
  id: number
  anunciante_id: number
  anunciante_nome: string
  valor_mensal: number
  data_inicio: string
  data_fim: string
  status: string
}

function badgeVariant(status: string, vencido: boolean) {
  if (vencido || status === 'encerrado') return 'muted' as const
  if (status === 'ativo') return 'online' as const
  if (status === 'suspenso') return 'alert' as const
  return 'default' as const
}

const OPCOES_MESES = [
  { label: '1 mes', meses: 1 },
  { label: '3 meses', meses: 3 },
  { label: '6 meses', meses: 6 },
  { label: '12 meses', meses: 12 },
]

function RenovarBtn({ id }: { id: number }) {
  const [pending, start] = useTransition()
  const [open, setOpen] = useState(false)
  const [meses, setMeses] = useState(6)

  function confirmar() {
    setOpen(false)
    start(() => renovarContrato(id, meses))
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        disabled={pending}
        className="text-[12px] text-accent hover:text-accent/80 transition-colors disabled:opacity-40 disabled:cursor-wait"
      >
        <RefreshCw size={12} className="inline mr-1" />
        Renovar
      </button>
      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title="Renovar contrato"
        description="Sera criado um novo contrato com o mesmo valor, iniciando hoje."
      >
        <div className="mt-4 mb-5">
          <label className="block text-[12px] text-muted mb-2">Duração da renovação</label>
          <select
            value={meses}
            onChange={(e) => setMeses(Number(e.target.value))}
            className="w-full bg-base border border-border rounded-[8px] px-3 py-2 text-[13px] text-fg focus:outline-none focus:ring-1 focus:ring-accent"
          >
            {OPCOES_MESES.map((o) => (
              <option key={o.meses} value={o.meses}>{o.label}</option>
            ))}
          </select>
        </div>
        <div className="flex gap-3 justify-end">
          <Button variant="ghost" size="sm" onClick={() => setOpen(false)} disabled={pending}>
            Cancelar
          </Button>
          <Button variant="primary" size="sm" onClick={confirmar} loading={pending}>
            Renovar
          </Button>
        </div>
      </Modal>
    </>
  )
}

function ContratoRow({ c, showRenovar }: { c: Contrato; showRenovar: boolean }) {
  const hoje = new Date()
  const fim = new Date(c.data_fim)
  const em30 = new Date(Date.now() + 30 * 86400000)
  const em7 = new Date(Date.now() + 7 * 86400000)
  const vencendo = fim <= em30 && fim >= hoje && c.status === 'ativo'
  const vencendoUrgente = fim <= em7 && fim >= hoje && c.status === 'ativo'
  const vencido = fim < hoje || c.status === 'encerrado'

  const diasRestantes = vencendoUrgente
    ? Math.ceil((fim.getTime() - hoje.getTime()) / 86400000)
    : null

  return (
    <div
      className={`flex items-center justify-between gap-4 bg-surface border rounded-[10px] px-4 py-3 ${
        vencendoUrgente ? 'border-error/40' : vencendo ? 'border-alert/30' : 'border-border'
      } ${vencido ? 'opacity-60' : ''}`}
    >
      <div className="flex items-center gap-3 min-w-0 flex-wrap">
        <Badge variant={badgeVariant(c.status, vencido)}>
          {c.status}
        </Badge>
        <Link
          href={`/admin/anunciantes/${c.anunciante_id}`}
          className="text-[14px] font-medium text-fg hover:text-accent transition-colors truncate"
        >
          {c.anunciante_nome}
        </Link>
        <span className="text-[12px] text-subtle hidden sm:block">
          {formatBRL(c.valor_mensal)}/mes
        </span>
        {vencendoUrgente && diasRestantes !== null && (
          <Badge variant="error">vence em {diasRestantes} dia{diasRestantes !== 1 ? 's' : ''}</Badge>
        )}
        {!vencendoUrgente && vencendo && (
          <span className="flex items-center gap-1 text-[12px] text-alert">
            <AlertTriangle size={12} />
            vence em breve
          </span>
        )}
      </div>
      <div className="flex items-center gap-3 flex-shrink-0">
        <span className="text-[12px] text-subtle hidden sm:block">
          {formatDate(c.data_inicio)} a {formatDate(c.data_fim)}
        </span>
        {showRenovar && <RenovarBtn id={c.id} />}
      </div>
    </div>
  )
}

function ListaContratos({ contratos, showRenovar }: { contratos: Contrato[]; showRenovar: boolean }) {
  if (contratos.length === 0) {
    return <p className="text-[13px] text-subtle py-4 text-center">Nenhum contrato nesta categoria.</p>
  }
  return (
    <div className="flex flex-col gap-2">
      {contratos.map((c) => (
        <ContratoRow key={c.id} c={c} showRenovar={showRenovar} />
      ))}
    </div>
  )
}

export function ContratosClient({ contratos }: { contratos: Contrato[] }) {
  const hoje = new Date()
  const em30 = new Date(Date.now() + 30 * 86400000)

  const ativos = contratos.filter(
    (c) => c.status === 'ativo' && new Date(c.data_fim) >= hoje,
  )
  const vencendo = ativos
    .filter((c) => new Date(c.data_fim) <= em30)
    .sort((a, b) => new Date(a.data_fim).getTime() - new Date(b.data_fim).getTime())
  const encerrados = contratos.filter(
    (c) => c.status === 'encerrado' || new Date(c.data_fim) < hoje,
  )

  const receitaAtiva = ativos.reduce((s, c) => s + Number(c.valor_mensal), 0)

  return (
    <div>
      {/* Totais */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        <div className="bg-surface border border-border rounded-[12px] p-4">
          <p className="text-[11px] text-subtle uppercase tracking-widest font-medium mb-2">Receita ativa</p>
          <p className="text-[20px] font-bold text-fg leading-none">{formatBRL(receitaAtiva)}</p>
          <p className="text-[11px] text-subtle mt-1">por mes</p>
        </div>
        <div className="bg-surface border border-border rounded-[12px] p-4">
          <p className="text-[11px] text-subtle uppercase tracking-widest font-medium mb-2">Ativos</p>
          <p className="text-[20px] font-bold text-fg leading-none">{ativos.length}</p>
          <p className="text-[11px] text-subtle mt-1">contrato{ativos.length !== 1 ? 's' : ''}</p>
        </div>
        <div className={`border rounded-[12px] p-4 ${vencendo.length > 0 ? 'bg-alert/5 border-alert/20' : 'bg-surface border-border'}`}>
          <p className="text-[11px] text-subtle uppercase tracking-widest font-medium mb-2">Vencendo</p>
          <p className={`text-[20px] font-bold leading-none ${vencendo.length > 0 ? 'text-alert' : 'text-fg'}`}>
            {vencendo.length}
          </p>
          <p className="text-[11px] text-subtle mt-1">nos proximos 30 dias</p>
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="todos">
        <TabsList className="mb-4">
          <TabsTrigger value="todos">Todos ({contratos.length})</TabsTrigger>
          <TabsTrigger value="ativos">Ativos ({ativos.length})</TabsTrigger>
          <TabsTrigger value="vencendo">
            Vencendo{vencendo.length > 0 ? ` (${vencendo.length})` : ''}
          </TabsTrigger>
          <TabsTrigger value="encerrados">Encerrados ({encerrados.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="todos">
          <ListaContratos contratos={contratos} showRenovar />
        </TabsContent>
        <TabsContent value="ativos">
          <ListaContratos contratos={ativos} showRenovar />
        </TabsContent>
        <TabsContent value="vencendo">
          <ListaContratos contratos={vencendo} showRenovar />
        </TabsContent>
        <TabsContent value="encerrados">
          <ListaContratos contratos={encerrados} showRenovar={false} />
        </TabsContent>
      </Tabs>
    </div>
  )
}
