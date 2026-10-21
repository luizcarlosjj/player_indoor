import sql from '@/lib/db'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ChevronLeft } from 'lucide-react'
import { PageHeader } from '@/components/ui/page-header'
import { PontosTabs } from './PontosTabs'

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const [ponto] = await sql`SELECT nome FROM pontos WHERE id = ${Number(id)}`.catch(() => [null])
  return { title: ponto?.nome ?? 'Ponto' }
}

export default async function EditarPontoPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const [ponto] = await sql`SELECT * FROM pontos WHERE id = ${Number(id)}`
  if (!ponto) notFound()

  const videosDisponiveis = await sql`
    SELECT v.id, v.titulo, a.nome AS anunciante, c.id AS contrato_id
    FROM videos v
    JOIN anunciantes a ON a.id = v.anunciante_id
    LEFT JOIN contratos c ON c.anunciante_id = a.id
      AND c.status = 'ativo'
      AND c.data_inicio <= CURRENT_DATE
      AND c.data_fim >= CURRENT_DATE
    ORDER BY a.nome, v.titulo
  `

  const playlistAtual = await sql`
    SELECT pi.id, pi.video_id, pi.ordem, pi.ativo, v.titulo, a.nome AS anunciante
    FROM playlist_itens pi
    JOIN videos v ON v.id = pi.video_id
    JOIN anunciantes a ON a.id = v.anunciante_id
    WHERE pi.ponto_id = ${ponto.id}
    ORDER BY pi.ordem ASC, pi.id ASC
  `

  const [ultimoHeartbeat] = await sql`
    SELECT recebido_em, versao_player, info
    FROM heartbeats
    WHERE ponto_id = ${ponto.id}
    ORDER BY recebido_em DESC
    LIMIT 1
  `.catch(() => [null])

  const playerUrl = `/player/${ponto.token_player}`

  return (
    <div className="max-w-[720px]">
      <div className="flex items-center gap-2 mb-6">
        <Link
          href="/admin/pontos"
          className="flex items-center gap-1 text-[13px] text-muted hover:text-fg transition-colors"
        >
          <ChevronLeft size={14} />
          Telas
        </Link>
        <span className="text-border">/</span>
        <h1 className="text-[16px] font-semibold text-fg">{ponto.nome}</h1>
      </div>

      <PontosTabs
        ponto={ponto as never}
        playlist={playlistAtual as never}
        videosDisponiveis={videosDisponiveis as never}
        ultimoHeartbeat={ultimoHeartbeat as never}
        playerUrl={playerUrl}
      />
    </div>
  )
}
