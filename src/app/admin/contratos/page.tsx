import sql from '@/lib/db'
import Link from 'next/link'
import { FileText } from 'lucide-react'
import { PageHeader } from '@/components/ui/page-header'
import { EmptyState } from '@/components/ui/empty-state'
import { ContratosClient } from './ContratosClient'

export const metadata = { title: 'Contratos' }

export default async function ContratosPage() {
  const contratos = await sql`
    SELECT
      c.id,
      c.anunciante_id,
      c.valor_mensal,
      c.data_inicio,
      c.data_fim,
      c.status,
      a.nome AS anunciante_nome,
      a.id AS anunciante_id
    FROM contratos c
    JOIN anunciantes a ON a.id = c.anunciante_id
    ORDER BY c.data_fim ASC
  `.catch(() => [])

  if (contratos.length === 0) {
    return (
      <div>
        <PageHeader title="Contratos" />
        <EmptyState
          icon={FileText}
          title="Nenhum contrato cadastrado"
          description="Contratos são criados dentro do cadastro de cada anunciante."
          action={
            <Link href="/admin/anunciantes" className="text-[13px] text-accent hover:underline">
              Ver anunciantes
            </Link>
          }
        />
      </div>
    )
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const dados = contratos.map((c: any) => ({
    id: Number(c.id),
    anunciante_id: Number(c.anunciante_id),
    anunciante_nome: String(c.anunciante_nome),
    valor_mensal: Number(c.valor_mensal),
    data_inicio: String(c.data_inicio),
    data_fim: String(c.data_fim),
    status: String(c.status),
  }))

  return (
    <div>
      <PageHeader title="Contratos" />
      <ContratosClient contratos={dados} />
    </div>
  )
}
