"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Divider,
  Paper,
  Tab,
  Tabs,
  TextField,
  Typography,
} from "@mui/material";
import { Lock, Storefront, CheckCircle, Schedule } from "@mui/icons-material";

interface Campo {
  chave: string;
  rotulo: string;
  tipo: "texto" | "senha" | "data";
  obrigatorio: boolean;
  ajuda?: string;
  placeholder?: string;
}

interface Canal {
  id: string;
  nome: string;
  doc: string;
  campos: Campo[];
}

interface Credencial {
  canal: string;
  campos: Record<string, string | boolean | null>;
  ativo: boolean;
  estado: "vazio" | "incompleto" | "vencido" | "ok";
  faltando: string[];
  atualizadoEm: string | null;
}

const ESTADO_LABEL: Record<Credencial["estado"], string> = {
  vazio: "sem cadastro",
  incompleto: "incompleto",
  vencido: "token vencido",
  ok: "completo",
};

const ESTADO_COR: Record<Credencial["estado"], "default" | "warning" | "error" | "success"> = {
  vazio: "default",
  incompleto: "warning",
  vencido: "error",
  ok: "success",
};

export default function CanaisAdmin() {
  const [canais, setCanais] = useState<Canal[]>([]);
  const [emBreve, setEmBreve] = useState<{ nome: string; nota: string }[]>([]);
  const [credenciais, setCredenciais] = useState<Credencial[]>([]);
  const [aba, setAba] = useState(0);
  const [valores, setValores] = useState<Record<string, Record<string, string>>>({});
  const [carregando, setCarregando] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState("");
  const [ok, setOk] = useState("");

  const carregar = async () => {
    const res = await fetch("/api/admin/canais");
    if (!res.ok) {
      setErro("Não foi possível carregar os canais");
      setCarregando(false);
      return;
    }
    const d = await res.json();
    setCanais(d.canais);
    setEmBreve(d.emBreve);
    setCredenciais(d.credenciais);

    // preenche só os campos não secretos
    const inicial: Record<string, Record<string, string>> = {};
    for (const c of d.canais as Canal[]) {
      const cred = (d.credenciais as Credencial[]).find((x) => x.canal === c.id);
      inicial[c.id] = {};
      for (const campo of c.campos) {
        if (campo.tipo === "senha") continue;
        const valor = cred?.campos?.[campo.chave];
        inicial[c.id][campo.chave] = valor === null || valor === undefined ? "" : String(valor);
      }
    }
    setValores(inicial);
    setCarregando(false);
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    carregar();
  }, []);

  const canalAtual = canais[aba];

  const credencialAtual = useMemo(
    () => credenciais.find((c) => c.canal === canalAtual?.id),
    [credenciais, canalAtual]
  );

  const salvar = async () => {
    if (!canalAtual) return;
    setSalvando(true);
    setErro("");
    setOk("");
    try {
      const corpo = { canal: canalAtual.id, ...valores[canalAtual.id] };
      const res = await fetch("/api/admin/canais", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(corpo),
      });
      const d = await res.json();
      if (!res.ok) throw new Error(d?.error || "Falha ao salvar");
      setOk(d.mensagem);
      await carregar();
    } catch (e) {
      setErro(e instanceof Error ? e.message : "Falha ao salvar");
    } finally {
      setSalvando(false);
    }
  };

  const remover = async () => {
    if (!canalAtual) return;
    if (!confirm(`Remover as credenciais de ${canalAtual.nome}?`)) return;
    const res = await fetch(`/api/admin/canais?canal=${canalAtual.id}`, { method: "DELETE" });
    if (res.ok) {
      setOk("Credenciais removidas.");
      await carregar();
    }
  };

  if (carregando) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", py: 6 }}>
        <CircularProgress size={28} />
      </Box>
    );
  }

  return (
    <Box>
      {erro && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setErro("")}>{erro}</Alert>}
      {ok && <Alert severity="success" sx={{ mb: 2 }} onClose={() => setOk("")}>{ok}</Alert>}

      <Alert severity="info" sx={{ mb: 3 }}>
        Aqui você <strong>cadastra</strong> as contas. A sincronização de anúncios e pedidos
        entra na próxima etapa — o cadastro fica pronto para quando ela rodar.
      </Alert>

      <Paper sx={{ borderRadius: 3, mb: 3 }}>
        <Tabs value={aba} onChange={(_, v) => setAba(v)} variant="scrollable" scrollButtons="auto">
          {canais.map((c) => (
            <Tab
              key={c.id}
              label={
                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                  <Storefront sx={{ fontSize: 18 }} />
                  {c.nome}
                  <Chip
                    size="small"
                    label={ESTADO_LABEL[credenciais.find((x) => x.canal === c.id)?.estado ?? "vazio"]}
                    color={ESTADO_COR[credenciais.find((x) => x.canal === c.id)?.estado ?? "vazio"]}
                    variant="outlined"
                    sx={{ height: 18, fontSize: "0.62rem" }}
                  />
                </Box>
              }
              sx={{ textTransform: "none", fontWeight: 600 }}
            />
          ))}
          <Tab
            label={
              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                Em breve
                <Chip size="small" label="sem integração" variant="outlined" sx={{ height: 18, fontSize: "0.62rem" }} />
              </Box>
            }
            sx={{ textTransform: "none", fontWeight: 600 }}
          />
        </Tabs>
        <Divider />

        <Box sx={{ p: 3 }}>
          {canalAtual ? (
            <>
              <Typography sx={{ fontWeight: 700, mb: 0.5 }}>{canalAtual.nome}</Typography>
              <Typography sx={{ fontSize: "0.8rem", color: "#666", mb: 2 }}>{canalAtual.doc}</Typography>

              {credencialAtual && credencialAtual.faltando.length > 0 && (
                <Typography sx={{ fontSize: "0.75rem", color: "#8a5200", mb: 2 }}>
                  Falta: {credencialAtual.faltando.join(", ")}
                </Typography>
              )}

              <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" }, gap: 2 }}>
                {canalAtual.campos.map((campo) => {
                  const jaTem = Boolean(
                    credencialAtual?.campos?.[`tem_${campo.chave}`] ?? false
                  );
                  return (
                    <TextField
                      key={campo.chave}
                      size="small"
                      label={`${campo.rotulo}${campo.obrigatorio ? "" : " (opcional)"}`}
                      type={campo.tipo === "senha" ? "password" : campo.tipo === "data" ? "date" : "text"}
                      value={valores[canalAtual.id]?.[campo.chave] ?? ""}
                      placeholder={campo.tipo === "senha" && jaTem ? "•••••• (salvo)" : campo.placeholder}
                      helperText={
                        campo.tipo === "senha" && jaTem
                          ? "Já salvo e cifrado. Deixe vazio para manter."
                          : campo.ajuda
                      }
                      onChange={(e) =>
                        setValores((v) => ({
                          ...v,
                          [canalAtual.id]: { ...v[canalAtual.id], [campo.chave]: e.target.value },
                        }))
                      }
                      slotProps={campo.tipo === "data" ? { inputLabel: { shrink: true } } : undefined}
                    />
                  );
                })}
              </Box>

              <Box sx={{ display: "flex", gap: 1, mt: 2.5, flexWrap: "wrap" }}>
                <Button
                  variant="contained"
                  onClick={salvar}
                  disabled={salvando}
                  sx={{ backgroundColor: "#BF360C", textTransform: "none", fontWeight: 700 }}
                >
                  {salvando ? "Salvando…" : "Salvar credenciais"}
                </Button>
                {credencialAtual && (
                  <Button onClick={remover} sx={{ textTransform: "none", color: "#b3261e" }}>
                    Remover
                  </Button>
                )}
              </Box>

              <Box sx={{ display: "flex", alignItems: "center", gap: 0.5, mt: 2 }}>
                <Lock sx={{ fontSize: 14, color: "#999" }} />
                <Typography sx={{ fontSize: "0.7rem", color: "#999" }}>
                  Tokens e chaves ficam cifrados (AES-256-GCM). A tela nunca devolve o valor salvo.
                </Typography>
              </Box>
            </>
          ) : (
            <Box>
              <Typography sx={{ fontWeight: 700, mb: 0.5 }}>Outros marketplaces</Typography>
              <Typography sx={{ fontSize: "0.8rem", color: "#666", mb: 2 }}>
                Ainda sem integração. Entram depois que o hub estiver pronto (#82).
              </Typography>
              <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" }, gap: 2 }}>
                {emBreve.map((c) => (
                  <Paper key={c.nome} sx={{ p: 2, borderRadius: 2, border: "1px dashed #ddd", backgroundColor: "#fafafa" }}>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                      <Schedule sx={{ fontSize: 16, color: "#999" }} />
                      <Typography sx={{ fontWeight: 600, fontSize: "0.875rem" }}>{c.nome}</Typography>
                      <Chip size="small" label="em breve" sx={{ height: 18, fontSize: "0.62rem" }} />
                    </Box>
                    <Typography sx={{ fontSize: "0.75rem", color: "#888", mt: 0.5 }}>{c.nota}</Typography>
                  </Paper>
                ))}
              </Box>
            </Box>
          )}
        </Box>
      </Paper>

      {credencialAtual?.estado === "ok" && (
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <CheckCircle sx={{ fontSize: 16, color: "#0E7A3F" }} />
          <Typography sx={{ fontSize: "0.78rem", color: "#555" }}>
            Credenciais completas. Sincronização ainda não está ligada — isso é o próximo passo.
          </Typography>
        </Box>
      )}
    </Box>
  );
}
