/**
 * Blog (6.6).
 *
 * As buscas que trazem cliente para suspensão são informacionais ("como
 * legalizar rebaixamento", "suspensão a ar vale a pena"). Sem conteúdo, a loja
 * só aparece quando alguém já sabe o nome da peça.
 *
 * Conteúdo é rascunho técnico: cada artigo aponta para uma landing e para
 * peças do catálogo. Nada de promessa que a loja não cumpre.
 */

export type Bloco =
  | { tipo: "p"; texto: string }
  | { tipo: "h2"; texto: string }
  | { tipo: "lista"; itens: string[] };

export interface PostBlog {
  slug: string;
  titulo: string;
  resumo: string;
  publicadoEm: string;
  atualizadoEm: string;
  /** Links internos que o artigo puxa. */
  links: { label: string; href: string }[];
  blocos: Bloco[];
}

export const POSTS: PostBlog[] = [
  {
    slug: "como-legalizar-rebaixamento",
    titulo: "Como legalizar rebaixamento: o caminho real",
    resumo:
      "O que muda no documento, o que o Detran verifica e por que altura não é o único item da lista.",
    publicadoEm: "2026-10-26",
    atualizadoEm: "2026-10-26",
    links: [
      { label: "Kit de rebaixamento", href: "/rebaixamento" },
      { label: "Amortecedores", href: "/categoria/amortecedores" },
    ],
    blocos: [
      {
        tipo: "p",
        texto:
          "Rebaixar o carro sem alterar o documento é infração e, em caso de acidente, problema grande. A regularização é feita como alteração de característica — o mesmo caminho de quem troca roda, motor ou instala GNV. O processo varia por estado, então o primeiro passo é consultar o Detran da sua UF.",
      },
      { tipo: "h2", texto: "O que costuma ser exigido" },
      {
        tipo: "lista",
        itens: [
          "Laudo de empresa ou engenheiro credenciado no Detran do seu estado",
          "Certificado de segurança veicular (CSV) quando o órgão exige",
          "Comprovação de que o conjunto foi instalado por profissional habilitado",
          "Vistoria no Detran e atualização do CRLV",
        ],
      },
      { tipo: "h2", texto: "O que reprova na vistoria" },
      {
        tipo: "p",
        texto:
          "Não é só a altura. Reprovam: pneu raspando em carroceria ou passagem de roda, suspensão sem curso útil (batente trabalhando no fim), farol fora do ângulo, e qualquer peça solta no conjunto. Carro muito baixo com mola cortada é o caso que mais aparece: corta a mola, perde o assentamento e o prato começa a marcar a peça.",
      },
      {
        tipo: "p",
        texto:
          "Por isso a ordem que funciona é: definir a altura com o kit certo, conferir curso de amortecedor e batente, alinhar, e só então levar para vistoria. Fazer o inverso custa duas mãos de obra.",
      },
    ],
  },
  {
    slug: "suspensao-a-ar-rosca-fixa",
    titulo: "Suspensão a ar, rosca ou fixa: qual escolher",
    resumo:
      "As três soluções resolvem 'deixar o carro baixo', mas o uso diário é que decide qual vale a pena.",
    publicadoEm: "2026-10-26",
    atualizadoEm: "2026-10-26",
    links: [
      { label: "Suspensão a ar", href: "/suspensao-a-ar" },
      { label: "Bolsas de ar", href: "/categoria/bolsas-de-ar" },
      { label: "Compressores", href: "/categoria/compressores" },
    ],
    blocos: [
      {
        tipo: "p",
        texto:
          "Quem quer o carro baixo escolhe entre três caminhos: mola fixa, rosca (regulável na hora da montagem) ou ar (regulável a qualquer momento, com compressor). A diferença prática é quanto você mexe na altura e quanto quer investir.",
      },
      { tipo: "h2", texto: "Fixa" },
      {
        tipo: "p",
        texto:
          "A mais barata e a mais confortável quando bem dimensionada. A altura é definida pela mola — para mudar, troca a peça. Se o uso é só estética e a altura já está definida, é a escolha com melhor custo por quilômetro.",
      },
      { tipo: "h2", texto: "Rosca" },
      {
        tipo: "p",
        texto:
          "Permite ajustar altura e conferir peso por roda, o que ajuda muito no acerto com roda larga. Em troca, é mais dura e exige revisão e limpeza das roscas de tempo em tempo, senão trava.",
      },
      { tipo: "h2", texto: "Ar" },
      {
        tipo: "p",
        texto:
          "Sobe e desce quando quiser e mantém conforto parecido com o original em altura de rua. Em troca, tem mais peças para falhar: compressor, bolsa, válvula, linha e controle. Manutenção preventiva (dreno e filtro) é o que separa um sistema que dura anos de um que dá dor de cabeça em seis meses.",
      },
      {
        tipo: "p",
        texto:
          "Resumo honesto: se você não vai mudar de altura, mola fixa resolve. Se vai acertar uma vez, rosca. Se quer subir e descer, ar — sabendo que é o sistema com mais pontos de atenção.",
      },
    ],
  },
  {
    slug: "manutencao-compressor-suspensao-ar",
    titulo: "Manutenção do compressor: o que mata a peça",
    resumo:
      "Quase toda troca de compressor acontece por umidade e sujeira, não por desgaste natural.",
    publicadoEm: "2026-10-26",
    atualizadoEm: "2026-10-26",
    links: [
      { label: "Compressores", href: "/categoria/compressores" },
      { label: "Suspensão a ar", href: "/suspensao-a-ar" },
    ],
    blocos: [
      {
        tipo: "p",
        texto:
          "Compressor bomba ar úmido. O ar que entra carrega vapor d'água, e essa água se acumula na parte baixa do circuito — reservatório, linhas, bolsa. É ela que enferruja anel, trava válvula e queima o motor por esforço.",
      },
      { tipo: "h2", texto: "Os três cuidados que mudam a vida útil" },
      {
        tipo: "lista",
        itens: [
          "Dreno no ponto mais baixo do circuito, aberto a cada uma ou duas semanas",
          "Filtro na entrada de ar do compressor, trocado quando saturar",
          "Segunda linha de proteção: separador de água antes do reservatório",
        ],
      },
      {
        tipo: "p",
        texto:
          "Outro erro comum é deixar o compressor trabalhando sem parada. Sistema sem pressostato ou com pressostato mal regulado faz o motor ligar a cada dois minutos, e o aquecimento repetido acaba com a vedação.",
      },
      {
        tipo: "h2",
        texto: "Sinais de que a peça está indo embora",
      },
      {
        tipo: "lista",
        itens: [
          "Demora cada vez maior para atingir a pressão",
          "Ruído metálico ao ligar",
          "Óleo aparecendo na linha de saída",
          "Fusível que queima com o compressor em carga",
        ],
      },
      {
        tipo: "p",
        texto:
          "Se algum desses sinais aparecer, pare de usar e abra o circuito antes de trocar só o compressor: linha com água ou ferrugem vai destruir a peça nova em pouco tempo.",
      },
    ],
  },
  {
    slug: "como-medir-altura-do-carro",
    titulo: "Como medir a altura do carro (e repetir a medida)",
    resumo:
      "Metade dos problemas de rebaixamento nasce de medida feita em piso errado ou em ponto errado.",
    publicadoEm: "2026-10-26",
    atualizadoEm: "2026-10-26",
    links: [
      { label: "Rebaixamento", href: "/rebaixamento" },
      { label: "Calços antirruído", href: "/categoria/calcos-antirruido" },
    ],
    blocos: [
      {
        tipo: "p",
        texto:
          "Antes de comprar qualquer peça, meça. E meça do jeito que dá para repetir depois — porque a diferença de dois dedos entre a frente e a traseira aparece na foto e não aparece na conversa.",
      },
      { tipo: "h2", texto: "Como medir" },
      {
        tipo: "lista",
        itens: [
          "Piso plano e nivelado. Rampa e calçada dão número falso — o carro torce e uma roda sobe",
          "Pneus na pressão de uso",
          "Meça do centro da roda até a borda do para-lama, na vertical",
          "Anote os quatro cantos, com o carro vazio e depois com o peso de sempre (você, passageiro, bagagem)",
        ],
      },
      {
        tipo: "p",
        texto:
          "Essa última medida é a que importa: suspensão se acerta com o peso real. Carro que fica no ponto sozinho e raspa com dois passageiros está mal dimensionado atrás, não 'baixo demais'.",
      },
      { tipo: "h2", texto: "O que comparar com o fornecedor" },
      {
        tipo: "p",
        texto:
          "Passe os quatro números e o peso que costuma carregar. Com isso dá para indicar mola, calço e curso de amortecedor que mantenham o carro na altura que você quer sem trabalhar no limite do curso.",
      },
    ],
  },
  {
    slug: "lift-para-picape",
    titulo: "Lift para picape: o que muda além da altura",
    resumo:
      "Levantar 2 polegadas mexe em ângulo de homocinética, geometria e comportamento em estrada.",
    publicadoEm: "2026-10-26",
    atualizadoEm: "2026-10-26",
    links: [
      { label: "Off-road 4x4", href: "/off-road" },
      { label: "Componentes", href: "/categoria/componentes" },
    ],
    blocos: [
      {
        tipo: "p",
        texto:
          "Lift é o caminho inverso do rebaixamento, com os mesmos limites: existe uma altura em que os componentes originais ainda trabalham bem, e existe a altura em que eles passam a sofrer.",
      },
      { tipo: "h2", texto: "Até onde o original aguenta" },
      {
        tipo: "p",
        texto:
          "Em picape de uso misto, lift de 1 a 2 polegadas com calço e amortecedor adequado costuma ser o ponto em que se ganha ângulo de entrada sem estragar o comportamento em estrada. Acima disso, começa a aparecer ângulo de homocinética, folga de cardã e esterço que passa a raspar.",
      },
      {
        tipo: "lista",
        itens: [
          "Confira o ângulo máximo de homocinética informado para o seu modelo",
          "Cardã e cruzeta: lift maior muda o ângulo de trabalho e acelera desgaste",
          "Alinhamento e cambagem precisam ser refeitos depois da montagem",
          "Pneu maior muda relação de câmbio final e consumo",
        ],
      },
      {
        tipo: "p",
        texto:
          "Para uso em trilha pesada, o caminho é kit com geometria corrigida (bandeja, pivô, amortecedor de curso maior) — mais caro, mas é o que evita trocar peça a cada seis meses.",
      },
    ],
  },
  {
    slug: "erros-de-instalacao-suspensao",
    titulo: "Cinco erros de instalação que custam caro",
    resumo:
      "Os problemas que voltam para a oficina quase sempre começam na montagem, não na peça.",
    publicadoEm: "2026-10-26",
    atualizadoEm: "2026-10-26",
    links: [
      { label: "Kits", href: "/categoria/kits" },
      { label: "Suspensão esportiva", href: "/suspensao-esportiva" },
    ],
    blocos: [
      { tipo: "h2", texto: "1. Apertar suspensão com o carro no ar" },
      {
        tipo: "p",
        texto:
          "Bucha de suspensão tem que ser apertada com o carro apoiado na altura de uso. Apertada no elevador, ela fica torcida em repouso e rasga em poucos meses.",
      },
      { tipo: "h2", texto: "2. Trocar mola sem trocar amortecedor" },
      {
        tipo: "p",
        texto:
          "Reduzir o curso da mola sem reduzir o do amortecedor faz a peça trabalhar no fim do curso. Resultado: batente destruído, amortecedor vazando e carro quicando.",
      },
      { tipo: "h2", texto: "3. Ignorar o batente e a coifa" },
      {
        tipo: "p",
        texto:
          "São as peças mais baratas do conjunto e as que mais aparecem quebradas na desmontagem. Reaproveitar batente velho em mola nova é economia que dura uma semana.",
      },
      { tipo: "h2", texto: "4. Não alinhar depois" },
      {
        tipo: "p",
        texto:
          "Qualquer mudança de altura muda cambagem e convergência. Rodar sem alinhar come o pneu de um lado e piora a estabilidade — às vezes o cliente sente como 'suspensão ruim'.",
      },
      { tipo: "h2", texto: "5. Montar sem conferir aplicação" },
      {
        tipo: "p",
        texto:
          "Mesma marca, mesmo ano, versões diferentes com conjunto diferente. Confira o código da peça e a medida antes de abrir a embalagem; peça que não serve sempre pode ser trocada, mas a mão de obra não volta.",
      },
    ],
  },
];

export function postPorSlug(slug: string): PostBlog | undefined {
  return POSTS.find((p) => p.slug === slug);
}
