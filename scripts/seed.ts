// Seed de teste: 1 ponto + 1 anunciante + 1 contrato + 2 vídeos públicos de exemplo
// Uso: npm run seed

import { neon } from '@neondatabase/serverless'
import { randomBytes } from 'crypto'

// Vídeos de exemplo do Cloudflare Stream (MP4 públicos, sem precisar de R2)
// Substitua pelas URLs reais do seu R2 depois
// r2_key usa a URL completa para seed de teste (urlPublica() retorna como está)
const VIDEOS_EXEMPLO = [
  {
    titulo: 'Demo Tenax 1',
    r2_key: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
    duracao_segundos: 15,
    largura: 1280,
    altura: 720,
  },
  {
    titulo: 'Demo Tenax 2',
    r2_key: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4',
    duracao_segundos: 15,
    largura: 1280,
    altura: 720,
  },
]

async function main() {
  if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL não definida. Copie .env.example para .env.local e preencha.')
  }

  const sql = neon(process.env.DATABASE_URL)

  const token = randomBytes(16).toString('hex')
  console.log(`Token do player de teste: ${token}`)

  // Ponto
  const [ponto] = await sql`
    INSERT INTO pontos (nome, endereco, orientacao, rotacao_graus, repasse_mensal, token_player, ativo)
    VALUES ('Barbearia Demo', 'Rua Exemplo, 123', 'vertical', 90, 150.00, ${token}, true)
    ON CONFLICT (token_player) DO UPDATE SET nome = EXCLUDED.nome
    RETURNING id
  `

  // Anunciante
  const [anunciante] = await sql`
    INSERT INTO anunciantes (nome, contato, telefone)
    VALUES ('Anunciante Demo', 'Contato Teste', '11999999999')
    RETURNING id
  `

  // Contrato vigente por 6 meses
  const hoje = new Date()
  const fim = new Date(hoje)
  fim.setMonth(fim.getMonth() + 6)

  const [contrato] = await sql`
    INSERT INTO contratos (anunciante_id, valor_mensal, data_inicio, data_fim, status)
    VALUES (${anunciante.id}, 120.00, ${hoje.toISOString().slice(0, 10)}, ${fim.toISOString().slice(0, 10)}, 'ativo')
    RETURNING id
  `

  // Vídeos e playlist
  for (let i = 0; i < VIDEOS_EXEMPLO.length; i++) {
    const v = VIDEOS_EXEMPLO[i]

    const [video] = await sql`
      INSERT INTO videos (anunciante_id, titulo, r2_key, duracao_segundos, largura, altura)
      VALUES (${anunciante.id}, ${v.titulo}, ${v.r2_key}, ${v.duracao_segundos}, ${v.largura}, ${v.altura})
      ON CONFLICT (r2_key) DO UPDATE SET titulo = EXCLUDED.titulo
      RETURNING id
    `

    await sql`
      INSERT INTO playlist_itens (ponto_id, video_id, contrato_id, ordem, ativo)
      VALUES (${ponto.id}, ${video.id}, ${contrato.id}, ${i}, true)
      ON CONFLICT (ponto_id, video_id) DO UPDATE SET ordem = EXCLUDED.ordem
    `
  }

  console.log('')
  console.log('=== Seed concluído ===')
  console.log(`Ponto ID: ${ponto.id}`)
  console.log(`Anunciante ID: ${anunciante.id}`)
  console.log(`Contrato ID: ${contrato.id}`)
  console.log('')
  console.log('URL do player de teste:')
  console.log(`  http://localhost:3000/player/${token}`)
  console.log('')
  console.log('ATENÇÃO: Os vídeos de exemplo são URLs públicas do Google (para teste).')
  console.log('Para produção, faça upload real no R2 e atualize os r2_key no banco.')
}

main().catch((e) => {
  console.error('Erro no seed:', e)
  process.exit(1)
})
