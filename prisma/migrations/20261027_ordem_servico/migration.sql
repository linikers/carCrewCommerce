-- Migration: ordem de serviço (#80)
-- Data: 2026-10-27
-- Risco: BAIXO — duas tabelas novas
-- Rollback: DROP TABLE IF EXISTS os_itens, os_ordens;

CREATE TABLE IF NOT EXISTS os_ordens (
  id                 TEXT PRIMARY KEY,
  cliente_nome       TEXT NOT NULL,
  cliente_telefone   TEXT,
  cliente_email      TEXT,
  cliente_documento  TEXT,
  veiculo            TEXT NOT NULL,
  placa              TEXT,
  km                 INTEGER,
  descricao_problema TEXT NOT NULL,
  observacoes        TEXT,
  status             TEXT NOT NULL DEFAULT 'aberta',
  total_pecas        DOUBLE PRECISION NOT NULL DEFAULT 0,
  total_servicos     DOUBLE PRECISION NOT NULL DEFAULT 0,
  total              DOUBLE PRECISION NOT NULL DEFAULT 0,
  prazo              TIMESTAMP(3),
  criado_em          TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  atualizado_em      TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS os_ordens_status_idx ON os_ordens (status);
CREATE INDEX IF NOT EXISTS os_ordens_cliente_telefone_idx ON os_ordens (cliente_telefone);

CREATE TABLE IF NOT EXISTS os_itens (
  id         TEXT PRIMARY KEY,
  ordem_id   TEXT NOT NULL REFERENCES os_ordens(id) ON DELETE CASCADE,
  tipo       TEXT NOT NULL,
  descricao  TEXT NOT NULL,
  produto_id INTEGER,
  quantidade INTEGER NOT NULL,
  valor_unit DOUBLE PRECISION NOT NULL,
  total      DOUBLE PRECISION NOT NULL
);

CREATE INDEX IF NOT EXISTS os_itens_ordem_id_idx ON os_itens (ordem_id);
