import { NextRequest, NextResponse } from "next/server";
import { hash } from "bcryptjs";
import prisma from "@/lib/prisma";

/**
 * Cadastro de cliente.
 *
 * Antes gravava em `src/data/usuarios.json` enquanto o login lia
 * `prisma.user` — quem se cadastrava não conseguia entrar. E a senha era
 * salva em texto puro.
 *
 * Duas correções: grava no Prisma e com hash. Nunca cria admin: `admin` só
 * é atribuído por um admin existente ou por seed. (A regra antiga "primeiro
 * usuário vira admin" era escalada de privilégio: quem se cadastrasse
 * primeiro em um banco vazio virava dono do painel.)
 */
export async function POST(req: NextRequest) {
  try {
    const { nome, email, senha } = await req.json();

    if (!nome || !email || !senha) {
      return NextResponse.json(
        { error: "Todos os campos são obrigatórios" },
        { status: 400 }
      );
    }

    if (!String(email).includes("@")) {
      return NextResponse.json({ error: "Email inválido" }, { status: 400 });
    }

    if (String(senha).length < 8) {
      return NextResponse.json(
        { error: "Senha deve ter no mínimo 8 caracteres" },
        { status: 400 }
      );
    }

    const emailNormalizado = String(email).toLowerCase().trim();

    const existente = await prisma.user.findUnique({
      where: { email: emailNormalizado },
    });

    if (existente) {
      return NextResponse.json({ error: "Email já cadastrado" }, { status: 409 });
    }

    await prisma.user.create({
      data: {
        name: nome,
        email: emailNormalizado,
        senha: await hash(String(senha), 12),
        admin: false,
      },
    });

    return NextResponse.json({ message: "Conta criada com sucesso" }, { status: 201 });
  } catch (error) {
    console.error("Erro ao registrar:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}
