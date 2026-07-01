// Tipos do CarCrew Commerce

export interface Produto {
  id: number;
  nome: string;
  descricao: string;
  preco: number;
  imgUrl: string;
  galeria?: string[];
  category: CategoriaSlug;
  parcelamento?: number;
  veiculos?: string[];
  // Medidas para frete (gramas e centímetros)
  peso?: number;
  altura?: number;
  largura?: number;
  profundidade?: number;
}

export type CategoriaSlug =
  | "compressores"
  | "amortecedores"
  | "bandejas"
  | "bolsas-de-ar"
  | "pontas-de-eixo"
  | "calcos-antirruido"
  | "kits"
  | "componentes"
  | "terminais"
  | "controles";

export interface Categoria {
  slug: CategoriaSlug;
  nome: string;
  icone: string;
}

export interface ItemCarrinho {
  produto: Produto;
  quantidade: number;
}
