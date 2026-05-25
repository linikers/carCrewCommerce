import { NextRequest, NextResponse } from "next/server";
import { readFileSync, writeFileSync, existsSync } from "fs";
import path from "path";

const DATA_PATH = path.join(process.cwd(), "src/data/usuarios.json");

interface Usuario {
  nome: string;
  email: string;
  senha: string;
  admin: boolean;
  criadoEm: string;
}

function lerUsuarios(): Usuario[] {
  try {
    if (!existsSync(DATA_PATH)) return [];
    const raw = readFileSync(DATA_PATH, "utf-8");
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

function salvarUsuarios(usuarios: Usuario[]) {
  writeFileSync(DATA_PATH, JSON.stringify(usuarios, null, 2));
}

export async function POST(req: NextRequest) {
  try {
    const { nome, email, senha } = await req.json();

    if (!nome || !email || !senha) {
      return NextResponse.json(
        { error: "Todos os campos são obrigatórios" },
        { status: 400 }
      );
    }

    if (!email.includes("@")) {
      return NextResponse.json(
        { error: "Email inválido" },
        { status: 400 }
      );
    }

    if (senha.length < 6) {
      return NextResponse.json(
        { error: "Senha deve ter no mínimo 6 caracteres" },
        { status: 400 }
      );
    }

    const usuarios = lerUsuarios();

    // Verifica se email já existe
    if (usuarios.find((u) => u.email === email)) {
      return NextResponse.json(
        { error: "Email já cadastrado" },
        { status: 409 }
      );
    }

    // Primeiro usuário vira admin
    const isAdmin = usuarios.length === 0;

    const novoUsuario: Usuario = {
      nome,
      email,
      senha,
      admin: isAdmin,
      criadoEm: new Date().toISOString(),
    };

    salvarUsuarios([...usuarios, novoUsuario]);

    return NextResponse.json({
      message: "Conta criada com sucesso",
      admin: isAdmin,
    });
  } catch (error) {
    console.error("Erro ao registrar:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}
