import sql from '@/lib/db'
import Link from 'next/link'
import { AlertTriangle, FileText } from 'lucide-react'
import { PageHeader } from '@/components/ui/page-header'
import { Badge } from '@/components/ui/badge'
import { EmptyState } from '@/components/ui/empty-state'
import { formatBRL, formatDate } from '@/lib/utils'

export const metadata = { title: 'Contratos' }

export default async function ContratosPage() {
  const contratos = await sql`
    SELECT
      c.*,
      a.nome AS anunciante_nome,
      a.id AS anunciante_id
    FROM contratos c
    JOIN anunciantes a ON a.id = c.anunciante_id
    ORDER BY c.data_fim ASC
  `.catch(() => [])

  const hoje = new Date()
  const em30dias = new Date(Date.now() + 30 * 86400000)

  const ativos = contratos.filter((c) => c.status === 'ativo' && new Date(c.data_fim) >= hoje)
  const vencendo = ativos.filter((c) => new Date(c.data_fim) <= em30dias)
  const encerrados = contratos.filter((c) => c.status === 'encerrado' || new Date(c.data_fim) < hoje)

  if (contratos.length === 0) {
    return (
      <div>
        <PageHeader title="Contratos" />
        <EmptyState
          icon={FileText}
          title="Nenhum contrato cadastrado"
          description="Contratos são criados dentro do cadastro de cada anunciante."
          action={<Link href="/admin/anunciantes" className="text-[13px] text-accent hover:underline">Ver anunciantes</Link>}
        />
      </div>
    )
  }

  return (
    <div>
      <PageHeader
        title="Contratos"
        description={`${ativos.length} ativo${ativos.length !== 1 ? 's' : ''} · ${encerrados.length} encerrado${encerrados.length !== 1 ? 's' : ''}`}
      />

      {/* Vencendo em 30 dias */}
      {vencendo.length > 0 && (
        <div className="bg-alert/5 border border-alert/20 rounded-[12px] p-4 mb-6">
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle size={14} className="text-alert" />
            <p className="text-[13px] font-semibold text-alert">Vencendo nos próximos 30 dias</p>
          </div>
          <div className="flex flex-col gap-2">
            {vencendo.map((c) => (
              <div key={c.id} className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-3 min-w-0">
                  <Link
                    href={`/admin/anunciantes/${c.anunciante_id}`}
                    className="text-[13px] text-fg hover:text-accent transition-colors truncate"
                  >
                    {c.anunciante_nome}
                  </Link>
                  <span className="text-[12px] text-subtle flex-shrink-0">{formatBRL(c.valor_mensal)}/mês</span>
                </div>
                <span className="text-[12px] text-alert flex-shrink-0">{formatDate(c.data_fim)}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="flex flex-col gap-6">
        <Secao titulo={`Ativos (${ativos.length})`} contratos={ativos} />
        <Secao titulo={`Encerrados (${encerrados.length})`} contratos={encerrados} dimmed />
      </div>
    </div>
  )
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function Secao({ titulo, contratos, dimmed }: { titulo: string; contratos: any[]; dimmed?: boolean }) {
  if (contratos.length === 0) return null
  return (
    <section>
      <h2 className="text-[11px] font-medium text-subtle uppercase tracking-widest mb-3">{titulo}</h2>
      <div className="flex flex-col gap-2">
        {contratos.map((c) => (
          <div
            key={c.id}
            className={`flex items-center justify-between gap-4 bg-surface border border-border rounded-[10px] px-4 py-3 ${dimmed ? 'opacity-60' : ''}`}
          >
            <div className="flex items-center gap-3 min-w-0">
              <Badge variant={dimmed ? 'muted' : c.status === 'ativo' ? 'online' : 'default'}>
                {c.status}
              </Badge>
              <Link
                href={`/admin/anunciantes/${c.anunciante_id}`}
                className="text-[14px] font-medium text-fg hover:text-accent transition-colors truncate"
              >
                {c.anunciante_nome}
              </Link>
              <span className="text-[12px] text-subtle flex-shrink-0 hidden sm:block">
                {formatBRL(c.valor_mensal)}/mês
              </span>
            </div>
            <div className="text-[12px] text-subtle flex-shrink-0">
              {formatDate(c.data_inicio)} — {formatDate(c.data_fim)}
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}
