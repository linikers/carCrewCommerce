import { Produto } from "@/types";

export const produtos: Produto[] = [
  {
    id: 1,
    nome: "Amortecedor Dianteiro — Chevrolet Montana / Vectra / Astra",
    descricao:
      "Amortecedor dianteiro original ou similar de alta qualidade. Compatível com Chevrolet Montana, Vectra e Astra. Proporciona estabilidade e conforto ao dirigir, reduzindo oscilações da suspensão.",
    preco: 397.90,
    imgUrl: "/produtos/amortecedor1.svg",
    category: "amortecedores",
    parcelamento: 12,
    veiculos: ["Chevrolet Montana", "Chevrolet Vectra", "Chevrolet Astra"],
  },
  {
    id: 2,
    nome: "Suporte Ponta de Eixo Parafusada e Reforçada",
    descricao:
      "Suporte de ponta de eixo reforçado para maior durabilidade. Fabricado em aço de alta resistência, suporta cargas elevadas sem deformar. Compatível com Montana, Vectra, Astra, Peugeot 307/308/408.",
    preco: 997.90,
    imgUrl: "/produtos/ponta-eixo1.svg",
    category: "ponta-de-eixo",
    parcelamento: 12,
    veiculos: ["Chevrolet Montana", "Chevrolet Vectra", "Chevrolet Astra", "Peugeot 307", "Peugeot 308", "Peugeot 408"],
  },
  {
    id: 3,
    nome: "Calço Antirruído Universal para Suspensão",
    descricao:
      "Calço de borracha de alta densidade para eliminar ruídos e vibrações na suspensão. Fácil instalação, compatível com a maioria dos veículos nacionais e importados. Reduz o desgaste de peças adjacentes.",
    preco: 49.90,
    imgUrl: "/produtos/calco1.svg",
    category: "calco-antirruido",
    parcelamento: 6,
    veiculos: ["Universal"],
  },
  {
    id: 4,
    nome: "Bolsa de Ar para Suspensão Pneumática — Reforçada",
    descricao:
      "Bolsa de ar reforçada para sistemas de suspensão a ar. Confeccionada em borracha de alta resistência com dupla camada de kevlar. Suporta alta pressão sem deformações. Ideal para projetos de air lift e suspensão pneumática.",
    preco: 667.00,
    imgUrl: "/produtos/bolsa-ar1.svg",
    category: "bolsa-de-ar",
    parcelamento: 12,
    veiculos: ["Universal"],
  },
  {
    id: 5,
    nome: "Kit Instalação Suspensão a Ar — Chicote + Central",
    descricao:
      "Kit completo para instalação de suspensão a ar. Inclui chicote elétrico com conectores, central de distribuição elétrica com mangueiras e conexões. Todas as peças necessárias para uma instalação profissional.",
    preco: 667.00,
    imgUrl: "/produtos/kit-instalacao1.svg",
    category: "acessorio-instalacao",
    parcelamento: 12,
    veiculos: ["Universal"],
  },
  {
    id: 6,
    nome: "Mola Helicoidal Dianteira — Original",
    descricao:
      "Mola helicoidal dianteira original de fábrica. Fabricada em aço silício-manganês com tratamento térmico. Compatível com diversos modelos nacionais. Restaura a altura original do veículo e melhora o conforto.",
    preco: 297.50,
    imgUrl: "/produtos/mola1.svg",
    category: "mola-suspensao",
    parcelamento: 10,
    veiculos: ["Chevrolet Montana"],
  },
  {
    id: 7,
    nome: "Amortecedor Traseiro — Aplicação Universal",
    descricao:
      "Amortecedor traseiro de alta performance, compatível com diversos veículos nacionais. Controle preciso de amortecimento, garantindo estabilidade em curvas e frenagens.",
    preco: 299.90,
    imgUrl: "/produtos/amortecedor1.svg",
    category: "amortecedores",
    parcelamento: 10,
    veiculos: ["Universal"],
  },
  {
    id: 8,
    nome: "Coxim do Amortecedor — Dianteiro",
    descricao:
      "Coxim de amortecimento dianteiro em borracha vulcanizada. Absorve impactos e vibrações, prolongando a vida útil do amortecedor. Compatível com a maioria dos veículos nacionais.",
    preco: 79.90,
    imgUrl: "/produtos/calco1.svg",
    category: "calco-antirruido",
    parcelamento: 6,
    veiculos: ["Chevrolet Montana", "Chevrolet Vectra"],
  },
  {
    id: 9,
    nome: "Mangueira para Suspensão a Ar — 10 metros",
    descricao:
      "Mangueira de nylon reforçado para sistemas de suspensão a ar. Suporta pressão de até 200 PSI. Resistente a óleo e temperatura. Ideal para instalações profissionais de air ride.",
    preco: 89.90,
    imgUrl: "/produtos/bolsa-ar1.svg",
    category: "bolsa-de-ar",
    parcelamento: 6,
    veiculos: ["Universal"],
  },
];
