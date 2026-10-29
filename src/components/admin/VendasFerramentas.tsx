"use client";

import { useState } from "react";
import {
  Alert,
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  MenuItem,
  TextField,
  Typography,
} from "@mui/material";
import { AddCircleOutlined, UploadFile } from "@mui/icons-material";
import { useRouter } from "next/navigation";

/**
 * Entradas de venda que não vieram do checkout (#191): balcão/marketplace
 * lançado na mão e histórico em planilha.
 *
 * As duas rotas gravam receita e custos; **nenhuma baixa estoque** — venda de
 * marketplace já saiu do estoque físico e histórico é passado.
 */

const CANAIS = [
  { id: "mercado_livre", rotulo: "Mercado Livre" },
  { id: "shopee", rotulo: "Shopee" },
  { id: "manual", rotulo: "Manual / balcão" },
  { id: "site", rotulo: "Site (fora do checkout)" },
];

export default function VendasFerramentas() {
  const router = useRouter();

  const [lancarAberto, setLancarAberto] = useState(false);
  const [importarAberto, setImportarAberto] = useState(false);
  const [erro, setErro] = useState("");
  const [ok, setOk] = useState("");
  const [salvando, setSalvando] = useState(false);
  const [texto, setTexto] = useState("");

  const [venda, setVenda] = useState({
    canal: "mercado_livre",
    data: new Date().toISOString().slice(0, 10),
    sku: "",
    quantidade: "1",
    valor: "",
    custo: "",
    frete: "0",
    comissao: "",
    impostoPercent: "",
    embalagem: "",
    ads: "0",
    id: "",
  });

  const limpar = () => {
    setErro("");
    setOk("");
  };

  const lancar = async () => {
    setSalvando(true);
    limpar();
    try {
      const res = await fetch("/api/admin/pedidos/venda", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          canal: venda.canal,
          data: venda.data,
          id: venda.id || null,
          frete: venda.frete,
          comissao: venda.comissao,
          impostoPercent: venda.impostoPercent,
          embalagem: venda.embalagem,
          ads: venda.ads,
          itens: [
            {
              sku: venda.sku,
              quantidade: Number(venda.quantidade) || 1,
              valor: venda.valor,
              custo: venda.custo === "" ? null : venda.custo,
            },
          ],
        }),
      });
      const d = await res.json();
      if (!res.ok) throw new Error(d?.error || "Não foi possível gravar a venda");
      setOk(d.mensagem);
      setLancarAberto(false);
      router.refresh();
    } catch (e) {
      setErro(e instanceof Error ? e.message : "Erro ao gravar");
    } finally {
      setSalvando(false);
    }
  };

  const importar = async () => {
    setSalvando(true);
    limpar();
    try {
      const res = await fetch("/api/admin/pedidos/importar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ texto }),
      });
      const d = await res.json();
      if (!res.ok) {
        const detalhe = Array.isArray(d?.erros) && d.erros.length
          ? ` Linha ${d.erros[0].linha}: ${d.erros[0].motivo}`
          : "";
        throw new Error((d?.error || "Não foi possível importar") + detalhe);
      }
      const recusadas = Array.isArray(d.recusadas) && d.recusadas.length
        ? ` Recusadas: ${d.recusadas.slice(0, 5).map((r: { linha: number; motivo: string }) => `${r.linha} (${r.motivo})`).join(", ")}`
        : "";
      setOk(d.mensagem + recusadas);
      setImportarAberto(false);
      router.refresh();
    } catch (e) {
      setErro(e instanceof Error ? e.message : "Erro ao importar");
    } finally {
      setSalvando(false);
    }
  };

  return (
    <>
      <Button
        variant="contained"
        startIcon={<AddCircleOutlined />}
        onClick={() => { limpar(); setLancarAberto(true); }}
        sx={{ backgroundColor: "#BF360C", "&:hover": { bgcolor: "#BF360C" }, textTransform: "none", fontWeight: 700 }}
      >
        Lançar venda
      </Button>
      <Button
        variant="outlined"
        startIcon={<UploadFile />}
        onClick={() => { limpar(); setImportarAberto(true); }}
        sx={{ textTransform: "none", borderColor: "#BF360C", color: "#BF360C" }}
      >
        Importar planilha
      </Button>

      {ok && <Alert severity="success" onClose={() => setOk("")} sx={{ width: "100%" }}>{ok}</Alert>}
      {erro && !lancarAberto && !importarAberto && (
        <Alert severity="error" onClose={() => setErro("")} sx={{ width: "100%" }}>{erro}</Alert>
      )}

      <Dialog open={lancarAberto} onClose={() => setLancarAberto(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 700 }}>Lançar venda</DialogTitle>
        <DialogContent>
          <Typography sx={{ fontSize: "0.8rem", color: "#666", mb: 2 }}>
            Venda que não passou pelo checkout. O custo vazio usa o custo do cadastro do produto.
            Esta ação <strong>não mexe no estoque</strong>.
          </Typography>
          <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" }, gap: 2 }}>
            <TextField select size="small" label="Canal" value={venda.canal}
              onChange={(e) => setVenda({ ...venda, canal: e.target.value })}>
              {CANAIS.map((c) => <MenuItem key={c.id} value={c.id}>{c.rotulo}</MenuItem>)}
            </TextField>
            <TextField size="small" label="Data da venda" type="date" value={venda.data}
              slotProps={{ inputLabel: { shrink: true } }}
              onChange={(e) => setVenda({ ...venda, data: e.target.value })} />
            <TextField size="small" label="SKU da peça" value={venda.sku}
              helperText="Precisa existir no catálogo"
              onChange={(e) => setVenda({ ...venda, sku: e.target.value.toUpperCase() })} />
            <TextField size="small" label="Quantidade" type="number" value={venda.quantidade}
              slotProps={{ htmlInput: { min: 1, step: 1 } }}
              onChange={(e) => setVenda({ ...venda, quantidade: e.target.value })} />
            <TextField size="small" label="Valor unitário (R$)" type="number" value={venda.valor}
              slotProps={{ htmlInput: { min: 0, step: 0.01 } }}
              onChange={(e) => setVenda({ ...venda, valor: e.target.value })} />
            <TextField size="small" label="Custo da peça (R$)" type="number" value={venda.custo}
              helperText="Vazio = usa o cadastro"
              slotProps={{ htmlInput: { min: 0, step: 0.01 } }}
              onChange={(e) => setVenda({ ...venda, custo: e.target.value })} />
            <TextField size="small" label="Comissão (R$)" type="number" value={venda.comissao}
              helperText="Vazio = usa o % do canal"
              slotProps={{ htmlInput: { min: 0, step: 0.01 } }}
              onChange={(e) => setVenda({ ...venda, comissao: e.target.value })} />
            <TextField size="small" label="Frete pago por você (R$)" type="number" value={venda.frete}
              slotProps={{ htmlInput: { min: 0, step: 0.01 } }}
              onChange={(e) => setVenda({ ...venda, frete: e.target.value })} />
            <TextField size="small" label="Imposto (%)" type="number" value={venda.impostoPercent}
              helperText="Vazio = usa a alíquota de Custos e mídia"
              slotProps={{ htmlInput: { min: 0, max: 100, step: 0.01 } }}
              onChange={(e) => setVenda({ ...venda, impostoPercent: e.target.value })} />
            <TextField size="small" label="Embalagem (R$)" type="number" value={venda.embalagem}
              slotProps={{ htmlInput: { min: 0, step: 0.01 } }}
              onChange={(e) => setVenda({ ...venda, embalagem: e.target.value })} />
            <TextField size="small" label="Ads (R$)" type="number" value={venda.ads}
              slotProps={{ htmlInput: { min: 0, step: 0.01 } }}
              onChange={(e) => setVenda({ ...venda, ads: e.target.value })} />
            <TextField size="small" label="Id do pedido no marketplace" value={venda.id}
              helperText="Evita duplicar na importação"
              onChange={(e) => setVenda({ ...venda, id: e.target.value })} />
          </Box>
          {erro && <Alert severity="error" sx={{ mt: 2 }}>{erro}</Alert>}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setLancarAberto(false)} sx={{ textTransform: "none" }}>Cancelar</Button>
          <Button variant="contained" onClick={lancar} disabled={salvando || !venda.valor || !venda.sku}
            sx={{ backgroundColor: "#BF360C", textTransform: "none", fontWeight: 700 }}>
            {salvando ? "Gravando…" : "Gravar venda"}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={importarAberto} onClose={() => setImportarAberto(false)} maxWidth="md" fullWidth>
        <DialogTitle sx={{ fontWeight: 700 }}>Importar vendas por planilha</DialogTitle>
        <DialogContent>
          <Typography sx={{ fontSize: "0.8rem", color: "#666", mb: 1 }}>
            Cole o CSV exportado do sistema atual, com a primeira linha de cabeçalho:
          </Typography>
          <Typography sx={{ fontSize: "0.72rem", fontFamily: "monospace", color: "#444", mb: 2 }}>
            data;canal;sku;quantidade;valor;comissao;frete;custo;imposto;embalagem;ads;id;cliente
          </Typography>
          <TextField
            multiline
            minRows={8}
            fullWidth
            value={texto}
            onChange={(e) => setTexto(e.target.value)}
            placeholder={"data;canal;sku;quantidade;valor;comissao;frete;custo;imposto;embalagem;ads;id\n2026-09-01;mercado_livre;AMO-007;1;799,00;120,00;35,00;550,00;31,96;1,00;20,00;ML123"}
          />
          <Typography sx={{ fontSize: "0.72rem", color: "#666", mt: 1 }}>
            Canal aceita <code>mercado_livre</code>, <code>shopee</code>, <code>site</code> ou{" "}
            <code>manual</code>. Com <code>id</code> preenchido, o mesmo pedido não entra duas vezes.
            <strong> Não mexe em estoque.</strong>
          </Typography>
          {erro && <Alert severity="error" sx={{ mt: 2 }}>{erro}</Alert>}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setImportarAberto(false)} sx={{ textTransform: "none" }}>Fechar</Button>
          <Button variant="contained" onClick={importar} disabled={salvando || texto.trim() === ""}
            sx={{ backgroundColor: "#BF360C", textTransform: "none", fontWeight: 700 }}>
            {salvando ? "Importando…" : "Importar"}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
