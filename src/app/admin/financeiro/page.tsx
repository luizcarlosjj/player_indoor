import sql from '@/lib/db'
import { PageHeader } from '@/components/ui/page-header'
import { FinanceiroClient } from './FinanceiroClient'

export const metadata = { title: 'Financeiro' }

export interface Investimento {
  id: number
  descricao: string
  valor: number
  data: string
  categoria: string
}

export interface MesDado {
  mes: string
  mrr: number
  repasse: number
  margem: number
}

export interface InvestimentoMes {
  mes: string
  total: number
}

export default async function FinanceiroPage() {
  const [mrrRow, repasseRow, investRow, investimentos, historico, investPorMes] =
    await Promise.all([
      sql`SELECT COALESCE(SUM(valor_mensal),0) AS mrr FROM contratos WHERE status='ativo' AND data_fim >= CURRENT_DATE`.catch(() => [{ mrr: 0 }]),
      sql`SELECT COALESCE(SUM(repasse_mensal),0) AS repasse FROM pontos WHERE ativo=true`.catch(() => [{ repasse: 0 }]),
      sql`SELECT COALESCE(SUM(valor),0) AS total FROM investimentos`.catch(() => [{ total: 0 }]),
      sql`SELECT id, descricao, valor, data, categoria FROM investimentos ORDER BY data DESC`.catch(() => []),
      sql`
        SELECT
          TO_CHAR(DATE_TRUNC('month', gs.mes), 'MM/YYYY') AS mes,
          COALESCE(SUM(c.valor_mensal), 0) AS mrr,
          (SELECT COALESCE(SUM(repasse_mensal),0) FROM pontos WHERE ativo=true) AS repasse
        FROM generate_series(
          DATE_TRUNC('month', NOW() - INTERVAL '11 months'),
          DATE_TRUNC('month', NOW()),
          '1 month'::interval
        ) AS gs(mes)
        LEFT JOIN contratos c ON c.status = 'ativo'
          AND c.data_inicio <= gs.mes + INTERVAL '1 month' - INTERVAL '1 day'
          AND c.data_fim >= gs.mes
        GROUP BY gs.mes
        ORDER BY gs.mes ASC
      `.catch(() => []),
      sql`
        SELECT TO_CHAR(DATE_TRUNC('month', data), 'MM/YYYY') AS mes, SUM(valor) AS total
        FROM investimentos
        GROUP BY DATE_TRUNC('month', data)
        ORDER BY DATE_TRUNC('month', data) ASC
      `.catch(() => []),
    ])

  const mrr = Number((mrrRow[0] as any)?.mrr ?? 0)
  const repasse = Number((repasseRow[0] as any)?.repasse ?? 0)
  const margem = mrr - repasse
  const totalInvestido = Number((investRow[0] as any)?.total ?? 0)
  const mesesBreakEven = margem > 0 ? Math.ceil(totalInvestido / margem) : null

  const dadosHistorico: MesDado[] = (historico as any[]).map((row) => ({
    mes: String(row.mes),
    mrr: Number(row.mrr),
    repasse: Number(row.repasse),
    margem: Number(row.mrr) - Number(row.repasse),
  }))

  const dadosInvestPorMes: InvestimentoMes[] = (investPorMes as any[]).map((row) => ({
    mes: String(row.mes),
    total: Number(row.total),
  }))

  const listaInvestimentos: Investimento[] = (investimentos as any[]).map((row) => ({
    id: Number(row.id),
    descricao: String(row.descricao),
    valor: Number(row.valor),
    data: String(row.data),
    categoria: String(row.categoria),
  }))

  return (
    <div>
      <PageHeader
        title="Financeiro"
        description="Receita, repasses e controle de investimentos"
      />
      <FinanceiroClient
        mrr={mrr}
        repasse={repasse}
        margem={margem}
        totalInvestido={totalInvestido}
        mesesBreakEven={mesesBreakEven}
        historico={dadosHistorico}
        investPorMes={dadosInvestPorMes}
        investimentos={listaInvestimentos}
      />
    </div>
  )
}
