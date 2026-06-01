// API pública — Produtos
// Retorna dados do JSON + dados do banco (Prisma)
// Só mostra produtos com ativo=true (não publicados ficam ocultos)

import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { readFileSync, existsSync } from "fs";
import path from "path";

interface ProdutoJson {
  id: number;
  nome: string;
  descricao: string;
  preco: number;
  imgUrl: string;
  category: string;
  parcelamento: number;
  veiculos?: string[];
  ativo?: boolean;
}

// Carrega produtos PUBLICÁVEIS do JSON (ativo != false)
function carregarProdutosJson(): ProdutoJson[] {
  try {
    const filePath = path.join(process.cwd(), "src/data/produtos.json");
    if (!existsSync(filePath)) return [];
    const raw = readFileSync(filePath, "utf-8");
    const todos: ProdutoJson[] = JSON.parse(raw);
    // Filtra só os publicados (ativo não é false)
    return todos.filter((p) => p.ativo !== false);
  } catch {
    return [];
  }
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    const category = searchParams.get("category");
    const veiculo = searchParams.get("veiculo");
    const search = searchParams.get("search");

    // Tenta buscar do banco
    const where: any = { ativo: true };
    if (id) where.id = Number(id);
    if (category) where.categorySlug = category;
    if (veiculo) where.veiculos = { has: veiculo };
    if (search) {
      where.OR = [
        { nome: { contains: search, mode: "insensitive" } },
        { descricao: { contains: search, mode: "insensitive" } },
      ];
    }

    const dbProdutos = await prisma.produto.findMany({
      where,
      orderBy: { criadoEm: "desc" },
    });

    const dbData = dbProdutos.map((p) => ({
      id: p.id,
      nome: p.nome,
      descricao: p.descricao || "",
      preco: p.preco,
      imgUrl: p.imgUrl || "/produtos/placeholder.svg",
      category: p.categorySlug,
      parcelamento: p.parcelamento,
      veiculos: p.veiculos,
    }));

    // Carrega fallback do JSON (já filtrado por ativo)
    const jsonProdutos = carregarProdutosJson();

    // Filtra JSON pelos mesmos critérios
    let jsonFiltered = [...jsonProdutos];
    if (category) {
      jsonFiltered = jsonFiltered.filter((p) => p.category === category);
    }
    if (veiculo) {
      jsonFiltered = jsonFiltered.filter(
        (p) => p.veiculos && p.veiculos.includes(veiculo)
      );
    }
    if (search) {
      const s = search.toLowerCase();
      jsonFiltered = jsonFiltered.filter(
        (p) =>
          p.nome.toLowerCase().includes(s) ||
          p.descricao.toLowerCase().includes(s)
      );
    }

    // Se pediu um ID específico
    if (id) {
      if (dbData.length > 0) return NextResponse.json(dbData);
      const json = jsonFiltered.filter((p) => p.id === Number(id));
      if (json.length > 0) return NextResponse.json(json);
      return NextResponse.json([]);
    }

    // Combina: banco primeiro, depois JSON (evita duplicar IDs)
    const dbIds = new Set(dbData.map((p) => p.id));
    const combined = [
      ...dbData,
      ...jsonFiltered.filter((p) => !dbIds.has(p.id)),
    ];

    return NextResponse.json(combined);
  } catch {
    // Sem banco — retorna só do JSON já filtrado por ativo
    const jsonProdutos = carregarProdutosJson();

    try {
      const { searchParams } = new URL(req.url);
      const id = searchParams.get("id");
      const category = searchParams.get("category");
      const veiculo = searchParams.get("veiculo");
      const search = searchParams.get("search");

      let filtered = [...jsonProdutos];
      if (id) filtered = filtered.filter((p) => p.id === Number(id));
      if (category) filtered = filtered.filter((p) => p.category === category);
      if (veiculo)
        filtered = filtered.filter(
          (p) => p.veiculos && p.veiculos.includes(veiculo)
        );
      if (search) {
        const s = search.toLowerCase();
        filtered = filtered.filter(
          (p) =>
            p.nome.toLowerCase().includes(s) ||
            p.descricao.toLowerCase().includes(s)
        );
      }

      return NextResponse.json(filtered);
    } catch {
      return NextResponse.json(jsonProdutos);
    }
  }
}
