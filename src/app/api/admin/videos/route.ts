import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import sql from '@/lib/db'

export async function POST(req: NextRequest) {
  const sessao = await auth()
  if (!sessao) return NextResponse.json({ erro: 'Não autorizado' }, { status: 401 })

  const { anunciante_id, titulo, r2_key, duracao_segundos, largura, altura } = await req.json()

  const [video] = await sql`
    INSERT INTO videos (anunciante_id, titulo, r2_key, duracao_segundos, largura, altura)
    VALUES (${anunciante_id}, ${titulo}, ${r2_key}, ${duracao_segundos ?? null}, ${largura ?? null}, ${altura ?? null})
    RETURNING id
  `

  return NextResponse.json({ id: video.id })
}
