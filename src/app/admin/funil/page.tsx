import sql from '@/lib/db'
import { PageHeader } from '@/components/ui/page-header'
import { FunilKanban } from './FunilKanban'

export const metadata = { title: 'Funil de vendas' }

export default async function FunilPage() {
  const leads = await sql`
    SELECT id, empresa, segmento, telefone, proxima_acao, etapa
    FROM leads
    ORDER BY criado_em DESC
  `.catch(() => [])

  return (
    <div>
      <PageHeader
        title="Funil de vendas"
        description={`${leads.length} lead${leads.length !== 1 ? 's' : ''}`}
      />
      <FunilKanban leads={leads as any} />
    </div>
  )
}
