'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import sql from '@/lib/db'

export async function gerarTokenRelatorio(anuncianteId: number) {
  const token = crypto.randomUUID()
  await sql`UPDATE anunciantes SET relatorio_token = ${token} WHERE id = ${anuncianteId}`
  revalidatePath(`/admin/anunciantes/${anuncianteId}`)
  return token
}

export async function criarAnunciante(fd: FormData) {
  await sql`
    INSERT INTO anunciantes (nome, contato, telefone, observacoes, segmento, instagram, whatsapp, cupom)
    VALUES (
      ${String(fd.get('nome'))},
      ${String(fd.get('contato') || '')},
      ${String(fd.get('telefone') || '')},
      ${String(fd.get('observacoes') || '')},
      ${String(fd.get('segmento') || '') || null},
      ${String(fd.get('instagram') || '') || null},
      ${String(fd.get('whatsapp') || '') || null},
      ${String(fd.get('cupom') || '') || null}
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
      observacoes = ${String(fd.get('observacoes') || '')},
      segmento = ${String(fd.get('segmento') || '') || null},
      instagram = ${String(fd.get('instagram') || '') || null},
      whatsapp = ${String(fd.get('whatsapp') || '') || null},
      cupom = ${String(fd.get('cupom') || '') || null}
    WHERE id = ${id}
  `
  revalidatePath('/admin/anunciantes')
  revalidatePath(`/admin/anunciantes/${id}`)
  redirect(`/admin/anunciantes/${id}`)
}

export async function criarContrato(anuncianteId: number, fd: FormData) {
  await sql`
    INSERT INTO contratos (anunciante_id, valor_mensal, data_inicio, data_fim, status, fidelidade)
    VALUES (
      ${anuncianteId},
      ${Number(fd.get('valor_mensal') || 120)},
      ${String(fd.get('data_inicio'))},
      ${String(fd.get('data_fim'))},
      'ativo',
      ${fd.get('fidelidade') === 'true'}
    )
  `
  revalidatePath(`/admin/anunciantes/${anuncianteId}`)
}

export async function atualizarStatusContrato(id: number, status: string, anuncianteId: number) {
  await sql`UPDATE contratos SET status = ${status} WHERE id = ${id}`
  revalidatePath(`/admin/anunciantes/${anuncianteId}`)
}

export async function renovarContrato(id: number, meses: number = 6) {
  const [original] = await sql`SELECT * FROM contratos WHERE id = ${id}`.catch(() => [null])
  if (!original) return
  const hoje = new Date()
  const dataInicio = hoje.toISOString().slice(0, 10)
  const dataFim = new Date(hoje.setMonth(hoje.getMonth() + meses)).toISOString().slice(0, 10)
  await sql`INSERT INTO contratos (anunciante_id, valor_mensal, data_inicio, data_fim, status, fidelidade)
    VALUES (${original.anunciante_id}, ${original.valor_mensal}, ${dataInicio}, ${dataFim}, 'ativo', ${original.fidelidade ?? false})`
  revalidatePath('/admin/contratos')
  revalidatePath(`/admin/anunciantes/${original.anunciante_id}`)
}

export async function deletarVideo(id: number, anuncianteId: number) {
  await sql`DELETE FROM playlist_itens WHERE video_id = ${id}`
  await sql`DELETE FROM videos WHERE id = ${id}`
  revalidatePath(`/admin/anunciantes/${anuncianteId}`)
}

export async function deletarAnunciante(id: number) {
  const videos = await sql`SELECT id FROM videos WHERE anunciante_id = ${id}`
  for (const v of videos) {
    await sql`DELETE FROM playlist_itens WHERE video_id = ${v.id}`
  }
  await sql`DELETE FROM videos WHERE anunciante_id = ${id}`
  await sql`DELETE FROM contratos WHERE anunciante_id = ${id}`
  await sql`DELETE FROM leads WHERE anunciante_id = ${id}`
  await sql`DELETE FROM anunciantes WHERE id = ${id}`
  revalidatePath('/admin/anunciantes')
  redirect('/admin/anunciantes')
}
