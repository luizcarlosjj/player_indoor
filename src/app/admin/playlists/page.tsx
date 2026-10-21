import sql from '@/lib/db'
import { PageHeader } from '@/components/ui/page-header'
import { PlaylistsClient } from './PlaylistsClient'

export const metadata = { title: 'Playlists' }

type RawRow = {
  ponto_id: string | number
  ponto_nome: string
  ativo: boolean
  item_id: string | number | null
  video_id: string | number | null
  ordem: string | number | null
  item_ativo: boolean | null
  titulo: string | null
  duracao_segundos: string | number | null
  tipo: string | null
  anunciante: string | null
}

type VideoItem = {
  item_id: number
  video_id: number
  ordem: number
  item_ativo: boolean
  titulo: string
  duracao_segundos: number | null
  tipo: string | null
  anunciante: string | null
}

type PontoComPlaylist = {
  ponto_id: number
  ponto_nome: string
  items: VideoItem[]
  ciclo_segundos: number
}

export default async function PlaylistsPage() {
  const rows = (await sql`
    SELECT
      p.id AS ponto_id,
      p.nome AS ponto_nome,
      p.ativo,
      pi.id AS item_id,
      pi.video_id,
      pi.ordem,
      pi.ativo AS item_ativo,
      v.titulo,
      v.duracao_segundos,
      v.tipo,
      a.nome AS anunciante
    FROM pontos p
    LEFT JOIN playlist_itens pi ON pi.ponto_id = p.id
    LEFT JOIN videos v ON v.id = pi.video_id
    LEFT JOIN anunciantes a ON a.id = v.anunciante_id
    WHERE p.ativo = true
    ORDER BY p.nome ASC, pi.ordem ASC, pi.id ASC
  `.catch(() => [])) as RawRow[]

  const map = new Map<number, PontoComPlaylist>()

  for (const row of rows) {
    const pontoId = Number(row.ponto_id)

    if (!map.has(pontoId)) {
      map.set(pontoId, {
        ponto_id: pontoId,
        ponto_nome: String(row.ponto_nome),
        items: [],
        ciclo_segundos: 0,
      })
    }

    if (row.item_id != null && row.video_id != null) {
      const item: VideoItem = {
        item_id: Number(row.item_id),
        video_id: Number(row.video_id),
        ordem: Number(row.ordem ?? 0),
        item_ativo: Boolean(row.item_ativo),
        titulo: String(row.titulo ?? ''),
        duracao_segundos: row.duracao_segundos != null ? Number(row.duracao_segundos) : null,
        tipo: row.tipo ? String(row.tipo) : null,
        anunciante: row.anunciante ? String(row.anunciante) : null,
      }
      map.get(pontoId)!.items.push(item)
    }
  }

  const pontos: PontoComPlaylist[] = Array.from(map.values()).map((p) => ({
    ...p,
    ciclo_segundos: p.items
      .filter((i) => i.item_ativo)
      .reduce((acc, i) => acc + (i.duracao_segundos ?? 0), 0),
  }))

  const pontoNomes = pontos.map((p) => ({ id: p.ponto_id, nome: p.ponto_nome }))

  return (
    <div>
      <PageHeader
        title="Playlists"
        description={`${pontos.length} tela${pontos.length !== 1 ? 's' : ''} ativa${pontos.length !== 1 ? 's' : ''}`}
      />
      <PlaylistsClient pontos={pontos} pontoNomes={pontoNomes} />
    </div>
  )
}
