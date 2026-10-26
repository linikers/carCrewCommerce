import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { soDigitos } from "@/lib/documento";

/**
 * Captura de lead (7.1).
 *
 * Todo visitante que não comprava na hora era perdido: não havia newsletter,
 * nem lista, nem forma de avisar sobre lançamento.
 *
 * Regras:
 * - e-mail válido e obrigatório; telefone opcional
 * - consentimento explícito (LGPD) — sem marcar, não grava
 * - e-mail repetido não duplica: atualiza telefone/origem
 * - nunca devolve se o e-mail já existia (não vaza a base)
 */

const CONSENTIMENTO =
  "Aceito receber novidades e ofertas da Car Crew Garage por e-mail. Posso sair quando quiser.";

export async function POST(req: NextRequest) {
  try {
    const { email, telefone, origem, consentimento } = await req.json();

    if (!consentimento) {
      return NextResponse.json(
        { error: "Precisamos do seu aceite para enviar as novidades." },
        { status: 400 }
      );
    }

    const emailLimpo = String(email || "").trim().toLowerCase();
    const emailValido = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(emailLimpo);
    if (!emailValido) {
      return NextResponse.json({ error: "Informe um e-mail válido." }, { status: 400 });
    }

    const telefoneLimpo = telefone ? soDigitos(String(telefone)) : "";

    await prisma.lead.upsert({
      where: { email: emailLimpo },
      create: {
        email: emailLimpo,
        telefone: telefoneLimpo || null,
        origem: String(origem || "site").slice(0, 40),
        consentimento: CONSENTIMENTO,
      },
      update: {
        // não sobrescreve telefone já existente com vazio
        ...(telefoneLimpo ? { telefone: telefoneLimpo } : {}),
        origem: String(origem || "site").slice(0, 40),
      },
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("[leads] falha ao salvar:", error);
    return NextResponse.json(
      { error: "Não foi possível salvar agora. Tente de novo." },
      { status: 503 }
    );
  }
}
