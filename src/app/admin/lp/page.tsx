"use client";

import { useEffect, useState } from "react";
import {
  Box,
  Button,
  Chip,
  CircularProgress,
  Container,
  Paper,
  Stack,
  Typography,
} from "@mui/material";
import { Edit, OpenInNew } from "@mui/icons-material";
import AdminLayout from "@/components/admin/AdminLayout";

interface PaginaLp {
  slug: string;
  nome: string;
  href: string;
  personalizado: boolean;
}

export default function AdminLpPage() {
  const [paginas, setPaginas] = useState<PaginaLp[]>([]);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState("");

  useEffect(() => {
    fetch("/api/admin/lp")
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error("falha"))))
      .then((d) => setPaginas(Array.isArray(d?.paginas) ? d.paginas : []))
      .catch(() => setErro("Não foi possível carregar as páginas."))
      .finally(() => setLoading(false));
  }, []);

  return (
    <AdminLayout title="Páginas de solução">
      <Container maxWidth="md" sx={{ py: { xs: 2, md: 4 } }}>
        <Typography variant="h5" sx={{ fontWeight: 800, mb: 1 }}>
          Páginas de solução
        </Typography>
        <Typography variant="body2" sx={{ color: "#666", mb: 3 }}>
          O texto das páginas que mais recebem visita pelo Google. Editar aqui
          vale na hora, sem deploy. Produto e preço continuam vindo do catálogo.
        </Typography>

        {erro && (
          <Paper sx={{ p: 2, mb: 2, borderLeft: "4px solid #C62828" }}>
            <Typography variant="body2">{erro}</Typography>
          </Paper>
        )}

        {loading ? (
          <Box sx={{ display: "flex", justifyContent: "center", py: 6 }}>
            <CircularProgress />
          </Box>
        ) : (
          <Stack spacing={2}>
            {paginas.map((pagina) => (
              <Paper key={pagina.slug} sx={{ p: 2.5 }}>
                <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, flexWrap: "wrap" }}>
                  <Box sx={{ flex: 1, minWidth: 200 }}>
                    <Typography sx={{ fontWeight: 700 }}>{pagina.nome}</Typography>
                    <Typography variant="caption" sx={{ color: "#777" }}>
                      {pagina.href}
                    </Typography>
                  </Box>
                  <Chip
                    size="small"
                    label={pagina.personalizado ? "texto próprio" : "texto original"}
                    sx={{
                      backgroundColor: pagina.personalizado ? "#FFF3E0" : "#EEEEEE",
                      color: pagina.personalizado ? "#BF360C" : "#555",
                      fontWeight: 600,
                    }}
                  />
                  <Button
                    size="small"
                    endIcon={<OpenInNew fontSize="small" />}
                    href={pagina.href}
                    target="_blank"
                  >
                    Ver
                  </Button>
                  <Button
                    size="small"
                    variant="contained"
                    startIcon={<Edit fontSize="small" />}
                    href={`/admin/lp/${pagina.slug}`}
                    sx={{ backgroundColor: "#BF360C", "&:hover": { backgroundColor: "#8f2809" } }}
                  >
                    Editar texto
                  </Button>
                </Box>
              </Paper>
            ))}
          </Stack>
        )}
      </Container>
    </AdminLayout>
  );
}
