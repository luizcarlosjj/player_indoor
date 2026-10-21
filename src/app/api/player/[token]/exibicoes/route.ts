import { NextRequest, NextResponse } from 'next/server'
import sql from '@/lib/db'
import { ExibicaoBatch } from '@/lib/tipos'

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
  const body = await req.json().catch(() => null)

  if (!Array.isArray(body) || body.length === 0) {
    return NextResponse.json({ erro: 'Array de exibições obrigatório' }, { status: 400 })
  }

  const items: ExibicaoBatch[] = body.filter(
    (item) => item && typeof item.exibicao_uuid === 'string' && typeof item.video_id === 'number',
  )

  if (items.length === 0) {
    return NextResponse.json({ inseridas: 0 })
  }

  const now = new Date().toISOString()

  await sql`
    INSERT INTO exibicoes (ponto_id, video_id, inicio, exibicao_uuid)
    SELECT
      ${ponto.id},
      (item->>'video_id')::int,
      COALESCE(item->>'inicio', ${now}),
      item->>'exibicao_uuid'
    FROM json_array_elements(${JSON.stringify(items)}::json) AS item
    ON CONFLICT (exibicao_uuid) DO NOTHING
  `

  return NextResponse.json({ inseridas: items.length })
}
