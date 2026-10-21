import { auth } from '@/auth'
import { Sidebar } from '@/components/admin/sidebar'
import { MobileNav } from '@/components/admin/mobile-nav'
import { CommandPalette } from '@/components/admin/CommandPalette'
import { SignOutButton } from './SignOutButton'
import sql from '@/lib/db'

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const sessao = await auth()
  if (!sessao) return <>{children}</>

  // TVs online (heartbeat < 10 min)
  const [tvStats] = await sql`
    SELECT
      COUNT(*) FILTER (WHERE recebido_em > NOW() - INTERVAL '10 minutes') AS online,
      (SELECT COUNT(*) FROM pontos WHERE ativo = true) AS total
    FROM (
      SELECT DISTINCT ON (ponto_id) recebido_em
      FROM heartbeats
      ORDER BY ponto_id, recebido_em DESC
    ) h
  `.catch(() => [{ online: 0, total: 0 }])

  const tvsOnline = Number(tvStats?.online ?? 0)
  const tvsTotal = Number(tvStats?.total ?? 0)

  return (
    <div className="flex min-h-screen bg-base">
      {/* Sidebar desktop */}
      <Sidebar tvsOnline={tvsOnline} tvsTotal={tvsTotal} />

      {/* Conteúdo principal */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header mobile com logout */}
        <header className="lg:hidden flex items-center justify-between px-4 py-3 border-b border-border bg-surface sticky top-0 z-30">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-accent rounded-[5px] flex items-center justify-center">
              <span className="text-accent-fg text-[9px] font-bold">T</span>
            </div>
            <span className="text-[14px] font-semibold text-fg">Tenax Indoor</span>
          </div>
          <SignOutButton />
        </header>

        {/* Logout na sidebar desktop fica aqui para injetar no Sidebar */}
        <main className="flex-1 p-4 lg:p-8 pb-20 lg:pb-8 min-w-0">
          {children}
        </main>
      </div>

      {/* Nav mobile */}
      <MobileNav />

      {/* Paleta de comandos (Cmd+K / Ctrl+K) */}
      <CommandPalette />
    </div>
  )
}
