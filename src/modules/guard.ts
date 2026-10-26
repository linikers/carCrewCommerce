import { notFound, redirect } from "next/navigation";
import { NextResponse } from "next/server";
import { moduloAtivo } from "./config";
import { acharModulo, type IdModulo } from "./registro";

/**
 * Barreira de módulo desligado.
 *
 * API: **404**, não 403. Um 403 confirma que a rota existe e convida a
 * procurar o endpoint. O 404 não entrega nada para quem sonda.
 *
 * Página: **redirect para /admin/modulos**. Testei `notFound()` aqui: o Next
 * já mandou o `<html>` do layout raiz (streaming) e o status sai 200 com a
 * tela de "não encontrada" dentro — status mentiroso. Como quem chega nessa
 * URL é o dono, mandar ele para a tela onde liga o módulo resolve melhor do
 * que um 404.
 *
 * Uso na API:
 *   const bloqueio = await exigirModulo("fiscal");
 *   if (bloqueio) return bloqueio;
 *
 * Uso na página (server component, no generateMetadata):
 *   await paginaDoModulo("estoque");
 */
export async function exigirModulo(id: IdModulo): Promise<NextResponse | null> {
  if (await moduloAtivo(id)) return null;
  return NextResponse.json({ error: "Não encontrado" }, { status: 404 });
}

export async function paginaDoModulo(id: IdModulo): Promise<void> {
  if (await moduloAtivo(id)) return;

  const modulo = acharModulo(id);
  // módulo declarado mas ainda não construído: não faz sentido mandar para o
  // painel de módulos, a tela simplesmente não existe
  if (!modulo) notFound();

  redirect(`/admin/modulos?desligado=${id}`);
}
