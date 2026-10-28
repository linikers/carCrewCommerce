import { requireAdmin } from "@/lib/api-auth";
import { NextRequest, NextResponse } from "next/server";
import { exigirModulo } from "@/modules/guard";
import { cnpjValido } from "@/modules/fiscal/dominio/fiscal";
import { invalidarContatoEmpresa } from "@/lib/empresa";
import {
  lerCertificadoSalvo,
  lerEmpresa,
  lerPolitica,
  listarPendencias,
  salvarEmpresa,
} from "@/modules/fiscal/dados/cadastro";

/**
 * Cadastro fiscal da empresa + situação para emitir.
 *
 * Cadastrar aqui **não emite** nada: a emissão é o #79 e depende da política
 * por canal e do certificado A1.
 */
export async function GET() {
  const denied = await requireAdmin();
  if (denied) return denied;
  const bloqueio = await exigirModulo("fiscal");
  if (bloqueio) return bloqueio;

  const [empresa, politica, pendencias, certificado] = await Promise.all([
    lerEmpresa(),
    lerPolitica(),
    listarPendencias(),
    lerCertificadoSalvo(),
  ]);

  const cadastroCompleto = Boolean(
    empresa?.razaoSocial &&
      cnpjValido(empresa.cnpj ?? "") &&
      empresa.ie &&
      empresa.cidade &&
      empresa.uf
  );

  // A validade vem do certificado REAL (tabela `certificado_digital`).
  //
  // Antes lia `empresa_fiscal.certificado_validade`, uma coluna que o upload
  // nunca preencheu: o certificado estava válido no box e a tela anunciava
  // "Sem certificado A1" na mesma página, bloqueando "pode emitir".
  const certificadoValido = Boolean(
    certificado?.validoAte && new Date(certificado.validoAte) > new Date()
  );

  return NextResponse.json({
    empresa,
    politica,
    pendencias,
    status: {
      cadastroCompleto,
      certificadoValido,
      // emissão pronta só quando os três pilares existem
      podeEmitir: cadastroCompleto && certificadoValido,
      totalPendencias: pendencias.length,
    },
  });
}

export async function PUT(req: NextRequest) {
  const denied = await requireAdmin();
  if (denied) return denied;
  const bloqueio = await exigirModulo("fiscal");
  if (bloqueio) return bloqueio;

  try {
    const body = await req.json();

    if (body.cnpj && !cnpjValido(String(body.cnpj))) {
      return NextResponse.json(
        { error: "CNPJ inválido — confira os 14 dígitos (o dígito verificador não fecha)." },
        { status: 400 }
      );
    }

    if (!body.razaoSocial && !body.cnpj) {
      // salvando parcial (ex.: só o certificado): não exige tudo
    }

    const empresa = await salvarEmpresa({
      razaoSocial: body.razaoSocial,
      nomeFantasia: body.nomeFantasia,
      cnpj: body.cnpj,
      ie: body.ie,
      im: body.im,
      crt: body.crt !== undefined ? Number(body.crt) : undefined,
      cnae: body.cnae,
      cep: body.cep,
      logradouro: body.logradouro,
      numero: body.numero,
      complemento: body.complemento,
      bairro: body.bairro,
      cidade: body.cidade,
      uf: body.uf,
      telefone: body.telefone,
      email: body.email,
      ambiente: body.ambiente,
      serie: body.serie !== undefined ? Number(body.serie) : undefined,
      proximoNumero: body.proximoNumero !== undefined ? Number(body.proximoNumero) : undefined,
      certificadoNome: body.certificadoNome,
      certificadoValidade: body.certificadoValidade ? new Date(body.certificadoValidade) : undefined,
    });

    // Razão social, fantasia e endereço aparecem no site — limpa o cache.
    invalidarContatoEmpresa();

    return NextResponse.json({ empresa });
  } catch (error) {
    console.error("[admin/fiscal] falha ao salvar:", error);
    return NextResponse.json({ error: "Não foi possível salvar o cadastro." }, { status: 500 });
  }
}
