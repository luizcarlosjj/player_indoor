-- Tenax Indoor: schema inicial
-- Rode este arquivo no Neon SQL Editor ou via script de migrate

CREATE TABLE IF NOT EXISTS pontos (
  id            SERIAL PRIMARY KEY,
  nome          TEXT NOT NULL,
  endereco      TEXT,
  orientacao    TEXT NOT NULL DEFAULT 'vertical' CHECK (orientacao IN ('vertical', 'horizontal')),
  rotacao_graus INT  NOT NULL DEFAULT 90 CHECK (rotacao_graus IN (0, 90, 180, 270)),
  repasse_mensal NUMERIC(10,2) NOT NULL DEFAULT 150.00,
  token_player  TEXT NOT NULL UNIQUE,
  ativo         BOOLEAN NOT NULL DEFAULT true,
  criado_em     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS anunciantes (
  id          SERIAL PRIMARY KEY,
  nome        TEXT NOT NULL,
  contato     TEXT,
  telefone    TEXT,
  observacoes TEXT,
  criado_em   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS contratos (
  id              SERIAL PRIMARY KEY,
  anunciante_id   INT NOT NULL REFERENCES anunciantes(id) ON DELETE CASCADE,
  valor_mensal    NUMERIC(10,2) NOT NULL DEFAULT 120.00,
  data_inicio     DATE NOT NULL,
  data_fim        DATE NOT NULL,
  status          TEXT NOT NULL DEFAULT 'ativo' CHECK (status IN ('ativo', 'encerrado', 'suspenso')),
  criado_em       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS videos (
  id               SERIAL PRIMARY KEY,
  anunciante_id    INT NOT NULL REFERENCES anunciantes(id) ON DELETE CASCADE,
  titulo           TEXT NOT NULL,
  r2_key           TEXT NOT NULL UNIQUE,
  duracao_segundos INT,
  largura          INT,
  altura           INT,
  criado_em        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS playlist_itens (
  id          SERIAL PRIMARY KEY,
  ponto_id    INT NOT NULL REFERENCES pontos(id) ON DELETE CASCADE,
  video_id    INT NOT NULL REFERENCES videos(id) ON DELETE CASCADE,
  contrato_id INT REFERENCES contratos(id) ON DELETE SET NULL,
  ordem       INT NOT NULL DEFAULT 0,
  ativo       BOOLEAN NOT NULL DEFAULT true,
  UNIQUE (ponto_id, video_id)
);

CREATE TABLE IF NOT EXISTS exibicoes (
  id        SERIAL PRIMARY KEY,
  ponto_id  INT NOT NULL REFERENCES pontos(id) ON DELETE CASCADE,
  video_id  INT NOT NULL REFERENCES videos(id) ON DELETE CASCADE,
  inicio    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS heartbeats (
  id              SERIAL PRIMARY KEY,
  ponto_id        INT NOT NULL REFERENCES pontos(id) ON DELETE CASCADE,
  recebido_em     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  versao_player   TEXT,
  info            JSONB
);

-- Índices para queries de relatório e status
CREATE INDEX IF NOT EXISTS idx_exibicoes_ponto_inicio   ON exibicoes(ponto_id, inicio);
CREATE INDEX IF NOT EXISTS idx_heartbeats_ponto_recebido ON heartbeats(ponto_id, recebido_em);
CREATE INDEX IF NOT EXISTS idx_contratos_anunciante      ON contratos(anunciante_id);
CREATE INDEX IF NOT EXISTS idx_playlist_ponto            ON playlist_itens(ponto_id);
CREATE INDEX IF NOT EXISTS idx_videos_anunciante         ON videos(anunciante_id);
