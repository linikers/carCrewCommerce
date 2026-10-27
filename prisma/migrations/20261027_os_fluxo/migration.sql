-- Migration: fluxo completo da OS (#os)
-- Data: 2026-10-27
-- Risco: BAIXO — colunas novas, todas nulas; nenhum dado existente muda
-- Rollback:
--   ALTER TABLE os_itens DROP COLUMN IF EXISTS origem, DROP COLUMN IF EXISTS custo, DROP COLUMN IF EXISTS terceiro;
--   ALTER TABLE os_ordens DROP COLUMN IF EXISTS token_publico, DROP COLUMN IF EXISTS aprovado_em;

ALTER TABLE os_itens  ADD COLUMN IF NOT EXISTS origem TEXT;
ALTER TABLE os_itens  ADD COLUMN IF NOT EXISTS custo DOUBLE PRECISION;
ALTER TABLE os_itens  ADD COLUMN IF NOT EXISTS terceiro TEXT;
ALTER TABLE os_ordens ADD COLUMN IF NOT EXISTS token_publico TEXT;
ALTER TABLE os_ordens ADD COLUMN IF NOT EXISTS aprovado_em TIMESTAMP(3);
CREATE UNIQUE INDEX IF NOT EXISTS os_ordens_token_publico_key ON os_ordens(token_publico);
