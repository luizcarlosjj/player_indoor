// Tipos compartilhados entre player e painel

export interface ItemPlaylist {
  id: number
  video_id: number
  titulo: string
  r2_key: string
  url: string
  duracao_segundos: number | null
  largura: number | null
  altura: number | null
  ordem: number
  atualizado_em: string
}

export interface HorarioDia {
  inicio: string // "HH:MM"
  fim: string    // "HH:MM"
}

export interface Horario {
  seg?: HorarioDia
  ter?: HorarioDia
  qua?: HorarioDia
  qui?: HorarioDia
  sex?: HorarioDia
  sab?: HorarioDia
  dom?: HorarioDia
}

export interface PlaylistResponse {
  ponto_id: number
  rotacao_graus: number
  orientacao: string
  programacao_versao: number
  horario: Horario | null
  itens: ItemPlaylist[]
}

export interface Ponto {
  id: number
  nome: string
  endereco: string | null
  orientacao: 'vertical' | 'horizontal'
  rotacao_graus: 0 | 90 | 180 | 270
  ativo: boolean
}

export interface ExibicaoBatch {
  exibicao_uuid: string
  video_id: number
  inicio: string
  fim?: string
}
