-- Migration: desconto por produto (#nova)
-- Data: 2026-10-27
-- Risco: BAIXO — coluna numérica com default 0 (nenhum preço muda)
-- Rollback: ALTER TABLE produtos DROP COLUMN IF EXISTS desconto_percent;

ALTER TABLE produtos ADD COLUMN IF NOT EXISTS desconto_percent DOUBLE PRECISION NOT NULL DEFAULT 0;
