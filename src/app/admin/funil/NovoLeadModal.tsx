'use client'

import { useRef, useState, useTransition } from 'react'
import { Modal } from '@/components/ui/modal'
import { Field } from '@/components/ui/field'
import { Button } from '@/components/ui/button'
import { criarLead } from '@/lib/actions/leads'

const ETAPAS = [
  { value: 'a_contatar', label: 'A contatar' },
  { value: 'mensagem_enviada', label: 'Mensagem enviada' },
  { value: 'respondeu', label: 'Respondeu' },
  { value: 'pediu_preco', label: 'Pediu preco' },
  { value: 'fechado', label: 'Fechado' },
  { value: 'recusou', label: 'Recusou' },
]

interface Props {
  open: boolean
  onClose: () => void
}

export function NovoLeadModal({ open, onClose }: Props) {
  const formRef = useRef<HTMLFormElement>(null)
  const [pending, startTransition] = useTransition()
  const [erro, setErro] = useState('')

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const fd = new FormData(e.currentTarget)
    const empresa = String(fd.get('empresa') ?? '').trim()
    if (!empresa) {
      setErro('Informe o nome da empresa.')
      return
    }
    setErro('')
    startTransition(async () => {
      await criarLead(fd)
      formRef.current?.reset()
      onClose()
    })
  }

  return (
    <Modal open={open} onClose={onClose} title="Novo lead">
      <form ref={formRef} onSubmit={handleSubmit} className="flex flex-col gap-4">
        <Field label="Empresa" required>
          <input name="empresa" required placeholder="Nome da empresa" />
        </Field>

        <Field label="Segmento">
          <input name="segmento" placeholder="Ex: Restaurante, Academia..." />
        </Field>

        <Field label="Telefone">
          <input name="telefone" type="tel" placeholder="(00) 90000-0000" />
        </Field>

        <Field label="Etapa">
          <select name="etapa" defaultValue="a_contatar">
            {ETAPAS.map((e) => (
              <option key={e.value} value={e.value}>
                {e.label}
              </option>
            ))}
          </select>
        </Field>

        <Field label="Proxima acao">
          <input name="proxima_acao" placeholder="Ex: Ligar segunda-feira" />
        </Field>

        <Field label="Observacoes">
          <textarea name="observacoes" rows={3} placeholder="Notas adicionais..." />
        </Field>

        {erro && <p className="text-[12px] text-error">{erro}</p>}

        <div className="flex gap-3 justify-end pt-1">
          <Button type="button" variant="ghost" size="sm" onClick={onClose} disabled={pending}>
            Cancelar
          </Button>
          <Button type="submit" size="sm" loading={pending}>
            Criar lead
          </Button>
        </div>
      </form>
    </Modal>
  )
}
