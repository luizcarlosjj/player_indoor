import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Tenax Indoor',
}

// Layout mínimo para o player — fundo preto via CSS global do player
export default function PlayerLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
