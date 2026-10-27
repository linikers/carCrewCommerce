-- Migration: dados da empresa em um lugar só (#os-pdf)
-- Data: 2026-10-27
-- Risco: BAIXO — só relaxa NOT NULL do cnpj e adiciona coluna nula
-- Rollback: ALTER TABLE empresa_fiscal DROP COLUMN IF EXISTS logo;
--           (o NOT NULL do cnpj só volta se não houver linha com cnpj nulo)

ALTER TABLE empresa_fiscal ALTER COLUMN cnpj DROP NOT NULL;
ALTER TABLE empresa_fiscal ADD COLUMN IF NOT EXISTS logo TEXT;
