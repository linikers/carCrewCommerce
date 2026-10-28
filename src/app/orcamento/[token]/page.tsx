import { notFound } from "next/navigation";
import { lerContatoEmpresa } from "@/lib/empresa";
import type { Metadata } from "next";
import { Box, Button, Container, Divider, Paper, Typography } from "@mui/material";
import { lerOrcamentoPublico } from "@/modules/os/dados/os";
import { TIPO_ITEM_LABEL } from "@/modules/os/dominio/os";
import DecisaoOrcamento from "@/modules/os/ui/DecisaoOrcamento";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Orçamento — Car Crew Garage",
  robots: { index: false, follow: false },
};

function brl(valor: number) {
  return valor.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function data(valor: Date | string) {
  return new Date(valor).toLocaleDateString("pt-BR");
}

export default async function OrcamentoPage(props: { params: Promise<{ token: string }> }) {
  const contato = await lerContatoEmpresa();
  const { token } = await props.params;
  const orcamento = await lerOrcamentoPublico(token);

  if (!orcamento) notFound();

  const respondido = !!orcamento.aprovadoEm;

  return (
    <Container maxWidth="sm" sx={{ py: { xs: 4, sm: 8 } }}>
      <Typography sx={{ fontSize: "0.72rem", letterSpacing: "0.12em", textTransform: "uppercase", color: "#BF360C", fontWeight: 700 }}>
        {contato.nome} · {contato.cidade}
      </Typography>
      <Typography variant="h5" sx={{ fontWeight: 800, mt: 0.5 }}>
        Orçamento para {orcamento.veiculo}
      </Typography>
      <Typography sx={{ fontSize: "0.85rem", color: "#666", mt: 0.5 }}>
        OS de {data(orcamento.criadoEm)} · {orcamento.clienteNome}
        {orcamento.placa ? ` · ${orcamento.placa}` : ""}
      </Typography>

      <Paper variant="outlined" sx={{ p: 2.5, mt: 3, borderRadius: 3 }}>
        <Typography sx={{ fontSize: "0.72rem", textTransform: "uppercase", letterSpacing: "0.05em", color: "#888" }}>
          Problema relatado
        </Typography>
        <Typography sx={{ fontSize: "0.9rem", color: "#333", mb: 2 }}>{orcamento.descricaoProblema}</Typography>

        {orcamento.itens.map((item) => (
          <Box key={item.id} sx={{ display: "flex", justifyContent: "space-between", gap: 2, py: 1, borderTop: "1px solid #eee" }}>
            <Box>
              <Typography sx={{ fontSize: "0.9rem", fontWeight: 600 }}>{item.descricao}</Typography>
              <Typography sx={{ fontSize: "0.72rem", color: "#888" }}>
                {TIPO_ITEM_LABEL[item.tipo as keyof typeof TIPO_ITEM_LABEL] ?? item.tipo} · {item.quantidade} × {brl(item.valorUnit)}
              </Typography>
            </Box>
            <Typography sx={{ fontSize: "0.9rem", fontWeight: 700, whiteSpace: "nowrap" }}>{brl(item.total)}</Typography>
          </Box>
        ))}

        <Divider sx={{ my: 2 }} />

        <Box sx={{ display: "flex", justifyContent: "space-between" }}>
          <Typography sx={{ fontSize: "0.85rem", color: "#666" }}>Peças</Typography>
          <Typography sx={{ fontSize: "0.85rem" }}>{brl(orcamento.totalPecas)}</Typography>
        </Box>
        <Box sx={{ display: "flex", justifyContent: "space-between" }}>
          <Typography sx={{ fontSize: "0.85rem", color: "#666" }}>Serviços</Typography>
          <Typography sx={{ fontSize: "0.85rem" }}>{brl(orcamento.totalServicos)}</Typography>
        </Box>
        <Box sx={{ display: "flex", justifyContent: "space-between", mt: 1 }}>
          <Typography sx={{ fontSize: "1rem", fontWeight: 800 }}>Total</Typography>
          <Typography sx={{ fontSize: "1.15rem", fontWeight: 800, color: "#BF360C" }}>{brl(orcamento.total)}</Typography>
        </Box>
      </Paper>

      <Box sx={{ mt: 3 }}>
        <Button
          variant="text"
          href={`/api/orcamento/${token}/pdf`}
          target="_blank"
          rel="noopener"
          sx={{ textTransform: "none", color: "#555", fontSize: "0.82rem" }}
        >
          Baixar PDF do orçamento
        </Button>
      </Box>

      <DecisaoOrcamento token={token} jaRespondido={respondido} />

      <Typography sx={{ fontSize: "0.72rem", color: "#999", mt: 4 }}>
        Valores válidos para o serviço descrito. Peças adicionais só entram com sua autorização.
      </Typography>
    </Container>
  );
}
