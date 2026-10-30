-- Fila de notas fiscais (interface do emissor). Risco: BAIXO, tabela nova.

BEGIN;

CREATE TABLE IF NOT EXISTS notas_fiscais (
  id            text PRIMARY KEY,
  pedido_id     text NOT NULL UNIQUE REFERENCES pedidos(id) ON DELETE CASCADE,
  canal         text NOT NULL,
  status        text NOT NULL DEFAULT 'pendente',
  motivo        text,
  numero        text,
  serie         text,
  chave         text,
  xml_url       text,
  exportada_em  timestamp(3),
  autorizada_em timestamp(3),
  criado_em     timestamp(3) NOT NULL DEFAULT now(),
  atualizado_em timestamp(3) NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS notas_fiscais_status_canal_idx ON notas_fiscais (status, canal);

COMMIT;
