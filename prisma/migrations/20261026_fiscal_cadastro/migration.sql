-- Migration: cadastro fiscal (#78)
-- Data: 2026-10-26
-- Risco: BAIXO — tabela nova + colunas nulas no produto (nada é obrigatório)
-- Rollback: DROP TABLE IF EXISTS empresa_fiscal;
--           ALTER TABLE produtos DROP COLUMN IF EXISTS ncm, cest, cfop, origem, cst_icms, unidade;

CREATE TABLE IF NOT EXISTS empresa_fiscal (
  id                  TEXT PRIMARY KEY DEFAULT 'unica',
  razao_social        TEXT NOT NULL,
  nome_fantasia       TEXT,
  cnpj                TEXT NOT NULL UNIQUE,
  ie                  TEXT,
  im                  TEXT,
  crt                 INTEGER NOT NULL DEFAULT 1,
  cnae                TEXT,
  cep                 TEXT,
  logradouro          TEXT,
  numero              TEXT,
  complemento         TEXT,
  bairro              TEXT,
  cidade              TEXT,
  uf                  TEXT,
  telefone            TEXT,
  email               TEXT,
  ambiente            TEXT NOT NULL DEFAULT 'homologacao',
  serie               INTEGER NOT NULL DEFAULT 1,
  proximo_numero      INTEGER NOT NULL DEFAULT 1,
  certificado_nome    TEXT,
  certificado_validade TIMESTAMP(3),
  atualizado_em       TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE produtos ADD COLUMN IF NOT EXISTS ncm TEXT;
ALTER TABLE produtos ADD COLUMN IF NOT EXISTS cest TEXT;
ALTER TABLE produtos ADD COLUMN IF NOT EXISTS cfop TEXT;
ALTER TABLE produtos ADD COLUMN IF NOT EXISTS origem INTEGER DEFAULT 0;
ALTER TABLE produtos ADD COLUMN IF NOT EXISTS cst_icms TEXT;
ALTER TABLE produtos ADD COLUMN IF NOT EXISTS unidade TEXT DEFAULT 'UN';
