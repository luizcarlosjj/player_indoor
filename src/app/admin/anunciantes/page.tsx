import sql from '@/lib/db'
import Link from 'next/link'
import { Users } from 'lucide-react'
import { PageHeader } from '@/components/ui/page-header'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar } from '@/components/ui/avatar'
import { EmptyState } from '@/components/ui/empty-state'

export const metadata = { title: 'Anunciantes' }

export default async function AnunciantesPage() {
  const anunciantes = await sql`
    SELECT
      a.*,
      COUNT(DISTINCT c.id) FILTER (WHERE c.status = 'ativo' AND c.data_fim >= CURRENT_DATE) AS contratos_ativos,
      COUNT(DISTINCT v.id) AS total_videos
    FROM anunciantes a
    LEFT JOIN contratos c ON c.anunciante_id = a.id
    LEFT JOIN videos v ON v.anunciante_id = a.id
    GROUP BY a.id
    ORDER BY a.nome ASC
  `.catch(() => [])

  return (
    <div>
      <PageHeader title="Anunciantes" description={`${anunciantes.length} cadastrado${anunciantes.length !== 1 ? 's' : ''}`}>
        <Link href="/admin/anunciantes/novo">
          <Button size="sm">Novo anunciante</Button>
        </Link>
      </PageHeader>

      {anunciantes.length === 0 ? (
        <EmptyState
          icon={Users}
          title="Nenhum anunciante cadastrado"
          description="Adicione o primeiro anunciante para começar a gerenciar contratos."
          action={<Link href="/admin/anunciantes/novo"><Button size="sm">Novo anunciante</Button></Link>}
        />
      ) : (
        <div className="flex flex-col gap-2">
          {anunciantes.map((a) => (
            <Link
              key={a.id}
              href={`/admin/anunciantes/${a.id}`}
              className="flex items-center justify-between gap-4 bg-surface border border-border rounded-[12px] px-4 py-3 hover:border-border-subtle transition-colors group"
            >
              <div className="flex items-center gap-3 min-w-0">
                <Avatar name={a.nome} className="flex-shrink-0" />
                <div className="min-w-0">
                  <p className="text-[14px] font-medium text-fg group-hover:text-accent transition-colors truncate">{a.nome}</p>
                  {a.contato && (
                    <p className="text-[12px] text-subtle truncate">
                      {a.contato}{a.telefone ? ` · ${a.telefone}` : ''}
                    </p>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2 flex-shrink-0">
                {Number(a.contratos_ativos) > 0 ? (
                  <Badge variant="online">{a.contratos_ativos} ativo{Number(a.contratos_ativos) !== 1 ? 's' : ''}</Badge>
                ) : (
                  <Badge variant="muted">sem contrato</Badge>
                )}
                {Number(a.total_videos) > 0 && (
                  <Badge variant="default">{a.total_videos} vídeo{Number(a.total_videos) !== 1 ? 's' : ''}</Badge>
                )}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
