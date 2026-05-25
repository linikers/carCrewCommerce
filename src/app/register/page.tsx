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
  Alert,
} from "@mui/material";
import { Google, PersonAdd } from "@mui/icons-material";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

export default function RegisterPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!name || !email || !password) {
      setError("Preencha todos os campos");
      return;
    }

    if (password.length < 6) {
      setError("A senha deve ter no mínimo 6 caracteres");
      return;
    }

    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nome: name, email, senha: password }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Erro ao cadastrar");
        return;
      }

      setSuccess(true);
      setTimeout(() => {
        router.push("/login");
      }, 2000);
    } catch {
      setError("Erro de conexão ao servidor");
    }
  };

  return (
    <Box sx={{ display: "flex", flexDirection: "column", minHeight: "100vh" }}>
      <Header />
      <Container maxWidth="sm" sx={{ flex: 1, py: 8 }}>
        <Paper sx={{ p: 4, borderRadius: 3 }}>
          <Typography
            variant="h5"
            sx={{
              fontWeight: 700,
              mb: 1,
              textAlign: "center",
              color: "#1A1A1A",
            }}
          >
            Criar Conta
          </Typography>
          <Typography
            variant="body2"
            sx={{ color: "#666", mb: 4, textAlign: "center" }}
          >
            Cadastre-se para acompanhar seus pedidos
          </Typography>

          {success ? (
            <Alert severity="success" sx={{ mb: 2 }}>
              Conta criada com sucesso! Redirecionando para o login...
            </Alert>
          ) : (
            <form onSubmit={handleRegister}>
              <TextField
                fullWidth
                label="Nome completo"
                value={name}
                onChange={(e) => setName(e.target.value)}
                sx={{ mb: 2 }}
              />
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
                helperText="Mínimo 6 caracteres"
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
                startIcon={<PersonAdd />}
                sx={{
                  backgroundColor: "#E65100",
                  "&:hover": { backgroundColor: "#BF360C" },
                  textTransform: "none",
                  fontWeight: 600,
                  py: 1.2,
                  mb: 2,
                }}
              >
                Criar Conta
              </Button>
            </form>
          )}

          <Button
            fullWidth
            variant="outlined"
            size="large"
            startIcon={<Google />}
            onClick={() => signIn("google", { callbackUrl: "/" })}
            sx={{
              textTransform: "none",
              fontWeight: 500,
              py: 1.2,
              borderColor: "#ddd",
              color: "#333",
              "&:hover": { borderColor: "#999" },
            }}
          >
            Cadastrar com Google
          </Button>

          <Box sx={{ mt: 3, textAlign: "center" }}>
            <Typography variant="body2" sx={{ color: "#666" }}>
              Já tem conta?{" "}
              <Button
                onClick={() => router.push("/login")}
                sx={{
                  textTransform: "none",
                  color: "#E65100",
                  fontWeight: 600,
                  p: 0,
                  minWidth: "auto",
                }}
              >
                Fazer login
              </Button>
            </Typography>
          </Box>
        </Paper>
      </Container>
      <Footer />
    </Box>
  );
}
