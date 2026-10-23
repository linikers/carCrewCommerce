-- Migration: limite de tentativas de login e auditoria de alterações
-- Data: 2026-10-23
-- Risco: BAIXO — duas tabelas novas, nenhuma coluna existente muda
-- Rollback: DROP TABLE IF EXISTS tentativas_login; DROP TABLE IF EXISTS auditoria;
--
-- ATENÇÃO: rodar ANTES do deploy (o build da Vercel não roda `migrate deploy`).

CREATE TABLE IF NOT EXISTS tentativas_login (
  chave         TEXT PRIMARY KEY,
  falhas        INTEGER NOT NULL DEFAULT 0,
  primeira_em   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  bloqueado_ate TIMESTAMP(3)
);

CREATE TABLE IF NOT EXISTS auditoria (
  id          SERIAL PRIMARY KEY,
  entidade    TEXT NOT NULL,
  entidade_id TEXT NOT NULL,
  acao        TEXT NOT NULL,
  antes       JSONB,
  depois      JSONB,
  user_id     TEXT,
  criado_em   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS auditoria_entidade_entidade_id_idx
  ON auditoria (entidade, entidade_id);
