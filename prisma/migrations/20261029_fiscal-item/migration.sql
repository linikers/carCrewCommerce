-- Dado fiscal por item + snapshot na venda (interface do emissor).
-- Risco: BAIXO. Colunas opcionais, nenhum dado reescrito.

BEGIN;

ALTER TABLE produtos ADD COLUMN IF NOT EXISTS cst_csosn text;
ALTER TABLE produtos ADD COLUMN IF NOT EXISTS cfop_interno text;
ALTER TABLE produtos ADD COLUMN IF NOT EXISTS cfop_externo text;

ALTER TABLE pedido_itens ADD COLUMN IF NOT EXISTS ncm text;
ALTER TABLE pedido_itens ADD COLUMN IF NOT EXISTS cfop text;
ALTER TABLE pedido_itens ADD COLUMN IF NOT EXISTS cst_csosn text;
ALTER TABLE pedido_itens ADD COLUMN IF NOT EXISTS unidade text;

COMMIT;
