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
import { LockOutlined } from "@mui/icons-material";

export default function AdminLogin() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
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
        setError("Credenciais inválidas");
      } else {
        // Verifica se é admin
        const res = await fetch("/api/auth/session");
        const session = await res.json();
        if (session?.user?.admin) {
          router.push("/admin");
        } else {
          await signIn("credentials", { email, password, callbackUrl: "/" });
          setError("Acesso restrito a administradores");
        }
      }
    } catch {
      setError("Erro ao fazer login");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box
      sx={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "#1A1A1A",
      }}
    >
      <Container maxWidth="xs">
        <Paper sx={{ p: 4, borderRadius: 3, textAlign: "center" }}>
          <LockOutlined
            sx={{ fontSize: 48, color: "#E65100", mb: 2 }}
          />
          <Typography variant="h5" sx={{ fontWeight: 700, mb: 1 }}>
            Admin CarCrew
          </Typography>
          <Typography variant="body2" sx={{ color: "#666", mb: 3 }}>
            Acesso restrito — informe suas credenciais
          </Typography>

          <form onSubmit={handleLogin}>
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
              disabled={loading}
              sx={{
                backgroundColor: "#E65100",
                "&:hover": { backgroundColor: "#BF360C" },
                "&.Mui-disabled": { backgroundColor: "#ccc" },
                textTransform: "none",
                fontWeight: 600,
                py: 1.2,
              }}
            >
              {loading ? "Entrando..." : "Entrar"}
            </Button>
          </form>

          <Button
            onClick={() => router.push("/")}
            sx={{
              mt: 2,
              textTransform: "none",
              color: "#999",
              "&:hover": { color: "#E65100" },
            }}
          >
            ← Voltar para loja
          </Button>
        </Paper>
      </Container>
    </Box>
  );
}
