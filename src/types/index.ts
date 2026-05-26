// Tipos do CarCrew Commerce

export interface Produto {
  id: number;
  nome: string;
  descricao: string;
  preco: number;
  imgUrl: string;
  category: CategoriaSlug;
  parcelamento?: number;
  veiculos?: string[];
}

export type CategoriaSlug =
  | "amortecedores"
  | "calco-antirruido"
  | "ponta-de-eixo"
  | "bolsa-de-ar"
  | "acessorio-instalacao"
  | "mola-suspensao";

export interface Categoria {
  slug: CategoriaSlug;
  nome: string;
  icone: string;
}

export interface ItemCarrinho {
  produto: Produto;
  quantidade: number;
}
