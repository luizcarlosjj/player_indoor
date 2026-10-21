'use client'

import { useState, useRef } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter, useSearchParams } from 'next/navigation'
import { AlertCircle } from 'lucide-react'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { Field } from '@/components/ui/field'

// Limite de tentativas em memória (5 por IP seria no servidor; aqui bloqueamos no cliente)
const attempts: number[] = []
function checkRateLimit(): boolean {
  const now = Date.now()
  const recent = attempts.filter((t) => now - t < 10 * 60 * 1000)
  attempts.length = 0
  attempts.push(...recent)
  if (recent.length >= 5) return false
  attempts.push(now)
  return true
}

export default function LoginPage() {
  const router = useRouter()
  const params = useSearchParams()
  const [erro, setErro] = useState('')
  const [loading, setLoading] = useState(false)
  const emailRef = useRef<HTMLInputElement>(null)
  const senhaRef = useRef<HTMLInputElement>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setErro('')

    if (!checkRateLimit()) {
      setErro('Muitas tentativas. Aguarde 10 minutos.')
      return
    }

    setLoading(true)
    const res = await signIn('credentials', {
      email: emailRef.current?.value,
      password: senhaRef.current?.value,
      redirect: false,
    })
    setLoading(false)

    if (res?.error) {
      setErro('E-mail ou senha incorretos. Tente de novo.')
    } else {
      router.push(params.get('callbackUrl') ?? '/admin')
    }
  }

  return (
    <div className="min-h-screen flex bg-base">
      {/* Lado esquerdo — branding + TV ilustrada */}
      <div className="hidden lg:flex lg:w-[55%] flex-col justify-between p-12 relative overflow-hidden border-r border-border">
        {/* Barra de acento no topo */}
        <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-accent to-transparent" />

        {/* Grade de pontos */}
        <div
          aria-hidden
          className="absolute inset-0 pointer-events-none opacity-30"
          style={{
            backgroundImage: 'radial-gradient(circle, var(--border) 1px, transparent 1px)',
            backgroundSize: '28px 28px',
          }}
        />
        {/* Fade lateral direito */}
        <div className="absolute inset-y-0 right-0 w-24 bg-gradient-to-r from-transparent to-base pointer-events-none" />

        {/* Logo */}
        <div className="relative z-10">
          <Image src="/logo-escuro.jpeg" alt="Tenax Sistemas" width={180} height={64} className="h-12 w-auto object-contain" priority />
        </div>

        {/* TV ilustrada + título */}
        <div className="relative z-10 flex flex-col items-start gap-8">
          {/* TV em CSS */}
          <TvIllustration />

          <div>
            <h1 className="text-[40px] font-bold text-fg leading-none tracking-tight">
              Central de<br />Transmissão
            </h1>
            <p className="text-[15px] text-muted mt-3 max-w-sm leading-relaxed">
              Gerencie telas, anunciantes e programação de mídia indoor em um só lugar.
            </p>
          </div>
        </div>

        {/* Rodapé */}
        <div className="relative z-10">
          <p className="text-[12px] text-subtle">
            © {new Date().getFullYear()} Tenax Sistemas. Todos os direitos reservados.
          </p>
        </div>
      </div>

      {/* Lado direito — formulário */}
      <div className="flex-1 flex flex-col items-center justify-center p-6 lg:p-12">
        {/* Logo mobile */}
        <div className="lg:hidden mb-10">
          <Image src="/logo-escuro.jpeg" alt="Tenax Sistemas" width={160} height={56} className="h-10 w-auto object-contain" priority />
        </div>

        <div className="w-full max-w-sm">
          <div className="mb-8">
            <h2 className="text-[24px] font-semibold text-fg">Acessar painel</h2>
            <p className="text-[13px] text-muted mt-1">Entre com suas credenciais</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <Field label="E-mail">
              <input
                ref={emailRef}
                type="email"
                name="email"
                required
                autoComplete="email"
                placeholder="seu@email.com"
                autoFocus
              />
            </Field>

            <Field label="Senha">
              <input
                ref={senhaRef}
                type="password"
                name="password"
                required
                autoComplete="current-password"
                placeholder="••••••••"
              />
            </Field>

            {erro && (
              <div className="flex items-center gap-2 p-3 rounded-[8px] bg-error/10 border border-error/20">
                <AlertCircle size={14} className="text-error flex-shrink-0" />
                <p className="text-[13px] text-error">{erro}</p>
              </div>
            )}

            <Button type="submit" className="w-full mt-2" loading={loading} size="md">
              {loading ? 'Entrando...' : 'Entrar'}
            </Button>
          </form>
        </div>
      </div>
    </div>
  )
}

function TvIllustration() {
  return (
    <div className="relative">
      {/* Moldura da TV vertical */}
      <div className="w-28 h-48 bg-elevated border-2 border-border rounded-[10px] relative overflow-hidden shadow-xl">
        {/* Tela */}
        <div className="absolute inset-1.5 bg-base rounded-[7px] overflow-hidden">
          {/* Conteúdo animado na tela */}
          <div className="absolute inset-0 flex flex-col">
            {/* Barra de acento no topo da tela */}
            <div className="h-1 bg-accent w-full" />
            {/* Blocos de conteúdo */}
            <div className="flex-1 p-2 space-y-1.5">
              <div className="h-2.5 bg-accent/20 rounded-sm w-3/4" />
              <div className="h-2 bg-elevated rounded-sm w-1/2" />
              <div className="h-12 bg-accent/5 rounded-sm mt-2 border border-accent/10 flex items-center justify-center">
                <div className="w-6 h-6 rounded-full bg-accent/20 animate-pulse-dot" />
              </div>
              <div className="h-2 bg-elevated rounded-sm w-2/3" />
              <div className="h-2 bg-elevated rounded-sm w-1/2" />
            </div>
          </div>
        </div>
        {/* Câmera / indicador */}
        <div className="absolute bottom-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-online animate-pulse-dot" />
      </div>
      {/* Pé da TV */}
      <div className="w-12 h-2 bg-elevated border border-border rounded-sm mx-auto mt-1" />
      <div className="w-8 h-1 bg-border rounded-sm mx-auto" />
    </div>
  )
}
