import { neon } from '@neondatabase/serverless'

// Conexão singleton para serverless (Neon usa HTTP por padrão)
const sql = neon(process.env.DATABASE_URL!)

export default sql
