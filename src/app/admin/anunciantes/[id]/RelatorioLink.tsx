'use client'

import { useState, useTransition, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { CopyButton } from '@/components/ui/copy-button'
import { gerarTokenRelatorio } from '@/lib/actions/anunciantes'

interface RelatorioLinkProps {
  anuncianteId: number
  token: string | null
}

export function RelatorioLink({ anuncianteId, token: initialToken }: RelatorioLinkProps) {
  const [token, setToken] = useState<string | null>(initialToken)
  const [origin, setOrigin] = useState('')
  const [isPending, startTransition] = useTransition()

  useEffect(() => {
    setOrigin(window.location.origin)
  }, [])

  function handleGerar() {
    startTransition(async () => {
      const novoToken = await gerarTokenRelatorio(anuncianteId)
      setToken(novoToken)
    })
  }

  if (!token) {
    return (
      <div className="flex items-center gap-3">
        <p className="text-[13px] text-muted">Nenhum link gerado</p>
        <Button variant="secondary" size="sm" onClick={handleGerar} loading={isPending}>
          Gerar link
        </Button>
      </div>
    )
  }

  const url = `${origin}/r/${token}`

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-2 bg-surface border border-border rounded-[10px] px-3 py-2">
        <span className="text-[12px] text-muted font-mono truncate flex-1">{url || `/r/${token}`}</span>
        <CopyButton value={url || `/r/${token}`} />
      </div>
      <div>
        <Button variant="ghost" size="sm" onClick={handleGerar} loading={isPending}>
          Regenerar link
        </Button>
      </div>
    </div>
  )
}
