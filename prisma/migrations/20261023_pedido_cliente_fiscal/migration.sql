-- Migration: e-mail e CPF/CNPJ do cliente no pedido
-- Data: 2026-10-23
-- Risco: BAIXO — duas colunas novas, NULL, nada existente muda
-- Rollback: ALTER TABLE pedidos DROP COLUMN IF EXISTS cliente_email, DROP COLUMN IF EXISTS cliente_documento;
--
-- Roda ANTES do deploy (o build da Vercel não roda `migrate deploy`).

ALTER TABLE pedidos ADD COLUMN IF NOT EXISTS cliente_email TEXT;
ALTER TABLE pedidos ADD COLUMN IF NOT EXISTS cliente_documento TEXT;
