-- Migration: redes sociais da empresa (#os-pdf)
-- Data: 2026-10-27
-- Risco: BAIXO — coluna nova, nula
-- Rollback: ALTER TABLE empresa_fiscal DROP COLUMN IF EXISTS redes_sociais;

ALTER TABLE empresa_fiscal ADD COLUMN IF NOT EXISTS redes_sociais JSONB;
