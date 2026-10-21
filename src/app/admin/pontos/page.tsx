import sql from '@/lib/db'
import Link from 'next/link'
import { ExternalLink, Monitor } from 'lucide-react'
import { PageHeader } from '@/components/ui/page-header'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { StatusDot } from '@/components/ui/status-dot'
import { EmptyState } from '@/components/ui/empty-state'
import { TogglePonto } from './TogglePonto'
import { tempoRelativo } from '@/lib/utils'

export const metadata = { title: 'Telas' }

export default async function PontosPage() {
  const pontos = await sql`
    SELECT
      p.*,
      (SELECT recebido_em FROM heartbeats WHERE ponto_id = p.id ORDER BY recebido_em DESC LIMIT 1) AS ultimo_heartbeat
    FROM pontos p
    ORDER BY p.nome ASC
  `.catch(() => [])

  return (
    <div>
      <PageHeader title="Telas" description={`${pontos.length} ponto${pontos.length !== 1 ? 's' : ''} cadastrado${pontos.length !== 1 ? 's' : ''}`}>
        <Link href="/admin/pontos/novo">
          <Button size="sm">Novo ponto</Button>
        </Link>
      </PageHeader>

      {pontos.length === 0 ? (
        <EmptyState
          icon={Monitor}
          title="Nenhum ponto cadastrado"
          description="Crie o primeiro ponto de exibição para começar."
          action={<Link href="/admin/pontos/novo"><Button size="sm">Novo ponto</Button></Link>}
        />
      ) : (
        <div className="flex flex-col gap-2">
          {pontos.map((p) => {
            const online = p.ultimo_heartbeat
              ? Date.now() - new Date(p.ultimo_heartbeat).getTime() < 10 * 60 * 1000
              : false
            const vistoHa = p.ultimo_heartbeat ? tempoRelativo(p.ultimo_heartbeat) : 'nunca'

            return (
              <div
                key={p.id}
                className="flex items-center justify-between gap-3 bg-surface border border-border rounded-[12px] px-4 py-3 hover:border-border-subtle transition-colors"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2.5 mb-0.5">
                    <StatusDot
                      status={online ? 'online' : 'offline'}
                      pulse={online}
                    />
                    <span className="text-[14px] font-medium text-fg truncate">{p.nome}</span>
                    {!p.ativo && (
                      <Badge variant="muted">inativo</Badge>
                    )}
                  </div>
                  <p className="text-[12px] text-subtle pl-[18px]">
                    {online ? 'Online agora' : `Visto ${vistoHa}`}
                    {p.endereco ? ` · ${p.endereco}` : ''}
                  </p>
                </div>

                <div className="flex items-center gap-3 flex-shrink-0">
                  <a
                    href={`/player/${p.token_player}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 text-[12px] text-info hover:text-info/80 transition-colors"
                    title="Abrir player"
                  >
                    <ExternalLink size={13} />
                    <span className="hidden sm:inline">Player</span>
                  </a>
                  <Link
                    href={`/admin/pontos/${p.id}`}
                    className="text-[12px] text-muted hover:text-fg transition-colors"
                  >
                    Editar
                  </Link>
                  <TogglePonto id={p.id} ativo={p.ativo} />
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
