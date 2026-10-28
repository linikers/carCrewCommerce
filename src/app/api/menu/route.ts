// API pública — menu da loja.
// O Header é client component: busca a configuração aqui e monta a barra.
// Sem a chave no banco, devolve o padrão (menu atual) — a loja nunca fica sem nav.

import { NextResponse } from "next/server";
import { lerMenuLoja, itensVisiveis } from "@/lib/menu-loja";

export const dynamic = "force-dynamic";

export async function GET() {
  const config = await lerMenuLoja();

  return NextResponse.json({
    barra: itensVisiveis(config.barra),
    solucoes: itensVisiveis(config.solucoes),
    categoriasOcultas: config.categoriasOcultas,
  });
}
