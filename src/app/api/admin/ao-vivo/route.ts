import { NextResponse } from 'next/server'
import sql from '@/lib/db'

export async function GET() {
  const rows = await sql`
    SELECT DISTINCT ON (e.ponto_id)
      e.ponto_id,
      e.inicio,
      v.titulo AS video_titulo,
      a.nome AS anunciante_nome,
      p.nome AS ponto_nome,
      hb.recebido_em AS ultimo_heartbeat
    FROM exibicoes e
    JOIN videos v ON v.id = e.video_id
    LEFT JOIN anunciantes a ON a.id = v.anunciante_id
    JOIN pontos p ON p.id = e.ponto_id
    LEFT JOIN LATERAL (
      SELECT recebido_em FROM heartbeats WHERE ponto_id = e.ponto_id ORDER BY recebido_em DESC LIMIT 1
    ) hb ON true
    WHERE e.inicio >= NOW() - INTERVAL '2 hours'
    ORDER BY e.ponto_id, e.inicio DESC
  `.catch(() => [])

  return NextResponse.json(
    rows.map((r) => ({
      ponto_id: Number(r.ponto_id),
      ponto_nome: String(r.ponto_nome),
      video_titulo: String(r.video_titulo),
      anunciante_nome: r.anunciante_nome ? String(r.anunciante_nome) : null,
      inicio: String(r.inicio),
      ultimo_heartbeat: r.ultimo_heartbeat ? String(r.ultimo_heartbeat) : null,
    })),
  )
}
