-- Migration: SKU no produto
-- Data: 2026-10-26
-- Risco: BAIXO — coluna nova, nula, com índice único
-- Rollback: DROP INDEX IF EXISTS produtos_sku_key; ALTER TABLE produtos DROP COLUMN IF EXISTS sku;
--
-- Backfill: gera código provisório CC-0001.. para as peças já cadastradas, para
-- a busca por código funcionar desde já. O código é editável no formulário.

ALTER TABLE produtos ADD COLUMN IF NOT EXISTS sku TEXT;
UPDATE produtos SET sku = 'CC-' || lpad(id::text, 4, '0') WHERE sku IS NULL;
CREATE UNIQUE INDEX IF NOT EXISTS produtos_sku_key ON produtos (sku);
