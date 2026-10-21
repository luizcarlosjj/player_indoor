CREATE TABLE leads (
  id SERIAL PRIMARY KEY,
  empresa TEXT NOT NULL,
  segmento TEXT,
  telefone TEXT,
  instagram TEXT,
  endereco TEXT,
  etapa TEXT NOT NULL DEFAULT 'a_contatar',
  proxima_acao TEXT,
  proxima_data DATE,
  observacoes TEXT,
  anunciante_id INT REFERENCES anunciantes(id) ON DELETE SET NULL,
  criado_em TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX leads_etapa_idx ON leads (etapa);
