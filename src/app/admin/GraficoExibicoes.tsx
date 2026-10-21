'use client'

import { AreaChart, Area, Tooltip, ResponsiveContainer } from 'recharts'

interface DiaExibicao {
  dia: string
  total: number
}

interface TooltipPayload {
  value: number
}

function CustomTooltip({ active, payload, label }: { active?: boolean; payload?: TooltipPayload[]; label?: string }) {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-elevated border border-border rounded-[8px] px-3 py-2 text-[12px]">
      <p className="text-subtle mb-0.5">{label}</p>
      <p className="text-fg font-semibold">{payload[0].value} exibições</p>
    </div>
  )
}

export function GraficoExibicoes({ dados }: { dados: DiaExibicao[] }) {
  if (dados.length === 0) {
    return (
      <div className="h-[180px] flex items-center justify-center">
        <p className="text-[13px] text-subtle">Sem exibições nos últimos 30 dias</p>
      </div>
    )
  }

  return (
    <ResponsiveContainer width="100%" height={180}>
      <AreaChart data={dados} margin={{ top: 4, right: 0, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id="grad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="var(--color-accent)" stopOpacity={0.25} />
            <stop offset="95%" stopColor="var(--color-accent)" stopOpacity={0} />
          </linearGradient>
        </defs>
        <Tooltip content={<CustomTooltip />} />
        <Area
          type="monotone"
          dataKey="total"
          stroke="var(--color-accent)"
          strokeWidth={2}
          fill="url(#grad)"
          dot={false}
          activeDot={{ r: 4, fill: 'var(--color-accent)', strokeWidth: 0 }}
        />
      </AreaChart>
    </ResponsiveContainer>
  )
}
