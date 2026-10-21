import sql from '@/lib/db'
import { PageHeader } from '@/components/ui/page-header'
import { RelatoriosClient } from './RelatoriosClient'

export const metadata = { title: 'Relatorios' }

export default async function RelatoriosPage() {
  const [pontos, anunciantes, statsAllTime, statsMes, topAnunciantes] = await Promise.all([
    sql`
      SELECT id, nome FROM pontos ORDER BY nome ASC
    `.catch(() => []),

    sql`
      SELECT id, nome FROM anunciantes ORDER BY nome ASC
    `.catch(() => []),

    sql`
      SELECT COUNT(*) AS total FROM exibicoes
    `.catch(() => [{ total: 0 }]),

    sql`
      SELECT COUNT(*) AS total
      FROM exibicoes
      WHERE inicio >= DATE_TRUNC('month', NOW() AT TIME ZONE 'America/Sao_Paulo')
    `.catch(() => [{ total: 0 }]),

    sql`
      SELECT
        a.nome AS anunciante,
        COUNT(*) AS total
      FROM exibicoes e
      JOIN videos v ON v.id = e.video_id
      JOIN anunciantes a ON a.id = v.anunciante_id
      WHERE e.inicio >= DATE_TRUNC('month', NOW() AT TIME ZONE 'America/Sao_Paulo')
      GROUP BY a.id, a.nome
      ORDER BY total DESC
      LIMIT 5
    `.catch(() => []),
  ])

  const totalAllTime = Number((statsAllTime as Array<{ total: number }>)[0]?.total ?? 0)
  const totalMes = Number((statsMes as Array<{ total: number }>)[0]?.total ?? 0)

  const pontosData = (pontos as Array<{ id: number; nome: string }>).map((p) => ({
    id: Number(p.id),
    nome: String(p.nome),
  }))

  const anunciantesData = (anunciantes as Array<{ id: number; nome: string }>).map((a) => ({
    id: Number(a.id),
    nome: String(a.nome),
  }))

  const topData = (topAnunciantes as Array<{ anunciante: string; total: number }>).map((r) => ({
    anunciante: String(r.anunciante),
    total: Number(r.total),
  }))

  return (
    <div>
      <PageHeader
        title="Relatorios"
        description="Consulte exibicoes por periodo, tela ou anunciante."
      />
      <RelatoriosClient
        pontos={pontosData}
        anunciantes={anunciantesData}
        totalAllTime={totalAllTime}
        totalMes={totalMes}
        topAnunciantesMes={topData}
      />
    </div>
  )
}
