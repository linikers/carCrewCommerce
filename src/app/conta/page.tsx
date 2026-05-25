"use client";

import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import {
  Container,
  Box,
  Typography,
  Button,
  Paper,
  Grid,
  Avatar,
  Divider,
  Chip,
  CircularProgress,
} from "@mui/material";
import {
  Person,
  Logout,
  ShoppingBag,
  LocationOn,
  Edit,
} from "@mui/icons-material";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

export default function AccountPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  if (status === "loading") {
    return (
      <Box sx={{ display: "flex", flexDirection: "column", minHeight: "100vh" }}>
        <Header />
        <Container sx={{ flex: 1, display: "flex", justifyContent: "center", alignItems: "center" }}>
          <CircularProgress sx={{ color: "#E65100" }} />
        </Container>
        <Footer />
      </Box>
    );
  }

  if (status === "unauthenticated") {
    return (
      <Box sx={{ display: "flex", flexDirection: "column", minHeight: "100vh" }}>
        <Header />
        <Container sx={{ flex: 1, py: 8, textAlign: "center" }}>
          <Person sx={{ fontSize: 80, color: "#ddd", mb: 2 }} />
          <Typography variant="h5" sx={{ fontWeight: 600, mb: 1 }}>
            Faça login para acessar sua conta
          </Typography>
          <Typography variant="body1" sx={{ color: "#666", mb: 3 }}>
            Entre com seu Google ou email para ver seus pedidos e dados.
          </Typography>
          <Button
            variant="contained"
            onClick={() => router.push("/login")}
            sx={{
              backgroundColor: "#E65100",
              "&:hover": { backgroundColor: "#BF360C" },
              textTransform: "none",
              px: 4,
            }}
          >
            Fazer Login
          </Button>
        </Container>
        <Footer />
      </Box>
    );
  }

  return (
    <Box sx={{ display: "flex", flexDirection: "column", minHeight: "100vh" }}>
      <Header />
      <Container maxWidth="lg" sx={{ flex: 1, py: 4 }}>
        <Typography variant="h4" sx={{ fontWeight: 700, mb: 4, color: "#1A1A1A" }}>
          Minha Conta
        </Typography>

        <Grid container spacing={4}>
          {/* Sidebar */}
          <Grid size={{ xs: 12, md: 3 }}>
            <Paper sx={{ p: 3, borderRadius: 3, textAlign: "center" }}>
              <Avatar
                src={session?.user?.image || undefined}
                sx={{
                  width: 80,
                  height: 80,
                  mx: "auto",
                  mb: 2,
                  bgcolor: "#E65100",
                  fontSize: 32,
                }}
              >
                {session?.user?.name?.charAt(0)?.toUpperCase() || "U"}
              </Avatar>
              <Typography variant="h6" sx={{ fontWeight: 600 }}>
                {session?.user?.name || "Usuário"}
              </Typography>
              <Typography variant="body2" sx={{ color: "#666", mb: 2 }}>
                {session?.user?.email}
              </Typography>
              <Chip
                icon={<Person />}
                label="Conta ativa"
                size="small"
                sx={{ backgroundColor: "#e8f5e9", color: "#2e7d32" }}
              />
            </Paper>
          </Grid>

          {/* Main content */}
          <Grid size={{ xs: 12, md: 9 }}>
            {/* Dados do Perfil */}
            <Paper sx={{ p: 3, borderRadius: 3, mb: 3 }}>
              <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
                <Typography variant="h6" sx={{ fontWeight: 600 }}>
                  Dados do Perfil
                </Typography>
                <Button
                  startIcon={<Edit />}
                  size="small"
                  sx={{ textTransform: "none", color: "#E65100" }}
                >
                  Editar
                </Button>
              </Box>
              <Divider sx={{ mb: 2 }} />
              <Grid container spacing={2}>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <Typography variant="caption" sx={{ color: "#999" }}>
                    Nome
                  </Typography>
                  <Typography variant="body1">
                    {session?.user?.name || "—"}
                  </Typography>
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <Typography variant="caption" sx={{ color: "#999" }}>
                    Email
                  </Typography>
                  <Typography variant="body1">
                    {session?.user?.email || "—"}
                  </Typography>
                </Grid>
              </Grid>
            </Paper>

            {/* Endereços */}
            <Paper sx={{ p: 3, borderRadius: 3, mb: 3 }}>
              <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
                <Typography variant="h6" sx={{ fontWeight: 600 }}>
                  Endereços
                </Typography>
                <Button
                  startIcon={<LocationOn />}
                  size="small"
                  sx={{ textTransform: "none", color: "#E65100" }}
                >
                  Adicionar
                </Button>
              </Box>
              <Divider sx={{ mb: 2 }} />
              <Typography variant="body2" sx={{ color: "#999" }}>
                Nenhum endereço cadastrado ainda.
              </Typography>
            </Paper>

            {/* Pedidos */}
            <Paper sx={{ p: 3, borderRadius: 3 }}>
              <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
                <Typography variant="h6" sx={{ fontWeight: 600 }}>
                  Meus Pedidos
                </Typography>
                <ShoppingBag sx={{ color: "#E65100" }} />
              </Box>
              <Divider sx={{ mb: 2 }} />
              <Typography variant="body2" sx={{ color: "#999" }}>
                Nenhum pedido realizado ainda.
              </Typography>
            </Paper>

            {/* Sair */}
            <Box sx={{ mt: 3, textAlign: "center" }}>
              <Button
                variant="outlined"
                startIcon={<Logout />}
                onClick={() => signOut({ callbackUrl: "/" })}
                sx={{
                  textTransform: "none",
                  color: "#999",
                  borderColor: "#ddd",
                  "&:hover": { borderColor: "#E65100", color: "#E65100" },
                }}
              >
                Sair da Conta
              </Button>
            </Box>
          </Grid>
        </Grid>
      </Container>
      <Footer />
    </Box>
  );
}
