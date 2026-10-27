-- Migration: preço base, canal do pedido e preço por canal (#preco)
-- Data: 2026-10-27
-- Risco: BAIXO — colunas novas nullable/default; tabela nova
-- Rollback: DROP TABLE preco_canal; ALTER TABLE produtos DROP COLUMN preco_base;
--           ALTER TABLE pedidos DROP COLUMN canal;

ALTER TABLE produtos ADD COLUMN IF NOT EXISTS preco_base DOUBLE PRECISION;
ALTER TABLE pedidos  ADD COLUMN IF NOT EXISTS canal TEXT NOT NULL DEFAULT 'site';

CREATE TABLE IF NOT EXISTS preco_canal (
  id           TEXT PRIMARY KEY,
  produto_id   INTEGER NOT NULL REFERENCES produtos(id) ON DELETE CASCADE,
  canal        TEXT NOT NULL,
  percentual   DOUBLE PRECISION,
  preco_fixo   DOUBLE PRECISION,
  criado_em    TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  atualizado_em TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT preco_canal_produto_canal_key UNIQUE (produto_id, canal)
);
