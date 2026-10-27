import { readFreteConfig, writeFreteConfig } from "./config";
import {
  ErroFrete,
  cotarNoMelhorEnvio,
  renovarToken,
  tokenVencido,
} from "./melhor-envio";
import { cotar, type ItemFrete, type OpcaoFrete } from "../dominio/cotacao";

/**
 * Serviço de cotação: decide entre a transportadora e a estimativa.
 *
 * Regra de ouro: **nunca** apresentar estimativa como cotação. Se o Melhor
 * Envio não está autorizado ou está fora, a resposta diz `fonte: "estimativa"`
 * e cada opção vem com `estimado: true` — a tela escreve isso para o cliente.
 */

export interface ResultadoCotacao {
  cepOrigem: string;
  cepDestino: string;
  pesoTotal: string;
  dimensoes: string;
  opcoes: OpcaoFrete[];
  /** melhorenvio = preço de transportadora; estimativa = tabela interna */
  fonte: "melhorenvio" | "estimativa";
  /** explicação para a tela quando caiu na estimativa */
  aviso?: string;
}

export async function cotarFrete(
  cepDestino: string,
  itens: ItemFrete[],
  valorDeclarado = 0
): Promise<ResultadoCotacao | null> {
  let config;
  try {
    config = await readFreteConfig();
  } catch (e) {
    console.error("[frete] falha ao ler config:", e);
    config = null;
  }

  if (config?.accessToken) {
    try {
      let atual = config;

      // token vencido: tenta renovar antes de cotar
      if (tokenVencido(atual)) {
        atual = await renovarToken(atual);
        await writeFreteConfig(atual);
      }

      const opcoes = await cotarNoMelhorEnvio(atual, cepDestino, itens, valorDeclarado);
      const base = cotar(cepDestino, itens);
      if (!base) return null;

      return {
        ...base,
        opcoes,
        fonte: "melhorenvio",
      };
    } catch (e) {
      const motivo = e instanceof ErroFrete ? e.message : "falha na cotação";
      console.error("[frete] Melhor Envio indisponível:", motivo);

      // cai na estimativa, mas diz por quê
      const base = cotar(cepDestino, itens);
      if (!base) return null;
      return {
        ...base,
        fonte: "estimativa",
        aviso:
          "A cotação da transportadora está indisponível agora. Os valores abaixo são estimativa e serão confirmados no fechamento do pedido.",
      };
    }
  }

  const base = cotar(cepDestino, itens);
  if (!base) return null;

  return {
    ...base,
    fonte: "estimativa",
    aviso: config?.accessToken
      ? undefined
      : "Frete estimado: a loja ainda não conectou a transportadora. O valor final é confirmado no fechamento do pedido.",
  };
}
