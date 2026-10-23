-- Migration: pedido sem usuário (venda para visitante)
-- Data: 2026-10-23
-- Risco: BAIXO — remove NOT NULL de uma coluna; nenhum dado é alterado
-- Rollback (só se não houver pedido sem usuário):
--   ALTER TABLE pedidos ALTER COLUMN user_id SET NOT NULL;
--
-- Contexto: /api/pedidos/criar grava userId "guest", que não existe em
-- `users`. A FK `pedidos_user_id_fkey` recusava o insert e TODO pedido
-- terminava em 500. Com a coluna opcional, pedido de visitante é válido e o
-- `userId` só é preenchido quando o cliente está logado.

ALTER TABLE pedidos ALTER COLUMN user_id DROP NOT NULL;
