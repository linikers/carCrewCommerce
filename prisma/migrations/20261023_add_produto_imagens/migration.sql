-- Migration: galeria de imagens do produto
-- Data: 2026-10-23
-- Risco: BAIXO — coluna nova com default, dados existentes não são afetados
-- Rollback: ALTER TABLE produtos DROP COLUMN IF EXISTS imagens;
--
-- ATENÇÃO: rodar ANTES de subir o código que usa o campo. O `npm run build`
-- da Vercel faz `prisma generate && prisma db seed && next build` — não roda
-- migrate deploy. Sem o ALTER abaixo, o Prisma tenta ler `imagens` e falha.

ALTER TABLE produtos ADD COLUMN IF NOT EXISTS imagens TEXT[] NOT NULL DEFAULT '{}';

COMMENT ON COLUMN produtos.imagens IS 'Galeria do produto (a primeira é a imagem principal). imgUrl continua sendo a capa usada nos cards.';
