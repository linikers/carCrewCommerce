"use client";

import { useEffect, useRef, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Container,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  FormControlLabel,
  IconButton,
  Paper,
  Slide,
  Snackbar,
  Stack,
  Switch,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import {
  Add,
  ArrowDownward,
  ArrowUpward,
  Delete,
  DragIndicator,
  OpenInNew,
  Save,
} from "@mui/icons-material";
import AdminLayout from "@/components/admin/AdminLayout";
import { serializar, useAlteracoesNaoSalvas } from "@/lib/useAlteracoesNaoSalvas";
import type { FaqItem } from "@/lib/faq-conteudo";

/**
 * Editor do FAQ (#181).
 *
 * Mesmo padrão da tela de menu: cada ação dá aviso, o item novo aparece na tela
 * e o Salvar fica sempre à mão no celular. Campo vazio no questionário salvo
 * não volta ao texto do código — o FAQ é lista, então remover = remover.
 */
export default function AdminFaqPage() {
  const [itens, setItens] = useState<FaqItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [msg, setMsg] = useState("");
  const [erro, setErro] = useState("");
  const [aviso, setAviso] = useState("");
  const [destaque, setDestaque] = useState<string | null>(null);
  const [remover, setRemover] = useState<string | null>(null);
  /** JSON do que veio do banco: base do aviso de alteração não salva (#183). */
  const [snapshot, setSnapshot] = useState("");

  useEffect(() => {
    fetch("/api/admin/faq")
      .then((r) => r.json())
      .then((d) => {
        const lista = Array.isArray(d?.itens) ? d.itens : [];
        setItens(lista);
        setSnapshot(serializar(lista));
      })
      .catch(() => setErro("Não foi possível carregar o FAQ."))
      .finally(() => setLoading(false));
  }, []);

  // Rola até a pergunta recém-criada e coloca o cursor nela.
  useEffect(() => {
    if (!destaque) return;
    const el = document.getElementById(`faq-${destaque}`);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "center" });
      (el.querySelector("input") as HTMLInputElement | null)?.focus({ preventScroll: true });
    }
    const t = setTimeout(() => setDestaque(null), 4000);
    return () => clearTimeout(t);
  }, [destaque]);

  const alterar = (id: string, campo: keyof FaqItem, valor: string | boolean) => {
    setItens((atual) => atual.map((i) => (i.id === id ? { ...i, [campo]: valor } : i)));
    setMsg("");
    setErro("");
  };

  const mover = (indice: number, direcao: -1 | 1) => {
    setItens((atual) => {
      const lista = [...atual];
      const destino = indice + direcao;
      if (destino < 0 || destino >= lista.length) return atual;
      [lista[indice], lista[destino]] = [lista[destino], lista[indice]];
      return lista.map((i, n) => ({ ...i, ordem: n }));
    });
    setMsg("");
  };

  // Reordenar arrastando (#183 parte 2). As setas continuam para quem prefere
  // clique — arrastar é atalho, não substituto.
  const [arrastando, setArrastando] = useState<number | null>(null);
  const [sobre, setSobre] = useState<number | null>(null);
  // A origem fica em ref: eventos de arrasto podem cair no mesmo tick e o
  // state ainda não teria commitado quando o drop chega.
  const origemArrasto = useRef<number | null>(null);

  const reordenar = (de: number, para: number) => {
    if (de === para) return;
    setItens((atual) => {
      const lista = [...atual];
      const [item] = lista.splice(de, 1);
      lista.splice(para, 0, item);
      return lista.map((i, n) => ({ ...i, ordem: n }));
    });
    setMsg("");
  };

  const adicionar = () => {
    const id = `faq-${Date.now()}`;
    setItens((atual) => [
      ...atual,
      { id, pergunta: "", resposta: "", ativo: true, ordem: atual.length },
    ]);
    setDestaque(id);
    setAviso("Pergunta adicionada. Preencha pergunta e resposta e clique em Salvar.");
  };

  const excluir = (id: string) => {
    setItens((atual) =>
      atual.filter((i) => i.id !== id).map((i, n) => ({ ...i, ordem: n }))
    );
    setRemover(null);
    setAviso("Pergunta removida. Clique em Salvar para aplicar no site.");
  };

  const salvar = async () => {
    setSalvando(true);
    setErro("");
    setMsg("");
    try {
      const res = await fetch("/api/admin/faq", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ itens }),
      });
      const dados = await res.json();
      if (!res.ok) throw new Error(dados?.error || "Não foi possível salvar.");
      setItens(dados.itens ?? itens);
      setSnapshot(serializar(dados.itens ?? itens));
      setMsg("FAQ salvo. A página /faq já está usando este conteúdo.");
    } catch (e) {
      setErro(e instanceof Error ? e.message : "Não foi possível salvar.");
    } finally {
      setSalvando(false);
    }
  };

  // Avisa antes de sair com alteração pendente (#183).
  useAlteracoesNaoSalvas(snapshot !== "" && serializar(itens) !== snapshot);

  const ativos = itens.filter((i) => i.ativo).length;

  return (
    <AdminLayout title="FAQ">
      <Container maxWidth="md" sx={{ pt: { xs: 2, md: 4 }, pb: { xs: 12, md: 4 } }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 2, flexWrap: "wrap", mb: 1 }}>
          <Typography variant="h5" sx={{ fontWeight: 800 }}>
            FAQ
          </Typography>
          <Chip size="small" label={`${ativos} no ar`} sx={{ backgroundColor: "#E8F5E9", color: "#1B5E20", fontWeight: 600 }} />
          <Box sx={{ flex: 1 }} />
          <Button
            size="small"
            endIcon={<OpenInNew fontSize="small" />}
            href="/faq"
            target="_blank"
            sx={{ color: "#BF360C", textTransform: "none" }}
          >
            Ver o FAQ
          </Button>
          <Button
            size="small"
            variant="contained"
            startIcon={<Save fontSize="small" />}
            onClick={salvar}
            disabled={salvando || loading}
            sx={{ minHeight: 44, backgroundColor: "#BF360C", "&:hover": { backgroundColor: "#8f2809" }, textTransform: "none" }}
          >
            Salvar
          </Button>
        </Box>

        <Typography variant="body2" sx={{ color: "#666", mb: 3 }}>
          Perguntas e respostas da página /faq. Ao desligar uma pergunta ela sai da página e
          do dados estruturados do Google, sem apagar o texto. No texto da resposta você pode
          usar <strong>{"{{telefone}}"}</strong> para o telefone do cadastro da empresa aparecer
          sozinho.
        </Typography>

        {msg && <Alert severity="success" sx={{ mb: 2 }}>{msg}</Alert>}
        {erro && <Alert severity="error" sx={{ mb: 2 }}>{erro}</Alert>}

        {loading ? (
          <Box sx={{ display: "flex", justifyContent: "center", py: 6 }}>
            <CircularProgress />
          </Box>
        ) : (
          <>
            <Stack spacing={2}>
            <Typography
              variant="caption"
              sx={{ display: { xs: "block", md: "none" }, color: "#777", mb: 1 }}
            >
              No celular, use as setas ↑ ↓ para mudar a ordem.
            </Typography>
              {itens.map((item, indice) => (
                <Paper
                  key={item.id}
                  id={`faq-${item.id}`}
                  sx={{
                    p: 2.5,
                    borderRadius: 2,
                    border: destaque === item.id ? "2px solid #BF360C" : "1px solid #eee",
                    backgroundColor: destaque === item.id ? "#FFF3E0" : "#fff",
                    transition: "border-color .2s ease, background-color .2s ease",
                  }}
                >
                  <Box
                  draggable
                  onDragStart={(e) => {
                    origemArrasto.current = indice;
                    setArrastando(indice);
                    e.dataTransfer.effectAllowed = "move";
                  }}
                  onDragOver={(e) => {
                    e.preventDefault();
                    e.dataTransfer.dropEffect = "move";
                  }}
                  onDragEnter={() => setSobre(indice)}
                  onDrop={(e) => {
                    e.preventDefault();
                    if (origemArrasto.current !== null) {
                      reordenar(origemArrasto.current, indice);
                    }
                    origemArrasto.current = null;
                    setArrastando(null);
                    setSobre(null);
                  }}
                  onDragEnd={() => {
                    origemArrasto.current = null;
                    setArrastando(null);
                    setSobre(null);
                  }}
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    gap: 0.5,
                    mb: 1.5,
                    cursor: "grab",
                    opacity: arrastando === indice ? 0.5 : 1,
                    borderTop: sobre === indice && arrastando !== null ? "2px dashed #BF360C" : "2px solid transparent",
                    pt: 0.5,
                  }}
                >
                    <Tooltip title="Arraste para reordenar (no computador)">
                      <DragIndicator
                        sx={{ display: { xs: "none", md: "block" }, fontSize: 20, color: "#8d8d8d" }}
                      />
                    </Tooltip>
                    <Chip
                      size="small"
                      label={item.ativo ? "no ar" : "desligada"}
                      sx={{
                        backgroundColor: item.ativo ? "#E8F5E9" : "#EEEEEE",
                        color: item.ativo ? "#1B5E20" : "#555",
                        fontWeight: 600,
                      }}
                    />
                    <Box sx={{ flex: 1 }} />
                    <Tooltip title="Subir">
                      <span>
                        <IconButton
                          size="small"
                          aria-label="Subir pergunta"
                          disabled={indice === 0}
                          onClick={() => mover(indice, -1)}
                          sx={{ width: 44, height: 44 }}
                        >
                          <ArrowUpward fontSize="small" />
                        </IconButton>
                      </span>
                    </Tooltip>
                    <Tooltip title="Descer">
                      <span>
                        <IconButton
                          size="small"
                          aria-label="Descer pergunta"
                          disabled={indice === itens.length - 1}
                          onClick={() => mover(indice, 1)}
                          sx={{ width: 44, height: 44 }}
                        >
                          <ArrowDownward fontSize="small" />
                        </IconButton>
                      </span>
                    </Tooltip>
                    <Tooltip title="Remover pergunta">
                      <IconButton
                        size="small"
                        color="error"
                        aria-label="Remover pergunta"
                        onClick={() => setRemover(item.id)}
                        sx={{ width: 44, height: 44 }}
                      >
                        <Delete fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </Box>

                  <TextField
                    label="Pergunta"
                    size="small"
                    fullWidth
                    value={item.pergunta}
                    onChange={(e) => alterar(item.id, "pergunta", e.target.value)}
                    placeholder="Vocês entregam para todo o Brasil?"
                  />
                  <TextField
                    label="Resposta"
                    size="small"
                    fullWidth
                    multiline
                    minRows={3}
                    sx={{ mt: 2 }}
                    value={item.resposta}
                    onChange={(e) => alterar(item.id, "resposta", e.target.value)}
                    helperText="Pode usar {{telefone}} para o número da empresa entrar sozinho"
                  />
                  <FormControlLabel
                    sx={{ mt: 1 }}
                    control={
                      <Switch
                        checked={item.ativo}
                        onChange={(e) => alterar(item.id, "ativo", e.target.checked)}
                      />
                    }
                    label="Aparecer na página"
                  />
                </Paper>
              ))}
            </Stack>

            <Divider sx={{ my: 3 }} />

            <Button
              startIcon={<Add />}
              onClick={adicionar}
              variant="contained"
              sx={{
                textTransform: "none",
                backgroundColor: "#BF360C",
                "&:hover": { backgroundColor: "#8f2809" },
                width: { xs: "100%", sm: "auto" },
                minHeight: 44,
              }}
            >
              Adicionar pergunta
            </Button>
            <Typography variant="caption" sx={{ display: "block", color: "#666", mt: 1 }}>
              A página /faq atualiza na próxima visita, sem deploy.
            </Typography>
          </>
        )}
      </Container>

      <Snackbar
        open={Boolean(aviso)}
        autoHideDuration={6000}
        onClose={() => setAviso("")}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
        slots={{ transition: Slide }}
        sx={{ mb: { xs: 9, md: 0 } }}
      >
        <Alert severity="info" onClose={() => setAviso("")} sx={{ width: "100%" }}>
          {aviso}
        </Alert>
      </Snackbar>

      {/* Salvar sempre à mão no celular */}
      <Box
        sx={{
          display: { xs: "flex", md: "none" },
          position: "fixed",
          bottom: 0,
          left: 0,
          right: 0,
          p: 1.5,
          backgroundColor: "#fff",
          borderTop: "1px solid #eee",
          boxShadow: "0 -4px 14px rgba(0,0,0,0.06)",
          zIndex: 1200,
        }}
      >
        <Button
          fullWidth
          variant="contained"
          startIcon={<Save />}
          onClick={salvar}
          disabled={salvando || loading}
          sx={{ backgroundColor: "#BF360C", "&:hover": { backgroundColor: "#8f2809" }, minHeight: 48, textTransform: "none" }}
        >
          {salvando ? "Salvando..." : "Salvar FAQ"}
        </Button>
      </Box>

      <Dialog open={remover !== null} onClose={() => setRemover(null)}>
        <DialogTitle>Remover esta pergunta?</DialogTitle>
        <DialogContent>
          <Typography variant="body2">
            A pergunta sai da lista. Se a ideia é esconder por um tempo, use a chave
            &quot;Aparecer na página&quot; — o texto fica guardado.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setRemover(null)}>Cancelar</Button>
          <Button color="error" onClick={() => remover && excluir(remover)}>
            Remover
          </Button>
        </DialogActions>
      </Dialog>
    </AdminLayout>
  );
}
