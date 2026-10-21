// Executa todas as migrations em ordem numérica
// Uso: npm run migrate

import { readFileSync, readdirSync } from 'fs'
import { join } from 'path'
import { neon } from '@neondatabase/serverless'

async function main() {
  if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL não definida. Copie .env.example para .env.local e preencha.')
  }

  const sql = neon(process.env.DATABASE_URL)
  const migrationsDir = join(process.cwd(), 'migrations')

  const arquivos = readdirSync(migrationsDir)
    .filter((f) => f.endsWith('.sql'))
    .sort()

  for (const arquivo of arquivos) {
    const caminho = join(migrationsDir, arquivo)
    const conteudo = readFileSync(caminho, 'utf-8')

    const statements = conteudo
      .split(';')
      .map((s) => s.trim())
      .filter((s) => s.length > 0 && !s.startsWith('--'))

    console.log(`\n→ ${arquivo} (${statements.length} statements)`)

    for (const stmt of statements) {
      await sql.query(stmt)
    }

    console.log(`  ✓ ok`)
  }

  console.log('\nTodas as migrations concluídas.')
}

main().catch((e) => {
  console.error('Erro na migration:', e.message ?? e)
  process.exit(1)
})
