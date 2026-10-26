import { requireAdmin } from "@/lib/api-auth";
import { NextRequest, NextResponse } from "next/server";
import { readFreteConfig, writeFreteConfig, type FreteConfig } from "@/modules/frete/dados/config";
import { auditar } from "@/lib/auditoria";


export async function GET() {
  const denied = await requireAdmin();
  if (denied) return denied;

  const config = await readFreteConfig();
  // Não expor secrets pro frontend
  const safe = {
    originCep: config.originCep,
    packageWeight: config.packageWeight,
    packageHeight: config.packageHeight,
    packageWidth: config.packageWidth,
    packageLength: config.packageLength,
    markupPercent: config.markupPercent,
    sandbox: config.sandbox,
    hasClientId: !!config.clientId,
    hasClientSecret: !!config.clientSecret,
    hasToken: !!config.accessToken,
    tokenExpiresAt: config.tokenExpiresAt,
  };
  return NextResponse.json(safe);
}

export async function PATCH(request: NextRequest) {
  const denied = await requireAdmin();
  if (denied) return denied;

  try {
    const body = await request.json();
    const config = await readFreteConfig();

    // Só permite atualizar campos específicos
    const allowedFields = [
      "originCep", "packageWeight", "packageHeight",
      "packageWidth", "packageLength", "markupPercent", "sandbox",
      "clientId", "clientSecret",
    ];

    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        (config as any)[field] = body[field];
      }
    }

    await writeFreteConfig(config);
    await auditar({
      entidade: "frete",
      entidadeId: "melhor-envio",
      acao: "alterar",
      depois: Object.keys(body),
    });
    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json(
      { error: "Erro ao salvar configuração" },
      { status: 500 },
    );
  }
}
