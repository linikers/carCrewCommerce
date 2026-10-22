/**
 * Camada única de eventos de marketing.
 *
 * Antes o site só tinha `gtag('config', ...)` no layout: nenhum evento de
 * e-commerce (`view_item`, `add_to_cart`, `begin_checkout`, `purchase`) e
 * nenhum clique de WhatsApp medido. Sem isso não existe remarketing, nem
 * funil, nem como saber qual peça converte.
 *
 * `track` empurra para o GA4 (gtag) e para o dataLayer, que é o ponto único
 * onde um Meta Pixel / CAPI pode ser plugado depois sem tocar nos componentes.
 */

export type EventName =
  | "view_item"
  | "add_to_cart"
  | "begin_checkout"
  | "purchase"
  | "whatsapp_click"
  | "search"
  | "generate_pix";

type Params = Record<string, unknown>;

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
    dataLayer?: unknown[];
  }
}

export function track(event: EventName, params: Params = {}): void {
  if (typeof window === "undefined") return;

  // GA4
  if (typeof window.gtag === "function") {
    window.gtag("event", event, params);
  }

  // dataLayer — ponto de extensão para Meta Pixel / CAPI
  window.dataLayer = window.dataLayer || [];
  window.dataLayer.push({ event, ...params });

  if (process.env.NODE_ENV !== "production") {
    // ajuda a depurar no console do navegador
    console.debug("[analytics]", event, params);
  }
}

/** Atalho para eventos de item (produto) */
export function trackItem(
  event: "view_item" | "add_to_cart",
  produto: { id: number | string; nome: string; preco: number; categorySlug?: string },
  quantidade = 1
): void {
  track(event, {
    currency: "BRL",
    value: produto.preco * quantidade,
    items: [
      {
        item_id: String(produto.id),
        item_name: produto.nome,
        item_category: produto.categorySlug,
        price: produto.preco,
        quantity: quantidade,
      },
    ],
  });
}

/** Clique em WhatsApp, com a origem para saber qual tela gera conversa */
export function trackWhatsApp(origem: string, produto?: string): void {
  track("whatsapp_click", { origem, produto });
}
