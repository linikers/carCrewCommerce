-- Migration: certificado digital + credenciais de canal (#78/#83/#84)
-- Data: 2026-10-26
-- Risco: BAIXO — duas tabelas novas, nada existente é alterado
-- Rollback: DROP TABLE IF EXISTS certificado_digital, credencial_canal;
--
-- Segredos ficam cifrados (AES-256-GCM) com a chave de CONFIG_SECRET_KEY.
-- Perder essa env = perder os segredos (é só recadastrar, nada mais quebra).

CREATE TABLE IF NOT EXISTS certificado_digital (
  id             TEXT PRIMARY KEY DEFAULT 'unica',
  nome_arquivo   TEXT NOT NULL,
  conteudo       TEXT NOT NULL,
  senha          TEXT NOT NULL,
  titular        TEXT,
  cnpj           TEXT,
  emissor        TEXT,
  valido_de      TIMESTAMP(3),
  valido_ate     TIMESTAMP(3),
  criado_em      TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  atualizado_em  TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS credencial_canal (
  id            TEXT PRIMARY KEY,
  canal         TEXT NOT NULL UNIQUE,
  dados         TEXT NOT NULL,
  ativo         BOOLEAN NOT NULL DEFAULT false,
  conectado_em  TIMESTAMP(3),
  atualizado_em TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
