'use server'

import { revalidatePath } from 'next/cache'
import sql from '@/lib/db'

export async function criarLead(fd: FormData) {
  const empresa = String(fd.get('empresa') ?? '').trim()
  if (!empresa) return

  await sql`
    INSERT INTO leads (empresa, segmento, telefone, etapa, proxima_acao, observacoes)
    VALUES (
      ${empresa},
      ${String(fd.get('segmento') ?? '') || null},
      ${String(fd.get('telefone') ?? '') || null},
      ${String(fd.get('etapa') ?? 'a_contatar')},
      ${String(fd.get('proxima_acao') ?? '') || null},
      ${String(fd.get('observacoes') ?? '') || null}
    )
  `
  revalidatePath('/admin/funil')
}

export async function moverLead(id: number, etapa: string) {
  await sql`
    UPDATE leads SET etapa = ${etapa} WHERE id = ${id}
  `
  revalidatePath('/admin/funil')
}
