'use client'

import { useState, useTransition } from 'react'
import { Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ConfirmModal } from '@/components/ui/modal'
import { deletarAnunciante } from '@/lib/actions/anunciantes'

export function DeletarAnunciante({ id, nome }: { id: number; nome: string }) {
  const [open, setOpen] = useState(false)
  const [pending, start] = useTransition()

  function confirmar() {
    start(() => deletarAnunciante(id))
  }

  return (
    <>
      <Button
        variant="danger"
        size="sm"
        onClick={() => setOpen(true)}
        aria-label="Remover anunciante"
      >
        <Trash2 size={14} />
        Remover anunciante
      </Button>

      <ConfirmModal
        open={open}
        onClose={() => setOpen(false)}
        onConfirm={confirmar}
        title="Remover anunciante"
        description={`Tem certeza que deseja remover "${nome}"? Essa ação remove o anunciante, contratos, vídeos e histórico. Não há como desfazer.`}
        confirmLabel="Sim, remover"
        loading={pending}
      />
    </>
  )
}
