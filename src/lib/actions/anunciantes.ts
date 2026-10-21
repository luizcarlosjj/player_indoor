'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import sql from '@/lib/db'

export async function criarAnunciante(fd: FormData) {
  await sql`
    INSERT INTO anunciantes (nome, contato, telefone, observacoes)
    VALUES (
      ${String(fd.get('nome'))},
      ${String(fd.get('contato') || '')},
      ${String(fd.get('telefone') || '')},
      ${String(fd.get('observacoes') || '')}
    )
  `
  revalidatePath('/admin/anunciantes')
  redirect('/admin/anunciantes')
}

export async function atualizarAnunciante(id: number, fd: FormData) {
  await sql`
    UPDATE anunciantes SET
      nome = ${String(fd.get('nome'))},
      contato = ${String(fd.get('contato') || '')},
      telefone = ${String(fd.get('telefone') || '')},
      observacoes = ${String(fd.get('observacoes') || '')}
    WHERE id = ${id}
  `
  revalidatePath('/admin/anunciantes')
  revalidatePath(`/admin/anunciantes/${id}`)
  redirect(`/admin/anunciantes/${id}`)
}

export async function criarContrato(anuncianteId: number, fd: FormData) {
  await sql`
    INSERT INTO contratos (anunciante_id, valor_mensal, data_inicio, data_fim, status)
    VALUES (
      ${anuncianteId},
      ${Number(fd.get('valor_mensal') || 120)},
      ${String(fd.get('data_inicio'))},
      ${String(fd.get('data_fim'))},
      'ativo'
    )
  `
  revalidatePath(`/admin/anunciantes/${anuncianteId}`)
}

export async function atualizarStatusContrato(id: number, status: string, anuncianteId: number) {
  await sql`UPDATE contratos SET status = ${status} WHERE id = ${id}`
  revalidatePath(`/admin/anunciantes/${anuncianteId}`)
}

export async function deletarVideo(id: number, anuncianteId: number) {
  // Remove da playlist também
  await sql`DELETE FROM playlist_itens WHERE video_id = ${id}`
  await sql`DELETE FROM videos WHERE id = ${id}`
  revalidatePath(`/admin/anunciantes/${anuncianteId}`)
}
