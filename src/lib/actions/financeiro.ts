'use server'
import { revalidatePath } from 'next/cache'
import sql from '@/lib/db'

export async function criarInvestimento(fd: FormData) {
  await sql`INSERT INTO investimentos (descricao, valor, data, categoria)
    VALUES (${String(fd.get('descricao'))}, ${Number(fd.get('valor'))}, ${String(fd.get('data'))}, ${String(fd.get('categoria') || 'equipamento')})`
  revalidatePath('/admin/financeiro')
}

export async function deletarInvestimento(id: number) {
  await sql`DELETE FROM investimentos WHERE id = ${id}`
  revalidatePath('/admin/financeiro')
}
