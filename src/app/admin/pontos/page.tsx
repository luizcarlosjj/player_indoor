import sql from '@/lib/db'
import Link from 'next/link'
import { Monitor } from 'lucide-react'
import { PageHeader } from '@/components/ui/page-header'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { StatusDot } from '@/components/ui/status-dot'
import { EmptyState } from '@/components/ui/empty-state'
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
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {pontos.map((p) => {
            const online = p.ultimo_heartbeat
              ? Date.now() - new Date(p.ultimo_heartbeat).getTime() < 10 * 60 * 1000
              : false
            const vistoHa = p.ultimo_heartbeat ? tempoRelativo(p.ultimo_heartbeat) : null

            return (
              <div
                key={p.id}
                className="bg-surface border border-border rounded-[12px] p-4 flex flex-col gap-3"
              >
                {/* Header */}
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-fg flex-1 truncate">{p.nome}</span>
                  {!p.ativo && <Badge variant="muted">inativo</Badge>}
                </div>

                {/* Status row */}
                <div className="flex items-center gap-2">
                  <StatusDot status={online ? 'online' : 'offline'} pulse={online} />
                  <span className="text-[13px] text-muted">
                    {online
                      ? 'no ar'
                      : vistoHa
                        ? `fora do ar ${vistoHa}`
                        : 'fora do ar'}
                  </span>
                </div>

                {/* Body */}
                <div className="flex items-center gap-2 min-h-[20px]">
                  {p.endereco && (
                    <span className="text-subtle text-[12px] flex-1 truncate">{p.endereco}</span>
                  )}
                  {p.orientacao && (
                    <Badge variant="default">{p.orientacao}</Badge>
                  )}
                </div>

                {/* Footer */}
                <Link href={`/admin/pontos/${p.id}`} className="mt-auto">
                  <Button variant="secondary" size="sm" className="w-full">
                    Ver detalhes
                  </Button>
                </Link>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
