import type { Metadata } from "next";
import { Container, Typography, Box, Paper, Grid, Button } from "@mui/material";
import { Phone, LocationOn, AccessTime, WhatsApp, Build, Star, Groups } from "@mui/icons-material";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

export const metadata: Metadata = {
  title: "Sobre a Car Crew Garage",
  description: "Oficina de suspensão automotiva em Maringá/PR — especialista em veículos rebaixados, suspensão a ar, suspensão fixa, suspensão rosca, coilover e customização automotiva. Mais de 10 anos de experiência.",
  alternates: { canonical: "/sobre" },
};

export default function SobrePage() {
  return (
    <Box sx={{ display: "flex", flexDirection: "column", minHeight: "100vh" }}>
      <Header />

      <Container maxWidth="md" sx={{ flex: 1, py: 6 }}>
        {/* Título */}
        <Typography variant="h3" sx={{ fontWeight: 700, mb: 2, textAlign: "center" }}>
          Sobre a Car Crew Garage
        </Typography>
        <Typography variant="h6" sx={{ color: "#666", textAlign: "center", mb: 6, fontWeight: 400 }}>
          Mais de 10 anos transformando veículos em paixão
        </Typography>

        {/* Nossa História */}
        <Paper sx={{ p: 4, borderRadius: 3, mb: 4 }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 3 }}>
            <Build sx={{ color: "#E65100", fontSize: 28 }} />
            <Typography variant="h5" sx={{ fontWeight: 600, color: "#E65100" }}>
              Nossa História
            </Typography>
          </Box>
          <Typography variant="body1" sx={{ lineHeight: 1.9, color: "#444", mb: 2 }}>
            A <strong>Car Crew Garage</strong> nasceu da paixão por veículos customizados e da
            vontade de transformar cada projeto em algo único. Com sede em{" "}
            <strong>Maringá/PR</strong> e <strong>mais de 10 anos de experiência</strong> no
            mercado de customização automotiva, construímos uma trajetória baseada em
            qualidade, inovação e dedicação aos apaixonados por carros.
          </Typography>
          <Typography variant="body1" sx={{ lineHeight: 1.9, color: "#444", mb: 2 }}>
            Somos especialistas em <strong>suspensão a ar</strong>,{" "}
            <strong>suspensão fixa</strong>, <strong>suspensão rosca (coilover)</strong>,{" "}
            <strong>kits lift</strong> e projetos de personalização automotiva para quem
            busca exclusividade, desempenho e um acabamento impecável. Nossa oficina atende
            clientes de Maringá e região que buscam o melhor em <strong>rebaixados</strong>{" "}
            e customização — mais do que
            instalar componentes, desenvolvemos soluções sob medida para que cada veículo
            reflita a personalidade do seu proprietário.
          </Typography>
          <Typography variant="body1" sx={{ lineHeight: 1.9, color: "#444" }}>
            Ao longo dos anos, conquistamos a confiança de clientes de diversas regiões do
            Brasil e hoje somos reconhecidos como <strong>um dos destaques da cena
            automotiva</strong>, resultado do compromisso com a excelência, da qualidade
            dos produtos que oferecemos e da atenção aos mínimos detalhes em cada projeto.
          </Typography>
        </Paper>

        {/* O que fazemos */}
        <Paper sx={{ p: 4, borderRadius: 3, mb: 4 }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 3 }}>
            <Star sx={{ color: "#E65100", fontSize: 28 }} />
            <Typography variant="h5" sx={{ fontWeight: 600, color: "#E65100" }}>
              O que Fazemos
            </Typography>
          </Box>
          <Typography variant="body1" sx={{ lineHeight: 1.9, color: "#444", mb: 2 }}>
            Seja para um rebaixamento de alto nível, um kit lift preparado para qualquer
            desafio ou uma customização completa, nossa missão é entregar um resultado
            que supere expectativas e faça seu veículo se destacar por onde passar.
          </Typography>
          <Typography variant="body1" sx={{ lineHeight: 1.9, color: "#444" }}>
            Na <strong>Car Crew Garage</strong>, cada projeto é tratado como único, porque
            sabemos que um veículo personalizado não é apenas um meio de transporte — é
            uma paixão, um estilo de vida e uma extensão de quem está ao volante.
          </Typography>
        </Paper>

        {/* Diferenciais */}
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
                Seg-Sex: 8h às 18h
              </Typography>
            </Paper>
          </Grid>
        </Grid>

        {/* CTA */}
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
