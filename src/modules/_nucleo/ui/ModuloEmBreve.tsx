"use client";

import { useRouter } from "next/navigation";
import { Box, Button, Chip, Paper, Typography } from "@mui/material";
import { Schedule, ArrowBack } from "@mui/icons-material";
import type { IdModulo } from "@/modules/registro";

/**
 * Página de módulo que ainda não foi construído.
 *
 * Por que existir: ligar um módulo e o menu não mudar nada é confuso — o dono
 * acha que a chave não funcionou. Aqui ele vê que o módulo está **ligado**, o
 * que vai poder fazer e onde acompanhar. Quando a tela real chegar, esta é
 * substituída; a URL continua a mesma.
 */

interface Conteudo {
  titulo: string;
  resumo: string;
  itens: string[];
  issue: number;
}

const CONTEUDO: Partial<Record<IdModulo, Conteudo>> = {
  financeiro: {
    titulo: "Financeiro",
    resumo:
      "Contas a pagar e a receber, fluxo de caixa e conciliação dos pedidos pagos. Hoje o dinheiro entra e não existe registro de saída.",
    itens: [
      "Contas a pagar: fornecedor, vencimento, valor e anexo do boleto",
      "Contas a receber: pedido, prazo do marketplace e taxa descontada",
      "Fluxo de caixa do mês: entrou, saiu, sobrou",
      "Conciliação: pedido pago x valor que caiu na conta",
    ],
    issue: 77,
  },
  pdv: {
    titulo: "PDV (balcão)",
    resumo:
      "Venda presencial com baixa imediata do estoque e emissão de NFC-e. Serve para a venda que hoje é anotada no papel.",
    itens: [
      "Busca de peça por nome ou SKU com saldo na hora",
      "Fechamento em dinheiro, PIX ou cartão",
      "Baixa de estoque no ato da venda",
      "Cupom/NFC-e quando o fiscal estiver configurado",
    ],
    issue: 88,
  },
  relatorios: {
    titulo: "Relatórios",
    resumo:
      "Venda, margem e giro com dado do próprio banco — sem depender do Google Analytics para saber o que saiu.",
    itens: [
      "Vendas por período, categoria e peça",
      "Margem por peça (precisa do custo de compra)",
      "Giro de estoque: o que encalhou e o que vendeu",
      "Produto sem venda há 90 dias",
    ],
    issue: 92,
  },
};

export default function ModuloEmBreve({ id }: { id: IdModulo }) {
  const router = useRouter();
  const conteudo = CONTEUDO[id];

  return (
    <Box sx={{ maxWidth: 720 }}>
      <Button
        startIcon={<ArrowBack />}
        onClick={() => router.push("/admin")}
        sx={{ textTransform: "none", color: "#666", mb: 2 }}
      >
        Painel
      </Button>

      <Paper sx={{ p: 3, borderRadius: 3 }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 1 }}>
          <Schedule sx={{ color: "#B26A00" }} />
          <Typography variant="h6" sx={{ fontWeight: 800 }}>
            {conteudo?.titulo ?? "Módulo"}
          </Typography>
          <Chip size="small" label="ativado no menu · tela em construção" color="warning" variant="outlined" />
        </Box>

        <Typography sx={{ fontSize: "0.875rem", color: "#555", mb: 2.5, lineHeight: 1.6 }}>
          {conteudo?.resumo}
        </Typography>

        <Typography sx={{ fontSize: "0.72rem", color: "#888", textTransform: "uppercase", letterSpacing: "0.05em", mb: 1 }}>
          O que vai poder fazer
        </Typography>
        <Box component="ul" sx={{ m: 0, pl: 2.5, mb: 2.5 }}>
          {conteudo?.itens.map((item) => (
            <Typography component="li" key={item} sx={{ fontSize: "0.85rem", color: "#333", mb: 0.5 }}>
              {item}
            </Typography>
          ))}
        </Box>

        <Typography sx={{ fontSize: "0.78rem", color: "#777" }}>
          O módulo está <strong>ligado</strong> e reservado no menu. A tela entra numa próxima
          entrega — nada do que você já usa depende dela.
          {conteudo ? ` Acompanhe na issue #${conteudo.issue}.` : ""}
        </Typography>
      </Paper>
    </Box>
  );
}
