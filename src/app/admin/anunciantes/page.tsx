import sql from '@/lib/db'
import Link from 'next/link'
import { Users } from 'lucide-react'
import { PageHeader } from '@/components/ui/page-header'
import { Button } from '@/components/ui/button'
import { EmptyState } from '@/components/ui/empty-state'
import { AnunciantesClient } from './AnunciantesClient'

export const metadata = { title: 'Anunciantes' }

export default async function AnunciantesPage() {
  const anunciantes = await sql`
    SELECT
      a.*,
      COUNT(DISTINCT c.id) FILTER (WHERE c.status = 'ativo' AND c.data_fim >= CURRENT_DATE) AS contratos_ativos,
      COUNT(DISTINCT v.id) AS total_videos,
      EXISTS (
        SELECT 1 FROM contratos c2
        WHERE c2.anunciante_id = a.id
          AND c2.status = 'ativo'
          AND c2.data_fim >= CURRENT_DATE
          AND c2.data_fim <= CURRENT_DATE + INTERVAL '30 days'
      ) AS vencendo
    FROM anunciantes a
    LEFT JOIN contratos c ON c.anunciante_id = a.id
    LEFT JOIN videos v ON v.anunciante_id = a.id
    GROUP BY a.id
    ORDER BY a.nome ASC
  `.catch(() => [])

  return (
    <div>
      <PageHeader
        title="Anunciantes"
        description={`${anunciantes.length} cadastrado${anunciantes.length !== 1 ? 's' : ''}`}
      >
        <Link href="/admin/anunciantes/novo">
          <Button size="sm">Novo anunciante</Button>
        </Link>
      </PageHeader>

      {anunciantes.length === 0 ? (
        <EmptyState
          icon={Users}
          title="Nenhum anunciante cadastrado"
          description="Adicione o primeiro anunciante para começar a gerenciar contratos."
          action={
            <Link href="/admin/anunciantes/novo">
              <Button size="sm">Novo anunciante</Button>
            </Link>
          }
        />
      ) : (
        <AnunciantesClient anunciantes={anunciantes as any} />
      )}
    </div>
  )
}
