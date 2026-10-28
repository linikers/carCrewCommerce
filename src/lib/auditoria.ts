import prisma from "@/lib/prisma";
import { getAdminId } from "@/lib/api-auth";

/**
 * Auditoria de alteração (7.8).
 *
 * Antes não havia nenhum registro de quem mudou o quê: preço alterado errado,
 * produto apagado, status de pedido trocado — impossível saber autor, hora e
 * valor anterior. Numa loja com mais de um operador isso vira disputa sem
 * prova.
 *
 * A gravação nunca derruba a operação: se o log falhar, a alteração continua
 * valendo e o erro vai para o console.
 */
export type EntidadeAuditada =
  | "produto"
  | "pedido"
  | "categoria"
  | "banner"
  | "pagamento"
  | "frete"
  | "configuracao"
  | "menu_loja"
  | "lp_conteudo"
  | "empresa";

export async function auditar(params: {
  entidade: EntidadeAuditada;
  entidadeId: string | number;
  acao: "criar" | "alterar" | "excluir";
  antes?: unknown;
  depois?: unknown;
}): Promise<void> {
  try {
    const userId = await getAdminId();
    await prisma.auditoria.create({
      data: {
        entidade: params.entidade,
        entidadeId: String(params.entidadeId),
        acao: params.acao,
        antes: params.antes === undefined ? undefined : JSON.parse(JSON.stringify(params.antes)),
        depois: params.depois === undefined ? undefined : JSON.parse(JSON.stringify(params.depois)),
        userId,
      },
    });
  } catch (e) {
    console.error("[auditoria] falha ao registrar:", e);
  }
}
