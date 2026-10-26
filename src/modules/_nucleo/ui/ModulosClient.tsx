"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Alert,
  Box,
  Chip,
  CircularProgress,
  Divider,
  Paper,
  Switch,
  Typography,
} from "@mui/material";
import { Lock, LockOpen } from "@mui/icons-material";
import type { IdModulo, Modulo } from "@/modules/registro";

/**
 * Liga/desliga dos módulos do sistema.
 *
 * A ideia é simples: o painel mostra o que a loja faz hoje e o que pode passar
 * a fazer. Módulo desligado não aparece no menu e as rotas dele respondem 404
 * — nada de tela pela metade.
 */

interface ModuloComEstado extends Modulo {
  ativo: boolean;
  faltando: IdModulo[];
}

export default function ModulosClient() {
  const router = useRouter();
  const [modulos, setModulos] = useState<ModuloComEstado[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [salvando, setSalvando] = useState<string | null>(null);
  const [erro, setErro] = useState("");
  const [aviso, setAviso] = useState("");

  useEffect(() => {
    fetch("/api/admin/modulos")
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error("Falha ao carregar"))))
      .then((d) => setModulos(d.modulos))
      .catch((e) => setErro(e.message))
      .finally(() => setCarregando(false));
  }, []);

  const alternar = async (modulo: ModuloComEstado, ativo: boolean) => {
    setSalvando(modulo.id);
    setErro("");
    try {
      const res = await fetch("/api/admin/modulos", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ [modulo.id]: ativo }),
      });
      const d = await res.json();
      if (!res.ok) throw new Error(d?.error || "Não foi possível salvar");

      // recarrega: o estado dos outros módulos muda junto (dependências)
      const atualizado = await fetch("/api/admin/modulos").then((r) => r.json());
      setModulos(atualizado.modulos);
      setAviso(
        ativo ? `"${modulo.nome}" ligado.` : `"${modulo.nome}" desligado.`
      );
      setTimeout(() => setAviso(""), 3000);
    } catch (e) {
      setErro(e instanceof Error ? e.message : "Não foi possível salvar");
    } finally {
      setSalvando(null);
    }
  };

  if (carregando) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", py: 6 }}>
        <CircularProgress size={28} />
      </Box>
    );
  }

  const grupos: Array<{ titulo: string; itens: ModuloComEstado[] }> = [
    { titulo: "No ar hoje", itens: modulos.filter((m) => m.ativo) },
    { titulo: "Disponíveis para ligar", itens: modulos.filter((m) => !m.ativo) },
  ];

  return (
    <Box>
      {erro && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setErro("")}>
          {erro}
        </Alert>
      )}
      {aviso && (
        <Alert severity="success" sx={{ mb: 2 }} onClose={() => setAviso("")}>
          {aviso}
        </Alert>
      )}

      {grupos.map((grupo) =>
        grupo.itens.length === 0 ? null : (
          <Box key={grupo.titulo} sx={{ mb: 4 }}>
            <Typography
              variant="overline"
              sx={{ color: "#666", fontWeight: 700, letterSpacing: "0.08em" }}
            >
              {grupo.titulo} ({grupo.itens.length})
            </Typography>

            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: { xs: "1fr", md: "repeat(2, 1fr)" },
                gap: 2,
                mt: 1,
              }}
            >
              {grupo.itens.map((m) => {
                const travado = Boolean(m.essencial);
                const bloqueadoPorDependencia = m.faltando.length > 0;
                const podeLigar = !bloqueadoPorDependencia;

                return (
                  <Paper
                    key={m.id}
                    sx={{
                      p: 2.5,
                      borderRadius: 3,
                      border: "1px solid",
                      borderColor: m.ativo ? "#BF360C22" : "#eee",
                      backgroundColor: m.ativo ? "#fffaf8" : "#fff",
                      display: "flex",
                      flexDirection: "column",
                      gap: 1,
                      opacity: !m.ativo && bloqueadoPorDependencia ? 0.75 : 1,
                    }}
                  >
                    <Box sx={{ display: "flex", alignItems: "flex-start", gap: 1 }}>
                      <Box sx={{ flex: 1 }}>
                        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                          <Typography sx={{ fontWeight: 700, fontSize: "0.95rem" }}>
                            {m.nome}
                          </Typography>
                          {travado && (
                            <Chip
                              size="small"
                              icon={<Lock sx={{ fontSize: "12px !important" }} />}
                              label="essencial"
                              variant="outlined"
                            />
                          )}
                          {m.issue && (
                            <Chip
                              size="small"
                              label={`#${m.issue}`}
                              variant="outlined"
                              sx={{ color: "#888", fontSize: "0.65rem" }}
                            />
                          )}
                        </Box>
                        <Typography sx={{ fontSize: "0.8125rem", color: "#666", mt: 0.5, lineHeight: 1.5 }}>
                          {m.descricao}
                        </Typography>
                      </Box>

                      <Switch
                        checked={m.ativo}
                        disabled={travado || salvando === m.id || (!m.ativo && !podeLigar)}
                        onChange={(e) => alternar(m, e.target.checked)}
                        sx={{
                          "& .MuiSwitch-switchBase.Mui-checked": { color: "#BF360C" },
                          "& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track": {
                            backgroundColor: "#BF360C",
                          },
                        }}
                      />
                    </Box>

                    {travado && (
                      <Typography sx={{ fontSize: "0.7rem", color: "#999" }}>
                        Sem ele a loja não vende — por isso não desliga.
                      </Typography>
                    )}

                    {!travado && bloqueadoPorDependencia && (
                      <Typography sx={{ fontSize: "0.7rem", color: "#B26A00" }}>
                        Precisa ligar antes:{" "}
                        {m.faltando
                          .map((d) => modulos.find((x) => x.id === d)?.nome ?? d)
                          .join(", ")}
                      </Typography>
                    )}

                    {m.telas.length > 0 && (
                      <Box sx={{ display: "flex", gap: 0.5, flexWrap: "wrap", mt: "auto", pt: 1 }}>
                        {m.telas.map((t) => (
                          <Chip
                            key={t.rota}
                            size="small"
                            label={t.rotulo}
                            variant="outlined"
                            onClick={m.ativo ? () => router.push(t.rota) : undefined}
                            sx={{
                              fontSize: "0.65rem",
                              color: m.ativo ? "#444" : "#bbb",
                              cursor: m.ativo ? "pointer" : "default",
                            }}
                          />
                        ))}
                      </Box>
                    )}
                  </Paper>
                );
              })}
            </Box>
          </Box>
        )
      )}

      <Divider sx={{ my: 3 }} />

      <Box sx={{ display: "flex", gap: 1, alignItems: "center", flexWrap: "wrap" }}>
        <LockOpen sx={{ fontSize: 18, color: "#999" }} />
        <Typography sx={{ fontSize: "0.75rem", color: "#888" }}>
          Módulo desligado não aparece no menu e as telas dele respondem 404. Nada é apagado:
          os dados continuam no banco para quando você religar.
        </Typography>
      </Box>
    </Box>
  );
}
