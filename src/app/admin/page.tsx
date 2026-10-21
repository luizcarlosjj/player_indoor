import sql from '@/lib/db'
import Link from 'next/link'
import { Monitor, Users, FileText, TrendingUp, AlertTriangle, ArrowRight } from 'lucide-react'
import { PageHeader } from '@/components/ui/page-header'
import { formatBRL, formatDate } from '@/lib/utils'

export const metadata = { title: 'Início' }

export default async function AdminDashboard() {
  const [stats] = await sql`
    SELECT
      (SELECT COUNT(*) FROM pontos WHERE ativo = true) AS pontos_ativos,
      (SELECT COUNT(*) FROM contratos WHERE status = 'ativo' AND data_fim >= CURRENT_DATE) AS contratos_ativos,
      (SELECT COUNT(*) FROM anunciantes) AS total_anunciantes,
      (SELECT COUNT(*) FILTER (WHERE recebido_em > NOW() - INTERVAL '10 minutes')
        FROM (SELECT DISTINCT ON (ponto_id) recebido_em FROM heartbeats ORDER BY ponto_id, recebido_em DESC) h
      ) AS tvs_online,
      (SELECT COALESCE(SUM(valor_mensal), 0) FROM contratos WHERE status = 'ativo' AND data_fim >= CURRENT_DATE) AS receita_mensal
  `.catch(() => [{ pontos_ativos: 0, contratos_ativos: 0, total_anunciantes: 0, tvs_online: 0, receita_mensal: 0 }])

  const vencendo = await sql`
    SELECT c.id, c.data_fim, a.nome, a.id AS anunciante_id
    FROM contratos c
    JOIN anunciantes a ON a.id = c.anunciante_id
    WHERE c.status = 'ativo'
      AND c.data_fim BETWEEN CURRENT_DATE AND CURRENT_DATE + INTERVAL '30 days'
    ORDER BY c.data_fim ASC
    LIMIT 5
  `.catch(() => [])

  const statCards = [
    { label: 'TVs online', value: String(stats.tvs_online), icon: Monitor, accent: Number(stats.tvs_online) > 0 },
    { label: 'Pontos ativos', value: String(stats.pontos_ativos), icon: Monitor, accent: false },
    { label: 'Contratos ativos', value: String(stats.contratos_ativos), icon: FileText, accent: false },
    { label: 'Receita mensal', value: formatBRL(stats.receita_mensal), icon: TrendingUp, accent: false },
  ]

  return (
    <div>
      <PageHeader title="Início" />

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        {statCards.map((card) => {
          const Icon = card.icon
          return (
            <div
              key={card.label}
              className="bg-surface border border-border rounded-[12px] p-4"
            >
              <div className="flex items-center justify-between mb-3">
                <p className="text-[11px] text-subtle uppercase tracking-widest font-medium">{card.label}</p>
                <div className="w-7 h-7 rounded-[6px] bg-elevated flex items-center justify-center">
                  <Icon size={14} className={card.accent ? 'text-online' : 'text-muted'} />
                </div>
              </div>
              <p className={`text-[22px] font-bold leading-none ${card.accent ? 'text-online' : 'text-fg'}`}>
                {card.value}
              </p>
            </div>
          )
        })}
      </div>

      {/* Vencendo em 30 dias */}
      {vencendo.length > 0 && (
        <div className="bg-alert/5 border border-alert/20 rounded-[12px] p-4 mb-6">
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle size={14} className="text-alert flex-shrink-0" />
            <p className="text-[13px] font-semibold text-alert">Contratos vencendo em 30 dias</p>
          </div>
          <ul className="space-y-2">
            {vencendo.map((c) => (
              <li key={c.id} className="flex items-center justify-between">
                <Link
                  href={`/admin/anunciantes/${c.anunciante_id}`}
                  className="text-[13px] text-fg hover:text-accent transition-colors"
                >
                  {c.nome}
                </Link>
                <span className="text-[12px] text-alert">{formatDate(c.data_fim)}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Atalhos */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <QuickLink href="/admin/pontos" label="Telas" description="Gerenciar pontos de exibição" icon={Monitor} />
        <QuickLink href="/admin/anunciantes" label="Anunciantes" description="Clientes e contratos" icon={Users} />
        <QuickLink href="/admin/contratos" label="Contratos" description="Visão geral de contratos" icon={FileText} />
      </div>
    </div>
  )
}

function QuickLink({
  href, label, description, icon: Icon,
}: {
  href: string
  label: string
  description: string
  icon: React.ElementType
}) {
  return (
    <Link
      href={href}
      className="group flex items-center justify-between bg-surface border border-border rounded-[12px] p-4 hover:border-accent/40 transition-colors"
    >
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-[8px] bg-elevated flex items-center justify-center">
          <Icon size={15} className="text-muted group-hover:text-accent transition-colors" />
        </div>
        <div>
          <p className="text-[13px] font-medium text-fg">{label}</p>
          <p className="text-[11px] text-subtle">{description}</p>
        </div>
      </div>
      <ArrowRight size={14} className="text-subtle group-hover:text-accent transition-colors" />
    </Link>
  )
}
