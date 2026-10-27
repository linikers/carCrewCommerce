-- Migration: movimento de estoque (#73)
-- Data: 2026-10-26
-- Risco: BAIXO — tabela nova; `produtos.estoque` não é alterado
-- Rollback: DROP TABLE IF EXISTS estoque_movimentos;
--
-- `produtos.estoque` continua existindo como SALDO (soma dos movimentos),
-- para não somar a tabela em cada listagem.

CREATE TABLE IF NOT EXISTS estoque_movimentos (
  id           TEXT PRIMARY KEY,
  produto_id   INTEGER NOT NULL REFERENCES produtos(id) ON DELETE CASCADE,
  tipo         TEXT NOT NULL,
  quantidade   INTEGER NOT NULL,
  saldo_depois INTEGER NOT NULL,
  motivo       TEXT NOT NULL,
  origem       TEXT NOT NULL,
  pedido_id    TEXT,
  usuario_id   TEXT,
  criado_em    TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS estoque_movimentos_produto_id_criado_em_idx
  ON estoque_movimentos (produto_id, criado_em);
CREATE INDEX IF NOT EXISTS estoque_movimentos_pedido_id_idx
  ON estoque_movimentos (pedido_id);

-- Ponto de partida: o saldo atual de cada peça vira um movimento de
-- "saldo inicial". Sem isso o histórico começaria do zero e a soma dos
-- movimentos não fecharia com `produtos.estoque`.
INSERT INTO estoque_movimentos (id, produto_id, tipo, quantidade, saldo_depois, motivo, origem, criado_em)
SELECT
  'ini_' || p.id,
  p.id,
  'entrada',
  p.estoque,
  p.estoque,
  'Saldo inicial (migração do estoque digitado)',
  'migracao',
  CURRENT_TIMESTAMP
FROM produtos p
WHERE NOT EXISTS (SELECT 1 FROM estoque_movimentos m WHERE m.produto_id = p.id);
