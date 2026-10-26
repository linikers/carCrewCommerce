-- Migration: leads (captura de e-mail/telefone)
-- Data: 2026-10-26
-- Risco: BAIXO — tabela nova
-- Rollback: DROP TABLE IF EXISTS leads;
--
-- Roda ANTES do deploy (o build da Vercel não roda `migrate deploy`).

CREATE TABLE IF NOT EXISTS leads (
  id            SERIAL PRIMARY KEY,
  email         TEXT NOT NULL UNIQUE,
  telefone      TEXT,
  origem        TEXT NOT NULL DEFAULT 'site',
  consentimento TEXT,
  criado_em     TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS leads_criado_em_idx ON leads (criado_em DESC);
