import { requireAdmin } from "@/lib/api-auth";
// API de configuração de pagamentos — Prisma (Vercel-safe)
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

const CONFIG_KEY = "pagamentos";

const defaultConfig = {
  pix: { habilitado: false, chaves: [] },
  boleto: { habilitado: false },
  cartao: { habilitado: false },
};

export async function GET() {
  const denied = await requireAdmin();
  if (denied) return denied;

  try {
    const row = await prisma.configuracao.findUnique({ where: { chave: CONFIG_KEY } });
    const config = row ? (row.valor as any) : defaultConfig;
    return NextResponse.json({ ...defaultConfig, ...config });
  } catch {
    return NextResponse.json(defaultConfig);
  }
}

export async function PUT(request: Request) {
  const denied = await requireAdmin();
  if (denied) return denied;

  try {
    const body = await request.json();
    await prisma.configuracao.upsert({
      where: { chave: CONFIG_KEY },
      update: { valor: body },
      create: { chave: CONFIG_KEY, valor: body },
    });
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Erro ao salvar pagamentos:", error);
    return NextResponse.json({ error: "Erro ao salvar configurações" }, { status: 500 });
  }
}
