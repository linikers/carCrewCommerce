-- Custo da peça (PR-1 do resultado por venda).
--
-- Risco: BAIXO. Aditivo, duas colunas opcionais, nenhum dado reescrito.
-- Sem estas colunas o build da Vercel cai em P2022 dentro do seed (o build
-- roda `prisma db seed`, que faz select em produtos).
--
-- Rollback:
--   ALTER TABLE produtos DROP COLUMN IF EXISTS custo;
--   ALTER TABLE pedido_itens DROP COLUMN IF EXISTS custo_unitario;

BEGIN;

ALTER TABLE produtos ADD COLUMN IF NOT EXISTS custo double precision;
ALTER TABLE pedido_itens ADD COLUMN IF NOT EXISTS custo_unitario double precision;

COMMIT;
