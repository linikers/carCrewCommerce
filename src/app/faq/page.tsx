import type { Metadata } from "next";
import {
  Container,
  Typography,
  Box,
  Paper,
  Accordion,
  AccordionSummary,
  AccordionDetails,
} from "@mui/material";
import { ExpandMore, WhatsApp } from "@mui/icons-material";
import Header from "@/components/Header";
import { lerContatoEmpresaCache } from "@/lib/empresa";
import { lerFaqPublico } from "@/lib/faq-conteudo";
import Footer from "@/components/Footer";

export const metadata: Metadata = {
  title: "Dúvidas Frequentes — Suspensão Automotiva | Car Crew Garage",
  description: "Respostas sobre suspensão a ar, fixa, rosca, instalação, frete, formas de pagamento e garantia. Car Crew Garage — oficina especializada em Maringá/PR.",
  alternates: { canonical: "/faq" },
  openGraph: {
    title: "FAQ — Car Crew Garage",
    description: "Tire suas dúvidas sobre suspensão automotiva com a Car Crew Garage.",
    type: "website",
  },
};

export const dynamic = "force-dynamic";

export default async function FaqPage() {
  const contato = await lerContatoEmpresaCache();

  // O telefone vem de "Minha empresa": o texto guarda um marcador para não
  // repetir o número em cada resposta.
  // Conteúdo do painel (/admin/faq); o texto do código é o padrão quando não
  // existe nada salvo.
  const publicados = await lerFaqPublico();
  const itens = publicados.map((f) => ({
    question: f.pergunta,
    answer: f.resposta.replaceAll("{{telefone}}", contato.telefoneFormatado),
  }));

  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: itens.map((f) => ({
      "@type": "Question",
      name: f.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: f.answer,
      },
    })),
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />
      <Box sx={{ display: "flex", flexDirection: "column", minHeight: "100vh" }}>
        <Header />

        <Container maxWidth="md" sx={{ flex: 1, py: 6 }}>
          <Typography
            component="h1"
            variant="h3"
            sx={{ fontWeight: 700, mb: 2, color: "#1A1A1A", textAlign: "center" }}
          >
            Dúvidas Frequentes
          </Typography>
          <Typography
            variant="body1"
            sx={{ color: "#666", textAlign: "center", mb: 6, fontSize: "1.1rem" }}
          >
            Tudo o que você precisa saber sobre suspensão automotiva, instalação, pagamento e entrega
          </Typography>

          <Box>
            {itens.map((item, idx) => (
              <Accordion
                key={idx}
                sx={{
                  mb: 1.5,
                  borderRadius: 2,
                  "&:before": { display: "none" },
                  boxShadow: "0 1px 3px rgba(0,0,0,0.08)",
                }}
              >
                <AccordionSummary
                  expandIcon={<ExpandMore />}
                  sx={{
                    "& .MuiAccordionSummary-content": {
                      my: 1.5,
                      fontWeight: 600,
                      color: "#1A1A1A",
                    },
                  }}
                >
                  {item.question}
                </AccordionSummary>
                <AccordionDetails>
                  <Typography
                    variant="body1"
                    sx={{ color: "#555", lineHeight: 1.8 }}
                  >
                    {item.answer}
                  </Typography>
                </AccordionDetails>
              </Accordion>
            ))}
          </Box>

          <Paper
            sx={{
              mt: 6,
              p: 4,
              borderRadius: 3,
              textAlign: "center",
              backgroundColor: "#1A1A1A",
              color: "#fff",
            }}
          >
            <Typography variant="h5" sx={{ fontWeight: 700, mb: 1 }}>
              Não encontrou sua dúvida?
            </Typography>
            <Typography variant="body1" sx={{ color: "#ccc", mb: 3 }}>
              Nossa equipe responde em até 5 minutos pelo WhatsApp
            </Typography>
            <Box
              component="a"
              href={contato.whatsapp}
              target="_blank"
              sx={{
                display: "inline-flex",
                alignItems: "center",
                gap: 1,
                backgroundColor: "#25D366",
                color: "#fff",
                textDecoration: "none",
                px: 4,
                py: 1.5,
                borderRadius: 2,
                fontWeight: 600,
                textTransform: "none",
                transition: "background-color 0.2s ease",
                "&:hover": { backgroundColor: "#1da851" },
              }}
            >
              <WhatsApp />
              Fale Conosco
            </Box>
          </Paper>
        </Container>

        <Footer />
      </Box>
    </>
  );
}
