'use client'

import { useTransition } from 'react'
import { togglePonto } from '@/lib/actions/pontos'

export function TogglePonto({ id, ativo }: { id: number; ativo: boolean }) {
  const [pending, start] = useTransition()

  return (
    <button
      disabled={pending}
      onClick={() => start(() => togglePonto(id, !ativo))}
      className="text-[12px] text-muted hover:text-fg transition-colors disabled:opacity-40 disabled:cursor-wait"
    >
      {ativo ? 'Desativar' : 'Ativar'}
    </button>
  )
}
