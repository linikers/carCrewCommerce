import { renderToBuffer } from "@react-pdf/renderer";
import { DocumentoOS, type EmpresaPDF, type ItemPDF, type PropsDocumentoOS } from "./DocumentoOS";

/**
 * Converte a OS em PDF (#os-pdf).
 *
 * `incluirCusto` separa as duas versões:
 *   - interna (admin): mostra custo e margem
 *   - do cliente: nunca recebe custo — quem chama a rota pública passa false
 */

export interface OrdemParaPDF {
  id: string;
  criadoEm: Date | string;
  prazo?: Date | string | null;
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
  aprovadoEm?: Date | string | null;
  itens: {
    tipo: string;
    descricao: string;
    quantidade: number;
    valorUnit: number;
    total: number;
    custo?: number | null;
    origem?: string | null;
    terceiro?: string | null;
  }[];
}

export const EMPRESA_PADRAO: EmpresaPDF = {
  razaoSocial: "Car Crew Garage",
  nomeFantasia: "Car Crew Garage",
  cidade: "Maringá",
  uf: "PR",
  telefone: "44998133182",
};

export function montarProps(
  ordem: OrdemParaPDF,
  empresa: EmpresaPDF | null,
  incluirCusto: boolean
): PropsDocumentoOS {
  const itens: ItemPDF[] = ordem.itens.map((i) => ({
    tipo: i.tipo,
    descricao: i.descricao,
    quantidade: i.quantidade,
    valorUnit: i.valorUnit,
    total: i.total,
    // custo só sai daqui quando é a versão interna
    custo: incluirCusto ? i.custo ?? null : null,
    origem: i.origem,
    terceiro: i.terceiro,
  }));

  return {
    empresa: empresa ?? EMPRESA_PADRAO,
    ordem: {
      id: ordem.id,
      criadoEm: ordem.criadoEm,
      prazo: ordem.prazo,
      status: ordem.status,
      clienteNome: ordem.clienteNome,
      clienteTelefone: ordem.clienteTelefone,
      clienteDocumento: ordem.clienteDocumento,
      veiculo: ordem.veiculo,
      placa: ordem.placa,
      km: ordem.km,
      descricaoProblema: ordem.descricaoProblema,
      observacoes: ordem.observacoes,
      total: ordem.total,
      totalPecas: ordem.totalPecas,
      totalServicos: ordem.totalServicos,
      aprovadoEm: ordem.aprovadoEm,
    },
    itens,
    incluirCusto,
  };
}

export async function gerarPdfOS(props: PropsDocumentoOS): Promise<Buffer> {
  return renderToBuffer(<DocumentoOS {...props} />);
}
