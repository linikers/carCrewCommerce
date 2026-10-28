import type { Metadata } from "next";
import { Container, Typography, Box, Paper, Grid, Button } from "@mui/material";
import { Phone, LocationOn, AccessTime, WhatsApp, Build, Star, Groups } from "@mui/icons-material";
import Header from "@/components/Header";
import { lerContatoEmpresaCache } from "@/lib/empresa";
import Footer from "@/components/Footer";
import TextoRico from "@/components/TextoRico";
import { lerPagina } from "@/lib/paginas-conteudo";

export const metadata: Metadata = {
  title: "Sobre a Car Crew Garage",
  description: "Oficina de suspensão automotiva em Maringá/PR — especialista em veículos rebaixados, suspensão a ar, suspensão fixa, suspensão rosca, coilover e customização automotiva. Mais de 10 anos de experiência.",
  alternates: { canonical: "/sobre" },
};

export const dynamic = "force-dynamic";

export default async function SobrePage() {
  const [contato, pagina] = await Promise.all([
    lerContatoEmpresaCache(),
    lerPagina("sobre"),
  ]);

  // Ícone por posição: o primeiro bloco é a história, o segundo o que fazemos.
  const icones = [<Build key="hist" sx={{ color: "#E65100", fontSize: 28 }} />, <Star key="faz" sx={{ color: "#E65100", fontSize: 28 }} />];

  return (
    <Box sx={{ display: "flex", flexDirection: "column", minHeight: "100vh" }}>
      <Header />

      <Container maxWidth="md" sx={{ flex: 1, py: 6 }}>
        <Typography component="h1" variant="h3" sx={{ fontWeight: 700, mb: 2, textAlign: "center" }}>
          {pagina.titulo}
        </Typography>
        {pagina.subtitulo && (
          <Typography variant="h6" sx={{ color: "#666", textAlign: "center", mb: 6, fontWeight: 400 }}>
            {pagina.subtitulo}
          </Typography>
        )}

        {/* Seções editáveis em /admin/paginas */}
        {pagina.secoes.map((secao, i) => (
          <Paper key={secao.id} sx={{ p: 4, borderRadius: 3, mb: 4 }}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 3 }}>
              {icones[i] ?? <Star sx={{ color: "#E65100", fontSize: 28 }} />}
              <Typography variant="h5" sx={{ fontWeight: 600, color: "#E65100" }}>
                {secao.titulo}
              </Typography>
            </Box>
            <TextoRico texto={secao.texto} />
          </Paper>
        ))}

        {/* Diferenciais (visual fixo) */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid size={{ xs: 12, md: 4 }}>
            <Paper sx={{ p: 3, borderRadius: 3, textAlign: "center", height: "100%" }}>
              <Build sx={{ fontSize: 40, color: "#E65100", mb: 1 }} />
              <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1 }}>
                +10 Anos
              </Typography>
              <Typography variant="body2" sx={{ color: "#666" }}>
                de experiência em customização automotiva
              </Typography>
            </Paper>
          </Grid>
          <Grid size={{ xs: 12, md: 4 }}>
            <Paper sx={{ p: 3, borderRadius: 3, textAlign: "center", height: "100%" }}>
              <Groups sx={{ fontSize: 40, color: "#E65100", mb: 1 }} />
              <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1 }}>
                Clientes em Todo o Brasil
              </Typography>
              <Typography variant="body2" sx={{ color: "#666" }}>
                de diversas regiões confiam no nosso trabalho
              </Typography>
            </Paper>
          </Grid>
          <Grid size={{ xs: 12, md: 4 }}>
            <Paper sx={{ p: 3, borderRadius: 3, textAlign: "center", height: "100%" }}>
              <Star sx={{ fontSize: 40, color: "#E65100", mb: 1 }} />
              <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1 }}>
                Soluções Sob Medida
              </Typography>
              <Typography variant="body2" sx={{ color: "#666" }}>
                cada veículo com projeto personalizado
              </Typography>
            </Paper>
          </Grid>
        </Grid>

        {/* Contato */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid size={{ xs: 12, md: 4 }}>
            <Paper sx={{ p: 3, borderRadius: 3, textAlign: "center" }}>
              <LocationOn sx={{ fontSize: 40, color: "#E65100", mb: 1 }} />
              <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>Endereço</Typography>
              <Typography variant="body2" sx={{ color: "#666" }}>
                {contato.endereco ? `${contato.endereco} — ` : ""}
                {contato.cidade}/{contato.uf}
              </Typography>
            </Paper>
          </Grid>
          <Grid size={{ xs: 12, md: 4 }}>
            <Paper sx={{ p: 3, borderRadius: 3, textAlign: "center" }}>
              <Phone sx={{ fontSize: 40, color: "#E65100", mb: 1 }} />
              <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>Contato</Typography>
              <Typography variant="body2" sx={{ color: "#666" }}>
                {contato.telefoneFormatado}
              </Typography>
            </Paper>
          </Grid>
          <Grid size={{ xs: 12, md: 4 }}>
            <Paper sx={{ p: 3, borderRadius: 3, textAlign: "center" }}>
              <AccessTime sx={{ fontSize: 40, color: "#E65100", mb: 1 }} />
              <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>Horário</Typography>
              <Typography variant="body2" sx={{ color: "#666" }}>
                Seg-Sex: 8h às 18h
              </Typography>
            </Paper>
          </Grid>
        </Grid>

        <Box sx={{ textAlign: "center", mt: 4 }}>
          <Button
            variant="contained"
            startIcon={<WhatsApp />}
            href={contato.whatsapp}
            target="_blank"
            sx={{
              backgroundColor: "#25D366",
              "&:hover": { backgroundColor: "#1da851" },
              textTransform: "none",
              px: 4,
              py: 1.5,
              fontSize: "1.05rem",
            }}
          >
            Fale Conosco no WhatsApp
          </Button>
        </Box>
      </Container>

      <Footer />
    </Box>
  );
}
