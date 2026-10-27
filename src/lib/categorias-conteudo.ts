/**
 * Texto de cada categoria (6.7).
 *
 * Antes a categoria era `?cat=slug` na home, com canonical para `/`: o Google
 * via uma página para dez assuntos e nenhuma delas tinha H1 ou conteúdo. Aqui
 * cada uma ganha título, parágrafo próprio e link para a landing que combina.
 *
 * Regra: nada de promessa que a loja não cumpre. Só descrição técnica do que a
 * peça é e para que serve.
 */

export interface ConteudoCategoria {
  titulo: string;
  intro: string;
  /** O que olhar antes de comprar. */
  atencao: string;
  /** Landing relacionada, quando existe. */
  landing?: { href: string; label: string };
}

export const CONTEUDO_CATEGORIA: Record<string, ConteudoCategoria> = {
  "bolsas-de-ar": {
    titulo: "Bolsas de ar para suspensão",
    intro:
      "A bolsa de ar é a mola do sistema pneumático: substitui a mola helicoidal e permite subir e descer o carro pelo compressor. Trabalhamos com bolsas para kits dianteiros e traseiros, nas medidas mais usadas em carros rebaixados e suspensão a ar montada no Brasil.",
    atencao:
      "Antes de comprar, confira o diâmetro da bolsa e o tipo de fixação (rosqueada ou com bico) do seu kit. Bolsa de medida errada monta, mas rasga no primeiro curso completo.",
    landing: { href: "/suspensao-a-ar", label: "Como funciona a suspensão a ar" },
  },
  compressores: {
    titulo: "Compressores para suspensão a ar",
    intro:
      "O compressor é o coração do sistema: enche o reservatório e mantém a pressão para o carro subir. Modelos 444C e similares são os mais usados em projetos de rua, com vazão suficiente para uso diário e para levantar o carro algumas vezes por dia.",
    atencao:
      "Compressor trabalha quente e molhado. Sem dreno no ponto mais baixo do circuito e sem filtro na entrada, a vida útil cai muito — a maioria das trocas acontece por isso, não por defeito da peça.",
    landing: { href: "/suspensao-a-ar", label: "Montagem do sistema de ar" },
  },
  amortecedores: {
    titulo: "Amortecedores",
    intro:
      "Amortecedor controla o movimento da mola. Em carro rebaixado, o curso útil diminui: amortecedor de curso curto evita que o batente trabalhe no fim do curso e que o carro fique quicando.",
    atencao:
      "Rebaixar só com mola e manter o amortecedor original é o erro mais comum: a peça passa a trabalhar fora da faixa e vaza. Confira curso e fixação antes de fechar o par.",
    landing: { href: "/rebaixamento", label: "Rebaixados sem perder conforto" },
  },
  bandejas: {
    titulo: "Bandejas e balanças de suspensão",
    intro:
      "Bandeja é o braço que prende a manga de eixo ao chassi. Em carro baixo ela trabalha em ângulo diferente do original, por isso modelos com geometria corrigida ou reforçados aparecem tanto em carros rebaixados quanto em uso esportivo.",
    atencao:
      "Bucha e pivô gastos aparecem como barulho em lombada e direção puxando. Trocar a bandeja sem revisar bucha e alinhamento depois devolve o problema em poucas semanas.",
    landing: { href: "/suspensao-esportiva", label: "Suspensão esportiva" },
  },
  "pontas-de-eixo": {
    titulo: "Pontas de eixo",
    intro:
      "Ponta de eixo transmite o movimento para a roda e sustenta o conjunto. Em carro muito baixo, o excesso de ângulo castiga a homocinética e a coifa — motivo de folga e estalo em curva.",
    atencao:
      "Estalo em curva com o carro baixo costuma ser homocinética, não a ponta inteira. Vale conferir coifa rasgada antes de trocar o conjunto completo.",
    landing: { href: "/rebaixamento", label: "Ângulo e altura" },
  },
  "calcos-antirruido": {
    titulo: "Calços antirruído",
    intro:
      "O calço assenta a mola no prato e absorve vibração. Quando resseca ou sai do lugar, aparecem estalos em curva e barulho em piso irregular — sintoma que muita gente confunde com amortecedor estourado.",
    atencao:
      "Calço de material duro demais resolve o barulho e devolve desconforto. Se o carro é de uso diário, prefira a dureza próxima da original.",
    landing: { href: "/suspensao-esportiva", label: "Acerto para uso diário" },
  },
  kits: {
    titulo: "Kits de suspensão",
    intro:
      "Kit reúne as peças que precisam ser trocadas juntas: mola, amortecedor, batente, coifa e coxim. Comprar avulso sai mais barato na peça e mais caro na mão de obra, porque a suspensão abre duas vezes.",
    atencao:
      "Confira o que vem no kit — alguns trazem só mola e amortecedor, sem batente nem coifa. Peça a lista de itens antes de comparar preço.",
    landing: { href: "/suspensao-esportiva", label: "Kit esportivo" },
  },
  componentes: {
    titulo: "Componentes de suspensão",
    intro:
      "Peças de apoio: coxim, batente, rolamento, terminal, pivô, bucha. São baratas e resolvem a maior parte dos barulhos de suspensão — desde que identificadas com o carro no elevador, não por chute.",
    atencao:
      "Barulho de suspensão raramente é uma peça só. Trocar o componente mais barato sem diagnóstico costuma não resolver.",
    landing: { href: "/suspensao-a-ar", label: "Diagnóstico do sistema" },
  },
  terminais: {
    titulo: "Terminais de direção",
    intro:
      "Terminal liga a caixa de direção à manga de eixo. Folga aqui vira direção imprecisa, pneu comendo de um lado e vibração em velocidade.",
    atencao:
      "Depois de trocar terminal, o alinhamento é obrigatório — sem isso o pneu novo pode durar menos da metade.",
  },
  controles: {
    titulo: "Controles e comandos do sistema de ar",
    intro:
      "Controle é a interface do sistema pneumático: sobe, desce, memoriza alturas e, nos modelos mais completos, mostra a pressão de cada linha.",
    atencao:
      "Confira a tensão (12V) e se o controle acompanha o chicote e os sensores. Sem sensor de altura, o controle segura pressão, não altura.",
  },
};

/** Para slugs novos que ainda não têm texto. */
export function conteudoDaCategoria(slug: string, nome: string): ConteudoCategoria {
  return (
    CONTEUDO_CATEGORIA[slug] ?? {
      titulo: nome,
      intro: `Peças de ${nome.toLowerCase()} para suspensão automotiva, com entrega para todo o Brasil.`,
      atencao:
        "Em dúvida sobre a aplicação no seu carro? Fale com a gente no WhatsApp antes de comprar.",
    }
  );
}
