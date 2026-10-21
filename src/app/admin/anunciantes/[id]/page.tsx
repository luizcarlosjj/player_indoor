import sql from '@/lib/db'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ChevronLeft, AlertTriangle } from 'lucide-react'
import { atualizarAnunciante, criarContrato } from '@/lib/actions/anunciantes'
import { Field } from '@/components/ui/field'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { VideoUpload } from './VideoUpload'
import { AcoesContrato } from './AcoesContrato'
import { DeletarVideo } from './DeletarVideo'
import { DuracaoRapida } from './DuracaoRapida'
import { RelatorioLink } from './RelatorioLink'
import { formatBRL, formatDate } from '@/lib/utils'

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const [a] = await sql`SELECT nome FROM anunciantes WHERE id = ${Number(id)}`.catch(() => [null])
  return { title: a?.nome ?? 'Anunciante' }
}

export default async function AnuncianteDetalhePage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const [a] = await sql`SELECT * FROM anunciantes WHERE id = ${Number(id)}`
  if (!a) notFound()

  const contratos = await sql`
    SELECT * FROM contratos WHERE anunciante_id = ${a.id} ORDER BY data_inicio DESC
  `

  const videos = await sql`
    SELECT * FROM videos WHERE anunciante_id = ${a.id} ORDER BY criado_em DESC
  `

  const atualizarComId = atualizarAnunciante.bind(null, a.id)
  const criarContratoComId = criarContrato.bind(null, a.id)

  return (
    <div className="max-w-[640px]">
      <div className="flex items-center gap-2 mb-6">
        <Link href="/admin/anunciantes" className="flex items-center gap-1 text-[13px] text-muted hover:text-fg transition-colors">
          <ChevronLeft size={14} />
          Anunciantes
        </Link>
        <span className="text-border">/</span>
        <h1 className="text-[16px] font-semibold text-fg">{a.nome}</h1>
      </div>

      {/* Dados */}
      <section className="mb-8">
        <h2 className="text-[11px] font-medium text-subtle uppercase tracking-widest mb-4">Dados</h2>
        <form action={atualizarComId} className="flex flex-col gap-4">
          <Field label="Nome" required>
            <input name="nome" required defaultValue={a.nome} />
          </Field>
          <Field label="Contato">
            <input name="contato" defaultValue={a.contato ?? ''} />
          </Field>
          <Field label="Telefone">
            <input name="telefone" type="tel" defaultValue={a.telefone ?? ''} />
          </Field>
          <Field label="Segmento">
            <input name="segmento" defaultValue={a.segmento ?? ''} placeholder="Ex: Restaurante, Academia..." />
          </Field>
          <Field label="Instagram">
            <input name="instagram" defaultValue={a.instagram ?? ''} placeholder="@perfil" />
          </Field>
          <Field label="WhatsApp">
            <input name="whatsapp" type="tel" defaultValue={a.whatsapp ?? ''} placeholder="(00) 90000-0000" />
          </Field>
          <Field label="Cupom">
            <input name="cupom" defaultValue={a.cupom ?? ''} placeholder="Ex: TV DUDU" />
          </Field>
          <Field label="Observações">
            <textarea name="observacoes" rows={3} defaultValue={a.observacoes ?? ''} />
          </Field>
          <div className="pt-1">
            <Button type="submit" size="md">Salvar</Button>
          </div>
        </form>
      </section>

      {/* Contratos */}
      <section className="mb-8">
        <h2 className="text-[11px] font-medium text-subtle uppercase tracking-widest mb-4">Contratos</h2>

        {contratos.length > 0 && (
          <div className="flex flex-col gap-2 mb-4">
            {contratos.map((c) => {
              const hoje = new Date()
              const fim = new Date(c.data_fim)
              const em30 = new Date(Date.now() + 30 * 86400000)
              const vencendo = fim <= em30 && fim >= hoje
              const vencido = fim < hoje || c.status === 'encerrado'

              return (
                <div
                  key={c.id}
                  className={`flex items-center justify-between gap-4 bg-surface rounded-[10px] px-4 py-3 border ${
                    vencendo ? 'border-alert/30' : 'border-border'
                  }`}
                >
                  <div className="flex items-center gap-3 flex-wrap">
                    <Badge variant={vencido ? 'muted' : c.status === 'ativo' ? 'online' : 'default'}>
                      {c.status}
                    </Badge>
                    <span className="text-[14px] font-medium text-fg">
                      {formatBRL(c.valor_mensal)}/mês
                    </span>
                    {vencendo && !vencido && (
                      <span className="flex items-center gap-1 text-[12px] text-alert">
                        <AlertTriangle size={12} />
                        vence em breve
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-3 flex-shrink-0">
                    <span className="text-[12px] text-subtle hidden sm:block">
                      {formatDate(c.data_inicio)} — {formatDate(c.data_fim)}
                    </span>
                    <AcoesContrato id={c.id} status={c.status} anuncianteId={a.id} />
                  </div>
                </div>
              )
            })}
          </div>
        )}

        <details className="bg-surface border border-border rounded-[10px]">
          <summary className="px-4 py-3 text-[13px] text-muted cursor-pointer hover:text-fg transition-colors select-none">
            + Novo contrato
          </summary>
          <div className="px-4 pb-4 pt-2 border-t border-border">
            <form action={criarContratoComId} data-contrato-form="" className="flex flex-col gap-3">
              <div className="grid grid-cols-3 gap-3">
                <Field label="Valor/mês (R$)">
                  <input name="valor_mensal" type="number" defaultValue="120" min="0" step="0.01" />
                </Field>
                <Field label="Início">
                  <input name="data_inicio" type="date" />
                </Field>
                <Field label="Fim">
                  <input name="data_fim" type="date" />
                </Field>
              </div>
              <DuracaoRapida dataInicioName="data_inicio" dataFimName="data_fim" />
              <div>
                <Button type="submit" size="sm">Criar contrato</Button>
              </div>
            </form>
          </div>
        </details>
      </section>

      {/* Vídeos */}
      <section className="mb-8">
        <h2 className="text-[11px] font-medium text-subtle uppercase tracking-widest mb-4">Vídeos</h2>

        {videos.length > 0 && (
          <div className="flex flex-col gap-2 mb-4">
            {videos.map((v) => (
              <div
                key={v.id}
                className="flex items-center justify-between gap-4 bg-surface border border-border rounded-[10px] px-4 py-3"
              >
                <div className="min-w-0">
                  <p className="text-[14px] font-medium text-fg truncate">{v.titulo}</p>
                  <p className="text-[12px] text-subtle">
                    {v.duracao_segundos ? `${v.duracao_segundos}s` : '—'}
                    {v.largura && v.altura ? ` · ${v.largura}×${v.altura}` : ''}
                  </p>
                </div>
                <DeletarVideo id={v.id} anuncianteId={a.id} />
              </div>
            ))}
          </div>
        )}

        <VideoUpload anuncianteId={a.id} />
      </section>

      {/* Relatório */}
      <section>
        <h2 className="text-[11px] font-medium text-subtle uppercase tracking-widest mb-4">Relatório público</h2>
        <RelatorioLink anuncianteId={a.id} token={a.relatorio_token ?? null} />
      </section>
    </div>
  )
}
