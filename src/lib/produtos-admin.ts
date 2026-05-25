import { readFileSync, writeFileSync, existsSync } from "fs";
import path from "path";

export interface ProdutoData {
  id: number;
  nome: string;
  descricao: string;
  preco: number;
  imgUrl: string;
  category: string;
  parcelamento: number;
  estoque: number;
  ativo: boolean;
  criadoEm: string;
}

const DATA_PATH = path.join(process.cwd(), "src/data/produtos.json");

export function lerProdutos(): ProdutoData[] {
  try {
    if (!existsSync(DATA_PATH)) return [];
    return JSON.parse(readFileSync(DATA_PATH, "utf-8"));
  } catch {
    return [];
  }
}

export function salvarProdutos(produtos: ProdutoData[]) {
  writeFileSync(DATA_PATH, JSON.stringify(produtos, null, 2));
}

export function proximoId(produtos: ProdutoData[]): number {
  if (produtos.length === 0) return 1;
  return Math.max(...produtos.map((p) => p.id)) + 1;
}
