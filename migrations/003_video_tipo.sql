ALTER TABLE videos ADD COLUMN tipo TEXT NOT NULL DEFAULT 'anunciante' CHECK (tipo IN ('anunciante', 'ponto', 'neutro'));
ALTER TABLE videos ADD COLUMN thumb_r2_key TEXT;
ALTER TABLE videos ALTER COLUMN anunciante_id DROP NOT NULL;
CREATE INDEX videos_tipo_idx ON videos (tipo);
