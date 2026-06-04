import { NextRequest, NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";

interface FreteConfig {
  originCep: string;
  clientId: string;
  clientSecret: string;
  accessToken: string;
  refreshToken: string;
  tokenExpiresAt: string | null;
  packageWeight: number;
  packageHeight: number;
  packageWidth: number;
  packageLength: number;
  markupPercent: number;
  sandbox: boolean;
}

const CONFIG_PATH = path.join(process.cwd(), "src/data/frete.json");

async function readConfig(): Promise<FreteConfig> {
  try {
    const raw = await fs.readFile(CONFIG_PATH, "utf-8");
    return JSON.parse(raw);
  } catch {
    return {
      originCep: "",
      clientId: "",
      clientSecret: "",
      accessToken: "",
      refreshToken: "",
      tokenExpiresAt: null,
      packageWeight: 0.5,
      packageHeight: 2,
      packageWidth: 16,
      packageLength: 18,
      markupPercent: 0,
      sandbox: true,
    };
  }
}

async function writeConfig(config: FreteConfig) {
  await fs.writeFile(CONFIG_PATH, JSON.stringify(config, null, 2), "utf-8");
}

export async function GET() {
  const config = await readConfig();
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
  try {
    const body = await request.json();
    const config = await readConfig();

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

    await writeConfig(config);
    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json(
      { error: "Erro ao salvar configuração" },
      { status: 500 },
    );
  }
}
