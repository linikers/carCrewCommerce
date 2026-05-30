// Seed script — migra dados dos JSONs pro PostgreSQL
// Uso: npx prisma db seed
import { PrismaClient } from "../src/generated/prisma/client.js";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import { readFileSync, existsSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const DATA_PATH = join(__dirname, "..", "src", "data");

function readJSON(filename: string) {
  const filePath = join(DATA_PATH, filename);
  if (!existsSync(filePath)) return [];
  return JSON.parse(readFileSync(filePath, "utf-8"));
}

async function main() {
  const url = process.env.POSTGRES_PRISMA_URL;
  if (!url) {
    console.error("POSTGRES_PRISMA_URL não configurada");
    process.exit(1);
  }

  const pool = new Pool({ connectionString: url });
  const adapter = new PrismaPg(pool);
  const prisma = new PrismaClient({ adapter });

  console.log("🌱 Seeding database...");

  // 1. Categorias
  const categorias = readJSON("categorias.json");
  for (const cat of categorias) {
    await prisma.categoria.upsert({
      where: { slug: cat.slug },
      update: {
        nome: cat.nome,
        icone: cat.icone || "🔧",
        descricao: cat.descricao || null,
        ordem: cat.ordem ?? 0,
      },
      create: {
        slug: cat.slug,
        nome: cat.nome,
        icone: cat.icone || "🔧",
        descricao: cat.descricao || null,
        ordem: cat.ordem ?? 0,
      },
    });
  }
  console.log(`  ✅ ${categorias.length} categorias`);

  // 2. Produtos
  const produtos = readJSON("produtos.json");
  for (const p of produtos) {
    await prisma.produto.upsert({
      where: { id: p.id },
      update: {
        nome: p.nome,
        descricao: p.descricao || null,
        preco: p.preco,
        imgUrl: p.imgUrl || null,
        categorySlug: p.category,
        parcelamento: p.parcelamento ?? 1,
        estoque: p.estoque ?? 0,
        veiculos: p.veiculos || [],
        ativo: p.ativo ?? true,
        criadoEm: p.criadoEm ? new Date(p.criadoEm) : new Date(),
      },
      create: {
        id: p.id,
        nome: p.nome,
        descricao: p.descricao || null,
        preco: p.preco,
        imgUrl: p.imgUrl || null,
        categorySlug: p.category,
        parcelamento: p.parcelamento ?? 1,
        estoque: p.estoque ?? 0,
        veiculos: p.veiculos || [],
        ativo: p.ativo ?? true,
        criadoEm: p.criadoEm ? new Date(p.criadoEm) : new Date(),
      },
    });
  }
  console.log(`  ✅ ${produtos.length} produtos`);

  // 3. Banners
  const banners = readJSON("banners.json");
  for (const b of banners) {
    await prisma.banner.upsert({
      where: { id: b.id },
      update: {
        titulo: b.titulo,
        subtitulo: b.subtitulo || null,
        imgDesktop: b.imgDesktop || null,
        imgMobile: b.imgMobile || null,
        link: b.link || null,
        corFundo: b.corFundo || "#1A1A1A",
        corTexto: b.corTexto || "#ffffff",
        ativo: b.ativo ?? true,
        ordem: b.ordem ?? 0,
      },
      create: {
        id: b.id,
        titulo: b.titulo,
        subtitulo: b.subtitulo || null,
        imgDesktop: b.imgDesktop || null,
        imgMobile: b.imgMobile || null,
        link: b.link || null,
        corFundo: b.corFundo || "#1A1A1A",
        corTexto: b.corTexto || "#ffffff",
        ativo: b.ativo ?? true,
        ordem: b.ordem ?? 0,
      },
    });
  }
  console.log(`  ✅ ${banners.length} banners`);

  // 4. Usuários
  const usuarios = readJSON("usuarios.json");
  for (const u of usuarios) {
    await prisma.user.upsert({
      where: { email: u.email },
      update: {
        name: u.nome,
        senha: u.senha,
        admin: u.admin ?? false,
        criadoEm: u.criadoEm ? new Date(u.criadoEm) : new Date(),
      },
      create: {
        name: u.nome,
        email: u.email,
        senha: u.senha,
        admin: u.admin ?? false,
        criadoEm: u.criadoEm ? new Date(u.criadoEm) : new Date(),
      },
    });
  }
  console.log(`  ✅ ${usuarios.length} usuários`);

  await prisma.$disconnect();
  console.log("🎉 Seed completo!");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
