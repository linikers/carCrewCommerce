import type { Metadata } from "next";
import { Container, Typography, Box, Paper } from "@mui/material";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

export const metadata: Metadata = {
  title: "Política de Privacidade",
  description: "Política de privacidade da Car Crew Garage — como coletamos, usamos e protegemos seus dados.",
  alternates: { canonical: "/privacidade" },
};

export default function PrivacidadePage() {
  return (
    <Box sx={{ display: "flex", flexDirection: "column", minHeight: "100vh" }}>
      <Header />

      <Container maxWidth="md" sx={{ flex: 1, py: 6 }}>
        <Typography variant="h3" sx={{ fontWeight: 700, mb: 4, textAlign: "center" }}>
          Política de Privacidade
        </Typography>

        <Typography variant="body2" sx={{ color: "#999", mb: 4, textAlign: "center" }}>
          Última atualização: Julho 2026
        </Typography>

        <Paper sx={{ p: 4, borderRadius: 3, mb: 3 }}>
          <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
            1. Dados Coletados
          </Typography>
          <Typography variant="body1" sx={{ lineHeight: 1.8, color: "#444" }}>
            {/* CONTEÚDO: Quais dados são coletados */}
            Coletamos os seguintes dados quando você realiza uma compra:
          </Typography>
          <Box component="ul" sx={{ ml: 2, mt: 1 }}>
            <li>Nome completo</li>
            <li>Telefone / WhatsApp</li>
            <li>Endereço (CEP, rua, número, bairro, cidade)</li>
            <li>E-mail</li>
            <li>Dados de pagamento (processados pelo gateway)</li>
          </Box>
        </Paper>

        <Paper sx={{ p: 4, borderRadius: 3, mb: 3 }}>
          <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
            2. Uso dos Dados
          </Typography>
          <Typography variant="body1" sx={{ lineHeight: 1.8, color: "#444" }}>
            {/* CONTEÚDO: Como os dados são usados */}
            Seus dados são utilizados para:
          </Typography>
          <Box component="ul" sx={{ ml: 2, mt: 1 }}>
            <li>Processar e entregar seu pedido</li>
            <li>Enviar atualizações sobre o status do pedido</li>
            <li>Entrar em contato para esclarecer dúvidas</li>
            <li>Cumprir obrigações legais (nota fiscal)</li>
          </Box>
        </Paper>

        <Paper sx={{ p: 4, borderRadius: 3, mb: 3 }}>
          <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
            3. Compartilhamento com Terceiros
          </Typography>
          <Typography variant="body1" sx={{ lineHeight: 1.8, color: "#444" }}>
            {/* CONTEÚDO: Com quem os dados são compartilhados */}
            Seus dados podem ser compartilhados com:
          </Typography>
          <Box component="ul" sx={{ ml: 2, mt: 1 }}>
            <li>Transportadoras (para entrega do pedido)</li>
            <li>Gateway de pagamento (para processar o pagamento)</li>
            <li>Órgãos fiscais (quando obrigatório por lei)</li>
          </Box>
        </Paper>

        <Paper sx={{ p: 4, borderRadius: 3, mb: 3 }}>
          <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
            4. Cookies
          </Typography>
          <Typography variant="body1" sx={{ lineHeight: 1.8, color: "#444" }}>
            {/* CONTEÚDO: Uso de cookies */}
            Utilizamos cookies para manter seu carrinho de compras e melhorar
            sua experiência de navegação.
          </Typography>
        </Paper>

        <Paper sx={{ p: 4, borderRadius: 3, mb: 3 }}>
          <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
            5. Seus Direitos (LGPD)
          </Typography>
          <Typography variant="body1" sx={{ lineHeight: 1.8, color: "#444" }}>
            {/* CONTEÚDO: Direitos do cliente conforme LGPD */}
            Conforme a Lei Geral de Proteção de Dados (LGPD), você tem direito a:
          </Typography>
          <Box component="ul" sx={{ ml: 2, mt: 1 }}>
            <li>Solicitar acesso aos seus dados</li>
            <li>Solicitar correção de dados incorretos</li>
            <li>Solicitar a exclusão dos seus dados</li>
            <li>Revogar o consentimento a qualquer momento</li>
          </Box>
        </Paper>

        <Paper sx={{ p: 4, borderRadius: 3 }}>
          <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
            6. Contato
          </Typography>
          <Typography variant="body1" sx={{ lineHeight: 1.8, color: "#444" }}>
            {/* CONTEÚDO: Contato do encarregado/DPO */}
            Para exercer seus direitos ou esclarecer dúvidas sobre esta
            política, entre em contato:
          </Typography>
          <Typography variant="body2" sx={{ mt: 1, color: "#666" }}>
            WhatsApp: (44) 99813-3182<br />
            E-mail: contato@carcrew.com.br
          </Typography>
        </Paper>
      </Container>

      <Footer />
    </Box>
  );
}
