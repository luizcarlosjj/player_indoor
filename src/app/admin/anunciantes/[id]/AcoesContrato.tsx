'use client'

import { useTransition } from 'react'
import { atualizarStatusContrato } from '@/lib/actions/anunciantes'

export function AcoesContrato({
  id, status, anuncianteId,
}: {
  id: number; status: string; anuncianteId: number
}) {
  const [pending, start] = useTransition()

  return (
    <div className="flex items-center gap-3">
      {status === 'ativo' && (
        <button
          disabled={pending}
          onClick={() => start(() => atualizarStatusContrato(id, 'suspenso', anuncianteId))}
          aria-label="Suspender contrato"
          className="text-[12px] text-muted hover:text-fg transition-colors disabled:opacity-40 disabled:cursor-wait"
        >
          Suspender
        </button>
      )}
      {status === 'suspenso' && (
        <button
          disabled={pending}
          onClick={() => start(() => atualizarStatusContrato(id, 'ativo', anuncianteId))}
          aria-label="Reativar contrato"
          className="text-[12px] text-online hover:text-online/80 transition-colors disabled:opacity-40 disabled:cursor-wait"
        >
          Reativar
        </button>
      )}
      {status !== 'encerrado' && (
        <button
          disabled={pending}
          onClick={() => start(() => atualizarStatusContrato(id, 'encerrado', anuncianteId))}
          aria-label="Encerrar contrato"
          className="text-[12px] text-error hover:text-error/80 transition-colors disabled:opacity-40 disabled:cursor-wait"
        >
          Encerrar
        </button>
      )}
    </div>
  )
}
