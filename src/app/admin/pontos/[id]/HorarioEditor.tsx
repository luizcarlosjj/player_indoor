'use client'

import { useState, useTransition } from 'react'
import { Button } from '@/components/ui/button'
import { salvarHorario } from '@/lib/actions/pontos'

const DIAS = [
  { key: 'seg', label: 'Segunda' },
  { key: 'ter', label: 'Terça' },
  { key: 'qua', label: 'Quarta' },
  { key: 'qui', label: 'Quinta' },
  { key: 'sex', label: 'Sexta' },
  { key: 'sab', label: 'Sábado' },
  { key: 'dom', label: 'Domingo' },
]

interface HorarioDia {
  ativo: boolean
  inicio: string
  fim: string
}

type Horario = Record<string, HorarioDia>

function buildInitialState(
  horarioAtual: Record<string, { inicio: string; fim: string }> | null,
): Horario {
  const state: Horario = {}
  for (const { key } of DIAS) {
    const dia = horarioAtual?.[key]
    state[key] = {
      ativo: !!dia,
      inicio: dia?.inicio ?? '08:00',
      fim: dia?.fim ?? '22:00',
    }
  }
  return state
}

export function HorarioEditor({
  pontoId,
  horarioAtual,
}: {
  pontoId: number
  horarioAtual: Record<string, { inicio: string; fim: string }> | null
}) {
  const [horario, setHorario] = useState<Horario>(() => buildInitialState(horarioAtual))
  const [pending, start] = useTransition()

  function setDia(key: string, partial: Partial<HorarioDia>) {
    setHorario((prev) => ({ ...prev, [key]: { ...prev[key], ...partial } }))
  }

  function salvar() {
    const payload: Record<string, { inicio: string; fim: string }> = {}
    for (const { key } of DIAS) {
      if (horario[key].ativo) {
        payload[key] = { inicio: horario[key].inicio, fim: horario[key].fim }
      }
    }
    start(() => salvarHorario(pontoId, Object.keys(payload).length > 0 ? payload : null))
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="bg-surface border border-border rounded-[12px] overflow-hidden">
        <table className="w-full text-[13px]">
          <thead>
            <tr className="border-b border-border">
              <th className="text-left px-4 py-2.5 text-subtle font-medium text-[11px] uppercase tracking-widest">Dia</th>
              <th className="text-center px-4 py-2.5 text-subtle font-medium text-[11px] uppercase tracking-widest">Ativo</th>
              <th className="text-left px-4 py-2.5 text-subtle font-medium text-[11px] uppercase tracking-widest">Inicio</th>
              <th className="text-left px-4 py-2.5 text-subtle font-medium text-[11px] uppercase tracking-widest">Fim</th>
            </tr>
          </thead>
          <tbody>
            {DIAS.map(({ key, label }, idx) => {
              const dia = horario[key]
              return (
                <tr
                  key={key}
                  className={idx < DIAS.length - 1 ? 'border-b border-border' : ''}
                >
                  <td className="px-4 py-3 text-fg font-medium">{label}</td>
                  <td className="px-4 py-3 text-center">
                    <input
                      type="checkbox"
                      checked={dia.ativo}
                      onChange={(e) => setDia(key, { ativo: e.target.checked })}
                      className="accent-accent w-4 h-4"
                    />
                  </td>
                  <td className="px-4 py-3">
                    <input
                      type="time"
                      value={dia.inicio}
                      disabled={!dia.ativo}
                      onChange={(e) => setDia(key, { inicio: e.target.value })}
                      className="bg-base border border-border rounded-[6px] px-2 py-1 text-[13px] text-fg disabled:opacity-40 disabled:cursor-not-allowed"
                    />
                  </td>
                  <td className="px-4 py-3">
                    <input
                      type="time"
                      value={dia.fim}
                      disabled={!dia.ativo}
                      onChange={(e) => setDia(key, { fim: e.target.value })}
                      className="bg-base border border-border rounded-[6px] px-2 py-1 text-[13px] text-fg disabled:opacity-40 disabled:cursor-not-allowed"
                    />
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      <div>
        <Button size="md" loading={pending} onClick={salvar}>
          Salvar horário
        </Button>
      </div>
    </div>
  )
}
