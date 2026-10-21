'use client'

import { useTransition, useState } from 'react'
import { deletarVideo } from '@/lib/actions/anunciantes'
import { ConfirmModal } from '@/components/ui/modal'

export function DeletarVideo({ id, anuncianteId }: { id: number; anuncianteId: number }) {
  const [pending, start] = useTransition()
  const [confirming, setConfirming] = useState(false)

  return (
    <>
      <button
        disabled={pending}
        onClick={() => setConfirming(true)}
        aria-label="Remover vídeo"
        className="text-[12px] text-error hover:text-error/80 transition-colors disabled:opacity-40 disabled:cursor-wait flex-shrink-0"
      >
        Remover
      </button>

      <ConfirmModal
        open={confirming}
        onClose={() => setConfirming(false)}
        onConfirm={() => {
          setConfirming(false)
          start(() => deletarVideo(id, anuncianteId))
        }}
        title="Remover vídeo"
        description="Este vídeo será removido das playlists também. Esta ação não pode ser desfeita."
        confirmLabel="Remover"
        variant="danger"
      />
    </>
  )
}
