import sql from '@/lib/db'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ChevronLeft, ExternalLink } from 'lucide-react'
import { atualizarPonto } from '@/lib/actions/pontos'
import { Field } from '@/components/ui/field'
import { Button } from '@/components/ui/button'
import { PlaylistManager } from './PlaylistManager'

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

  const atualizarComId = atualizarPonto.bind(null, ponto.id)
  const playerUrl = `/player/${ponto.token_player}`

  return (
    <div className="max-w-[640px]">
      <div className="flex items-center gap-2 mb-6">
        <Link href="/admin/pontos" className="flex items-center gap-1 text-[13px] text-muted hover:text-fg transition-colors">
          <ChevronLeft size={14} />
          Pontos
        </Link>
        <span className="text-border">/</span>
        <h1 className="text-[16px] font-semibold text-fg">{ponto.nome}</h1>
      </div>

      {/* Link do player */}
      <div className="bg-surface border border-border rounded-[12px] p-4 mb-6">
        <p className="text-[11px] text-subtle uppercase tracking-widest mb-2">Link do player</p>
        <div className="flex items-center gap-3">
          <code className="flex-1 text-[12px] text-online bg-base px-3 py-2 rounded-[6px] truncate block font-mono">
            {playerUrl}
          </code>
          <a
            href={playerUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 text-[12px] text-info hover:text-info/80 transition-colors flex-shrink-0"
          >
            <ExternalLink size={13} />
            Abrir
          </a>
        </div>
      </div>

      {/* Configurações */}
      <section className="mb-8">
        <h2 className="text-[11px] font-medium text-subtle uppercase tracking-widest mb-4">Configurações</h2>
        <form action={atualizarComId} className="flex flex-col gap-4">
          <Field label="Nome" required>
            <input name="nome" required defaultValue={ponto.nome} />
          </Field>

          <Field label="Endereço">
            <input name="endereco" defaultValue={ponto.endereco ?? ''} />
          </Field>

          <div className="grid grid-cols-2 gap-4">
            <Field label="Orientação">
              <select name="orientacao" defaultValue={ponto.orientacao}>
                <option value="vertical">Vertical</option>
                <option value="horizontal">Horizontal</option>
              </select>
            </Field>

            <Field label="Rotação">
              <select name="rotacao_graus" defaultValue={String(ponto.rotacao_graus)}>
                <option value="0">0°</option>
                <option value="90">90°</option>
                <option value="180">180°</option>
                <option value="270">270°</option>
              </select>
            </Field>
          </div>

          <Field label="Repasse mensal (R$)">
            <input name="repasse_mensal" type="number" min="0" step="0.01" defaultValue={String(ponto.repasse_mensal)} />
          </Field>

          <Field label="Status">
            <select name="ativo" defaultValue={String(ponto.ativo)}>
              <option value="true">Ativo</option>
              <option value="false">Inativo</option>
            </select>
          </Field>

          <div className="pt-1">
            <Button type="submit" size="md">Salvar</Button>
          </div>
        </form>
      </section>

      {/* Playlist */}
      <section>
        <h2 className="text-[11px] font-medium text-subtle uppercase tracking-widest mb-4">Playlist</h2>
        <PlaylistManager
          pontoId={ponto.id}
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          playlist={playlistAtual as any}
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          videosDisponiveis={videosDisponiveis as any}
        />
      </section>
    </div>
  )
}
