/**
 * Dados de contato da empresa no formato que o site usa.
 *
 * Sem Prisma neste arquivo de propósito: o rodapé, o cabeçalho e os cards são
 * componentes de cliente e não podem carregar o banco para o navegador. A
 * leitura fica em `@/lib/empresa` (servidor) e o valor pronto viaja por um
 * provider no layout raiz.
 *
 * Os padrões são os dados que estavam escritos à mão no código — servem de
 * rede de segurança enquanto "Minha empresa" não estiver preenchida.
 */

export interface ContatoEmpresa {
  /** Nome exibido (fantasia quando existir). */
  nome: string;
  razaoSocial: string;
  cnpj: string | null;
  /** Linha do endereço: "Rua, 123 · Bairro" */
  endereco: string | null;
  cidade: string;
  uf: string;
  cep: string | null;
  /** Só dígitos, com DDD — é o que o wa.me precisa. */
  telefone: string;
  telefoneFormatado: string;
  whatsapp: string;
  email: string;
  site: string | null;
  instagram: string | null;
  facebook: string | null;
}

export const CONTATO_PADRAO: ContatoEmpresa = {
  nome: "Car Crew Garage",
  razaoSocial: "Car Crew Garage",
  cnpj: null,
  endereco: "Av. Dona Sophia Rasgulaeff, 2825 · Jardim Novo Oasis",
  cidade: "Maringá",
  uf: "PR",
  cep: "87047300",
  telefone: "44998133182",
  telefoneFormatado: "(44) 99813-3182",
  whatsapp: "https://wa.me/5544998133182",
  email: "carcrewgarage@gmail.com",
  site: "carcrew.com.br",
  instagram: "https://www.instagram.com/carcrewgarage_/",
  facebook: "https://www.facebook.com/CarCrewG",
};

/** (44) 99813-3182 para 11 dígitos; (44) 3612-3456 para 10. */
export function formatarTelefone(telefone: string): string {
  const d = telefone.replace(/\D/g, "");
  if (d.length === 11) return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
  if (d.length === 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
  return telefone;
}

/** Link do WhatsApp: 55 + DDD + número, sem símbolos. */
export function linkWhatsApp(telefone: string, mensagem?: string): string {
  const d = telefone.replace(/\D/g, "");
  const numero = d.startsWith("55") ? d : `55${d}`;
  const base = `https://wa.me/${numero}`;
  return mensagem ? `${base}?text=${encodeURIComponent(mensagem)}` : base;
}

function rede(valor: string | null | undefined, base: string): string | null {
  if (!valor) return null;
  const limpo = valor.trim();
  if (!limpo) return null;
  if (/^https?:\/\//i.test(limpo)) return limpo;
  return `${base}${limpo.replace(/^@/, "").replace(/\/$/, "")}`;
}

export interface DadosBrutosEmpresa {
  razaoSocial?: string | null;
  nomeFantasia?: string | null;
  cnpj?: string | null;
  logradouro?: string | null;
  numero?: string | null;
  complemento?: string | null;
  bairro?: string | null;
  cidade?: string | null;
  uf?: string | null;
  cep?: string | null;
  telefone?: string | null;
  email?: string | null;
  redesSociais?: {
    site?: string | null;
    instagram?: string | null;
    facebook?: string | null;
    tiktok?: string | null;
    youtube?: string | null;
  } | null;
}

/** Junta o cadastro com os padrões, campo por campo. */
export function montarContato(dados: DadosBrutosEmpresa | null): ContatoEmpresa {
  const d = dados ?? {};
  const redes = d.redesSociais ?? {};

  const rua = [d.logradouro, d.numero].filter(Boolean).join(", ");
  const endereco = [rua, d.complemento, d.bairro].filter(Boolean).join(" · ");

  const telefone = (d.telefone ?? "").replace(/\D/g, "") || CONTATO_PADRAO.telefone;

  const siteBruto = redes.site?.trim();
  const site = siteBruto
    ? siteBruto.replace(/^https?:\/\//i, "").replace(/\/$/, "")
    : null;

  return {
    nome: d.nomeFantasia?.trim() || d.razaoSocial?.trim() || CONTATO_PADRAO.nome,
    razaoSocial: d.razaoSocial?.trim() || CONTATO_PADRAO.razaoSocial,
    cnpj: d.cnpj?.replace(/\D/g, "") || null,
    endereco: endereco || CONTATO_PADRAO.endereco,
    cidade: d.cidade?.trim() || CONTATO_PADRAO.cidade,
    uf: (d.uf?.trim() || CONTATO_PADRAO.uf).toUpperCase(),
    cep: d.cep?.replace(/\D/g, "") || CONTATO_PADRAO.cep,
    telefone,
    telefoneFormatado: formatarTelefone(telefone),
    whatsapp: linkWhatsApp(telefone),
    email: d.email?.trim() || CONTATO_PADRAO.email,
    site: site ?? CONTATO_PADRAO.site,
    instagram:
      rede(redes.instagram, "https://www.instagram.com/") ?? CONTATO_PADRAO.instagram,
    facebook:
      rede(redes.facebook, "https://www.facebook.com/") ?? CONTATO_PADRAO.facebook,
  };
}
