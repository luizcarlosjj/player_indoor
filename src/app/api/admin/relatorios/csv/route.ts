import { NextRequest, NextResponse } from 'next/server'
import sql from '@/lib/db'

function formatDatetimeSP(isoString: string): string {
  return new Date(isoString).toLocaleString('pt-BR', {
    timeZone: 'America/Sao_Paulo',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  })
}

function escapeCsvField(value: string): string {
  const str = String(value ?? '')
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return `"${str.replace(/"/g, '""')}"`
  }
  return str
}

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
      `
    }

    const typedRows = rows as Array<{
      inicio: string
      anunciante: string
      video: string
      ponto: string
      duracao_segundos: number
    }>

    const header = 'Data/Hora,Anunciante,Video,Tela,Duracao(s)\r\n'
    const lines = typedRows.map((r) => {
      return [
        escapeCsvField(formatDatetimeSP(r.inicio)),
        escapeCsvField(r.anunciante),
        escapeCsvField(r.video),
        escapeCsvField(r.ponto),
        String(Number(r.duracao_segundos)),
      ].join(',')
    })

    const csv = header + lines.join('\r\n')

    return new NextResponse(csv, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': 'attachment; filename="relatorio.csv"',
      },
    })
  } catch (err) {
    console.error('[relatorios/csv] erro:', err)
    return NextResponse.json({ erro: 'Erro ao gerar CSV' }, { status: 500 })
  }
}
