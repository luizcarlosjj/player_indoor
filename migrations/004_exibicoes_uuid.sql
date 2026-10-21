ALTER TABLE exibicoes ADD COLUMN exibicao_uuid TEXT;
CREATE UNIQUE INDEX exibicoes_uuid_idx ON exibicoes (exibicao_uuid) WHERE exibicao_uuid IS NOT NULL;
