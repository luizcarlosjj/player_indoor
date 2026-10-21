import { NextRequest, NextResponse } from 'next/server'
import sql from '@/lib/db'

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl
  const dataInicio = searchParams.get('data_inicio') ?? ''
  const dataFim = searchParams.get('data_fim') ?? ''
  const pontoId = searchParams.get('ponto_id') ?? ''
  const anuncianteId = searchParams.get('anunciante_id') ?? ''

  if (!dataInicio || !dataFim) {
    return NextResponse.json({ erro: 'data_inicio e data_fim são obrigatórios' }, { status: 400 })
  }

  try {
    let rows: unknown[]

    const hasPonto = pontoId !== ''
    const hasAnunciante = anuncianteId !== ''

    if (!hasPonto && !hasAnunciante) {
      rows = await sql`
        SELECT
          e.inicio,
          a.nome AS anunciante,
          v.titulo AS video,
          p.nome AS ponto,
          v.duracao_segundos
        FROM exibicoes e
        JOIN videos v ON v.id = e.video_id
        JOIN anunciantes a ON a.id = v.anunciante_id
        JOIN pontos p ON p.id = e.ponto_id
        WHERE e.inicio >= ${dataInicio}::date
          AND e.inicio < (${dataFim}::date + INTERVAL '1 day')
        ORDER BY e.inicio DESC
        LIMIT 201
      `
    } else if (hasPonto && !hasAnunciante) {
      rows = await sql`
        SELECT
          e.inicio,
          a.nome AS anunciante,
          v.titulo AS video,
          p.nome AS ponto,
          v.duracao_segundos
        FROM exibicoes e
        JOIN videos v ON v.id = e.video_id
        JOIN anunciantes a ON a.id = v.anunciante_id
        JOIN pontos p ON p.id = e.ponto_id
        WHERE e.inicio >= ${dataInicio}::date
          AND e.inicio < (${dataFim}::date + INTERVAL '1 day')
          AND e.ponto_id = ${Number(pontoId)}
        ORDER BY e.inicio DESC
        LIMIT 201
      `
    } else if (!hasPonto && hasAnunciante) {
      rows = await sql`
        SELECT
          e.inicio,
          a.nome AS anunciante,
          v.titulo AS video,
          p.nome AS ponto,
          v.duracao_segundos
        FROM exibicoes e
        JOIN videos v ON v.id = e.video_id
        JOIN anunciantes a ON a.id = v.anunciante_id
        JOIN pontos p ON p.id = e.ponto_id
        WHERE e.inicio >= ${dataInicio}::date
          AND e.inicio < (${dataFim}::date + INTERVAL '1 day')
          AND v.anunciante_id = ${Number(anuncianteId)}
        ORDER BY e.inicio DESC
        LIMIT 201
      `
    } else {
      rows = await sql`
        SELECT
          e.inicio,
          a.nome AS anunciante,
          v.titulo AS video,
          p.nome AS ponto,
          v.duracao_segundos
        FROM exibicoes e
        JOIN videos v ON v.id = e.video_id
        JOIN anunciantes a ON a.id = v.anunciante_id
        JOIN pontos p ON p.id = e.ponto_id
        WHERE e.inicio >= ${dataInicio}::date
          AND e.inicio < (${dataFim}::date + INTERVAL '1 day')
          AND e.ponto_id = ${Number(pontoId)}
          AND v.anunciante_id = ${Number(anuncianteId)}
        ORDER BY e.inicio DESC
        LIMIT 201
      `
    }

    const typedRows = rows as Array<{
      inicio: string
      anunciante: string
      video: string
      ponto: string
      duracao_segundos: number
    }>

    const total = typedRows.length
    const duracao_total = typedRows.reduce((acc, r) => acc + Number(r.duracao_segundos ?? 0), 0)
    const anunciantes_distintos = new Set(typedRows.map((r) => r.anunciante)).size

    const normalizedRows = typedRows.map((r) => ({
      inicio: r.inicio,
      anunciante: r.anunciante,
      video: r.video,
      ponto: r.ponto,
      duracao_segundos: Number(r.duracao_segundos),
    }))

    return NextResponse.json({
      total,
      duracao_total,
      anunciantes_distintos,
      rows: normalizedRows,
    })
  } catch (err) {
    console.error('[relatorios] erro:', err)
    return NextResponse.json({ erro: 'Erro ao consultar dados' }, { status: 500 })
  }
}
