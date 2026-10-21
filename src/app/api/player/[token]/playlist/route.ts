import { NextRequest, NextResponse } from 'next/server'
import sql from '@/lib/db'
import { urlPublica } from '@/lib/r2'
import { ItemPlaylist, PlaylistResponse } from '@/lib/tipos'

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params

  const pontos = await sql`
    SELECT id, rotacao_graus, orientacao, programacao_versao, horario
    FROM pontos
    WHERE token_player = ${token} AND ativo = true
    LIMIT 1
  `

  if (pontos.length === 0) {
    return NextResponse.json({ erro: 'Ponto não encontrado' }, { status: 404 })
  }

  const ponto = pontos[0]

  const itens = await sql`
    SELECT
      pi.id,
      pi.video_id,
      v.titulo,
      v.r2_key,
      v.duracao_segundos,
      v.largura,
      v.altura,
      pi.ordem,
      COALESCE(v.atualizado_em, v.criado_em) AS atualizado_em
    FROM playlist_itens pi
    JOIN videos v ON v.id = pi.video_id
    LEFT JOIN contratos c ON c.id = pi.contrato_id
    WHERE pi.ponto_id = ${ponto.id}
      AND pi.ativo = true
      AND (
        pi.contrato_id IS NULL
        OR (c.status = 'ativo' AND c.data_inicio <= CURRENT_DATE AND c.data_fim >= CURRENT_DATE)
      )
    ORDER BY pi.ordem ASC, pi.id ASC
  `

  const playlist: ItemPlaylist[] = itens.map((i) => ({
    id: i.id,
    video_id: i.video_id,
    titulo: i.titulo,
    r2_key: i.r2_key,
    url: urlPublica(i.r2_key),
    duracao_segundos: i.duracao_segundos,
    largura: i.largura,
    altura: i.altura,
    ordem: i.ordem,
    atualizado_em: i.atualizado_em ? new Date(i.atualizado_em).toISOString() : new Date(0).toISOString(),
  }))

  const response: PlaylistResponse = {
    ponto_id: ponto.id,
    rotacao_graus: ponto.rotacao_graus,
    orientacao: ponto.orientacao,
    programacao_versao: Number(ponto.programacao_versao ?? 0),
    horario: ponto.horario ?? null,
    itens: playlist,
  }

  return NextResponse.json(response)
}
