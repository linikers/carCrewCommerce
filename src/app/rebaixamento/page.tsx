import type { Metadata } from "next";
import prisma from "@/lib/prisma";
import { Build, CheckCircle, LocalShipping, Star, Straighten } from "@mui/icons-material";
import CategoriaLanding, { CategoriaProduto } from "@/components/categorias/CategoriaLanding";
import { serviceSchema, itemListSchema, breadcrumbSchema } from "@/lib/seo-schemas";

export const metadata: Metadata = {
  title: {
    absolute: "Rebaixamento de Carro em Maringá | Car Crew Garage",
  },
  description:
    "Tudo para rebaixar seu carro em Maringá-PR: calços antirruído, kits de rebaixamento, bandejas e pontas de eixo. Deixe seu carro na altura ideal com segurança. Venda e instalação.",
  alternates: { canonical: "/rebaixamento" },
  openGraph: {
    title: "Rebaixamento de Carro em Maringá — Car Crew Garage",
    description: "Calços antirruído, kits, bandejas e pontas de eixo para rebaixar seu carro com segurança. Venda e instalação em Maringá-PR.",
    type: "website",
    images: ["/og-image.jpg"],
  },
};

const SLUGS = ["calcos-antirruido", "kits", "bandejas", "pontas-de-eixo"];

export const dynamic = "force-dynamic";

export default async function RebaixamentoPage() {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://carcrew.com.br";
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
      name: "Rebaixamento de Carro em Maringá",
      serviceType: "Rebaixamento de Suspensão Automotiva",
      description:
        "Peças e instalação para rebaixar carro: calços antirruído, kits de rebaixamento, bandejas reforçadas e pontas de eixo. Deixe seu carro na altura ideal com segurança. Atendimento em Maringá/PR e região.",
      url: `${siteUrl}/rebaixamento`,
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
        h1="Rebaixamento de Carro em Maringá"
        intro={[
          "Rebaixar o carro é o primeiro passo pra deixar o visual com a cara do dono — mas precisa ser feito com peças certas e instalação caprichada. Na Car Crew Garage você encontra calços antirruído, kits de rebaixamento, bandejas reforçadas e pontas de eixo para rebaixar com segurança e sem barulho.",
          "Atendemos os principais modelos do mercado brasileiro: Gol, Voyage, Saveiro, Corsa, Celta, Prisma, Civic, Corolla e muito mais. Seja rebaixamento leve ou projeto mais baixo, nossa equipe em Maringá-PR monta o conjunto ideal pro seu carro — e enviamos peças para todo o Brasil.",
        ]}
        produtos={produtos}
        beneficios={[
          { icon: <Build sx={{ fontSize: 40, color: "#E65100" }} />, title: "Instalação Especializada", desc: "Equipe com mais de 10 anos de experiência em rebaixamento" },
          { icon: <CheckCircle sx={{ fontSize: 40, color: "#E65100" }} />, title: "Peças de Qualidade", desc: "Calços, bandejas e pontas de eixo de marcas confiáveis" },
          { icon: <LocalShipping sx={{ fontSize: 40, color: "#E65100" }} />, title: "Entrega para todo Brasil", desc: "Enviamos peças para todo território nacional. Instalação em Maringá/PR" },
          { icon: <Star sx={{ fontSize: 40, color: "#E65100" }} />, title: "Garantia e Suporte", desc: "90 dias de garantia na mão de obra + garantia do fabricante nas peças" },
        ]}
        servicos={[
          "Calços antirruído (coxim)",
          "Kits completos de rebaixamento",
          "Bandejas reforçadas",
          "Pontas de eixo",
          "Rebaixamento a mola",
          "Rebaixamento a calço",
          "Alinhamento e balanceamento",
          "Projetos super baixos",
        ]}
        ctaTitle="Quer rebaixar seu carro com segurança?"
        ctaDesc="Fale com nossos especialistas e receba o orçamento do seu projeto. Atendemos em Maringá-PR e enviamos para todo o Brasil."
        whatsMessage="Olá! Quero um orçamento de rebaixamento para meu carro."
      />
    </>
  );
}
