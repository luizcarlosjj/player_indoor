import { NextRequest, NextResponse } from 'next/server'
import sql from '@/lib/db'

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params

  const pontos = await sql`
    SELECT programacao_versao
    FROM pontos
    WHERE token_player = ${token} AND ativo = true
    LIMIT 1
  `

  if (pontos.length === 0) {
    return NextResponse.json({ erro: 'Ponto não encontrado' }, { status: 404 })
  }

  return NextResponse.json({ versao: Number(pontos[0].programacao_versao ?? 0) })
}
