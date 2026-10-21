-- UUID por exibição para deduplicação no batch POST
ALTER TABLE exibicoes
  ADD COLUMN IF NOT EXISTS exibicao_uuid TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS exibicoes_uuid_idx ON exibicoes (exibicao_uuid)
  WHERE exibicao_uuid IS NOT NULL;

COMMENT ON COLUMN exibicoes.exibicao_uuid IS 'UUID gerado no cliente; ON CONFLICT DO NOTHING evita duplicatas no batch';
