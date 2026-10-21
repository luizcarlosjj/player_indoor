-- Tipo de vídeo e thumbnail
ALTER TABLE videos
  ADD COLUMN IF NOT EXISTS tipo TEXT NOT NULL DEFAULT 'anunciante'
    CHECK (tipo IN ('anunciante', 'ponto', 'neutro')),
  ADD COLUMN IF NOT EXISTS thumb_r2_key TEXT;

-- anunciante_id pode ser null para vídeos do tipo 'ponto' ou 'neutro'
ALTER TABLE videos
  ALTER COLUMN anunciante_id DROP NOT NULL;

-- índice para buscas por tipo
CREATE INDEX IF NOT EXISTS videos_tipo_idx ON videos (tipo);

COMMENT ON COLUMN videos.tipo IS 'anunciante = vídeo comercial, ponto = vídeo do local, neutro = conteúdo genérico';
COMMENT ON COLUMN videos.thumb_r2_key IS 'Chave R2 da thumbnail gerada';
