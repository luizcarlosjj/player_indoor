import { criarPonto } from '@/lib/actions/pontos'
import Link from 'next/link'
import { ChevronLeft } from 'lucide-react'
import { Field } from '@/components/ui/field'
import { Button } from '@/components/ui/button'

export const metadata = { title: 'Novo ponto' }

export default function NovoPontoPage() {
  return (
    <div className="max-w-[520px]">
      <div className="flex items-center gap-2 mb-6">
        <Link href="/admin/pontos" className="flex items-center gap-1 text-[13px] text-muted hover:text-fg transition-colors">
          <ChevronLeft size={14} />
          Telas
        </Link>
        <span className="text-border">/</span>
        <h1 className="text-[16px] font-semibold text-fg">Novo ponto</h1>
      </div>

      <form action={criarPonto} className="flex flex-col gap-4">
        <Field label="Nome" required>
          <input name="nome" required />
        </Field>

        <Field label="Endereço">
          <input name="endereco" placeholder="Rua, número, bairro..." />
        </Field>

        <div className="grid grid-cols-2 gap-4">
          <Field label="Orientação">
            <select name="orientacao">
              <option value="vertical">Vertical</option>
              <option value="horizontal">Horizontal</option>
            </select>
          </Field>

          <Field label="Rotação">
            <select name="rotacao_graus">
              <option value="0">0°</option>
              <option value="90">90°</option>
              <option value="180">180°</option>
              <option value="270">270°</option>
            </select>
          </Field>
        </div>

        <Field label="Repasse mensal (R$)">
          <input name="repasse_mensal" type="number" defaultValue="150" min="0" step="0.01" />
        </Field>

        <div className="pt-2">
          <Button type="submit" size="md">Criar ponto</Button>
        </div>
      </form>
    </div>
  )
}
