-- Migration: endereço, frete e contato no pedido
-- Data: 2026-10-23
-- Risco: BAIXO — quatro colunas novas, todas NULL, nenhum dado existente muda
-- Rollback: ALTER TABLE pedidos DROP COLUMN IF EXISTS endereco_entrega, DROP COLUMN IF EXISTS frete, DROP COLUMN IF EXISTS cliente_nome, DROP COLUMN IF EXISTS cliente_telefone;
--
-- ATENÇÃO: rodar ANTES de subir o código. O build da Vercel roda
-- `prisma generate && prisma db seed && next build` — não roda `migrate deploy`.
--
-- Contexto: o checkout já coletava CEP, endereço, número, bairro, cidade e
-- telefone; a API criava o pedido e descartava tudo. Sem endereço não há
-- expedição, sem frete não há conferência de etiqueta.

ALTER TABLE pedidos ADD COLUMN IF NOT EXISTS endereco_entrega JSONB;
ALTER TABLE pedidos ADD COLUMN IF NOT EXISTS frete DOUBLE PRECISION;
ALTER TABLE pedidos ADD COLUMN IF NOT EXISTS cliente_nome TEXT;
ALTER TABLE pedidos ADD COLUMN IF NOT EXISTS cliente_telefone TEXT;
