"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Divider,
  MenuItem,
  Paper,
  Switch,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
  FormControlLabel,
} from "@mui/material";
import { WarningAmber, VerifiedUser, Lock } from "@mui/icons-material";

interface Empresa {
  razaoSocial: string;
  nomeFantasia: string | null;
  cnpj: string;
  ie: string | null;
  im: string | null;
  crt: number;
  cep: string | null;
  logradouro: string | null;
  numero: string | null;
  bairro: string | null;
  cidade: string | null;
  uf: string | null;
  telefone: string | null;
  email: string | null;
  ambiente: string;
  serie: number;
  proximoNumero: number;
  certificadoNome: string | null;
  certificadoValidade: string | null;
}

interface Politica {
  emitirSite: boolean;
  emitirMarketplace: boolean;
  emitirPdv: boolean;
  ambiente: "homologacao" | "producao";
  momento: "pagamento_confirmado" | "criacao";
}

interface Pendencia {
  produtoId: number;
  nome: string;
  sku: string | null;
  faltando: string[];
}

const VAZIA: Empresa = {
  razaoSocial: "",
  nomeFantasia: "",
  cnpj: "",
  ie: "",
  im: "",
  crt: 1,
  cep: "",
  logradouro: "",
  numero: "",
  bairro: "",
  cidade: "",
  uf: "",
  telefone: "",
  email: "",
  ambiente: "homologacao",
  serie: 1,
  proximoNumero: 1,
  certificadoNome: "",
  certificadoValidade: null,
};

export default function FiscalAdmin() {
  const router = useRouter();
  const [empresa, setEmpresa] = useState<Empresa>(VAZIA);
  const [politica, setPolitica] = useState<Politica>({
    emitirSite: false,
    emitirMarketplace: true,
    emitirPdv: false,
    ambiente: "homologacao",
    momento: "pagamento_confirmado",
  });
  const [pendencias, setPendencias] = useState<Pendencia[]>([]);
  const [status, setStatus] = useState({
    cadastroCompleto: false,
    certificadoValido: false,
    podeEmitir: false,
    totalPendencias: 0,
  });
  const [carregando, setCarregando] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState("");
  const [ok, setOk] = useState("");

  const carregar = async () => {
    const res = await fetch("/api/admin/fiscal");
    if (!res.ok) {
      setErro("Não foi possível carregar o cadastro fiscal");
      setCarregando(false);
      return;
    }
    const d = await res.json();
    if (d.empresa) setEmpresa({ ...VAZIA, ...d.empresa });
    setPolitica(d.politica);
    setPendencias(d.pendencias);
    setStatus(d.status);
    setCarregando(false);
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    carregar();
  }, []);

  const salvarEmpresa = async () => {
    setSalvando(true);
    setErro("");
    setOk("");
    try {
      const res = await fetch("/api/admin/fiscal", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(empresa),
      });
      const d = await res.json();
      if (!res.ok) throw new Error(d?.error || "Falha ao salvar");
      setOk("Cadastro salvo.");
      await carregar();
    } catch (e) {
      setErro(e instanceof Error ? e.message : "Falha ao salvar");
    } finally {
      setSalvando(false);
    }
  };

  const alternar = async (campo: "emitirSite" | "emitirMarketplace" | "emitirPdv", valor: boolean) => {
    setPolitica({ ...politica, [campo]: valor });
    try {
      const res = await fetch("/api/admin/fiscal/politica", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ [campo]: valor }),
      });
      if (!res.ok) throw new Error("Falha ao salvar a política");
      setOk(
        campo === "emitirSite"
          ? valor
            ? "Emissão para vendas no site ligada."
            : "Emissão para vendas no site desligada."
          : "Política atualizada."
      );
      setTimeout(() => setOk(""), 3000);
    } catch {
      setErro("Não foi possível salvar a política");
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

      {/* Situação para emitir */}
      <Paper sx={{ p: 2.5, borderRadius: 3, mb: 3, backgroundColor: status.podeEmitir ? "#f4faf6" : "#fffaf8", border: "1px solid #eee" }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1 }}>
          {status.podeEmitir ? <VerifiedUser sx={{ color: "#0E7A3F" }} /> : <WarningAmber sx={{ color: "#B26A00" }} />}
          <Typography sx={{ fontWeight: 700 }}>
            {status.podeEmitir ? "Pronto para emitir" : "Ainda não é possível emitir"}
          </Typography>
        </Box>
        <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
          <Chip size="small" label={status.cadastroCompleto ? "Cadastro completo" : "Cadastro incompleto"} color={status.cadastroCompleto ? "success" : "warning"} variant="outlined" />
          <Chip size="small" label={status.certificadoValido ? "Certificado válido" : "Sem certificado A1"} color={status.certificadoValido ? "success" : "default"} variant="outlined" />
          <Chip size="small" label={`${status.totalPendencias} peça(s) sem dados fiscais`} color={status.totalPendencias > 0 ? "warning" : "success"} variant="outlined" />
        </Box>
        <Typography sx={{ fontSize: "0.78rem", color: "#777", mt: 1.5 }}>
          Cadastrar aqui não emite nada. A emissão depende da política abaixo e do
          certificado — e o transmissor entra na próxima etapa.
        </Typography>
      </Paper>

      {/* Política de emissão */}
      <Paper sx={{ p: 2.5, borderRadius: 3, mb: 3 }}>
        <Typography sx={{ fontWeight: 700, mb: 0.5 }}>Quando emitir nota</Typography>
        <Typography sx={{ fontSize: "0.8rem", color: "#666", mb: 2 }}>
          Cada canal tem sua chave. Venda no site é opcional; marketplace emite por padrão
          porque sem nota o repasse fica travado.
        </Typography>

        <Box sx={{ display: "flex", flexDirection: "column", gap: 0.5 }}>
          <FormControlLabel
            control={<Switch checked={politica.emitirSite} onChange={(e) => alternar("emitirSite", e.target.checked)} />}
            label={
              <Box>
                <Typography sx={{ fontSize: "0.875rem", fontWeight: 600 }}>Venda na loja própria</Typography>
                <Typography sx={{ fontSize: "0.72rem", color: "#777" }}>
                  Desligado: o pedido fica na fila e você emite quando quiser.
                </Typography>
              </Box>
            }
          />
          <FormControlLabel
            control={<Switch checked={politica.emitirMarketplace} onChange={(e) => alternar("emitirMarketplace", e.target.checked)} />}
            label={
              <Box>
                <Typography sx={{ fontSize: "0.875rem", fontWeight: 600 }}>Venda em marketplace (Shopee, Mercado Livre)</Typography>
                <Typography sx={{ fontSize: "0.72rem", color: "#777" }}>
                  Ligado por padrão. Marketplace exige nota para liberar o repasse.
                </Typography>
              </Box>
            }
          />
          <FormControlLabel
            disabled
            control={<Switch checked={politica.emitirPdv} />}
            label={
              <Box>
                <Typography sx={{ fontSize: "0.875rem", fontWeight: 600, color: "#999" }}>
                  Venda no balcão (PDV) — em breve
                </Typography>
              </Box>
            }
          />
        </Box>

        <Divider sx={{ my: 2 }} />

        <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" }, gap: 2 }}>
          <TextField
            select
            size="small"
            label="Ambiente"
            value={politica.ambiente}
            onChange={(e) => {
              const ambiente = e.target.value as Politica["ambiente"];
              setPolitica({ ...politica, ambiente });
              fetch("/api/admin/fiscal/politica", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ ambiente }),
              });
            }}
            helperText="Homologação não tem valor fiscal — use para testar"
          >
            <MenuItem value="homologacao">Homologação (teste)</MenuItem>
            <MenuItem value="producao">Produção (vale como nota)</MenuItem>
          </TextField>

          <TextField
            select
            size="small"
            label="Momento da emissão"
            value={politica.momento}
            onChange={(e) => {
              const momento = e.target.value as Politica["momento"];
              setPolitica({ ...politica, momento });
              fetch("/api/admin/fiscal/politica", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ momento }),
              });
            }}
            helperText="Emitir na criação pode gerar nota de pedido não pago"
          >
            <MenuItem value="pagamento_confirmado">Depois do pagamento confirmado</MenuItem>
            <MenuItem value="criacao">Na criação do pedido</MenuItem>
          </TextField>
        </Box>
      </Paper>

      {/* Empresa */}
      <Paper sx={{ p: 2.5, borderRadius: 3, mb: 3 }}>
        <Typography sx={{ fontWeight: 700, mb: 0.5 }}>Dados da empresa</Typography>
        <Typography sx={{ fontSize: "0.8rem", color: "#666", mb: 2 }}>
          Vão no cabeçalho da nota. CNPJ é validado pelo dígito verificador.
        </Typography>

        <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "2fr 1fr" }, gap: 2 }}>
          <TextField size="small" label="Razão social" value={empresa.razaoSocial} onChange={(e) => setEmpresa({ ...empresa, razaoSocial: e.target.value })} />
          <TextField size="small" label="CNPJ" value={empresa.cnpj} placeholder="00.000.000/0000-00" onChange={(e) => setEmpresa({ ...empresa, cnpj: e.target.value })} />
          <TextField size="small" label="Nome fantasia" value={empresa.nomeFantasia || ""} onChange={(e) => setEmpresa({ ...empresa, nomeFantasia: e.target.value })} />
          <TextField size="small" label="Inscrição estadual (IE)" value={empresa.ie || ""} onChange={(e) => setEmpresa({ ...empresa, ie: e.target.value })} />
          <TextField size="small" label="Inscrição municipal (IM)" value={empresa.im || ""} onChange={(e) => setEmpresa({ ...empresa, im: e.target.value })} />
          <TextField select size="small" label="Regime (CRT)" value={empresa.crt} onChange={(e) => setEmpresa({ ...empresa, crt: Number(e.target.value) })}>
            <MenuItem value={1}>1 — Simples Nacional</MenuItem>
            <MenuItem value={2}>2 — Simples, excesso de sublimite</MenuItem>
            <MenuItem value={3}>3 — Regime Normal</MenuItem>
          </TextField>
          <TextField size="small" label="CEP" value={empresa.cep || ""} onChange={(e) => setEmpresa({ ...empresa, cep: e.target.value })} />
          <TextField size="small" label="Logradouro" value={empresa.logradouro || ""} onChange={(e) => setEmpresa({ ...empresa, logradouro: e.target.value })} />
          <TextField size="small" label="Número" value={empresa.numero || ""} onChange={(e) => setEmpresa({ ...empresa, numero: e.target.value })} />
          <TextField size="small" label="Bairro" value={empresa.bairro || ""} onChange={(e) => setEmpresa({ ...empresa, bairro: e.target.value })} />
          <TextField size="small" label="Cidade" value={empresa.cidade || ""} onChange={(e) => setEmpresa({ ...empresa, cidade: e.target.value })} />
          <TextField size="small" label="UF" value={empresa.uf || ""} onChange={(e) => setEmpresa({ ...empresa, uf: e.target.value.toUpperCase().slice(0, 2) })} />
          <TextField size="small" label="Telefone" value={empresa.telefone || ""} onChange={(e) => setEmpresa({ ...empresa, telefone: e.target.value })} />
          <TextField size="small" label="E-mail fiscal" value={empresa.email || ""} onChange={(e) => setEmpresa({ ...empresa, email: e.target.value })} />
        </Box>

        <Typography sx={{ fontWeight: 700, mt: 3, mb: 1 }}>Numeração</Typography>
        <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" }, gap: 2 }}>
          <TextField size="small" type="number" label="Série" value={empresa.serie} onChange={(e) => setEmpresa({ ...empresa, serie: Number(e.target.value) })} />
          <TextField size="small" type="number" label="Próximo número" value={empresa.proximoNumero} onChange={(e) => setEmpresa({ ...empresa, proximoNumero: Number(e.target.value) })} />
        </Box>

        <Typography sx={{ fontWeight: 700, mt: 3, mb: 1 }}>Certificado A1</Typography>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1.5 }}>
          <Lock sx={{ fontSize: 16, color: "#888" }} />
          <Typography sx={{ fontSize: "0.75rem", color: "#777" }}>
            O arquivo .pfx e a senha ficam nos segredos do deploy — nunca no banco nem no
            repositório. Aqui registramos só nome e validade para avisar quando vencer.
          </Typography>
        </Box>
        <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" }, gap: 2 }}>
          <TextField size="small" label="Nome do arquivo" placeholder="certificado-carcrew.pfx" value={empresa.certificadoNome || ""} onChange={(e) => setEmpresa({ ...empresa, certificadoNome: e.target.value })} />
          <TextField
            size="small"
            type="date"
            label="Validade"
            value={empresa.certificadoValidade ? String(empresa.certificadoValidade).slice(0, 10) : ""}
            onChange={(e) => setEmpresa({ ...empresa, certificadoValidade: e.target.value || null })}
            slotProps={{ inputLabel: { shrink: true } }}
          />
        </Box>

        <Button
          variant="contained"
          onClick={salvarEmpresa}
          disabled={salvando}
          sx={{ mt: 2.5, backgroundColor: "#BF360C", textTransform: "none", fontWeight: 700 }}
        >
          {salvando ? "Salvando…" : "Salvar cadastro"}
        </Button>
      </Paper>

      {/* Pendências */}
      <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 0.5 }}>
        Peças sem dados fiscais ({pendencias.length})
      </Typography>
      <Typography sx={{ fontSize: "0.78rem", color: "#777", mb: 1.5 }}>
        Sem NCM e CFOP a peça não entra em nota. Clique para abrir e preencher.
      </Typography>

      <TableContainer component={Paper} sx={{ borderRadius: 3 }}>
        <Table size="small">
          <TableHead>
            <TableRow sx={{ backgroundColor: "#f5f5f5" }}>
              <TableCell sx={{ fontWeight: 600 }}>SKU</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Peça</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Falta</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {pendencias.slice(0, 30).map((p) => (
              <TableRow key={p.produtoId} hover onClick={() => router.push(`/admin/produtos/${p.produtoId}/edit`)} sx={{ cursor: "pointer" }}>
                <TableCell sx={{ fontFamily: "monospace", fontSize: "0.75rem" }}>{p.sku || "—"}</TableCell>
                <TableCell sx={{ maxWidth: 420, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{p.nome}</TableCell>
                <TableCell>
                  {p.faltando.map((f) => (
                    <Chip key={f} size="small" label={f} sx={{ mr: 0.5, fontSize: "0.65rem" }} variant="outlined" />
                  ))}
                </TableCell>
              </TableRow>
            ))}
            {pendencias.length === 0 && (
              <TableRow>
                <TableCell colSpan={3} sx={{ py: 3, textAlign: "center", color: "#666" }}>
                  Nenhuma pendência — todas as peças ativas têm dados fiscais.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>
      {pendencias.length > 30 && (
        <Typography sx={{ fontSize: "0.72rem", color: "#888", mt: 1 }}>
          Mostrando 30 de {pendencias.length}. Use a busca de produtos para editar as demais.
        </Typography>
      )}
    </Box>
  );
}
