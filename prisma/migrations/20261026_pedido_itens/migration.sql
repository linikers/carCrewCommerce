-- Migration: itens do pedido (#72)
-- Data: 2026-10-26
-- Risco: BAIXO — tabela nova, nenhuma coluna existente é alterada
-- Rollback: DROP TABLE IF EXISTS pedido_itens;
--
-- `pedidos.items` (JSON) fica como legado de leitura: pedido antigo continua
-- abrindo. Pedido novo grava nas duas? Não — só em pedido_itens; o JSON fica
-- NULL e o leitor usa a relação.

CREATE TABLE IF NOT EXISTS pedido_itens (
  id          TEXT PRIMARY KEY,
  pedido_id   TEXT NOT NULL REFERENCES pedidos(id) ON DELETE CASCADE,
  produto_id  INTEGER REFERENCES produtos(id) ON DELETE SET NULL,
  nome        TEXT NOT NULL,
  sku         TEXT,
  preco       DOUBLE PRECISION NOT NULL,
  quantidade  INTEGER NOT NULL,
  total       DOUBLE PRECISION NOT NULL,
  criado_em   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS pedido_itens_pedido_id_idx  ON pedido_itens (pedido_id);
CREATE INDEX IF NOT EXISTS pedido_itens_produto_id_idx ON pedido_itens (produto_id);

-- Backfill: converte o JSON dos pedidos antigos (hoje 0 pedidos na base, mas
-- o comando fica para quem tiver histórico).
INSERT INTO pedido_itens (id, pedido_id, produto_id, nome, sku, preco, quantidade, total, criado_em)
SELECT
  'it_' || p.id || '_' || (ord - 1),
  p.id,
  NULLIF((item->>'produtoId')::int, 0),
  COALESCE(item->>'nome', 'Item'),
  pr.sku,
  COALESCE((item->>'preco')::double precision, 0),
  COALESCE((item->>'quantidade')::int, 1),
  COALESCE((item->>'preco')::double precision, 0) * COALESCE((item->>'quantidade')::int, 1),
  p.created_at
FROM pedidos p
CROSS JOIN LATERAL jsonb_array_elements(p.items) WITH ORDINALITY AS t(item, ord)
LEFT JOIN produtos pr ON pr.id = NULLIF((item->>'produtoId')::int, 0)
WHERE p.items IS NOT NULL
  AND jsonb_typeof(p.items) = 'array'
  AND NOT EXISTS (SELECT 1 FROM pedido_itens pi WHERE pi.pedido_id = p.id);
