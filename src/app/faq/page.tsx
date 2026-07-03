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
      "A diferença principal é a regulagem de altura. A suspensão a ar e a rosca (coilover) são ajustáveis — no ar você controla a altura em tempo real por um painel (perfeito para qualquer terreno), e na rosca você regula manualmente girando o anel de pré-carga. A suspensão fixa tem altura definida de fábrica; qualquer mudança exige retrabalho mecânico (troca de molas, corte, etc). Resumindo: ar = regulagem dinâmica via controle; rosca = regulagem manual por ajuste mecânico; fixa = sem regulagem, alteração exige retrabalho.",
  },
  {
    question: "Qual suspensão escolher para meu carro?",
    answer:
      "Depende do uso que você faz do veículo. Para uso urbano e versatilidade, a suspensão a ar é a mais comum — você ajusta a altura conforme o terreno ou situação (subindo em lombadas, rebaixando para estilo). Para quem anda na cidade e também vai para pista/autódromo, a rosca (coilover) ou a fixa são as mais indicadas, pela precisão em curvas e resposta esportiva. O ar entrega o melhor conforto e comodidade para os mais variados tipos de terreno, mas se o foco é performance pura em pista, rosca ou fixa são superiores. Cada projeto é conversado caso a caso — fale com a gente pelo WhatsApp para uma recomendação personalizada.",
  },
  {
    question: "Vocês entregam para todo o Brasil?",
    answer:
      "Sim. Enviamos para todo o território nacional via Correios e transportadoras parceiras. Já temos mais de 500 vendas concluídas para fora do nosso estado, com clientes satisfeitos em todas as regiões. O frete é calculado pelo CEP no checkout e o prazo varia conforme a região.",
  },
  {
    question: "Quanto custa uma suspensão instalada?",
    answer:
      "Atualmente, modificar uma suspensão parte de R$ 900. O teto é definido pelo orçamento do cliente, porque trabalhamos com acessórios nacionais e importados das mais variadas faixas de preço. Cada projeto tem suas particularidades — tipo de suspensão, marca dos componentes, modelo do veículo e nível de personalização. Por isso fazemos um orçamento detalhado, sem compromisso, de acordo com o que você quer.",
  },
  {
    question: "A suspensão rebaixada ou lift é legalizada?",
    answer:
      "Sim, é possível legalizar suspensão rebaixada e lift, respeitando os limites do CONTRAN. Para rebaixamento, o limite é de 10 cm em relação à altura original do veículo (Resolução CONTRAN nº 292/2008). Para lift (elevação), não há limite de altura fixado, mas o veículo precisa passar por vistoria técnica e homologação junto ao DETRAN/PR, com laudo de inspeção veicular. A Car Crew Garage orienta todos os clientes sobre a documentação e o processo de regularização.",
  },
  {
    question: "Posso parcelar a instalação?",
    answer:
      "Sim, aceitamos parcelamento da instalação. Entre em contato pelo WhatsApp (44) 99813-3182 para combinar as condições de pagamento direto. Para produtos da loja, parcelamos em até 12x sem juros no cartão.",
  },
  {
    question: "Vocês fazem orçamento sem compromisso?",
    answer:
      "Sim, fazemos orçamento sem compromisso. Mande pelo WhatsApp (44) 99813-3182 o modelo e ano do veículo, o tipo de suspensão desejada e (se possível) fotos do projeto. Respondemos com orçamento detalhado em até 24 horas.",
  },
  {
    question: "Quanto tempo leva a instalação?",
    answer:
      "Em média, 1 semana para instalar. Dependendo do tipo de suspensão e da complexidade do projeto, o prazo pode ser menor ou maior — uma suspensão fixa costuma ser instalada no mesmo dia, enquanto uma suspensão a ar completa (com compressor, manifolds, chicotes elétricos) pode levar 2 a 3 dias úteis. O agendamento é feito conforme sua disponibilidade.",
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
