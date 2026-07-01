// API mock de frete — futuramente será Melhor Envio ou equivalente
import { NextResponse } from "next/server";

interface FreightRequest {
  cepDestino: string;
  itens: Array<{
    peso: number;
    altura: number;
    largura: number;
    profundidade: number;
    quantidade: number;
  }>;
}

interface FreightOption {
  id: string;
  transportadora: string;
  modalidade: string;
  prazo: string;
  valor: number;
  erro?: string;
}

// CEP de origem CarCrew (Maringá/PR)
const CEP_ORIGEM = "87033400";

export async function POST(request: Request) {
  try {
    const body: FreightRequest = await request.json();
    const { cepDestino, itens } = body;

    // Validar CEP
    const cepLimpo = cepDestino.replace(/\D/g, "");
    if (cepLimpo.length !== 8) {
      return NextResponse.json(
        { erro: "CEP inválido" },
        { status: 400 }
      );
    }

    // Calcular peso total e dimensões maiores
    const pesoTotal = itens.reduce(
      (sum, item) => sum + item.peso * item.quantidade,
      0
    );
    const alturaMax = Math.max(...itens.map((i) => i.altura));
    const larguraMax = Math.max(...itens.map((i) => i.largura));
    const profundidadeTotal = itens.reduce(
      (sum, item) => sum + item.profundidade * item.quantidade,
      0
    );

    // MOCK: simular cálculo de frete
    // Em produção, aqui seria a chamada ao Melhor Envio ou equivalente
    const opcoes: FreightOption[] = [
      {
        id: "pac",
        transportadora: "Correios",
        modalidade: "PAC",
        prazo: "8 a 12 dias úteis",
        valor: calcularFreteMock(pesoTotal, "pac"),
      },
      {
        id: "sedex",
        transportadora: "Correios",
        modalidade: "SEDEX",
        prazo: "3 a 5 dias úteis",
        valor: calcularFreteMock(pesoTotal, "sedex"),
      },
      {
        id: "express",
        transportadora: "Jadlog",
        modalidade: "Express",
        prazo: "2 a 4 dias úteis",
        valor: calcularFreteMock(pesoTotal, "express"),
      },
    ];

    return NextResponse.json({
      cepOrigem: CEP_ORIGEM,
      cepDestino: cepLimpo,
      pesoTotal: `${pesoTotal}g`,
      dimensoes: `${alturaMax}x${larguraMax}x${profundidadeTotal}cm`,
      opcoes,
    });
  } catch (error) {
    return NextResponse.json(
      { erro: "Erro ao calcular frete" },
      { status: 500 }
    );
  }
}

// Função mock — substituir por integração real
function calcularFreteMock(pesoGramas: number, modalidade: string): number {
  const pesoKg = pesoGramas / 1000;

  // Base por modalidade
  const bases: Record<string, number> = {
    pac: 15,
    sedex: 25,
    express: 35,
  };

  // Adicionar por kg
  const porKg: Record<string, number> = {
    pac: 4.5,
    sedex: 7,
    express: 10,
  };

  const valor = (bases[modalidade] || 15) + (porKg[modalidade] || 4.5) * pesoKg;

  // Mínimo
  return Math.max(valor, 18.9);
}
