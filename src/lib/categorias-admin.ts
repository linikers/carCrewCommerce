import { readFileSync, writeFileSync, existsSync } from "fs";
import path from "path";

export interface CategoriaData {
  id: number;
  slug: string;
  nome: string;
  icone: string;
  descricao: string;
  ordem: number;
}

const DATA_PATH = path.join(process.cwd(), "src/data/categorias.json");

export function lerCategorias(): CategoriaData[] {
  try {
    if (!existsSync(DATA_PATH)) return [];
    return JSON.parse(readFileSync(DATA_PATH, "utf-8"));
  } catch {
    return [];
  }
}

export function salvarCategorias(categorias: CategoriaData[]) {
  writeFileSync(DATA_PATH, JSON.stringify(categorias, null, 2));
}

export function proximoId(categorias: CategoriaData[]): number {
  if (categorias.length === 0) return 1;
  return Math.max(...categorias.map((c) => c.id)) + 1;
}
