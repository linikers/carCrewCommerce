/**
 * Registro de módulos do CarCrew Commerce.
 *
 * Cada módulo é uma área do sistema que pode ser ligada ou desligada sem
 * deploy. O registro é a única fonte de verdade sobre: quem existe, quem
 * depende de quem, que telas aparecem no painel e quais tabelas o módulo
 * possui.
 *
 * Regras (valem para todo módulo novo):
 * 1. o módulo só lê e escreve as tabelas listadas em `tabelas`
 * 2. `dominio/` não importa Next, React nem Prisma
 * 3. efeito colateral em outro módulo passa pela tabela `eventos`
 * 4. tabelas têm prefixo do módulo (`estoque_movimentos`)
 * 5. as rotas em `src/app/api` são cascas finas: validam e chamam o módulo
 *
 * O script `npm run checar:fronteiras` verifica as regras 1, 2 e 5.
 */

export type IdModulo =
  | "catalogo"
  | "pedidos"
  | "frete"
  | "estoque"
  | "fiscal"
  | "financeiro"
  | "marketplace"
  | "pdv"
  | "os"
  | "relatorios";

export interface TelaModulo {
  /** Rota no painel. */
  rota: string;
  /** Texto no menu. */
  rotulo: string;
  /** Grupo do menu (Catálogo, Operação, Configuração…). */
  grupo: "Catálogo" | "Operação" | "Configuração";
}

export interface Modulo {
  id: IdModulo;
  nome: string;
  /** Uma linha explicando o que liga. */
  descricao: string;
  /**
   * Módulo essencial: não pode ser desligado (a loja para).
   * A tela mostra a chave travada com o motivo.
   */
  essencial?: boolean;
  /** Ligado por padrão quando nunca foi configurado. */
  padraoAtivo: boolean;
  /** IDs que precisam estar ligados para este funcionar. */
  dependeDe: IdModulo[];
  /** Telas que o módulo adiciona ao painel. */
  telas: TelaModulo[];
  /** Tabelas que o módulo possui (prefixo do módulo). */
  tabelas: string[];
  /** Issue que acompanha a construção. */
  issue?: number;
}

export const MODULOS: Modulo[] = [
  {
    id: "catalogo",
    nome: "Catálogo e vitrine",
    descricao: "Produtos, categorias, banners, home e páginas de categoria.",
    essencial: true,
    padraoAtivo: true,
    dependeDe: [],
    telas: [
      { rota: "/admin/produtos", rotulo: "Produtos", grupo: "Catálogo" },
      { rota: "/admin/categorias", rotulo: "Categorias", grupo: "Catálogo" },
      { rota: "/admin/banners", rotulo: "Banners", grupo: "Catálogo" },
    ],
    tabelas: ["produtos", "categorias", "banners"],
  },
  {
    id: "pedidos",
    nome: "Pedidos e clientes",
    descricao: "Carrinho, checkout, pedidos, clientes e leads.",
    essencial: true,
    padraoAtivo: true,
    dependeDe: ["catalogo"],
    telas: [
      { rota: "/admin/pedidos", rotulo: "Pedidos", grupo: "Operação" },
      { rota: "/admin/clientes", rotulo: "Clientes", grupo: "Operação" },
      { rota: "/admin/leads", rotulo: "Leads", grupo: "Operação" },
    ],
    tabelas: ["pedidos", "pedido_itens", "leads", "users"],
  },
  {
    id: "frete",
    nome: "Frete",
    descricao: "Cálculo de frete no produto e no checkout, cotação e etiqueta.",
    padraoAtivo: true,
    dependeDe: ["pedidos"],
    telas: [{ rota: "/admin/frete", rotulo: "Frete", grupo: "Configuração" }],
    tabelas: ["configuracoes"],
    issue: 75,
  },
  {
    id: "estoque",
    nome: "Estoque real",
    descricao:
      "Movimento de estoque, saldo por depósito e custo médio — em vez de um número digitado à mão.",
    padraoAtivo: false,
    dependeDe: ["catalogo", "pedidos"],
    telas: [
      { rota: "/admin/estoque", rotulo: "Estoque", grupo: "Operação" },
      { rota: "/admin/estoque/movimentos", rotulo: "Movimentos", grupo: "Operação" },
    ],
    tabelas: ["estoque_movimentos", "estoque_saldos"],
    issue: 73,
  },
  {
    id: "fiscal",
    nome: "Fiscal (NF-e)",
    descricao:
      "Cadastro fiscal da empresa e política de emissão por canal (site opcional, marketplace padrão).",
    padraoAtivo: false,
    // emitir não exige o módulo de estoque: a nota precisa de pedido + itens +
    // dados fiscais. Estoques e movimentos são outra conversa (#73).
    dependeDe: ["pedidos"],
    telas: [{ rota: "/admin/fiscal", rotulo: "Fiscal", grupo: "Configuração" }],
    tabelas: ["empresa_fiscal", "fiscal_notas"],
    issue: 79,
  },
  {
    id: "financeiro",
    nome: "Financeiro",
    descricao: "Contas a pagar e a receber, fluxo de caixa e conciliação de pedidos.",
    padraoAtivo: false,
    dependeDe: ["pedidos"],
    telas: [
      { rota: "/admin/financeiro", rotulo: "Financeiro", grupo: "Operação" },
      { rota: "/admin/financeiro/contas", rotulo: "Contas", grupo: "Operação" },
    ],
    tabelas: ["fin_titulos", "fin_lancamentos"],
    issue: 77,
  },
  {
    id: "marketplace",
    nome: "Marketplace",
    descricao:
      "Cadastro das contas de Shopee e Mercado Livre e, depois, publicação e sincronização de anúncios.",
    padraoAtivo: false,
    // cadastrar credencial não exige estoque; sincronizar vai exigir (#85)
    dependeDe: ["catalogo"],
    telas: [{ rota: "/admin/marketplace", rotulo: "Marketplace", grupo: "Operação" }],
    tabelas: ["credencial_canal", "mkt_anuncios", "mkt_pedidos"],
    issue: 82,
  },
  {
    id: "pdv",
    nome: "PDV (balcão)",
    descricao: "Venda presencial com emissão de NFC-e e baixa imediata do estoque.",
    padraoAtivo: false,
    dependeDe: ["estoque", "fiscal"],
    telas: [{ rota: "/admin/pdv", rotulo: "PDV", grupo: "Operação" }],
    tabelas: ["pdv_vendas"],
    issue: 88,
  },
  {
    id: "os",
    nome: "Ordem de serviço",
    descricao: "Ordens da oficina: veículo, diagnóstico, peça, serviço e prazo.",
    padraoAtivo: false,
    // OS usa peça e serviço; não exige o módulo de estoque para abrir a ordem
    dependeDe: [],
    telas: [{ rota: "/admin/os", rotulo: "Ordens de serviço", grupo: "Operação" }],
    tabelas: ["os_ordens", "os_itens"],
    issue: 80,
  },
  {
    id: "relatorios",
    nome: "Relatórios",
    descricao: "Dashboards de venda, margem e giro com dado do próprio banco.",
    padraoAtivo: false,
    dependeDe: ["pedidos"],
    telas: [{ rota: "/admin/relatorios", rotulo: "Relatórios", grupo: "Operação" }],
    tabelas: [],
    issue: 92,
  },
];

export function acharModulo(id: string): Modulo | undefined {
  return MODULOS.find((m) => m.id === id);
}

/**
 * Ordem de ligação: um módulo só pode ligar se as dependências já estiverem
 * ligadas. Devolve a lista de dependências que faltam.
 */
export function dependenciasFaltando(
  id: IdModulo,
  ativos: Record<string, boolean>
): IdModulo[] {
  const modulo = acharModulo(id);
  if (!modulo) return [];
  return modulo.dependeDe.filter((dep) => !ativos[dep]);
}
