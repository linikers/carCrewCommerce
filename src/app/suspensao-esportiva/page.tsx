import type { Metadata } from "next";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { Build, CheckCircle, LocalShipping, Star } from "@mui/icons-material";
import CategoriaLanding, { CategoriaProduto } from "@/components/categorias/CategoriaLanding";
import { serviceSchema, itemListSchema, breadcrumbSchema } from "@/lib/seo-schemas";
import { lerConteudoLp } from "@/lib/lp-conteudo";

const SLUG = "suspensao-esportiva";

// Ícones ficam no código (não são texto); o texto vem do painel.
const ICONES = [Build, CheckCircle, LocalShipping, Star];

export async function generateMetadata(): Promise<Metadata> {
  const conteudo = await lerConteudoLp(SLUG);

  return {
    title: { absolute: conteudo.seoTitulo },
    description: conteudo.seoDescricao,
    alternates: { canonical: "/suspensao-esportiva" },
    openGraph: {
      title: conteudo.seoTitulo,
      description: conteudo.seoDescricao,
      type: "website",
      images: ["/og-image.jpg"],
    },
  };
}
const SLUGS = ["amortecedores", "kits"];

export const dynamic = "force-dynamic";

export default async function SuspensaoEsportivaPage() {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://carcrew.com.br";
  const conteudo = await lerConteudoLp(SLUG);
  const sessao = await getServerSession(authOptions);
  const admin = Boolean((sessao?.user as { admin?: boolean } | undefined)?.admin);
  let produtos: CategoriaProduto[] = [];

  try {
    const db = await prisma.produto.findMany({
      where: { ativo: true, categorySlug: { in: SLUGS } },
      orderBy: { id: "asc" },
    });
    produtos = db.map((p) => ({
      id: p.id,
      nome: p.nome,
      preco: p.preco,
      imgUrl: p.imgUrl || "/produtos/placeholder.svg",
      parcelamento: p.parcelamento || 12,
    }));
  } catch (error) {
    console.error("Erro ao buscar produtos de suspensão esportiva:", error);
  }

  const schema = [
    serviceSchema({
      name: "Suspensão Esportiva em Maringá",
      serviceType: "Suspensão Esportiva Automotiva",
      description:
        "Amortecedores esportivos e kits de suspensão para mais estabilidade, menos rolagem de carroceria e dirigibilidade esportiva. Venda e instalação em Maringá/PR e região.",
      url: `${siteUrl}/suspensao-esportiva`,
    }),
    itemListSchema(produtos, siteUrl),
    breadcrumbSchema([
      { name: "Home", url: siteUrl },
      { name: "Suspensão Esportiva", url: `${siteUrl}/suspensao-esportiva` },
    ]),
  ];

  return (
    <>
      {schema.map((s, i) => (
        <script
          key={i}
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(s) }}
        />
      ))}
      <CategoriaLanding
        h1={conteudo.titulo}
        intro={conteudo.intro}
        produtos={produtos}
        beneficios={conteudo.beneficios.map((b, i) => {
          const Icone = ICONES[i % ICONES.length];
          return {
            icon: <Icone sx={{ fontSize: 40, color: "#E65100" }} />,
            title: b.titulo,
            desc: b.texto,
          };
        })}
        servicos={conteudo.servicos}
        ctaTitle={conteudo.ctaTitulo}
        ctaDesc={conteudo.ctaTexto}
        whatsMessage={conteudo.whatsMensagem}
        editarHref={admin ? `/admin/lp/${SLUG}` : undefined}
      />
    </>
  );
}
