import type { Metadata } from "next";
import { Container, Typography, Box, Paper, Alert } from "@mui/material";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import TextoRico from "@/components/TextoRico";
import { lerPagina } from "@/lib/paginas-conteudo";
import { lerContatoEmpresaCache } from "@/lib/empresa";

export const metadata: Metadata = {
  title: "Política de Trocas e Devoluções",
  description: "Política de trocas e devoluções da Car Crew Garage — como solicitar troca ou devolução.",
  alternates: { canonical: "/trocas" },
};

export const dynamic = "force-dynamic";

export default async function TrocasPage() {
  const [pagina, contato] = await Promise.all([lerPagina("trocas"), lerContatoEmpresaCache()]);

  // {{telefone}} vem do cadastro da empresa — não repetir número no texto.
  const trocar = (t: string) => t.replaceAll("{{telefone}}", contato.telefoneFormatado);

  return (
    <Box sx={{ display: "flex", flexDirection: "column", minHeight: "100vh" }}>
      <Header />

      <Container maxWidth="md" sx={{ flex: 1, py: 6 }}>
        <Typography component="h1" variant="h3" sx={{ fontWeight: 700, mb: 4, textAlign: "center" }}>
          {pagina.titulo}
        </Typography>

        {pagina.subtitulo && (
          <Typography variant="h6" sx={{ color: "#666", textAlign: "center", mb: 4, fontWeight: 400 }}>
            {pagina.subtitulo}
          </Typography>
        )}

        {pagina.destaque && (
          <Alert severity="info" sx={{ mb: 4, borderRadius: 2 }}>
            {trocar(pagina.destaque)}
          </Alert>
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
