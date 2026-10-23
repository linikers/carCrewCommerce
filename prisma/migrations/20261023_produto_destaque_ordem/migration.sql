-- Migration: curadoria da home (destaque e ordem)
-- Data: 2026-10-23
-- Risco: BAIXO — duas colunas novas com default; nada existente muda
-- Rollback: ALTER TABLE produtos DROP COLUMN IF EXISTS destaque, DROP COLUMN IF EXISTS ordem;
--
-- Roda ANTES do deploy (o build da Vercel não roda `migrate deploy`).
-- Sem curadoria marcada a home continua mostrando os 8 primeiros por id.

ALTER TABLE produtos ADD COLUMN IF NOT EXISTS destaque BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE produtos ADD COLUMN IF NOT EXISTS ordem INTEGER NOT NULL DEFAULT 0;
CREATE INDEX IF NOT EXISTS produtos_destaque_ordem_idx ON produtos (destaque DESC, ordem ASC, id ASC);
