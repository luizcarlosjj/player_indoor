'use client'

import { useState } from 'react'
import { Copy, Check } from 'lucide-react'
import { cn } from '@/lib/utils'

interface CopyButtonProps {
  value: string
  className?: string
  size?: number
}

export function CopyButton({ value, className, size = 14 }: CopyButtonProps) {
  const [copied, setCopied] = useState(false)

  async function copy() {
    await navigator.clipboard.writeText(value)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <button
      onClick={copy}
      className={cn(
        'p-1.5 rounded-[6px] text-subtle hover:text-fg hover:bg-elevated transition-colors duration-150',
        className,
      )}
      aria-label={copied ? 'Copiado!' : 'Copiar'}
      title={copied ? 'Copiado!' : 'Copiar'}
    >
      {copied ? <Check size={size} className="text-online" /> : <Copy size={size} />}
    </button>
  )
}
