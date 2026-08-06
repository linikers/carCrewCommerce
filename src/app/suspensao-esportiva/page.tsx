import type { Metadata } from "next";
import prisma from "@/lib/prisma";
import { Build, CheckCircle, LocalShipping, Star, Speed } from "@mui/icons-material";
import CategoriaLanding, { CategoriaProduto } from "@/components/categorias/CategoriaLanding";
import { serviceSchema, itemListSchema, breadcrumbSchema } from "@/lib/seo-schemas";

export const metadata: Metadata = {
  title: {
    absolute: "Suspensão Esportiva em Maringá | Car Crew Garage",
  },
  description:
    "Suspensão esportiva em Maringá-PR: amortecedores esportivos e kits para mais estabilidade e dirigibilidade. Melhore o comportamento do seu carro. Venda e instalação especializada.",
  alternates: { canonical: "/suspensao-esportiva" },
  openGraph: {
    title: "Suspensão Esportiva em Maringá — Car Crew Garage",
    description: "Amortecedores esportivos e kits para um carro mais estável e divertido de dirigir. Venda e instalação em Maringá-PR.",
    type: "website",
    images: ["/og-image.jpg"],
  },
};

const SLUGS = ["amortecedores", "kits"];

export const dynamic = "force-dynamic";

export default async function SuspensaoEsportivaPage() {
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
        h1="Suspensão Esportiva em Maringá"
        intro={[
          "Suspensão esportiva muda completamente o comportamento do carro: menos rolagem nas curvas, resposta mais direta e uma dirigibilidade que combina com quem gosta de dirigir. Na Car Crew Garage você encontra amortecedores esportivos e kits de suspensão para deixar seu carro mais firme e estável.",
          "Trabalhamos com opções para os principais modelos do mercado — de hatches compactos a sedans — com instalação especializada em Maringá-PR e envio para todo o Brasil. Se o objetivo é performance no asfalto ou simplesmente um visual mais esportivo, temos a solução certa.",
        ]}
        produtos={produtos}
        beneficios={[
          { icon: <Build sx={{ fontSize: 40, color: "#E65100" }} />, title: "Instalação Especializada", desc: "Equipe com mais de 10 anos de experiência em suspensão esportiva" },
          { icon: <CheckCircle sx={{ fontSize: 40, color: "#E65100" }} />, title: "Peças de Qualidade", desc: "Amortecedores e kits de marcas confiáveis do mercado" },
          { icon: <LocalShipping sx={{ fontSize: 40, color: "#E65100" }} />, title: "Entrega para todo Brasil", desc: "Enviamos peças para todo território nacional. Instalação em Maringá/PR" },
          { icon: <Star sx={{ fontSize: 40, color: "#E65100" }} />, title: "Garantia e Suporte", desc: "90 dias de garantia na mão de obra + garantia do fabricante nas peças" },
        ]}
        servicos={[
          "Amortecedores esportivos",
          "Kits de suspensão",
          "Molas esportivas",
          "Buchas e coxins",
          "Revisão completa da suspensão",
          "Alinhamento e balanceamento",
          "Ajuste de altura",
          "Setup para track day",
        ]}
        ctaTitle="Quer deixar seu carro mais estável e esportivo?"
        ctaDesc="Fale com nossos especialistas e receba o orçamento do seu projeto. Atendemos em Maringá-PR e enviamos para todo o Brasil."
        whatsMessage="Olá! Quero um orçamento de suspensão esportiva para meu carro."
      />
    </>
  );
}
