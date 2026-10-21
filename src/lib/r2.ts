import { S3Client, PutObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'

export const r2Client = new S3Client({
  region: 'auto',
  endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID!,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
  },
})

// Gera URL pré-assinada para upload direto do navegador (expiração: 10 min)
export async function gerarUrlUpload(key: string, contentType: string) {
  const cmd = new PutObjectCommand({
    Bucket: process.env.R2_BUCKET_NAME!,
    Key: key,
    ContentType: contentType,
  })
  return getSignedUrl(r2Client, cmd, { expiresIn: 600 })
}

// URL pública do vídeo via domínio público do R2
// Se o key já for uma URL completa (seed de teste), retorna como está
export function urlPublica(key: string) {
  if (key.startsWith('http://') || key.startsWith('https://')) return key
  return `${process.env.R2_PUBLIC_URL}/${key}`
}
