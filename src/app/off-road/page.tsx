import type { Metadata } from "next";
import prisma from "@/lib/prisma";
import {
  Container,
  Typography,
  Box,
  Grid,
  Paper,
} from "@mui/material";
import { CheckCircle, Star, Build, LocalShipping } from "@mui/icons-material";
import Link from "next/link";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import OffRoadHero from "@/components/off-road/OffRoadHero";
import OffRoadCta from "@/components/off-road/OffRoadCta";
import OffRoadNoProducts from "@/components/off-road/OffRoadNoProducts";

export const metadata: Metadata = {
  title: "Suspensão Off-Road e Lift 4x4 em Maringá | Car Crew Garage",
  description:
    "Especialistas em suspensão off-road, lift kits e elevação 4x4 em Maringá/PR. Trilha, lama, aventura — prepare sua picape com a Car Crew Garage.",
  alternates: { canonical: "/off-road" },
  openGraph: {
    title: "Suspensão Off-Road e Lift 4x4 — Car Crew Garage",
    description: "Prepare sua picape para qualquer terreno. Lift 4x4 em Maringá/PR.",
    type: "website",
    images: ["/banners/banner-offroad.png"],
  },
};

interface OffRoadProduct {
  id: number;
  nome: string;
  preco: number;
  imgUrl: string;
  parcelamento: number;
}

const offRoadSchema = {
  "@context": "https://schema.org",
  "@type": "Service",
  name: "Suspensão Off-Road e Lift 4x4",
  serviceType: "Suspensão Automotiva Off-Road",
  provider: {
    "@type": "LocalBusiness",
    name: "Car Crew Garage",
    address: {
      "@type": "PostalAddress",
      streetAddress: "Av. Dona Sophia Rasgulaeff, 2825",
      addressLocality: "Maringá",
      addressRegion: "PR",
      postalCode: "87047-300",
      addressCountry: "BR",
    },
    telephone: "+55-44-99813-3182",
  },
  areaServed: { "@type": "Country", name: "Brasil" },
  description:
    "Instalação de lift kits 4x4, suspensão off-road e preparação de picapes para trilha, lama e aventura. Atendimento em Maringá/PR e região.",
};

export default async function OffRoadPage() {
  let produtos: OffRoadProduct[] = [];
  try {
    const allProdutos = await prisma.produto.findMany({
      where: { ativo: true },
      take: 100,
    });

    const keywords = ["lift", "off", "road", "trilha", "4x4", "elevação", "suspensao a ar", "bolsa", "coilover", "rosca"];
    produtos = allProdutos
      .filter((p) => keywords.some((k) => p.nome.toLowerCase().includes(k)))
      .sort((a, b) => {
        // Prioridade: produtos com 'off', 'road', 'lift' no nome primeiro
        const pa = a.nome.toLowerCase();
        const pb = b.nome.toLowerCase();
        const scoreA = (pa.includes("off") ? 3 : 0) + (pa.includes("road") ? 3 : 0) + (pa.includes("lift") ? 3 : 0);
        const scoreB = (pb.includes("off") ? 3 : 0) + (pb.includes("road") ? 3 : 0) + (pb.includes("lift") ? 3 : 0);
        if (scoreA !== scoreB) return scoreB - scoreA;
        return a.nome.localeCompare(b.nome);
      })
      .slice(0, 16)
      .map((p) => ({
        id: p.id,
        nome: p.nome,
        preco: p.preco,
        imgUrl: p.imgUrl || "/produtos/placeholder.svg",
        parcelamento: p.parcelamento || 12,
      }));
  } catch {}

  const beneficios = [
    { icon: <Build sx={{ fontSize: 40, color: "#E65100" }} />, title: "Instalação Especializada", desc: "Equipe com mais de 10 anos de experiência em suspensão 4x4 e lift kits" },
    { icon: <CheckCircle sx={{ fontSize: 40, color: "#E65100" }} />, title: "Peças de Qualidade", desc: "Trabalhamos com as melhores marcas: BDS Suspension, Rough Country, Fabtech, Pro Comp" },
    { icon: <LocalShipping sx={{ fontSize: 40, color: "#E65100" }} />, title: "Entrega para todo Brasil", desc: "Enviamos peças para todo território nacional. Instalação em Maringá/PR" },
    { icon: <Star sx={{ fontSize: 40, color: "#E65100" }} />, title: "Garantia e Suporte", desc: "90 dias de garantia na mão de obra + garantia do fabricante nas peças" },
  ];

  const servicos = [
    "Lift kits 2\", 4\" e 6\"",
    "Suspensão independente 4x4",
    "Shocks de longo curso",
    "Molas de elevação reforçadas",
    "Braços de suspensão reforçados",
    "Bloqueios de diferencial",
    "Snorkel e preparação para lama",
    "Acessórios off-road (engates, guinchos)",
  ];

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(offRoadSchema) }}
      />
      <Box sx={{ display: "flex", flexDirection: "column", minHeight: "100vh" }}>
        <Header />

        <OffRoadHero />

        <Container maxWidth="lg" sx={{ flex: 1, py: 6 }}>
          <Typography variant="h3" sx={{ fontWeight: 700, mb: 1, color: "#1A1A1A" }}>
            Por que escolher a Car Crew Garage?
          </Typography>
          <Typography variant="body1" sx={{ color: "#666", mb: 5, fontSize: "1.05rem" }}>
            Mais de uma década preparando veículos para o off-road em Maringá e região
          </Typography>
          <Grid container spacing={3} sx={{ mb: 8 }}>
            {beneficios.map((b, i) => (
              <Grid size={{ xs: 12, sm: 6, md: 3 }} key={i}>
                <Paper sx={{ p: 3, borderRadius: 3, height: "100%", textAlign: "center", transition: "transform 0.2s", "&:hover": { transform: "translateY(-4px)" } }}>
                  <Box sx={{ mb: 2 }}>{b.icon}</Box>
                  <Typography variant="h6" sx={{ fontWeight: 700, mb: 1, color: "#1A1A1A" }}>{b.title}</Typography>
                  <Typography variant="body2" sx={{ color: "#666", lineHeight: 1.7 }}>{b.desc}</Typography>
                </Paper>
              </Grid>
            ))}
          </Grid>

          <Paper sx={{ p: { xs: 3, md: 5 }, borderRadius: 3, mb: 8, backgroundColor: "#1A1A1A", color: "#fff" }}>
            <Typography variant="h3" sx={{ fontWeight: 700, mb: 1 }}>
              Serviços Off-Road
            </Typography>
            <Typography variant="body1" sx={{ color: "#ccc", mb: 4 }}>
              Tudo o que sua picape precisa pra encarar qualquer terreno
            </Typography>
            <Grid container spacing={2}>
              {servicos.map((s, i) => (
                <Grid size={{ xs: 12, sm: 6, md: 3 }} key={i}>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                    <CheckCircle sx={{ color: "#E65100", fontSize: 24 }} />
                    <Typography variant="body1" sx={{ fontWeight: 500 }}>{s}</Typography>
                  </Box>
                </Grid>
              ))}
            </Grid>
          </Paper>

          <Box id="produtos-offroad">
          <Typography variant="h3" sx={{ fontWeight: 700, mb: 1, color: "#1A1A1A" }}>
            Produtos para Off-Road
          </Typography>
          <Typography variant="body1" sx={{ color: "#666", mb: 4 }}>
            Confira nossa seleção de peças off-road
          </Typography>

          {produtos.length === 0 ? (
            <OffRoadNoProducts />
          ) : (
            <Grid container spacing={3} sx={{ mb: 4 }}>
              {produtos.map((p) => (
                <Grid size={{ xs: 12, sm: 6, md: 3 }} key={p.id}>
                  <Link href={`/produto/${p.id}`} style={{ textDecoration: "none" }}>
                    <Paper sx={{ borderRadius: 3, overflow: "hidden", transition: "transform 0.2s", cursor: "pointer", "&:hover": { transform: "translateY(-4px)" } }}>
                      <Box component="img" src={p.imgUrl} alt={p.nome} sx={{ width: "100%", height: 180, objectFit: "cover" }} />
                      <Box sx={{ p: 2 }}>
                        <Typography variant="body2" sx={{ fontWeight: 600, color: "#1A1A1A", mb: 1, minHeight: 40 }}>{p.nome}</Typography>
                        <Typography variant="h6" sx={{ color: "#E65100", fontWeight: 700 }}>
                          R$ {p.preco.toFixed(2)}
                        </Typography>
                        <Typography variant="caption" sx={{ color: "#999" }}>
                          ou {p.parcelamento}x de R$ {(p.preco / p.parcelamento).toFixed(2)} sem juros
                        </Typography>
                      </Box>
                    </Paper>
                  </Link>
                </Grid>
              ))}
            </Grid>
          )}

          </Box>

          <OffRoadCta />
        </Container>

        <Footer />
      </Box>
    </>
  );
}
