import { Produto } from "@/types";

/**
 * Fallback: used when Prisma is unavailable (no DB connection).
 * Real product data is in src/data/produtos.json loaded by the app.
 * This exists only for admin CRUD fallback operations.
 */
export const produtos: Produto[] = [
  {
    id: 1,
    nome: "Compressor HKI 444C Premium Cromado 200 PSI 12V",
    descricao: "Compressor de ar 444C Premium para suspensão a ar. 200 PSI, 12V.",
    preco: 0,
    imgUrl: "/produtos/compressors/444-cromado.webp",
    category: "compressores",
    parcelamento: 12,
  },
  {
    id: 2,
    nome: "Compressor HKI 444C Premium Preto 200 PSI 12V",
    descricao: "Compressor de ar 444C Premium para suspensão a ar. 200 PSI, 12V.",
    preco: 0,
    imgUrl: "/produtos/compressors/444-preto.webp",
    category: "compressores",
    parcelamento: 12,
  },
  {
    id: 3,
    nome: "Compressor HKI EVO 595",
    descricao: "Compressor HKI EVO 595 pré-lançamento 2026.",
    preco: 0,
    imgUrl: "/produtos/compressors/444-cromado.webp",
    category: "compressores",
    parcelamento: 12,
  },
  {
    id: 6,
    nome: "Bandeja Slim Reforçada Corsa/Celta/Prisma",
    descricao: "Bandeja Slim Reforçada para suspensão rebaixada.",
    preco: 0,
    imgUrl: "/produtos/bandejas/bandeja-gm.jpg",
    category: "bandejas",
    parcelamento: 12,
  },
];
