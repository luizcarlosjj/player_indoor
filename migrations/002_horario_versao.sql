-- Horário de funcionamento e versão de programação por ponto
ALTER TABLE pontos
  ADD COLUMN IF NOT EXISTS horario JSONB,
  ADD COLUMN IF NOT EXISTS programacao_versao INT NOT NULL DEFAULT 0;

-- horario: { seg: {inicio: "08:00", fim: "22:00"}, ter: {...}, ... }
-- null = sem restrição de horário (exibe 24h)
COMMENT ON COLUMN pontos.horario IS 'Horário de funcionamento por dia da semana. null = 24h';
COMMENT ON COLUMN pontos.programacao_versao IS 'Incrementado ao salvar a playlist; player usa para detectar mudanças';
