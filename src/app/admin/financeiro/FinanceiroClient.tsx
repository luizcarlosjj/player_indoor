'use client'

import { useState } from 'react'
import {
  ResponsiveContainer,
  ComposedChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
} from 'recharts'
import { Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Field } from '@/components/ui/field'
import { formatBRL, formatDate } from '@/lib/utils'
import { criarInvestimento } from '@/lib/actions/financeiro'
import { DeletarInvestimento } from './DeletarInvestimento'
import type { Investimento, MesDado, InvestimentoMes } from './page'

interface Props {
  mrr: number
  repasse: number
  margem: number
  totalInvestido: number
  mesesBreakEven: number | null
  historico: MesDado[]
  investPorMes: InvestimentoMes[]
  investimentos: Investimento[]
}

function formatarMes(n: number): string {
  return formatBRL(n).replace('R$ ', '')
}

function categoriaBadge(cat: string) {
  const map: Record<string, { label: string; variant: 'default' | 'accent' | 'alert' | 'muted' | 'online' | 'error' | 'info' }> = {
    equipamento: { label: 'Equipamento', variant: 'accent' },
    instalacao:  { label: 'Instalacao', variant: 'online' },
    marketing:   { label: 'Marketing', variant: 'alert' },
    outro:       { label: 'Outro', variant: 'muted' },
  }
  return map[cat] ?? { label: cat, variant: 'default' as const }
}

function projetarMeses(historico: MesDado[], n: number): MesDado[] {
  if (historico.length === 0) return []
  const ultimo = historico[historico.length - 1]

  const projetados: MesDado[] = []
  let [mm, yyyy] = ultimo.mes.split('/').map(Number)
  for (let i = 0; i < n; i++) {
    mm++
    if (mm > 12) { mm = 1; yyyy++ }
    projetados.push({
      mes: `${String(mm).padStart(2, '0')}/${yyyy}`,
      mrr: ultimo.mrr,
      repasse: ultimo.repasse,
      margem: ultimo.margem,
    })
  }
  return projetados
}

interface TooltipPayloadItem {
  name: string
  value: number
  color: string
}

interface CustomTooltipProps {
  active?: boolean
  payload?: TooltipPayloadItem[]
  label?: string
}

function CustomTooltip({ active, payload, label }: CustomTooltipProps) {
  if (!active || !payload || payload.length === 0) return null
  return (
    <div className="bg-elevated border border-border rounded-[10px] px-3 py-2 text-[12px] shadow-lg">
      <p className="text-muted font-medium mb-1">{label}</p>
      {payload.map((item) => (
        <div key={item.name} className="flex items-center justify-between gap-4">
          <span style={{ color: item.color }}>{item.name}</span>
          <span className="text-fg font-medium">{formatBRL(item.value)}</span>
        </div>
      ))}
    </div>
  )
}

export function FinanceiroClient({
  mrr,
  repasse,
  margem,
  totalInvestido,
  mesesBreakEven,
  historico,
  investimentos,
}: Props) {
  const [formAberto, setFormAberto] = useState(false)

  const hoje = new Date().toISOString().slice(0, 10)

  const dadosGrafico = [
    ...historico,
    ...projetarMeses(historico, 3),
  ]

  // Progress bar: assume project start = oldest investimento or 0 months ago
  // We use months elapsed since first investimento or just months covered / mesesBreakEven
  const mesesDecorridos = historico.length
  const progressoPct =
    mesesBreakEven !== null && mesesBreakEven > 0
      ? Math.min(100, Math.round((mesesDecorridos / mesesBreakEven) * 100))
      : 0

  const breakEvenLabel = () => {
    if (margem <= 0) return 'sem margem'
    if (mesesBreakEven !== null && mesesDecorridos >= mesesBreakEven) return 'atingido'
    if (mesesBreakEven !== null) return `em ${mesesBreakEven} meses`
    return 'sem margem'
  }

  const breakEvenColor =
    margem <= 0 ? 'text-error' : mesesDecorridos >= (mesesBreakEven ?? Infinity) ? 'text-online' : 'text-fg'

  return (
    <div className="flex flex-col gap-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="bg-surface border border-border rounded-[12px] p-4">
          <p className="text-[11px] text-subtle uppercase tracking-widest font-medium mb-2">MRR atual</p>
          <p className={`text-[22px] font-bold leading-none ${mrr > 0 ? 'text-online' : 'text-fg'}`}>
            {formatBRL(mrr)}
          </p>
          <p className="text-[11px] text-subtle mt-1">por mes</p>
        </div>

        <div className="bg-surface border border-border rounded-[12px] p-4">
          <p className="text-[11px] text-subtle uppercase tracking-widest font-medium mb-2">Repasse total</p>
          <p className="text-[22px] font-bold leading-none text-fg">
            {formatBRL(repasse)}
          </p>
          <p className="text-[11px] text-subtle mt-1">por mes</p>
        </div>

        <div className="bg-surface border border-border rounded-[12px] p-4">
          <p className="text-[11px] text-subtle uppercase tracking-widest font-medium mb-2">Margem mensal</p>
          <p className={`text-[22px] font-bold leading-none ${margem > 0 ? 'text-online' : margem < 0 ? 'text-error' : 'text-fg'}`}>
            {formatBRL(margem)}
          </p>
          <p className="text-[11px] text-subtle mt-1">MRR - repasse</p>
        </div>

        <div className="bg-surface border border-border rounded-[12px] p-4">
          <p className="text-[11px] text-subtle uppercase tracking-widest font-medium mb-2">Break-even</p>
          <p className={`text-[22px] font-bold leading-none ${breakEvenColor}`}>
            {breakEvenLabel()}
          </p>
          <p className="text-[11px] text-subtle mt-1">recuperacao do invest.</p>
        </div>
      </div>

      {/* Grafico */}
      <div className="bg-surface border border-border rounded-[12px] p-4">
        <p className="text-[11px] text-subtle uppercase tracking-widest mb-4">Projecao mensal</p>
        {dadosGrafico.length > 0 ? (
          <ResponsiveContainer width="100%" height={220}>
            <ComposedChart data={dadosGrafico} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
              <XAxis
                dataKey="mes"
                tick={{ fontSize: 11, fill: 'var(--color-subtle)' }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tick={{ fontSize: 11, fill: 'var(--color-subtle)' }}
                axisLine={false}
                tickLine={false}
                tickFormatter={(v) => `R$${(v / 1000).toFixed(0)}k`}
                width={44}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend
                wrapperStyle={{ fontSize: 12, paddingTop: 8 }}
                formatter={(value) => <span style={{ color: 'var(--color-muted)' }}>{value}</span>}
              />
              <Line
                type="monotone"
                dataKey="mrr"
                name="MRR"
                stroke="var(--color-online)"
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 4 }}
              />
              <Line
                type="monotone"
                dataKey="repasse"
                name="Repasse"
                stroke="var(--color-alert)"
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 4 }}
              />
              <Line
                type="monotone"
                dataKey="margem"
                name="Margem"
                stroke="var(--color-accent)"
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 4 }}
              />
            </ComposedChart>
          </ResponsiveContainer>
        ) : (
          <p className="text-[13px] text-subtle text-center py-8">Sem dados historicos ainda.</p>
        )}
      </div>

      {/* Break-even progress */}
      {mesesBreakEven !== null && totalInvestido > 0 && (
        <div className="bg-surface border border-border rounded-[12px] p-4">
          <p className="text-[11px] text-subtle uppercase tracking-widest mb-3">Recuperacao do investimento</p>
          <div className="flex items-end gap-3 mb-3">
            <span className="text-[28px] font-bold text-fg">{mesesBreakEven}</span>
            <span className="text-[14px] text-muted mb-1">meses para break-even</span>
          </div>
          <div className="h-2 bg-elevated rounded-full overflow-hidden">
            <div
              className="h-full bg-online rounded-full transition-all"
              style={{ width: `${progressoPct}%` }}
            />
          </div>
          <p className="text-[12px] text-subtle mt-2">
            {formatBRL(totalInvestido)} investido · margem de {formatBRL(margem)}/mes
          </p>
        </div>
      )}

      {/* Log de investimentos */}
      <div className="bg-surface border border-border rounded-[12px] p-4">
        <div className="flex items-center justify-between gap-4 mb-4">
          <p className="text-[13px] font-semibold text-fg">Gastos de investimento</p>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => setFormAberto((v) => !v)}
          >
            <Plus size={14} />
            Registrar gasto
          </Button>
        </div>

        {formAberto && (
          <form
            action={async (fd) => {
              await criarInvestimento(fd)
              setFormAberto(false)
            }}
            className="mb-5 p-4 bg-elevated border border-border rounded-[10px]"
          >
            <div className="grid grid-cols-2 gap-3 mb-3">
              <Field label="Descricao">
                <input
                  name="descricao"
                  required
                  placeholder="Ex: TV Samsung 50 pol"
                  className="h-9 w-full bg-base border border-border rounded-[var(--radius-input)] px-3 text-[13px] text-fg placeholder:text-subtle focus:outline-none focus:border-accent transition-colors"
                />
              </Field>
              <Field label="Valor (R$)">
                <input
                  name="valor"
                  type="number"
                  min="0"
                  step="0.01"
                  required
                  placeholder="0,00"
                  className="h-9 w-full bg-base border border-border rounded-[var(--radius-input)] px-3 text-[13px] text-fg placeholder:text-subtle focus:outline-none focus:border-accent transition-colors"
                />
              </Field>
              <Field label="Data">
                <input
                  name="data"
                  type="date"
                  defaultValue={hoje}
                  className="h-9 w-full bg-base border border-border rounded-[var(--radius-input)] px-3 text-[13px] text-fg focus:outline-none focus:border-accent transition-colors"
                />
              </Field>
              <Field label="Categoria">
                <select
                  name="categoria"
                  className="h-9 w-full bg-base border border-border rounded-[var(--radius-input)] px-3 text-[13px] text-fg focus:outline-none focus:border-accent transition-colors"
                >
                  <option value="equipamento">Equipamento</option>
                  <option value="instalacao">Instalacao</option>
                  <option value="marketing">Marketing</option>
                  <option value="outro">Outro</option>
                </select>
              </Field>
            </div>
            <div className="flex items-center gap-2">
              <Button type="submit" size="sm">Salvar</Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setFormAberto(false)}
              >
                Cancelar
              </Button>
            </div>
          </form>
        )}

        {investimentos.length === 0 ? (
          <p className="text-[13px] text-subtle text-center py-6">
            Nenhum investimento registrado ainda.
          </p>
        ) : (
          <div className="flex flex-col gap-1">
            {investimentos.map((inv) => {
              const cat = categoriaBadge(inv.categoria)
              return (
                <div
                  key={inv.id}
                  className="flex items-center justify-between gap-3 px-3 py-2.5 rounded-[8px] hover:bg-elevated transition-colors"
                >
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <span className="text-[12px] text-subtle tabular-nums shrink-0">
                      {formatDate(inv.data)}
                    </span>
                    <span className="text-[13px] text-fg truncate">{inv.descricao}</span>
                    <Badge variant={cat.variant} className="shrink-0 hidden sm:inline-flex">
                      {cat.label}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-[13px] font-medium text-fg tabular-nums">
                      {formatBRL(inv.valor)}
                    </span>
                    <DeletarInvestimento id={inv.id} />
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
