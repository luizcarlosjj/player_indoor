import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { r2Client } from '@/lib/r2'
import { PutObjectCommand } from '@aws-sdk/client-s3'

export const runtime = 'nodejs'
export const maxDuration = 60

export async function PUT(req: NextRequest) {
  const sessao = await auth()
  if (!sessao) return NextResponse.json({ erro: 'Não autorizado' }, { status: 401 })

  const key = req.nextUrl.searchParams.get('key')
  const tipo = req.nextUrl.searchParams.get('tipo') ?? 'video/mp4'

  if (!key) return NextResponse.json({ erro: 'Key obrigatório' }, { status: 400 })
  if (!req.body) return NextResponse.json({ erro: 'Body vazio' }, { status: 400 })

  const chunks: Uint8Array[] = []
  const reader = req.body.getReader()
  while (true) {
    const { done, value } = await reader.read()
    if (done) break
    if (value) chunks.push(value)
  }
  const body = Buffer.concat(chunks)

  await r2Client.send(
    new PutObjectCommand({
      Bucket: process.env.R2_BUCKET_NAME!,
      Key: key,
      Body: body,
      ContentType: tipo,
    }),
  )

  return NextResponse.json({ ok: true })
}