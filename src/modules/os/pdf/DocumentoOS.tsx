import { formatarTelefone } from "@/lib/empresa-contato";
import { Document, Image, Page, StyleSheet, Text, View } from "@react-pdf/renderer";

/**
 * PDF da ordem de serviço (#os-pdf).
 *
 * A4 retrato, Helvetica (embutida na lib — nada de `fs`, que não funciona no
 * serverless). O custo interno só existe quando `incluirCusto` é true, e a rota
 * pública nunca liga esse flag.
 */

export interface EmpresaPDF {
  razaoSocial: string;
  nomeFantasia?: string | null;
  cnpj?: string | null;
  ie?: string | null;
  logradouro?: string | null;
  numero?: string | null;
  complemento?: string | null;
  bairro?: string | null;
  cidade?: string | null;
  uf?: string | null;
  cep?: string | null;
  telefone?: string | null;
  email?: string | null;
  logo?: string | null;
  redesSociais?: { site?: string | null; instagram?: string | null } | null;
}

export interface ItemPDF {
  tipo: string;
  descricao: string;
  quantidade: number;
  valorUnit: number;
  total: number;
  custo?: number | null;
  origem?: string | null;
  terceiro?: string | null;
}

export interface PropsDocumentoOS {
  empresa: EmpresaPDF;
  ordem: {
    id: string;
    criadoEm: string | Date;
    prazo?: string | Date | null;
    status: string;
    clienteNome: string;
    clienteTelefone?: string | null;
    clienteDocumento?: string | null;
    veiculo: string;
    placa?: string | null;
    km?: number | null;
    descricaoProblema: string;
    observacoes?: string | null;
    total: number;
    totalPecas: number;
    totalServicos: number;
    aprovadoEm?: string | Date | null;
  };
  itens: ItemPDF[];
  /** custo e margem — NUNCA true na rota pública */
  incluirCusto: boolean;
}

const COR = {
  primaria: "#BF360C",
  texto: "#1A1A1A",
  suave: "#6B6B6B",
  linha: "#D9D9D9",
  fundo: "#F7F3F1",
};

const TIPO_LABEL: Record<string, string> = {
  peca: "Peça",
  servico: "Serviço",
  terceiro: "Terceiro",
};

const STATUS_LABEL: Record<string, string> = {
  aberta: "Aberta",
  orcamento: "Orçamento",
  aprovada: "Aprovada",
  aguardando_peca: "Aguardando peça",
  execucao: "Em execução",
  concluida: "Concluída",
  entregue: "Entregue",
  cancelada: "Cancelada",
};

const estilos = StyleSheet.create({
  pagina: { paddingTop: 34, paddingBottom: 40, paddingHorizontal: 34, fontSize: 9, color: COR.texto, fontFamily: "Helvetica" },
  topo: { flexDirection: "row", alignItems: "center", borderBottomWidth: 2, borderBottomColor: COR.primaria, paddingBottom: 10, marginBottom: 14 },
  logo: { width: 54, height: 54, marginRight: 12, objectFit: "contain" },
  empresaNome: { fontSize: 13, fontFamily: "Helvetica-Bold", color: COR.primaria },
  empresaDados: { fontSize: 7.5, color: COR.suave, marginTop: 2, lineHeight: 1.4 },
  tituloBox: { flex: 1, alignItems: "flex-end" },
  titulo: { fontSize: 14, fontFamily: "Helvetica-Bold" },
  numero: { fontSize: 8, color: COR.suave, marginTop: 2 },
  secao: { flexDirection: "row", gap: 18, marginBottom: 12 },
  bloco: { flex: 1 },
  rotulo: { fontSize: 6.5, color: COR.suave, textTransform: "uppercase", letterSpacing: 0.6, marginBottom: 2 },
  valor: { fontSize: 9.5 },
  valorForte: { fontSize: 9.5, fontFamily: "Helvetica-Bold" },
  problemaBox: { backgroundColor: COR.fundo, padding: 8, borderRadius: 3, marginBottom: 12 },
  tabela: { borderTopWidth: 1, borderTopColor: COR.linha },
  linhaTabela: { flexDirection: "row", borderBottomWidth: 1, borderBottomColor: COR.linha, paddingVertical: 5, alignItems: "center" },
  cabecalhoTabela: { flexDirection: "row", backgroundColor: COR.fundo, paddingVertical: 5, borderBottomWidth: 1, borderBottomColor: COR.linha },
  colDescricao: { flex: 1, paddingRight: 6 },
  colDescricaoTexto: { flex: 1, paddingRight: 6, paddingLeft: 1 },
  colTipo: { width: 62 },
  colQtd: { width: 30, textAlign: "right" },
  colValor: { width: 66, textAlign: "right" },
  colCusto: { width: 58, textAlign: "right", paddingRight: 2 },
  cabecalhoTexto: { fontSize: 7, color: COR.suave, textTransform: "uppercase", letterSpacing: 0.4 },
  totais: { marginTop: 10, alignItems: "flex-end" },
  linhaTotal: { flexDirection: "row", justifyContent: "flex-end", marginBottom: 2 },
  totalRotulo: { width: 90, textAlign: "right", color: COR.suave, paddingRight: 8 },
  totalValor: { width: 80, textAlign: "right" },
  totalFinal: { flexDirection: "row", justifyContent: "flex-end", marginTop: 4, paddingTop: 4, borderTopWidth: 1, borderTopColor: COR.linha },
  totalFinalRotulo: { width: 90, textAlign: "right", paddingRight: 8, fontFamily: "Helvetica-Bold", fontSize: 10 },
  totalFinalValor: { width: 80, textAlign: "right", fontFamily: "Helvetica-Bold", fontSize: 11, color: COR.primaria },
  assinaturas: { flexDirection: "row", gap: 40, marginTop: 56 },
  linhaAssinatura: { flex: 1, borderTopWidth: 1, borderTopColor: COR.texto, paddingTop: 4, fontSize: 7.5, color: COR.suave, textAlign: "center" },
  rodape: { position: "absolute", bottom: 18, left: 34, right: 34, fontSize: 6.5, color: COR.suave, textAlign: "center", borderTopWidth: 1, borderTopColor: COR.linha, paddingTop: 5 },
});

function brl(valor: number): string {
  return `R$ ${Number(valor || 0).toFixed(2).replace(".", ",").replace(/\B(?=(\d{3})+(?!\d))/g, ".")}`;
}

function data(valor?: string | Date | null): string {
  if (!valor) return "—";
  const d = new Date(valor);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("pt-BR", { timeZone: "America/Sao_Paulo" });
}

function linhaEndereco(e: EmpresaPDF): string {
  const partes = [
    [e.logradouro, e.numero].filter(Boolean).join(", "),
    e.complemento,
    e.bairro,
    [e.cidade, e.uf].filter(Boolean).join("/"),
    e.cep ? `CEP ${e.cep.replace(/(\d{5})(\d{3})/, "$1-$2")}` : null,
  ].filter(Boolean);
  return partes.join(" · ");
}

function documento(e: EmpresaPDF): string {
  if (e.cnpj) return `CNPJ ${e.cnpj.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/, "$1.$2.$3/$4-$5")}`;
  return "";
}

export function DocumentoOS({ empresa, ordem, itens, incluirCusto }: PropsDocumentoOS) {
  const orcamento = ["aberta", "orcamento"].includes(ordem.status);
  const endereco = linhaEndereco(empresa);
  const instagram = empresa.redesSociais?.instagram
    ? `@${empresa.redesSociais.instagram.replace(/^@/, "").replace(/^https?:\/\/(www\.)?instagram\.com\//, "").replace(/\/$/, "")}`
    : null;

  const contato = [
    empresa.telefone ? formatarTelefone(empresa.telefone) : null,
    empresa.email,
    empresa.redesSociais?.site,
    instagram,
  ]
    .filter(Boolean)
    .join(" · ");

  const totalCusto = itens.reduce((s, i) => s + (i.custo ? i.custo * i.quantidade : 0), 0);
  const margem = ordem.total - totalCusto;

  return (
    <Document title={`${orcamento ? "Orçamento" : "OS"} ${ordem.clienteNome}`} author={empresa.razaoSocial}>
      <Page size="A4" style={estilos.pagina}>
        <View style={estilos.topo}>
          {empresa.logo ? <Image style={estilos.logo} src={empresa.logo} /> : null}
          <View style={{ flex: 1 }}>
            <Text style={estilos.empresaNome}>{empresa.nomeFantasia || empresa.razaoSocial}</Text>
            <Text style={estilos.empresaDados}>
              {[documento(empresa), endereco].filter(Boolean).join("\n")}
              {contato ? `\n${contato}` : ""}
            </Text>
          </View>
          <View style={estilos.tituloBox}>
            <Text style={estilos.titulo}>{orcamento ? "ORÇAMENTO" : "ORDEM DE SERVIÇO"}</Text>
            <Text style={estilos.numero}>Nº {ordem.id.slice(-6).toUpperCase()}</Text>
            <Text style={estilos.numero}>{data(ordem.criadoEm)}</Text>
          </View>
        </View>

        <View style={estilos.secao}>
          <View style={estilos.bloco}>
            <Text style={estilos.rotulo}>Cliente</Text>
            <Text style={estilos.valorForte}>{ordem.clienteNome}</Text>
            <Text style={estilos.valor}>{ordem.clienteTelefone || "sem telefone"}</Text>
            {ordem.clienteDocumento ? <Text style={estilos.valor}>Doc. {ordem.clienteDocumento}</Text> : null}
          </View>
          <View style={estilos.bloco}>
            <Text style={estilos.rotulo}>Veículo</Text>
            <Text style={estilos.valorForte}>{ordem.veiculo}</Text>
            <Text style={estilos.valor}>
              {[ordem.placa || "sem placa", ordem.km ? `${ordem.km} km` : null].filter(Boolean).join(" · ")}
            </Text>
          </View>
          <View style={{ width: 110 }}>
            <Text style={estilos.rotulo}>Situação</Text>
            <Text style={estilos.valorForte}>{STATUS_LABEL[ordem.status] ?? ordem.status}</Text>
            {ordem.prazo ? <Text style={estilos.valor}>Prazo {data(ordem.prazo)}</Text> : null}
          </View>
        </View>

        <View style={estilos.problemaBox}>
          <Text style={estilos.rotulo}>Problema relatado</Text>
          <Text style={{ fontSize: 9 }}>{ordem.descricaoProblema}</Text>
        </View>

        <View style={estilos.cabecalhoTabela}>
          <Text style={[estilos.colDescricao, estilos.cabecalhoTexto]}>Descrição</Text>
          <Text style={[estilos.colTipo, estilos.cabecalhoTexto]}>Tipo</Text>
          <Text style={[estilos.colQtd, estilos.cabecalhoTexto]}>Qtd</Text>
          <Text style={[estilos.colValor, estilos.cabecalhoTexto]}>Unitário</Text>
          <Text style={[estilos.colValor, estilos.cabecalhoTexto]}>Total</Text>
          {incluirCusto ? <Text style={[estilos.colCusto, estilos.cabecalhoTexto]}>Custo</Text> : null}
        </View>

        {itens.length === 0 ? (
          <View style={estilos.linhaTabela}>
            <Text style={{ flex: 1, color: COR.suave }}>Nenhum item lançado.</Text>
          </View>
        ) : (
          itens.map((item, indice) => (
            <View style={estilos.linhaTabela} key={indice} wrap={false}>
              <Text style={estilos.colDescricaoTexto}>
                {item.descricao}
                {item.terceiro ? ` (${item.terceiro})` : ""}
              </Text>
              <Text style={estilos.colTipo}>
                {TIPO_LABEL[item.tipo] ?? item.tipo}
                {item.tipo === "peca" && item.origem === "externa" ? " externa" : ""}
              </Text>
              <Text style={estilos.colQtd}>{item.quantidade}</Text>
              <Text style={estilos.colValor}>{brl(item.valorUnit)}</Text>
              <Text style={estilos.colValor}>{brl(item.total)}</Text>
              {incluirCusto ? (
                <Text style={estilos.colCusto}>{item.custo ? brl(item.custo * item.quantidade) : "—"}</Text>
              ) : null}
            </View>
          ))
        )}

        <View style={estilos.totais}>
          <View style={estilos.linhaTotal}>
            <Text style={estilos.totalRotulo}>Peças</Text>
            <Text style={estilos.totalValor}>{brl(ordem.totalPecas)}</Text>
          </View>
          <View style={estilos.linhaTotal}>
            <Text style={estilos.totalRotulo}>Serviços</Text>
            <Text style={estilos.totalValor}>{brl(ordem.totalServicos)}</Text>
          </View>
          {incluirCusto ? (
            <>
              <View style={estilos.linhaTotal}>
                <Text style={estilos.totalRotulo}>Custo</Text>
                <Text style={estilos.totalValor}>{brl(totalCusto)}</Text>
              </View>
              <View style={estilos.linhaTotal}>
                <Text style={estilos.totalRotulo}>Margem</Text>
                <Text style={estilos.totalValor}>
                  {brl(margem)}
                  {ordem.total > 0 ? ` (${Math.round((margem / ordem.total) * 100)}%)` : ""}
                </Text>
              </View>
            </>
          ) : null}
          <View style={estilos.totalFinal}>
            <Text style={estilos.totalFinalRotulo}>Total</Text>
            <Text style={estilos.totalFinalValor}>{brl(ordem.total)}</Text>
          </View>
        </View>

        {ordem.observacoes ? (
          <View style={{ marginTop: 14 }}>
            <Text style={estilos.rotulo}>Observações</Text>
            <Text style={{ fontSize: 8.5 }}>{ordem.observacoes}</Text>
          </View>
        ) : null}

        <View style={estilos.assinaturas}>
          <Text style={estilos.linhaAssinatura}>Assinatura do cliente</Text>
          <Text style={estilos.linhaAssinatura}>Responsável — {empresa.nomeFantasia || empresa.razaoSocial}</Text>
        </View>

        <Text style={estilos.rodape} fixed>
          {orcamento
            ? "Orçamento válido para o serviço descrito. Peças adicionais só entram com autorização do cliente."
            : "Peças adicionais só entram com autorização do cliente."}
          {ordem.aprovadoEm ? `  ·  Aprovado pelo cliente em ${data(ordem.aprovadoEm)}.` : ""}
        </Text>
      </Page>
    </Document>
  );
}
