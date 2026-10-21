'use client'

import { signOut } from 'next-auth/react'
import { LogOut } from 'lucide-react'

export function SignOutButton() {
  return (
    <button
      onClick={() => signOut({ callbackUrl: '/admin/login' })}
      className="flex items-center gap-2 px-2.5 py-2 rounded-[8px] w-full text-[13px] text-subtle hover:text-error hover:bg-error/10 transition-colors duration-150"
      aria-label="Sair do painel"
    >
      <LogOut size={16} />
      <span>Sair</span>
    </button>
  )
}
