// API de configuração de pagamentos
import { NextResponse } from "next/server";
import { readFileSync, writeFileSync, existsSync } from "fs";
import path from "path";

interface PixKey {
  id: string;
  tipo: "cpf" | "cnpj" | "email" | "telefone" | "aleatoria";
  chave: string;
  titular: string;
  banco: string;
  ativo: boolean;
  ordem: number;
}

interface PagamentoConfig {
  pix: {
    habilitado: boolean;
    chaves: PixKey[];
  };
  boleto: {
    habilitado: boolean;
  };
  cartao: {
    habilitado: boolean;
  };
}

const CONFIG_PATH = path.join(process.cwd(), "src/data/pagamentos.json");

const defaultConfig: PagamentoConfig = {
  pix: {
    habilitado: true,
    chaves: [],
  },
  boleto: {
    habilitado: false,
  },
  cartao: {
    habilitado: false,
  },
};

function loadConfig(): PagamentoConfig {
  try {
    if (existsSync(CONFIG_PATH)) {
      const data = readFileSync(CONFIG_PATH, "utf-8");
      return { ...defaultConfig, ...JSON.parse(data) };
    }
  } catch {}
  return defaultConfig;
}

function saveConfig(config: PagamentoConfig): void {
  writeFileSync(CONFIG_PATH, JSON.stringify(config, null, 2), "utf-8");
}

// GET — retorna config
export async function GET() {
  const config = loadConfig();
  return NextResponse.json(config);
}

// PUT — salva config
export async function PUT(request: Request) {
  try {
    const body = await request.json();
    saveConfig(body);
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Erro ao salvar" }, { status: 500 });
  }
}
