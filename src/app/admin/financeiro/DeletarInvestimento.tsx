'use client'

import { useTransition } from 'react'
import { X } from 'lucide-react'
import { deletarInvestimento } from '@/lib/actions/financeiro'

export function DeletarInvestimento({ id }: { id: number }) {
  const [pending, start] = useTransition()

  return (
    <button
      onClick={() => start(() => deletarInvestimento(id))}
      disabled={pending}
      aria-label="Remover investimento"
      className="inline-flex items-center justify-center w-7 h-7 rounded-[6px] text-subtle hover:text-error hover:bg-error/10 transition-colors disabled:opacity-40 disabled:cursor-wait"
    >
      <X size={14} />
    </button>
  )
}
