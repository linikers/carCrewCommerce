-- Migration: Adicionar campos de peso e dimensões ao produto
-- Data: 2026-07-01
-- Risco: BAIXO — todas as colunas são nullable, dados existentes não são afetados
-- Rollback: ALTER TABLE produtos DROP COLUMN IF EXISTS peso, altura, largura, profundidade;

ALTER TABLE produtos ADD COLUMN peso         DOUBLE PRECISION;
ALTER TABLE produtos ADD COLUMN altura       DOUBLE PRECISION;
ALTER TABLE produtos ADD COLUMN largura      DOUBLE PRECISION;
ALTER TABLE produtos ADD COLUMN profundidade DOUBLE PRECISION;

COMMENT ON COLUMN produtos.peso         IS 'Peso em gramas';
COMMENT ON COLUMN produtos.altura       IS 'Altura em centímetros';
COMMENT ON COLUMN produtos.largura      IS 'Largura em centímetros';
COMMENT ON COLUMN produtos.profundidade IS 'Profundidade/comprimento em centímetros';
