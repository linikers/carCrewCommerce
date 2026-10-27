-- Migration: mensagens do pedido (#122 / 6.5)
-- Data: 2026-10-27
-- Risco: BAIXO — tabela nova
-- Rollback: DROP TABLE IF EXISTS mensagens_pedido;

CREATE TABLE IF NOT EXISTS mensagens_pedido (
  id         TEXT PRIMARY KEY,
  pedido_id  TEXT NOT NULL REFERENCES pedidos(id) ON DELETE CASCADE,
  canal      TEXT NOT NULL,
  direcao    TEXT NOT NULL DEFAULT 'saida',
  texto      TEXT NOT NULL,
  autor_id   TEXT,
  enviado    BOOLEAN NOT NULL DEFAULT false,
  criado_em  TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS mensagens_pedido_pedido_id_criado_em_idx
  ON mensagens_pedido (pedido_id, criado_em);
