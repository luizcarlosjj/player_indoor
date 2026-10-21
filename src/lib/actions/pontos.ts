'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import sql from '@/lib/db'
import { randomBytes } from 'crypto'

export async function criarPonto(fd: FormData) {
  const token = randomBytes(16).toString('hex')

  await sql`
    INSERT INTO pontos (nome, endereco, orientacao, rotacao_graus, repasse_mensal, token_player)
    VALUES (
      ${String(fd.get('nome'))},
      ${String(fd.get('endereco') || '')},
      ${String(fd.get('orientacao') || 'vertical')},
      ${Number(fd.get('rotacao_graus') || 90)},
      ${Number(fd.get('repasse_mensal') || 150)},
      ${token}
    )
  `

  revalidatePath('/admin/pontos')
  redirect('/admin/pontos')
}

export async function atualizarPonto(id: number, fd: FormData) {
  await sql`
    UPDATE pontos SET
      nome = ${String(fd.get('nome'))},
      endereco = ${String(fd.get('endereco') || '')},
      orientacao = ${String(fd.get('orientacao') || 'vertical')},
      rotacao_graus = ${Number(fd.get('rotacao_graus') || 90)},
      repasse_mensal = ${Number(fd.get('repasse_mensal') || 150)},
      ativo = ${fd.get('ativo') === 'true'}
    WHERE id = ${id}
  `

  revalidatePath('/admin/pontos')
  revalidatePath(`/admin/pontos/${id}`)
  redirect('/admin/pontos')
}

export async function togglePonto(id: number, ativo: boolean) {
  await sql`UPDATE pontos SET ativo = ${ativo} WHERE id = ${id}`
  revalidatePath('/admin/pontos')
}

export async function salvarHorario(
  pontoId: number,
  horario: Record<string, { inicio: string; fim: string }> | null,
) {
  const val = horario ? JSON.stringify(horario) : null
  await sql`UPDATE pontos SET horario = ${val}::jsonb WHERE id = ${pontoId}`
  revalidatePath(`/admin/pontos/${pontoId}`)
}

export async function forcarAtualizacao(pontoId: number) {
  await sql`UPDATE pontos SET programacao_versao = COALESCE(programacao_versao, 0) + 1 WHERE id = ${pontoId}`
  revalidatePath(`/admin/pontos/${pontoId}`)
}
