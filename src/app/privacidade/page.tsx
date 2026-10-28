import type { Metadata } from "next";
import { Container, Typography, Box, Paper } from "@mui/material";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import TextoRico from "@/components/TextoRico";
import { lerPagina } from "@/lib/paginas-conteudo";
import { lerContatoEmpresaCache } from "@/lib/empresa";

export const metadata: Metadata = {
  title: "Política de Privacidade",
  description: "Política de privacidade da Car Crew Garage — como coletamos, usamos e protegemos seus dados.",
  alternates: { canonical: "/privacidade" },
};

export const dynamic = "force-dynamic";

export default async function PrivacidadePage() {
  const [pagina, contato] = await Promise.all([lerPagina("privacidade"), lerContatoEmpresaCache()]);

  // Marcadores trocados pelo cadastro da empresa: sem telefone/e-mail fixo no texto.
  const trocar = (t: string) =>
    t.replaceAll("{{telefone}}", contato.telefoneFormatado).replaceAll("{{email}}", contato.email);

  return (
    <Box sx={{ display: "flex", flexDirection: "column", minHeight: "100vh" }}>
      <Header />

      <Container maxWidth="md" sx={{ flex: 1, py: 6 }}>
        <Typography component="h1" variant="h3" sx={{ fontWeight: 700, mb: 2, textAlign: "center" }}>
          {pagina.titulo}
        </Typography>

        {pagina.subtitulo && (
          <Typography variant="body2" sx={{ color: "#999", mb: 4, textAlign: "center" }}>
            {pagina.subtitulo}
          </Typography>
        )}

        {pagina.secoes.map((secao) => (
          <Paper key={secao.id} sx={{ p: 4, borderRadius: 3, mb: 3 }}>
            <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
              {secao.titulo}
            </Typography>
            <TextoRico texto={trocar(secao.texto)} />
          </Paper>
        ))}
      </Container>

      <Footer />
    </Box>
  );
}
