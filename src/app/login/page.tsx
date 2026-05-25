"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import {
  Container,
  Box,
  Typography,
  TextField,
  Button,
  Paper,
  Divider,
  Alert,
} from "@mui/material";
import { Google, Email } from "@mui/icons-material";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleGoogleLogin = async () => {
    await signIn("google", { callbackUrl: "/" });
  };

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });

      if (result?.error) {
        setError("Email ou senha inválidos");
      } else {
        router.push("/");
      }
    } catch {
      setError("Erro ao fazer login");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ display: "flex", flexDirection: "column", minHeight: "100vh" }}>
      <Header />
      <Container maxWidth="sm" sx={{ flex: 1, py: 8 }}>
        <Paper sx={{ p: 4, borderRadius: 3 }}>
          <Typography
            variant="h5"
            sx={{ fontWeight: 700, mb: 1, textAlign: "center", color: "#1A1A1A" }}
          >
            Entrar
          </Typography>
          <Typography
            variant="body2"
            sx={{ color: "#666", mb: 4, textAlign: "center" }}
          >
            Faça login para acessar sua conta
          </Typography>

          {/* Google Login */}
          <Button
            fullWidth
            variant="outlined"
            size="large"
            startIcon={<Google />}
            onClick={handleGoogleLogin}
            sx={{
              textTransform: "none",
              fontWeight: 500,
              py: 1.2,
              mb: 2,
              borderColor: "#ddd",
              color: "#333",
              "&:hover": { borderColor: "#999" },
            }}
          >
            Entrar com Google
          </Button>

          <Divider sx={{ my: 3 }}>
            <Typography variant="caption" sx={{ color: "#999" }}>
              ou
            </Typography>
          </Divider>

          {/* Email Login */}
          <form onSubmit={handleEmailLogin}>
            <TextField
              fullWidth
              label="Email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              sx={{ mb: 2 }}
            />
            <TextField
              fullWidth
              label="Senha"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              sx={{ mb: 2 }}
            />

            {error && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {error}
              </Alert>
            )}

            <Button
              fullWidth
              type="submit"
              variant="contained"
              size="large"
              disabled={loading || !email || !password}
              startIcon={<Email />}
              sx={{
                backgroundColor: "#E65100",
                "&:hover": { backgroundColor: "#BF360C" },
                "&.Mui-disabled": { backgroundColor: "#ccc" },
                textTransform: "none",
                fontWeight: 600,
                py: 1.2,
              }}
            >
              {loading ? "Entrando..." : "Entrar com Email"}
            </Button>
          </form>

          <Box sx={{ mt: 3, textAlign: "center" }}>
            <Typography variant="body2" sx={{ color: "#666" }}>
              Não tem conta?{" "}
              <Button
                onClick={() => router.push("/register")}
                sx={{
                  textTransform: "none",
                  color: "#E65100",
                  fontWeight: 600,
                  p: 0,
                  minWidth: "auto",
                }}
              >
                Cadastre-se
              </Button>
            </Typography>
          </Box>
        </Paper>
      </Container>
      <Footer />
    </Box>
  );
}
