import type { Metadata } from "next";
import { Container, Typography, Box, Paper, Grid, Button } from "@mui/material";
import { Phone, LocationOn, AccessTime, WhatsApp } from "@mui/icons-material";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

export const metadata: Metadata = {
  title: "Sobre a Car Crew Garage",
  description: "Conheça a Car Crew Garage — especialistas em suspensão pneumática e rebaixamento automotivo em Maringá/PR.",
  alternates: { canonical: "/sobre" },
};

export default function SobrePage() {
  return (
    <Box sx={{ display: "flex", flexDirection: "column", minHeight: "100vh" }}>
      <Header />

      <Container maxWidth="md" sx={{ flex: 1, py: 6 }}>
        <Typography variant="h3" sx={{ fontWeight: 700, mb: 4, textAlign: "center" }}>
          Sobre a Car Crew
        </Typography>

        <Paper sx={{ p: 4, borderRadius: 3, mb: 4 }}>
          <Typography variant="h5" sx={{ fontWeight: 600, mb: 2, color: "#E65100" }}>
            Nossa História
          </Typography>
          <Typography variant="body1" sx={{ lineHeight: 1.8, color: "#444" }}>
            {/* CONTEÚDO: Inserir história da empresa */}
            A Car Crew Garage nasceu da paixão por automotivos e da experiência
            prática em suspensão pneumática. Localizada em Maringá/PR, somos
            especialistas em soluções de suspensão a ar, rebaixamento e kit lift
            para veículos leves e comerciais.
          </Typography>
        </Paper>

        <Paper sx={{ p: 4, borderRadius: 3, mb: 4 }}>
          <Typography variant="h5" sx={{ fontWeight: 600, mb: 2, color: "#E65100" }}>
            Missão
          </Typography>
          <Typography variant="body1" sx={{ lineHeight: 1.8, color: "#444" }}>
            {/* CONTEÚDO: Inserir missão */}
            Oferecer produtos de alta qualidade para suspensão automotiva,
            com atendimento personalizado e suporte técnico para cada cliente.
          </Typography>
        </Paper>

        <Grid container spacing={3}>
          <Grid size={{ xs: 12, md: 4 }}>
            <Paper sx={{ p: 3, borderRadius: 3, textAlign: "center" }}>
              <LocationOn sx={{ fontSize: 40, color: "#E65100", mb: 1 }} />
              <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>Endereço</Typography>
              <Typography variant="body2" sx={{ color: "#666" }}>
                {/* CONTEÚDO: Endereço completo */}
                Maringá/PR
              </Typography>
            </Paper>
          </Grid>
          <Grid size={{ xs: 12, md: 4 }}>
            <Paper sx={{ p: 3, borderRadius: 3, textAlign: "center" }}>
              <Phone sx={{ fontSize: 40, color: "#E65100", mb: 1 }} />
              <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>Contato</Typography>
              <Typography variant="body2" sx={{ color: "#666" }}>
                (44) 99813-3182
              </Typography>
            </Paper>
          </Grid>
          <Grid size={{ xs: 12, md: 4 }}>
            <Paper sx={{ p: 3, borderRadius: 3, textAlign: "center" }}>
              <AccessTime sx={{ fontSize: 40, color: "#E65100", mb: 1 }} />
              <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>Horário</Typography>
              <Typography variant="body2" sx={{ color: "#666" }}>
                {/* CONTEÚDO: Horário de funcionamento */}
                Seg-Sex: 8h às 18h
              </Typography>
            </Paper>
          </Grid>
        </Grid>

        <Box sx={{ textAlign: "center", mt: 4 }}>
          <Button
            variant="contained"
            startIcon={<WhatsApp />}
            href="https://wa.me/5544998133182"
            target="_blank"
            sx={{
              backgroundColor: "#25D366",
              "&:hover": { backgroundColor: "#1da851" },
              textTransform: "none",
              px: 4,
              py: 1.5,
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
