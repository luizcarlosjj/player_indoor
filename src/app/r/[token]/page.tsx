import sql from '@/lib/db'
import { formatBRL, formatDate } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'

export const dynamic = 'force-dynamic'

export async function generateMetadata({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params
  const [a] = await sql`SELECT nome FROM anunciantes WHERE relatorio_token = ${token}`.catch(() => [null])
  return { title: a ? `Relatório · ${a.nome}` : 'Relatório não encontrado' }
}

function mesReferencia(): string {
  const agora = new Date(
    new Date().toLocaleString('en-US', { timeZone: 'America/Sao_Paulo' }),
  )
  return agora.toLocaleDateString('pt-BR', {
    month: 'long',
    year: 'numeric',
    timeZone: 'America/Sao_Paulo',
  })
}

function capitalizar(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1)
}

function calcularVariacao(atual: number, anterior: number): { texto: string; positivo: boolean } | null {
  if (anterior === 0) return null
  const pct = Math.round(((atual - anterior) / anterior) * 100)
  return {
    texto: `${pct >= 0 ? '+' : ''}${pct}%`,
    positivo: pct >= 0,
  }
}

export default async function RelatorioPublicoPage({
  params,
}: {
  params: Promise<{ token: string }>
}) {
  const { token } = await params

  const [anunciante] = await sql`
    SELECT id, nome, segmento FROM anunciantes WHERE relatorio_token = ${token}
  `.catch(() => [null])

  if (!anunciante) {
    return (
      <div className="min-h-screen bg-base flex items-center justify-center px-4">
        <div className="text-center">
          <p className="text-[28px] mb-2">🔗</p>
          <h1 className="text-[18px] font-semibold text-fg mb-2">Relatório não encontrado</h1>
          <p className="text-[14px] text-muted">
            Este link pode ter expirado ou ser inválido.
          </p>
        </div>
      </div>
    )
  }

  // Contrato ativo
  const [contrato] = await sql`
    SELECT valor_mensal, data_fim FROM contratos
    WHERE anunciante_id = ${anunciante.id}
      AND status = 'ativo'
    ORDER BY data_fim DESC
    LIMIT 1
  `.catch(() => [null])

  // Exibicoes este mes
  const [{ count: exibicoesMes }] = await sql`
    SELECT COUNT(*) AS count FROM exibicoes e
    JOIN videos v ON v.id = e.video_id
    WHERE v.anunciante_id = ${anunciante.id}
      AND e.inicio >= DATE_TRUNC('month', NOW() AT TIME ZONE 'America/Sao_Paulo')
  `

  // Exibicoes mes passado
  const [{ count: exibicoesMesPassado }] = await sql`
    SELECT COUNT(*) AS count FROM exibicoes e
    JOIN videos v ON v.id = e.video_id
    WHERE v.anunciante_id = ${anunciante.id}
      AND e.inicio >= DATE_TRUNC('month', NOW() AT TIME ZONE 'America/Sao_Paulo') - INTERVAL '1 month'
      AND e.inicio < DATE_TRUNC('month', NOW() AT TIME ZONE 'America/Sao_Paulo')
  `

  // Exibicoes total
  const [{ count: exibicoesTotal }] = await sql`
    SELECT COUNT(*) AS count FROM exibicoes e
    JOIN videos v ON v.id = e.video_id
    WHERE v.anunciante_id = ${anunciante.id}
  `

  // Por ponto (este mes)
  const porPonto = await sql`
    SELECT p.nome AS ponto_nome, COUNT(*) AS exibicoes_mes
    FROM exibicoes e
    JOIN videos v ON v.id = e.video_id
    JOIN pontos p ON p.id = e.ponto_id
    WHERE v.anunciante_id = ${anunciante.id}
      AND e.inicio >= DATE_TRUNC('month', NOW() AT TIME ZONE 'America/Sao_Paulo')
    GROUP BY p.id, p.nome
    ORDER BY exibicoes_mes DESC
  `

  // Videos com exibicoes este mes
  const videos = await sql`
    SELECT v.titulo, COUNT(e.id) AS exibicoes_mes
    FROM videos v
    LEFT JOIN exibicoes e ON e.video_id = v.id
      AND e.inicio >= DATE_TRUNC('month', NOW() AT TIME ZONE 'America/Sao_Paulo')
    WHERE v.anunciante_id = ${anunciante.id}
    GROUP BY v.id, v.titulo
    ORDER BY exibicoes_mes DESC, v.titulo
  `

  const mesMes = Number(exibicoesMes)
  const mesPassado = Number(exibicoesMesPassado)
  const total = Number(exibicoesTotal)
  const variacaoMes = calcularVariacao(mesMes, mesPassado)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const maxPonto = porPonto.length > 0 ? Math.max(...(porPonto as any[]).map((p) => Number(p.exibicoes_mes))) : 1

  const hoje = new Date(
    new Date().toLocaleString('en-US', { timeZone: 'America/Sao_Paulo' }),
  )
  const dataGeracao = hoje.toLocaleDateString('pt-BR', { timeZone: 'America/Sao_Paulo' })

  return (
    <div className="min-h-screen bg-base py-10 px-4">
      <div className="max-w-[480px] mx-auto flex flex-col gap-6">

        {/* Header / Logo */}
        <div className="text-center mb-2">
          <p className="text-[13px] font-semibold text-accent tracking-wider uppercase">Tenax Indoor</p>
          <p className="text-[12px] text-muted mt-0.5">Relatório de exibições</p>
        </div>

        {/* Titulo anunciante */}
        <div>
          <h1 className="text-[22px] font-bold text-fg leading-tight">{anunciante.nome}</h1>
          <div className="flex items-center gap-2 mt-1 flex-wrap">
            {anunciante.segmento && (
              <Badge variant="default">{anunciante.segmento}</Badge>
            )}
            <span className="text-[13px] text-muted">
              {capitalizar(mesReferencia())}
            </span>
          </div>
        </div>

        {/* KPI cards */}
        <div className="grid grid-cols-1 gap-3">

          {/* Exibicoes este mes */}
          <div className="bg-surface border border-border rounded-[12px] p-4">
            <p className="text-[11px] font-medium text-subtle uppercase tracking-widest mb-2">
              Exibições este mês
            </p>
            <div className="flex items-end gap-3">
              <span className="text-[32px] font-bold text-fg leading-none">{mesMes.toLocaleString('pt-BR')}</span>
              {variacaoMes && (
                <span
                  className={`text-[13px] font-semibold mb-1 ${variacaoMes.positivo ? 'text-online' : 'text-alert'}`}
                >
                  {variacaoMes.texto} vs mês anterior
                </span>
              )}
              {!variacaoMes && mesPassado === 0 && mesMes > 0 && (
                <span className="text-[12px] text-muted mb-1">primeiro mês</span>
              )}
            </div>
          </div>

          {/* Cards menores em grid */}
          <div className="grid grid-cols-2 gap-3">

            <div className="bg-surface border border-border rounded-[12px] p-4">
              <p className="text-[11px] font-medium text-subtle uppercase tracking-widest mb-2">
                Total histórico
              </p>
              <span className="text-[24px] font-bold text-fg leading-none">
                {total.toLocaleString('pt-BR')}
              </span>
            </div>

            <div className="bg-surface border border-border rounded-[12px] p-4">
              <p className="text-[11px] font-medium text-subtle uppercase tracking-widest mb-2">
                Contrato
              </p>
              {contrato ? (
                <>
                  <p className="text-[15px] font-bold text-fg leading-none mb-1">
                    {formatBRL(contrato.valor_mensal)}<span className="text-[12px] font-normal text-muted">/mês</span>
                  </p>
                  <p className="text-[11px] text-muted">
                    até {formatDate(contrato.data_fim)}
                  </p>
                </>
              ) : (
                <p className="text-[13px] text-subtle">Sem contrato ativo</p>
              )}
            </div>

          </div>
        </div>

        {/* Por tela */}
        {porPonto.length > 0 && (
          <section>
            <h2 className="text-[11px] font-medium text-subtle uppercase tracking-widest mb-3">
              Por tela
            </h2>
            <div className="bg-surface border border-border rounded-[12px] p-4 flex flex-col gap-3">
              {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
              {(porPonto as any[]).map((p: { ponto_nome: string; exibicoes_mes: number }) => {
                const count = Number(p.exibicoes_mes)
                const pct = maxPonto > 0 ? Math.round((count / maxPonto) * 100) : 0
                return (
                  <div key={p.ponto_nome}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[13px] text-fg font-medium truncate pr-2">{p.ponto_nome}</span>
                      <span className="text-[12px] text-muted flex-shrink-0">{count.toLocaleString('pt-BR')}</span>
                    </div>
                    <div className="h-1.5 bg-elevated rounded-full overflow-hidden">
                      <div
                        className="h-full bg-accent rounded-full transition-all"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                )
              })}
            </div>
          </section>
        )}

        {/* Seus videos */}
        {videos.length > 0 && (
          <section>
            <h2 className="text-[11px] font-medium text-subtle uppercase tracking-widest mb-3">
              Seus vídeos
            </h2>
            <div className="bg-surface border border-border rounded-[12px] divide-y divide-border overflow-hidden">
              {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
              {(videos as any[]).map((v: { titulo: string; exibicoes_mes: number }) => (
                <div
                  key={v.titulo}
                  className="flex items-center justify-between px-4 py-3 gap-3"
                >
                  <span className="text-[13px] text-fg truncate">{v.titulo}</span>
                  <span className="text-[12px] text-muted flex-shrink-0 tabular-nums">
                    {Number(v.exibicoes_mes).toLocaleString('pt-BR')} exib.
                  </span>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Footer */}
        <p className="text-center text-[11px] text-subtle pt-2">
          Gerado em {dataGeracao} · Tenax Indoor
        </p>

      </div>
    </div>
  )
}
