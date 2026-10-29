-- Custo por período: ads e fatura do Mercado Livre Full (#191, PR-4).
--
-- Risco: BAIXO. Tabela nova, ninguém lê ainda.
--
-- Rollback: DROP TABLE IF EXISTS custos_periodo;

BEGIN;

CREATE TABLE IF NOT EXISTS custos_periodo (
  id          text PRIMARY KEY,
  tipo        text NOT NULL,
  canal       text NOT NULL,
  inicio      date NOT NULL,
  fim         date NOT NULL,
  valor       double precision NOT NULL,
  observacao  text,
  rateado_em  timestamp(3),
  criado_em   timestamp(3) NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS custos_periodo_canal_inicio_fim_idx
  ON custos_periodo (canal, inicio, fim);

COMMIT;
