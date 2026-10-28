import { requireAdmin } from "@/lib/api-auth";
import { NextRequest, NextResponse } from "next/server";
import { auditar } from "@/lib/auditoria";
import {
  invalidarContatoEmpresa,
  lerEmpresa,
  salvarEmpresa,
  type DadosEmpresa,
} from "@/lib/empresa";

/**
 * Dados da empresa (#os-pdf).
 *
 * Fonte única para tudo que leva o nome da loja: PDF da OS, orçamento, nota
 * fiscal. A tela `/admin/empresa` é a única que escreve aqui.
 *
 * O CNPJ é opcional de propósito: a loja funciona sem ele. Quem exige o dado é
 * a emissão da nota, no momento de emitir — nunca o cadastro.
 */

const ID = "unica";

export async function GET() {
  const denied = await requireAdmin();
  if (denied) return denied;

  const empresa = await lerEmpresa();

  return NextResponse.json({ empresa });
}

export async function PUT(req: NextRequest) {
  const denied = await requireAdmin();
  if (denied) return denied;

  try {
    const body = await req.json();
    const antes = await lerEmpresa();

    // Identidade da loja. CNPJ, IE, regime, série e numeração da nota são da
    // aba Fiscal (/api/admin/fiscal) — esta rota não os toca.
    const dados = {
      razaoSocial: String(body.razaoSocial || "").trim() || "Car Crew Garage",
      nomeFantasia: body.nomeFantasia ? String(body.nomeFantasia).trim() : null,
      cep: body.cep ? String(body.cep).replace(/\D/g, "") || null : null,
      logradouro: body.logradouro ? String(body.logradouro).trim() : null,
      numero: body.numero ? String(body.numero).trim() : null,
      complemento: body.complemento ? String(body.complemento).trim() : null,
      bairro: body.bairro ? String(body.bairro).trim() : null,
      cidade: body.cidade ? String(body.cidade).trim() : null,
      uf: body.uf ? String(body.uf).toUpperCase().slice(0, 2) : null,
      telefone: body.telefone ? String(body.telefone).replace(/\D/g, "") : null,
      email: body.email ? String(body.email).trim() : null,
      logo: body.logo === undefined ? undefined : body.logo,
      redesSociais: body.redesSociais
        ? {
            site: body.redesSociais.site || null,
            instagram: body.redesSociais.instagram || null,
            facebook: body.redesSociais.facebook || null,
            tiktok: body.redesSociais.tiktok || null,
            youtube: body.redesSociais.youtube || null,
          }
        : undefined,
    };

    const { registro: empresa } = await salvarEmpresa(
      dados as Partial<DadosEmpresa> & { razaoSocial: string }
    );

    // O site inteiro lê estes dados do cache: salvar tem que valer na hora.
    invalidarContatoEmpresa();

    await auditar({
      entidade: "empresa",
      entidadeId: ID,
      acao: antes ? "alterar" : "criar",
      antes: antes ? { ...antes, logo: antes.logo ? "[imagem]" : null } : undefined,
      depois: { ...dados, logo: dados.logo ? "[imagem]" : null },
    });

    return NextResponse.json({ ok: true, empresa: dados });
  } catch (erro) {
    console.error("[admin/empresa] falha ao salvar:", erro);
    return NextResponse.json({ error: "Não foi possível salvar os dados da empresa" }, { status: 500 });
  }
}
