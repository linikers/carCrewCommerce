import type { Metadata } from "next";
import prisma from "@/lib/prisma";
import { lerPoliticaPreco, precoSiteDe } from "@/lib/politica-preco";
import { Box, Container, Typography } from "@mui/material";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import ProdutoGrade from "@/components/ProdutoGrade";
import type { Produto } from "@/types";

export const dynamic = "force-dynamic";

/**
 * Busca do site (#163).
 *
 * Antes existia só na home: digitar em qualquer outra página não fazia nada, e
 * `/categoria/x?q=y` era ignorado. Aqui a busca vale para o catálogo inteiro e
 * a categoria mantém o recorte com o próprio `?q=`.
 */

function normalizar(texto: string) {
  return texto
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

async function buscarProdutos(termo: string): Promise<Produto[]> {
  const alvo = normalizar(termo.trim());
  if (!alvo) return [];

  const politicaPreco = await lerPoliticaPreco();
  // O filtro é em memória (catálogo de ~130 peças): `contains` do Postgres não
  // ignora acento, e "amortecedor" precisa achar "Amortecedor".
  const brutos = await prisma.produto.findMany({
    where: { ativo: true },
    orderBy: [{ destaque: "desc" }, { ordem: "asc" }, { id: "asc" }],
    include: { precosCanal: true },
  });

  return brutos
    .filter((p) =>
      [p.nome, p.sku ?? "", p.descricao ?? ""].some((campo) =>
        normalizar(campo).includes(alvo)
      )
    )
    .map((p) => ({
      id: p.id,
      nome: p.nome,
      descricao: p.descricao || "",
      preco: precoSiteDe(p, politicaPreco),
      descontoPercent: p.descontoPercent ?? 0,
      imgUrl: p.imgUrl || "/produtos/placeholder.svg",
      category: p.categorySlug as Produto["category"],
      parcelamento: p.parcelamento || 12,
      veiculos: p.veiculos || [],
    }));
}

export async function generateMetadata(props: {
  searchParams: Promise<{ q?: string }>;
}): Promise<Metadata> {
  const { q } = await props.searchParams;
  return {
    title: q ? `Busca: ${q}` : "Buscar peças",
    robots: { index: false, follow: true },
  };
}

export default async function BuscaPage(props: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await props.searchParams;
  const termo = (q ?? "").trim();
  const produtos = await buscarProdutos(termo);

  return (
    <Box sx={{ display: "flex", flexDirection: "column", minHeight: "100vh" }}>
      <Header initialQuery={termo} key={`header-${termo}`} />

      <Container maxWidth="lg" sx={{ flex: 1, py: { xs: 3, md: 5 } }}>
        <Box
          component="nav"
          aria-label="Você está em"
          sx={{ display: "flex", gap: 0.75, alignItems: "center", mb: 1 }}
        >
          <Box
            component="a"
            href="/"
            sx={{ color: "#666", fontSize: "0.875rem", textDecoration: "none", "&:hover": { color: "primary.main", textDecoration: "underline" } }}
          >
            Home
          </Box>
          <Typography component="span" sx={{ color: "#bbb", fontSize: "0.875rem" }}>/</Typography>
          <Typography component="span" aria-current="page" sx={{ color: "#666", fontSize: "0.875rem", fontWeight: 600 }}>
            Busca
          </Typography>
        </Box>

        <Typography component="h1" variant="h4" sx={{ fontWeight: 800, color: "#1A1A1A", mb: 1 }}>
          {termo ? `Resultados para “${termo}”` : "Buscar peças"}
        </Typography>

        <Typography variant="body2" sx={{ color: "#666", mb: 3 }}>
          {termo
            ? `${produtos.length} ${produtos.length === 1 ? "peça encontrada" : "peças encontradas"} em todo o catálogo.`
            : "Digite o nome da peça, o código (SKU) ou o modelo do carro no campo de busca acima."}
        </Typography>

        {termo && produtos.length === 0 ? (
          <Box sx={{ py: 4 }}>
            <Typography variant="body1" sx={{ fontWeight: 600, color: "#1A1A1A", mb: 0.5 }}>
              Nenhuma peça encontrada.
            </Typography>
            <Typography variant="body2" sx={{ color: "#666" }}>
              Tente um termo mais curto (ex.: “bolsa”, “compressor”) ou fale com a gente no WhatsApp — buscamos a peça para você.
            </Typography>
          </Box>
        ) : (
          <ProdutoGrade produtos={produtos} />
        )}
      </Container>

      <Footer />
    </Box>
  );
}
