-- Custo da venda (#191, PR-3).
--
-- Risco: BAIXO. Só colunas opcionais + um índice único em (canal, canal_pedido_id),
-- que hoje não afeta nada porque `pedidos` tem 0 linhas em produção.
--
-- Sem este DDL o build da Vercel cai em P2022 dentro do seed.
--
-- Rollback:
--   DROP INDEX IF EXISTS pedidos_canal_canal_pedido_id_key;
--   ALTER TABLE pedidos DROP COLUMN IF EXISTS comissao, ... (todas as colunas abaixo);

BEGIN;

ALTER TABLE pedidos ADD COLUMN IF NOT EXISTS comissao double precision;
ALTER TABLE pedidos ADD COLUMN IF NOT EXISTS comissao_percent double precision;
ALTER TABLE pedidos ADD COLUMN IF NOT EXISTS frete_vendedor double precision;
ALTER TABLE pedidos ADD COLUMN IF NOT EXISTS imposto double precision;
ALTER TABLE pedidos ADD COLUMN IF NOT EXISTS imposto_percent double precision;
ALTER TABLE pedidos ADD COLUMN IF NOT EXISTS embalagem double precision;
ALTER TABLE pedidos ADD COLUMN IF NOT EXISTS ads double precision NOT NULL DEFAULT 0;
ALTER TABLE pedidos ADD COLUMN IF NOT EXISTS ads_origem text NOT NULL DEFAULT 'manual';
ALTER TABLE pedidos ADD COLUMN IF NOT EXISTS custos_origem text NOT NULL DEFAULT 'manual';
ALTER TABLE pedidos ADD COLUMN IF NOT EXISTS venda_em timestamp(3);
ALTER TABLE pedidos ADD COLUMN IF NOT EXISTS canal_pedido_id text;
ALTER TABLE pedidos ADD COLUMN IF NOT EXISTS resultado double precision;
ALTER TABLE pedidos ADD COLUMN IF NOT EXISTS margem_percent double precision;

CREATE UNIQUE INDEX IF NOT EXISTS pedidos_canal_canal_pedido_id_key
  ON pedidos (canal, canal_pedido_id);

COMMIT;
