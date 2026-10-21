import { criarAnunciante } from '@/lib/actions/anunciantes'
import Link from 'next/link'
import { ChevronLeft } from 'lucide-react'
import { Field } from '@/components/ui/field'
import { Button } from '@/components/ui/button'

export const metadata = { title: 'Novo anunciante' }

export default function NovoAnunciantePage() {
  return (
    <div className="max-w-[520px]">
      <div className="flex items-center gap-2 mb-6">
        <Link href="/admin/anunciantes" className="flex items-center gap-1 text-[13px] text-muted hover:text-fg transition-colors">
          <ChevronLeft size={14} />
          Anunciantes
        </Link>
        <span className="text-border">/</span>
        <h1 className="text-[16px] font-semibold text-fg">Novo anunciante</h1>
      </div>

      <form action={criarAnunciante} className="flex flex-col gap-4">
        <Field label="Nome" required>
          <input name="nome" required placeholder="Nome da empresa" />
        </Field>

        <Field label="Contato">
          <input name="contato" placeholder="Nome do responsável" />
        </Field>

        <Field label="Telefone">
          <input name="telefone" type="tel" placeholder="(00) 00000-0000" />
        </Field>

        <Field label="Observações">
          <textarea name="observacoes" rows={3} placeholder="Informações adicionais..." />
        </Field>

        <div className="pt-2">
          <Button type="submit" size="md">Criar anunciante</Button>
        </div>
      </form>
    </div>
  )
}
