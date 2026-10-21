import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { gerarUrlUpload } from '@/lib/r2'
import { randomBytes } from 'crypto'

export async function POST(req: NextRequest) {
  const sessao = await auth()
  if (!sessao) return NextResponse.json({ erro: 'Não autorizado' }, { status: 401 })

  const { nome, tipo } = await req.json()
  const ext = nome.split('.').pop() ?? 'mp4'
  const key = `videos/${randomBytes(8).toString('hex')}.${ext}`

  const url = await gerarUrlUpload(key, tipo || 'video/mp4')

  return NextResponse.json({ url, key })
}
