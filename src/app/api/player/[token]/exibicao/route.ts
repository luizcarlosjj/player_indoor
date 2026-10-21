import { NextRequest, NextResponse } from 'next/server'
import sql from '@/lib/db'

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params

  const pontos = await sql`
    SELECT id FROM pontos WHERE token_player = ${token} AND ativo = true LIMIT 1
  `
  if (pontos.length === 0) {
    return NextResponse.json({ erro: 'Ponto não encontrado' }, { status: 404 })
  }

  const ponto = pontos[0]
  const body = await req.json().catch(() => ({}))

  if (!body.video_id) {
    return NextResponse.json({ erro: 'video_id obrigatório' }, { status: 400 })
  }

  await sql`
    INSERT INTO exibicoes (ponto_id, video_id, inicio)
    VALUES (${ponto.id}, ${body.video_id}, ${body.inicio ?? new Date().toISOString()})
  `

  return NextResponse.json({ ok: true })
}
