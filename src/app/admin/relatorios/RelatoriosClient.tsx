'use client'

import { useState, useCallback } from 'react'
import { BarChart2, Download } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { EmptyState } from '@/components/ui/empty-state'

interface Ponto {
  id: number
  nome: string
}

interface Anunciante {
  id: number
  nome: string
}

interface ExibicaoRow {
  inicio: string
  anunciante: string
  video: string
  ponto: string
  duracao_segundos: number
}

interface ResultadoAPI {
  total: number
  duracao_total: number
  anunciantes_distintos: number
  rows: ExibicaoRow[]
}

interface RelatoriosClientProps {
  pontos: Ponto[]
  anunciantes: Anunciante[]
  totalAllTime: number
  totalMes: number
  topAnunciantesMes: Array<{ anunciante: string; total: number }>
}

function hoje(): string {
  return new Date().toISOString().slice(0, 10)
}

function primeiroDiaMes(): string {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-01`
}

function formatDuracao(segundos: number): string {
  const h = Math.floor(segundos / 3600)
  const m = Math.floor((segundos % 3600) / 60)
  if (h === 0) return `${m}m`
  return `${h}h ${m}m`
}

function formatDatetimeSP(isoString: string): string {
  return new Date(isoString).toLocaleString('pt-BR', {
    timeZone: 'America/Sao_Paulo',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  })
}

export function RelatoriosClient({
  pontos,
  anunciantes,
  totalAllTime,
  totalMes,
  topAnunciantesMes,
}: RelatoriosClientProps) {
  const [dataInicio, setDataInicio] = useState(primeiroDiaMes())
  const [dataFim, setDataFim] = useState(hoje())
  const [pontoId, setPontoId] = useState('')
  const [anuncianteId, setAnuncianteId] = useState('')
  const [carregando, setCarregando] = useState(false)
  const [resultado, setResultado] = useState<ResultadoAPI | null>(null)
  const [erro, setErro] = useState<string | null>(null)

  const buildParams = useCallback(() => {
    const params = new URLSearchParams({
      data_inicio: dataInicio,
      data_fim: dataFim,
    })
    if (pontoId) params.set('ponto_id', pontoId)
    if (anuncianteId) params.set('anunciante_id', anuncianteId)
    return params
  }, [dataInicio, dataFim, pontoId, anuncianteId])

  async function handleFiltrar() {
    setCarregando(true)
    setErro(null)
    try {
      const res = await fetch(`/api/admin/relatorios?${buildParams()}`)
      if (!res.ok) {
        const json = await res.json().catch(() => ({}))
        throw new Error((json as { erro?: string }).erro ?? 'Erro ao buscar dados')
      }
      const data: ResultadoAPI = await res.json()
      setResultado(data)
    } catch (e) {
      setErro(e instanceof Error ? e.message : 'Erro desconhecido')
    } finally {
      setCarregando(false)
    }
  }

  function handleExportarCSV() {
    const url = `/api/admin/relatorios/csv?${buildParams()}`
    const a = document.createElement('a')
    a.href = url
    a.download = 'relatorio.csv'
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
  }

  const rowsExibidos = resultado ? resultado.rows.slice(0, 200) : []
  const truncado = resultado ? resultado.total > 200 : false

  return (
    <div className="flex flex-col gap-6">
      {/* Dados gerais */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        <div className="bg-surface border border-border rounded-[12px] p-4">
          <p className="text-[11px] font-medium text-subtle uppercase tracking-widest mb-2">Total (histórico)</p>
          <p className="text-[22px] font-bold text-fg leading-none">{totalAllTime.toLocaleString('pt-BR')}</p>
          <p className="text-[11px] text-muted mt-1">exibições</p>
        </div>
        <div className="bg-surface border border-border rounded-[12px] p-4">
          <p className="text-[11px] font-medium text-subtle uppercase tracking-widest mb-2">Este mês</p>
          <p className="text-[22px] font-bold text-fg leading-none">{totalMes.toLocaleString('pt-BR')}</p>
          <p className="text-[11px] text-muted mt-1">exibições</p>
        </div>
        <div className="bg-surface border border-border rounded-[12px] p-4 col-span-2 sm:col-span-1">
          <p className="text-[11px] font-medium text-subtle uppercase tracking-widest mb-2">Top anunciantes este mês</p>
          {topAnunciantesMes.length === 0 ? (
            <p className="text-[12px] text-muted">Nenhum dado ainda</p>
          ) : (
            <ul className="flex flex-col gap-1 mt-1">
              {topAnunciantesMes.map((a, i) => (
                <li key={i} className="flex items-center justify-between gap-2">
                  <span className="text-[12px] text-fg truncate">{a.anunciante}</span>
                  <span className="text-[11px] text-muted flex-shrink-0">{Number(a.total).toLocaleString('pt-BR')}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {/* Filtros */}
      <div className="bg-surface border border-border rounded-[12px] p-4">
        <p className="text-[11px] font-medium text-subtle uppercase tracking-widest mb-3">Filtros</p>
        <div className="flex flex-wrap gap-3 items-end">
          <div className="flex flex-col gap-1">
            <label className="text-[11px] text-subtle font-medium">De</label>
            <input
              type="date"
              value={dataInicio}
              onChange={(e) => setDataInicio(e.target.value)}
              className="h-9 px-3 text-[13px] bg-base border border-border rounded-[var(--radius-input)] text-fg focus:outline-none focus:border-accent/60"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-[11px] text-subtle font-medium">Ate</label>
            <input
              type="date"
              value={dataFim}
              onChange={(e) => setDataFim(e.target.value)}
              className="h-9 px-3 text-[13px] bg-base border border-border rounded-[var(--radius-input)] text-fg focus:outline-none focus:border-accent/60"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-[11px] text-subtle font-medium">Tela</label>
            <select
              value={pontoId}
              onChange={(e) => setPontoId(e.target.value)}
              className="h-9 px-3 text-[13px] bg-base border border-border rounded-[var(--radius-input)] text-fg focus:outline-none focus:border-accent/60 min-w-[160px]"
            >
              <option value="">Todas as telas</option>
              {pontos.map((p) => (
                <option key={p.id} value={String(p.id)}>{p.nome}</option>
              ))}
            </select>
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-[11px] text-subtle font-medium">Anunciante</label>
            <select
              value={anuncianteId}
              onChange={(e) => setAnuncianteId(e.target.value)}
              className="h-9 px-3 text-[13px] bg-base border border-border rounded-[var(--radius-input)] text-fg focus:outline-none focus:border-accent/60 min-w-[160px]"
            >
              <option value="">Todos os anunciantes</option>
              {anunciantes.map((a) => (
                <option key={a.id} value={String(a.id)}>{a.nome}</option>
              ))}
            </select>
          </div>
          <div className="flex gap-2 items-end">
            <Button
              onClick={handleFiltrar}
              loading={carregando}
              disabled={carregando}
              size="md"
            >
              {carregando ? 'Carregando...' : 'Filtrar'}
            </Button>
            <Button
              variant="secondary"
              size="md"
              onClick={handleExportarCSV}
              disabled={carregando}
            >
              <Download size={14} />
              Exportar CSV
            </Button>
          </div>
        </div>
        {erro && (
          <p className="mt-3 text-[12px] text-error">{erro}</p>
        )}
      </div>

      {/* Resultados */}
      {resultado && (
        <div className="flex flex-col gap-4">
          {/* KPI cards do período */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="bg-surface border border-border rounded-[12px] p-4">
              <p className="text-[11px] font-medium text-subtle uppercase tracking-widest mb-2">Exibicoes no periodo</p>
              <p className="text-[22px] font-bold text-fg leading-none">
                {resultado.total.toLocaleString('pt-BR')}
              </p>
            </div>
            <div className="bg-surface border border-border rounded-[12px] p-4">
              <p className="text-[11px] font-medium text-subtle uppercase tracking-widest mb-2">Anunciantes ativos</p>
              <p className="text-[22px] font-bold text-fg leading-none">
                {resultado.anunciantes_distintos.toLocaleString('pt-BR')}
              </p>
            </div>
            <div className="bg-surface border border-border rounded-[12px] p-4">
              <p className="text-[11px] font-medium text-subtle uppercase tracking-widest mb-2">Duracao total</p>
              <p className="text-[22px] font-bold text-fg leading-none">
                {formatDuracao(resultado.duracao_total)}
              </p>
            </div>
          </div>

          {/* Tabela */}
          <div className="bg-surface border border-border rounded-[12px] overflow-hidden">
            {truncado && (
              <div className="px-4 py-2 border-b border-border bg-elevated">
                <p className="text-[12px] text-muted">
                  Mostrando 200 de {resultado.total.toLocaleString('pt-BR')} resultados. Use &quot;Exportar CSV&quot; para obter todos.
                </p>
              </div>
            )}
            {rowsExibidos.length === 0 ? (
              <EmptyState
                icon={BarChart2}
                title="Nenhuma exibicao no periodo"
                description="Tente ajustar os filtros para encontrar resultados."
              />
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-[13px]">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left px-4 py-3 text-[11px] font-medium text-subtle uppercase tracking-widest whitespace-nowrap">Data/Hora</th>
                      <th className="text-left px-4 py-3 text-[11px] font-medium text-subtle uppercase tracking-widest">Anunciante</th>
                      <th className="text-left px-4 py-3 text-[11px] font-medium text-subtle uppercase tracking-widest">Video</th>
                      <th className="text-left px-4 py-3 text-[11px] font-medium text-subtle uppercase tracking-widest">Tela</th>
                      <th className="text-right px-4 py-3 text-[11px] font-medium text-subtle uppercase tracking-widest whitespace-nowrap">Duracao</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rowsExibidos.map((row, i) => (
                      <tr
                        key={i}
                        className="border-b border-border last:border-0 hover:bg-elevated transition-colors"
                      >
                        <td className="px-4 py-3 text-muted whitespace-nowrap font-mono text-[12px]">
                          {formatDatetimeSP(row.inicio)}
                        </td>
                        <td className="px-4 py-3 text-fg">{row.anunciante}</td>
                        <td className="px-4 py-3 text-muted max-w-[200px] truncate">{row.video}</td>
                        <td className="px-4 py-3 text-muted">{row.ponto}</td>
                        <td className="px-4 py-3 text-muted text-right whitespace-nowrap">{row.duracao_segundos}s</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
