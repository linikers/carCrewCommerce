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

interface FaqItem {
  question: string;
  answer: string;
}

const faqItems: FaqItem[] = [
  {
    question: "Qual a diferença entre suspensão a ar, fixa e rosca?",
    answer:
      "A suspensão a ar usa bolsas pneumáticas controladas por compressor, permitindo ajustar a altura do veículo em tempo real pelo painel. A suspensão fixa usa molas ou amortecedores convencionais, com altura fixa e manutenção mais simples. A suspensão rosca (coilover) é uma evolução da fixa, com regulagem de altura e pré-carga da mola por meio de anéis, ideal para quem quer precisão no rebaixamento.",
  },
  {
    question: "Vocês entregam para todo o Brasil?",
    answer:
      "Sim. Enviamos para todo o território nacional via Correios e transportadoras parceiras. O frete é calculado automaticamente pelo CEP no checkout, e o prazo de entrega varia conforme a região. Atendemos clientes em Maringá, Londrina, Curitiba, São Paulo, Rio de Janeiro e demais estados.",
  },
  {
    question: "Quanto custa uma suspensão completa instalada?",
    answer:
      "O valor depende do tipo de suspensão, marca dos componentes e modelo do veículo. Trabalhamos com peças das principais marcas do mercado (BDS, Air Lift, AccuAir, QA1, Stance, Pro Comp) e montamos orçamentos personalizados. Entre em contato pelo WhatsApp (44) 99813-3182 com modelo e ano do carro para receber um orçamento detalhado.",
  },
  {
    question: "Quanto tempo leva a instalação de uma suspensão?",
    answer:
      "A instalação completa leva entre 4 e 8 horas dependendo do tipo de suspensão e complexidade do veículo. Para suspensão a ar o tempo médio é de 1 a 2 dias úteis (incluindo alinhamento, balanceamento e testes). Suspensão fixa ou coilover geralmente é instalada no mesmo dia. Agendamos a data e horário conforme sua disponibilidade.",
  },
  {
    question: "A suspensão rebaixada é legalizada?",
    answer:
      "Sim, desde que respeite os limites do CONTRAN (Resolução 292/2008 e atualizações). O rebaixamento máximo permitido é de 10 cm em relação à altura original do veículo. Após a instalação, é necessário regularizar no DETRAN/PR com laudo de inspeção técnica veicular. A Car Crew Garage orienta todos os clientes sobre a documentação necessária.",
  },
  {
    question: "Vocês fazem orçamento sem compromisso?",
    answer:
      "Sim. Entre em contato pelo WhatsApp (44) 99813-3182 informando modelo e ano do veículo, tipo de suspensão desejada e fotos do projeto. Enviamos orçamento detalhado em até 24 horas, sem compromisso de contratação.",
  },
  {
    question: "Vocês parcelam a instalação?",
    answer:
      "Sim, aceitamos parcelamento em até 12x sem juros no cartão de crédito para produtos da loja. Para serviços de instalação, consulte condições de pagamento direto no WhatsApp. PIX à vista tem desconto especial.",
  },
  {
    question: "Como funciona a garantia?",
    answer:
      "Todos os produtos da loja têm garantia do fabricante (varia de 3 meses a 1 ano conforme marca). A mão de obra de instalação tem garantia de 90 dias para defeitos relacionados à montagem. Em caso de problema, entre em contato pelo WhatsApp com o número do pedido.",
  },
];

const faqSchema = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: faqItems.map((f) => ({
    "@type": "Question",
    name: f.question,
    acceptedAnswer: {
      "@type": "Answer",
      text: f.answer,
    },
  })),
};

export default function FaqPage() {
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
            {faqItems.map((item, idx) => (
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
              href="https://wa.me/5544998133182"
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
