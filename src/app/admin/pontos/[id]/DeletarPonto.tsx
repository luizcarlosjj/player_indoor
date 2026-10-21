'use client'

import { useState, useTransition } from 'react'
import { Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ConfirmModal } from '@/components/ui/modal'
import { deletarPonto } from '@/lib/actions/pontos'

export function DeletarPonto({ id, nome }: { id: number; nome: string }) {
  const [open, setOpen] = useState(false)
  const [pending, start] = useTransition()

  function confirmar() {
    start(() => deletarPonto(id))
  }

  return (
    <>
      <Button
        variant="danger"
        size="sm"
        onClick={() => setOpen(true)}
        aria-label="Remover tela"
      >
        <Trash2 size={14} />
        Remover tela
      </Button>

      <ConfirmModal
        open={open}
        onClose={() => setOpen(false)}
        onConfirm={confirmar}
        title="Remover tela"
        description={`Tem certeza que deseja remover "${nome}"? Essa ação remove o ponto, a playlist e todo o histórico de exibições. Não há como desfazer.`}
        confirmLabel="Sim, remover"
        loading={pending}
      />
    </>
  )
}
