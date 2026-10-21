'use client'

import { Button } from '@/components/ui/button'

const OPCOES = [
  { label: '3 meses', meses: 3 },
  { label: '6 meses', meses: 6 },
  { label: '12 meses', meses: 12 },
]

function addMeses(dataIso: string, meses: number): string {
  const d = new Date(dataIso)
  d.setMonth(d.getMonth() + meses)
  return d.toISOString().slice(0, 10)
}

export function DuracaoRapida({
  dataInicioName,
  dataFimName,
}: {
  dataInicioName: string
  dataFimName: string
}) {
  function aplicar(meses: number) {
    const form = document.querySelector<HTMLFormElement>('[data-contrato-form]')
    if (!form) return
    const inicio = (form.elements.namedItem(dataInicioName) as HTMLInputElement)?.value
    const fimInput = form.elements.namedItem(dataFimName) as HTMLInputElement
    if (!fimInput) return
    if (inicio) {
      fimInput.value = addMeses(inicio, meses)
    } else {
      fimInput.value = addMeses(new Date().toISOString().slice(0, 10), meses)
    }
  }

  return (
    <div className="flex gap-2 flex-wrap">
      <span className="text-[11px] text-subtle self-center">Duração rápida:</span>
      {OPCOES.map((o) => (
        <Button
          key={o.meses}
          type="button"
          variant="secondary"
          size="sm"
          onClick={() => aplicar(o.meses)}
        >
          {o.label}
        </Button>
      ))}
    </div>
  )
}
