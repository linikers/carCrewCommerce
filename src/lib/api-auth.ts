import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { authOptions } from "@/lib/auth";

/**
 * Guard das rotas /api/admin/*.
 *
 * Antes desta função NENHUMA rota administrativa verificava sessão:
 * `grep -rn "getServerSession" src` devolvia zero. Um `curl` sem cookie
 * listava todos os pedidos com nome e e-mail do cliente, apagava produto e
 * mudava preço.
 *
 * Uso, como primeira instrução de cada handler:
 *
 *   const denied = await requireAdmin();
 *   if (denied) return denied;
 */
export async function requireAdmin(): Promise<NextResponse | null> {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  if (!(session.user as { admin?: boolean }).admin) {
    return NextResponse.json({ error: "Acesso restrito" }, { status: 403 });
  }

  return null;
}

/** Id do admin logado, para auditoria (quem alterou o quê) */
export async function getAdminId(): Promise<string | null> {
  const session = await getServerSession(authOptions);
  if (!session?.user || !(session.user as { admin?: boolean }).admin) return null;
  return (session.user as { id?: string }).id ?? null;
}
