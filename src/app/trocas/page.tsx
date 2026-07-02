import type { Metadata } from "next";
import { Container, Typography, Box, Paper, Alert } from "@mui/material";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

export const metadata: Metadata = {
  title: "Política de Trocas e Devoluções",
  description: "Política de trocas e devoluções da Car Crew Garage — como solicitar troca ou devolução.",
  alternates: { canonical: "/trocas" },
};

export default function TrocasPage() {
  return (
    <Box sx={{ display: "flex", flexDirection: "column", minHeight: "100vh" }}>
      <Header />

      <Container maxWidth="md" sx={{ flex: 1, py: 6 }}>
        <Typography variant="h3" sx={{ fontWeight: 700, mb: 4, textAlign: "center" }}>
          Trocas e Devoluções
        </Typography>

        <Alert severity="info" sx={{ mb: 4, borderRadius: 2 }}>
          {/* CONTEÚDO: Prazo pra trocar */}
          Você tem até 7 dias após o recebimento para solicitar troca ou devolução.
        </Alert>

        <Paper sx={{ p: 4, borderRadius: 3, mb: 3 }}>
          <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
            Condições para Troca
          </Typography>
          <Typography variant="body1" sx={{ lineHeight: 1.8, color: "#444" }}>
            {/* CONTEÚDO: Condições pra troca */}
            Para que a troca seja aceita, o produto deve estar:
          </Typography>
          <Box component="ul" sx={{ ml: 2, mt: 1 }}>
            <li>Na embalagem original</li>
            <li>Sem sinais de uso ou instalação</li>
            <li>Com todos os acessórios inclusos</li>
            <li>Com nota fiscal</li>
          </Box>
        </Paper>

        <Paper sx={{ p: 4, borderRadius: 3, mb: 3 }}>
          <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
            Como Solicitar
          </Typography>
          <Typography variant="body1" sx={{ lineHeight: 1.8, color: "#444" }}>
            {/* CONTEÚDO: Passo a passo pra solicitar */}
          </Typography>
          <Box component="ol" sx={{ ml: 2, mt: 1 }}>
            <li>Entre em contato pelo WhatsApp (44) 99813-3182</li>
            <li>Informe o número do pedido e o motivo da troca</li>
            <li>Aguarde instruções para envio do produto</li>
            <li>Após receber o produto, processaremos a troca em até 5 dias úteis</li>
          </Box>
        </Paper>

        <Paper sx={{ p: 4, borderRadius: 3, mb: 3 }}>
          <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
            Frete de Devolução
          </Typography>
          <Typography variant="body1" sx={{ lineHeight: 1.8, color: "#444" }}>
            {/* CONTEÚDO: Quem paga o frete de devolução */}
            O frete de devolução é de responsabilidade do cliente, exceto
            quando o produto apresentar defeito de fabricação.
          </Typography>
        </Paper>

        <Paper sx={{ p: 4, borderRadius: 3, mb: 3 }}>
          <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
            Itens com Restrição de Troca
          </Typography>
          <Typography variant="body1" sx={{ lineHeight: 1.8, color: "#444" }}>
            {/* CONTEÚDO: Itens que não podem ser trocados */}
            Não aceitamos troca para:
          </Typography>
          <Box component="ul" sx={{ ml: 2, mt: 1 }}>
            <li>Produtos personalizados ou sob medida</li>
            <li>Produtos instalados ou com sinais de uso</li>
            <li>Acessórios sem embalagem original</li>
          </Box>
        </Paper>

        <Paper sx={{ p: 4, borderRadius: 3 }}>
          <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
            Reembolso
          </Typography>
          <Typography variant="body1" sx={{ lineHeight: 1.8, color: "#444" }}>
            {/* CONTEÚDO: Prazo de reembolso */}
            O reembolso será processado em até 10 dias úteis após a
            confirmação da devolução, na mesma forma de pagamento utilizada
            na compra.
          </Typography>
        </Paper>
      </Container>

      <Footer />
    </Box>
  );
}
