import { requireAdmin } from "@/lib/api-auth";
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

/** Lista de leads capturados (7.1). Só admin. */
export async function GET() {
  const denied = await requireAdmin();
  if (denied) return denied;

  try {
    const [leads, total, ultimos7] = await Promise.all([
      prisma.lead.findMany({ orderBy: { criadoEm: "desc" }, take: 500 }),
      prisma.lead.count(),
      prisma.lead.count({
        where: { criadoEm: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } },
      }),
    ]);

    return NextResponse.json({
      leads: leads.map((l) => ({
        id: l.id,
        email: l.email,
        telefone: l.telefone,
        origem: l.origem,
        criadoEm: l.criadoEm,
      })),
      resumo: { total, ultimos7 },
    });
  } catch (error) {
    console.error("[admin/leads] falha ao listar:", error);
    return NextResponse.json(
      { error: "Não foi possível carregar a lista agora." },
      { status: 503 }
    );
  }
}
