import type { Metadata } from "next";
import prisma from "@/lib/prisma";
import { Build, CheckCircle, LocalShipping, Star, Air } from "@mui/icons-material";
import CategoriaLanding, { CategoriaProduto } from "@/components/categorias/CategoriaLanding";
import { serviceSchema, itemListSchema, breadcrumbSchema } from "@/lib/seo-schemas";

export const metadata: Metadata = {
  title: {
    absolute: "Suspensão a Ar em Maringá | Car Crew Garage",
  },
  description:
    "Sistema de suspensão pneumática em Maringá-PR: bolsas de ar, compressores e controles bluetooth. Rebaixe ou nivele seu carro com conforto. Venda e instalação especializada.",
  alternates: { canonical: "/suspensao-a-ar" },
  openGraph: {
    title: "Suspensão a Ar em Maringá — Car Crew Garage",
    description: "Bolsas de ar, compressores e controles para suspensão pneumática. Venda e instalação em Maringá-PR.",
    type: "website",
    images: ["/og-image.jpg"],
  },
};

const SLUGS = ["bolsas-de-ar", "compressores", "controles"];

export const dynamic = "force-dynamic";

export default async function SuspensaoArPage() {
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
    console.error("Erro ao buscar produtos de suspensão a ar:", error);
  }

  const schema = [
    serviceSchema({
      name: "Suspensão a Ar em Maringá",
      serviceType: "Suspensão Pneumática Automotiva",
      description:
        "Venda e instalação de sistemas de suspensão a ar: bolsas de ar, compressores e controles bluetooth. Rebaixamento com conforto e nivelamento para qualquer veículo. Atendimento em Maringá/PR e região.",
      url: `${siteUrl}/suspensao-a-ar`,
    }),
    itemListSchema(produtos, siteUrl),
    breadcrumbSchema([
      { name: "Home", url: siteUrl },
      { name: "Suspensão a Ar", url: `${siteUrl}/suspensao-a-ar` },
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
        h1="Suspensão a Ar em Maringá"
        intro={[
          "A suspensão a ar (ou suspensão pneumática) é a escolha de quem quer rebaixar o carro sem abrir mão do conforto — ou nivelar a altura do veículo em segundos, no controle bluetooth. Na Car Crew Garage você encontra bolsas de ar, compressores e controles das melhores marcas, com instalação especializada em Maringá-PR.",
          "Trabalhamos com bolsas de ar para os projetos mais baixos, compressores de alta vazão e controles bluetooth que permitem ajustar cada eixo separadamente. Atendemos clientes de Maringá, Sarandi, Marialva, Cianorte e todo o Brasil com envio seguro para qualquer estado.",
        ]}
        produtos={produtos}
        beneficios={[
          { icon: <Build sx={{ fontSize: 40, color: "#E65100" }} />, title: "Instalação Especializada", desc: "Equipe experiente em sistema pneumático e projetos super baixos" },
          { icon: <CheckCircle sx={{ fontSize: 40, color: "#E65100" }} />, title: "Peças de Qualidade", desc: "Bolsas, compressores e válvulas de marcas confiáveis do mercado" },
          { icon: <LocalShipping sx={{ fontSize: 40, color: "#E65100" }} />, title: "Entrega para todo Brasil", desc: "Enviamos peças para todo território nacional. Instalação em Maringá/PR" },
          { icon: <Star sx={{ fontSize: 40, color: "#E65100" }} />, title: "Garantia e Suporte", desc: "90 dias de garantia na mão de obra + garantia do fabricante nas peças" },
        ]}
        servicos={[
          "Projetos super baixos (bagged)",
          "Nivelamento por eixo",
          "Compressores e reservatórios",
          "Válvulas e mangueiras",
          "Controle bluetooth",
          "Suspensão mista (ar + mola)",
          "Reparos e manutenção",
          "Ajuste de altura em segundos",
        ]}
        ctaTitle="Quer rebaixar ou nivelar seu carro com suspensão a ar?"
        ctaDesc="Fale com nossos especialistas e receba o orçamento do seu projeto. Atendemos em Maringá-PR e enviamos para todo o Brasil."
        whatsMessage="Olá! Quero um orçamento de suspensão a ar para meu carro."
      />
    </>
  );
}
