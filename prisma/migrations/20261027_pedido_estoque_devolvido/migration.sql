-- Migration: marca de estoque devolvido no pedido (#121)
-- Data: 2026-10-27
-- Risco: BAIXO — coluna booleana com default false
-- Rollback: ALTER TABLE pedidos DROP COLUMN IF EXISTS estoque_devolvido;
--
-- Sem esta marca, cancelar duas vezes devolveria o estoque duas vezes (ou,
-- pior, devolveria pedido que nunca baixou).

ALTER TABLE pedidos ADD COLUMN IF NOT EXISTS estoque_devolvido BOOLEAN NOT NULL DEFAULT false;
