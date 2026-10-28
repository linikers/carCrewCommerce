import type { Metadata } from "next";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { Build, CheckCircle, LocalShipping, Star } from "@mui/icons-material";
import CategoriaLanding, { CategoriaProduto } from "@/components/categorias/CategoriaLanding";
import { serviceSchema, itemListSchema, breadcrumbSchema } from "@/lib/seo-schemas";
import { lerConteudoLp } from "@/lib/lp-conteudo";
import { lerContatoEmpresaCache } from "@/lib/empresa";

const SLUG = "rebaixamento";

// Ícones ficam no código (não são texto); o texto vem do painel.
const ICONES = [Build, CheckCircle, LocalShipping, Star];

export async function generateMetadata(): Promise<Metadata> {
  const conteudo = await lerConteudoLp(SLUG);

  return {
    title: { absolute: conteudo.seoTitulo },
    description: conteudo.seoDescricao,
    alternates: { canonical: "/rebaixamento" },
    openGraph: {
      title: conteudo.seoTitulo,
      description: conteudo.seoDescricao,
      type: "website",
      images: ["/og-image.jpg"],
    },
  };
}
const SLUGS = ["calcos-antirruido", "kits", "bandejas", "pontas-de-eixo"];

export const dynamic = "force-dynamic";

export default async function RebaixamentoPage() {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://carcrew.com.br";
  const conteudo = await lerConteudoLp(SLUG);
  const contato = await lerContatoEmpresaCache();
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
    console.error("Erro ao buscar produtos de rebaixamento:", error);
  }

  const schema = [
    serviceSchema({
      name: "Rebaixados em Maringá",
      serviceType: "Rebaixamento de Suspensão Automotiva",
      description:
        "Peças e instalação para rebaixar carro: calços antirruído, kits de rebaixamento, bandejas reforçadas e pontas de eixo. Deixe seu carro na altura ideal com segurança. Atendimento em Maringá/PR e região.",
      url: `${siteUrl}/rebaixamento`,
      empresa: contato,
    }),
    itemListSchema(produtos, siteUrl),
    breadcrumbSchema([
      { name: "Home", url: siteUrl },
      { name: "Rebaixamento", url: `${siteUrl}/rebaixamento` },
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
