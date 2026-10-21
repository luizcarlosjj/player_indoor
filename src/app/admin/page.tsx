import sql from '@/lib/db'
import Link from 'next/link'
import { Monitor, Users, FileText, TrendingUp, AlertTriangle, WifiOff, Calendar, Check } from 'lucide-react'
import { PageHeader } from '@/components/ui/page-header'
import { formatBRL, formatDate, tempoRelativo } from '@/lib/utils'
import { GraficoExibicoes } from './GraficoExibicoes'

export const metadata = { title: 'Início' }

function saudacao(): string {
  const hora = new Date().toLocaleString('pt-BR', {
    timeZone: 'America/Sao_Paulo',
    hour: 'numeric',
    hour12: false,
  })
  const h = parseInt(hora, 10)
  if (h >= 5 && h < 12) return 'Bom dia,'
  if (h >= 12 && h < 18) return 'Boa tarde,'
  return 'Boa noite,'
}

export default async function AdminDashboard() {
  // KPI principal
  const [kpi] = await sql`
    SELECT
      (SELECT COUNT(*) FROM pontos WHERE ativo = true) AS pontos_ativos,
      (SELECT COUNT(*) FROM pontos) AS total_pontos,
      (SELECT COUNT(*) FROM anunciantes) AS total_anunciantes,
      (SELECT COUNT(DISTINCT anunciante_id)
        FROM contratos
        WHERE status = 'ativo' AND data_fim >= CURRENT_DATE
      ) AS anunciantes_rodando,
      (SELECT COALESCE(SUM(valor_mensal), 0)
        FROM contratos WHERE status = 'ativo' AND data_fim >= CURRENT_DATE
      ) AS receita_mensal,
      (SELECT COALESCE(SUM(p.repasse_mensal), 0)
        FROM pontos p
        WHERE p.ativo = true
      ) AS repasse_mensal,
      (SELECT COUNT(*)
        FROM contratos
        WHERE status = 'ativo'
          AND data_fim BETWEEN CURRENT_DATE AND CURRENT_DATE + INTERVAL '30 days'
      ) AS vencendo_30
  `.catch(() => [{
    pontos_ativos: 0, total_pontos: 0, total_anunciantes: 0,
    anunciantes_rodando: 0, receita_mensal: 0, repasse_mensal: 0, vencendo_30: 0,
  }])

  // Exibições hoje (timezone SP)
  const [exibHoje] = await sql`
    SELECT COUNT(*) AS total
    FROM exibicoes
    WHERE inicio >= (NOW() AT TIME ZONE 'America/Sao_Paulo')::date
  `.catch(() => [{ total: 0 }])

  // Exibições no mês (timezone SP)
  const [exibMes] = await sql`
    SELECT COUNT(*) AS total
    FROM exibicoes
    WHERE inicio >= DATE_TRUNC('month', NOW() AT TIME ZONE 'America/Sao_Paulo')
  `.catch(() => [{ total: 0 }])

  // Gráfico 30 dias
  const grafico = await sql`
    SELECT
      TO_CHAR(
        (inicio AT TIME ZONE 'America/Sao_Paulo')::date,
        'DD/MM'
      ) AS dia,
      COUNT(*) AS total
    FROM exibicoes
    WHERE inicio >= NOW() - INTERVAL '30 days'
    GROUP BY (inicio AT TIME ZONE 'America/Sao_Paulo')::date
    ORDER BY (inicio AT TIME ZONE 'America/Sao_Paulo')::date ASC
  `.catch(() => [])

  const dadosGrafico = grafico.map((r) => ({ dia: String(r.dia), total: Number(r.total) }))

  // TVs offline (ativo=true, heartbeat > 30 min atrás)
  const tvsOffline = await sql`
    SELECT
      p.id,
      p.nome,
      hb.recebido_em AS ultimo_heartbeat
    FROM pontos p
    LEFT JOIN LATERAL (
      SELECT recebido_em
      FROM heartbeats
      WHERE ponto_id = p.id
      ORDER BY recebido_em DESC
      LIMIT 1
    ) hb ON true
    WHERE p.ativo = true
      AND (hb.recebido_em IS NULL OR hb.recebido_em < NOW() - INTERVAL '30 minutes')
    ORDER BY p.nome ASC
    LIMIT 5
  `.catch(() => [])

  // Contratos vencendo em 30 dias
  const vencendo = await sql`
    SELECT c.id, c.data_fim, a.nome, a.id AS anunciante_id
    FROM contratos c
    JOIN anunciantes a ON a.id = c.anunciante_id
    WHERE c.status = 'ativo'
      AND c.data_fim BETWEEN CURRENT_DATE AND CURRENT_DATE + INTERVAL '30 days'
    ORDER BY c.data_fim ASC
    LIMIT 5
  `.catch(() => [])

  // Pontos ativos sem playlist
  const semPlaylist = await sql`
    SELECT p.id, p.nome
    FROM pontos p
    WHERE p.ativo = true
      AND NOT EXISTS (
        SELECT 1 FROM playlist_itens pi
        WHERE pi.ponto_id = p.id
      )
    ORDER BY p.nome ASC
    LIMIT 5
  `.catch(() => [])

  // Atividade recente: últimas 5 exibições por anunciante
  const ultimasExibicoes = await sql`
    SELECT
      e.inicio,
      v.titulo AS video_titulo,
      a.nome AS anunciante_nome,
      a.id AS anunciante_id
    FROM exibicoes e
    JOIN videos v ON v.id = e.video_id
    JOIN anunciantes a ON a.id = v.anunciante_id
    ORDER BY e.inicio DESC
    LIMIT 5
  `.catch(() => [])

  // Últimos 3 contratos criados
  const ultimosContratos = await sql`
    SELECT c.id, c.criado_em, c.valor_mensal, c.data_fim, a.nome AS anunciante_nome, a.id AS anunciante_id
    FROM contratos c
    JOIN anunciantes a ON a.id = c.anunciante_id
    ORDER BY c.criado_em DESC
    LIMIT 3
  `.catch(() => [])

  const receita = Number(kpi.receita_mensal)
  const repasse = Number(kpi.repasse_mensal)
  const margem = receita - repasse
  const pontosAtivos = Number(kpi.pontos_ativos)
  const totalPontos = Number(kpi.total_pontos)

  // Resumo humano
  const resumo = [
    totalPontos > 0 ? `${pontosAtivos} tela${pontosAtivos !== 1 ? 's' : ''} no ar` : null,
    Number(kpi.anunciantes_rodando) > 0
      ? `${kpi.anunciantes_rodando} anunciante${Number(kpi.anunciantes_rodando) !== 1 ? 's' : ''} rodando`
      : null,
    Number(kpi.vencendo_30) > 0
      ? `${kpi.vencendo_30} contrato${Number(kpi.vencendo_30) !== 1 ? 's' : ''} vencendo esse mês`
      : null,
  ]
    .filter(Boolean)
    .join(', ')

  const temAtencao = tvsOffline.length > 0 || vencendo.length > 0 || semPlaylist.length > 0

  return (
    <div>
      <PageHeader
        title={saudacao()}
        description={resumo || 'Tudo tranquilo por aqui.'}
      />

      {/* KPIs — linha 1 */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-3">
        <KpiCard
          label="Receita mensal"
          value={formatBRL(receita)}
          icon={TrendingUp}
        />
        <KpiCard
          label="Repasse mensal"
          value={formatBRL(repasse)}
          icon={TrendingUp}
        />
        <KpiCard
          label="Margem"
          value={formatBRL(margem)}
          icon={TrendingUp}
          accent={margem > 0}
        />
        <KpiCard
          label="Telas no ar"
          value={`${pontosAtivos} de ${totalPontos}`}
          icon={Monitor}
          accent={pontosAtivos > 0}
        />
      </div>

      {/* KPIs — linha 2 */}
      <div className="grid grid-cols-2 gap-3 mb-6">
        <KpiCard
          label="Exibições hoje"
          value={String(Number(exibHoje.total))}
          icon={Monitor}
        />
        <KpiCard
          label="Exibições no mês"
          value={String(Number(exibMes.total))}
          icon={Monitor}
        />
      </div>

      {/* Onboarding — primeiros passos */}
      {totalPontos === 0 && (
        <div className="bg-surface border border-border rounded-[12px] p-5 mb-6">
          <p className="text-[13px] font-semibold text-fg mb-4">Primeiros passos</p>
          <ol className="flex flex-col gap-3">
            {[
              { label: 'Cadastre a primeira tela', href: '/admin/pontos/novo', done: totalPontos > 0 },
              { label: 'Adicione um anunciante', href: '/admin/anunciantes', done: Number(kpi.total_anunciantes) > 0 },
              { label: 'Crie um contrato', href: '/admin/contratos', done: Number(kpi.anunciantes_rodando) > 0 },
            ].map((step, i) => (
              <li key={i} className="flex items-center gap-3">
                <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${step.done ? 'border-online bg-online/10' : 'border-border'}`}>
                  {step.done && <Check size={11} className="text-online" />}
                </div>
                {step.done ? (
                  <span className="text-[13px] text-muted line-through">{step.label}</span>
                ) : (
                  <Link href={step.href} className="text-[13px] text-fg hover:text-accent transition-colors">
                    {step.label}
                  </Link>
                )}
              </li>
            ))}
          </ol>
        </div>
      )}

      {/* Gráfico */}
      <div className="bg-surface border border-border rounded-[12px] p-4 mb-6">
        <p className="text-[11px] font-medium text-subtle uppercase tracking-widest mb-4">
          Exibições — últimos 30 dias
        </p>
        <GraficoExibicoes dados={dadosGrafico} />
      </div>

      {/* Precisa de atenção */}
      {temAtencao && (
        <div className="bg-alert/5 border border-alert/20 rounded-[12px] p-4 mb-6">
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle size={14} className="text-alert flex-shrink-0" />
            <p className="text-[13px] font-semibold text-alert">Precisa da sua atenção</p>
          </div>
          <ul className="flex flex-col gap-2">
            {tvsOffline.map((p) => (
              <li key={`offline-${p.id}`} className="flex items-center gap-2 text-[13px]">
                <WifiOff size={13} className="text-alert flex-shrink-0" />
                <span className="text-fg">
                  <Link href={`/admin/pontos/${p.id}`} className="hover:text-accent transition-colors">
                    {p.nome}
                  </Link>
                  {' '}offline
                  {p.ultimo_heartbeat ? ` ${tempoRelativo(p.ultimo_heartbeat)}` : ' (sem sinal)'}
                </span>
              </li>
            ))}
            {vencendo.map((c) => (
              <li key={`venc-${c.id}`} className="flex items-center gap-2 text-[13px]">
                <Calendar size={13} className="text-alert flex-shrink-0" />
                <span className="text-fg">
                  Contrato de{' '}
                  <Link href={`/admin/anunciantes/${c.anunciante_id}`} className="hover:text-accent transition-colors">
                    {c.nome}
                  </Link>
                  {' '}vence em {formatDate(c.data_fim)}
                </span>
              </li>
            ))}
            {semPlaylist.map((p) => (
              <li key={`sem-${p.id}`} className="flex items-center gap-2 text-[13px]">
                <Monitor size={13} className="text-alert flex-shrink-0" />
                <span className="text-fg">
                  <Link href={`/admin/pontos/${p.id}`} className="hover:text-accent transition-colors">
                    {p.nome}
                  </Link>
                  {' '}sem playlist ativa
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Atividade recente */}
      {(ultimasExibicoes.length > 0 || ultimosContratos.length > 0) && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {ultimasExibicoes.length > 0 && (
            <div className="bg-surface border border-border rounded-[12px] p-4">
              <p className="text-[11px] font-medium text-subtle uppercase tracking-widest mb-3">
                Exibições recentes
              </p>
              <ul className="flex flex-col gap-2">
                {ultimasExibicoes.map((e, i) => (
                  // eslint-disable-next-line react/no-array-index-key
                  <li key={i} className="flex items-center justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-[13px] text-fg truncate">
                        <Link href={`/admin/anunciantes/${e.anunciante_id}`} className="hover:text-accent transition-colors">
                          {e.anunciante_nome}
                        </Link>
                      </p>
                      <p className="text-[11px] text-subtle truncate">{e.video_titulo}</p>
                    </div>
                    <span className="text-[11px] text-subtle flex-shrink-0">{tempoRelativo(e.inicio)}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {ultimosContratos.length > 0 && (
            <div className="bg-surface border border-border rounded-[12px] p-4">
              <p className="text-[11px] font-medium text-subtle uppercase tracking-widest mb-3">
                Contratos recentes
              </p>
              <ul className="flex flex-col gap-2">
                {ultimosContratos.map((c) => (
                  <li key={c.id} className="flex items-center justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-[13px] text-fg truncate">
                        <Link href={`/admin/anunciantes/${c.anunciante_id}`} className="hover:text-accent transition-colors">
                          {c.anunciante_nome}
                        </Link>
                      </p>
                      <p className="text-[11px] text-subtle">{formatBRL(c.valor_mensal)}/mês</p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="text-[11px] text-subtle">até {formatDate(c.data_fim)}</p>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* Atalhos */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-6">
        <QuickLink href="/admin/pontos" label="Telas" description="Gerenciar pontos de exibição" icon={Monitor} />
        <QuickLink href="/admin/anunciantes" label="Anunciantes" description="Clientes e contratos" icon={Users} />
        <QuickLink href="/admin/contratos" label="Contratos" description="Visão geral de contratos" icon={FileText} />
      </div>
    </div>
  )
}

function KpiCard({
  label, value, icon: Icon, accent = false,
}: {
  label: string
  value: string
  icon: React.ElementType
  accent?: boolean
}) {
  return (
    <div className="bg-surface border border-border rounded-[12px] p-4">
      <div className="flex items-center justify-between mb-3">
        <p className="text-[11px] text-subtle uppercase tracking-widest font-medium">{label}</p>
        <div className="w-7 h-7 rounded-[6px] bg-elevated flex items-center justify-center">
          <Icon size={14} className={accent ? 'text-accent' : 'text-muted'} />
        </div>
      </div>
      <p className={`text-[22px] font-bold leading-none ${accent ? 'text-accent' : 'text-fg'}`}>
        {value}
      </p>
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
      className="group flex items-center gap-3 bg-surface border border-border rounded-[12px] p-4 hover:border-accent/40 transition-colors"
    >
      <div className="w-8 h-8 rounded-[8px] bg-elevated flex items-center justify-center flex-shrink-0">
        <Icon size={15} className="text-muted group-hover:text-accent transition-colors" />
      </div>
      <div className="min-w-0">
        <p className="text-[13px] font-medium text-fg">{label}</p>
        <p className="text-[11px] text-subtle">{description}</p>
      </div>
    </Link>
  )
}
