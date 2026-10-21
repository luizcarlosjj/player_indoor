'use server'

import { revalidatePath } from 'next/cache'
import sql from '@/lib/db'

async function incrementarVersao(pontoId: number) {
  await sql`
    UPDATE pontos
    SET programacao_versao = COALESCE(programacao_versao, 0) + 1
    WHERE id = ${pontoId}
  `
}

export async function adicionarVideoPlaylist(pontoId: number, videoId: number, contratoId: number | null) {
  const [ultimo] = await sql`
    SELECT COALESCE(MAX(ordem), -1) as max_ordem FROM playlist_itens WHERE ponto_id = ${pontoId}
  `
  const proximaOrdem = (ultimo?.max_ordem ?? -1) + 1

  await sql`
    INSERT INTO playlist_itens (ponto_id, video_id, contrato_id, ordem, ativo)
    VALUES (${pontoId}, ${videoId}, ${contratoId}, ${proximaOrdem}, true)
    ON CONFLICT (ponto_id, video_id) DO UPDATE SET ativo = true, ordem = EXCLUDED.ordem
  `
  await incrementarVersao(pontoId)
  revalidatePath(`/admin/pontos/${pontoId}`)
}

export async function removerItemPlaylist(itemId: number, pontoId: number) {
  await sql`DELETE FROM playlist_itens WHERE id = ${itemId}`
  await incrementarVersao(pontoId)
  revalidatePath(`/admin/pontos/${pontoId}`)
}

export async function toggleItemPlaylist(itemId: number, ativo: boolean, pontoId: number) {
  await sql`UPDATE playlist_itens SET ativo = ${ativo} WHERE id = ${itemId}`
  await incrementarVersao(pontoId)
  revalidatePath(`/admin/pontos/${pontoId}`)
}

export async function reordenarPlaylist(pontoId: number, itens: { id: number; ordem: number }[]) {
  for (const item of itens) {
    await sql`UPDATE playlist_itens SET ordem = ${item.ordem} WHERE id = ${item.id} AND ponto_id = ${pontoId}`
  }
  await incrementarVersao(pontoId)
  revalidatePath(`/admin/pontos/${pontoId}`)
}
