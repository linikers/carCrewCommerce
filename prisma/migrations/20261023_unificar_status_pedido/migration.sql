-- Migration: unificar vocabulário de status do pedido
-- Data: 2026-10-23
-- Risco: BAIXO — só normaliza strings; nenhuma coluna muda
-- Rollback: UPDATE pedidos SET status='pendente' WHERE status='aguardando_pagamento';
--           UPDATE pedidos SET status='confirmado' WHERE status='pago' AND ... (não recomendado)
--
-- O checkout gravava "aguardando_pagamento" e "confirmado"; o admin só
-- conhecia "pendente|pago|preparando|enviado|entregue|cancelado". Todo
-- pedido real nascia invisível para a operação.
--
-- Rode ANTES do deploy do código novo.

UPDATE pedidos SET status = 'aguardando_pagamento' WHERE status = 'pendente';
UPDATE pedidos SET status = 'pago'                WHERE status = 'confirmado';
UPDATE pedidos SET status = 'em_separacao'        WHERE status = 'preparando';

-- Conferência: deve listar apenas os 6 status do novo vocabulário
SELECT status, count(*) FROM pedidos GROUP BY status ORDER BY 2 DESC;
