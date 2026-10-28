import { requireAdmin } from "@/lib/api-auth";
import { NextRequest, NextResponse } from "next/server";
import {
  ErroMercadoPago,
  configPublica,
  lerConfigMercadoPago,
  salvarConfigMercadoPago,
  testarCredencial,
} from "@/lib/mercado-pago";

/**
 * Conta do Mercado Pago para receber PIX.
 *
 * GET  — estado para a tela (token nunca volta; só `temAccessToken`)
 * PUT  — grava; campo de segredo vazio mantém o que já está salvo
 * POST — testa a credencial em /users/me e devolve a conta
 */

function baseUrl(req: NextRequest): string {
  return (
    process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ||
    new URL(req.url).origin
  );
}

export async function GET(req: NextRequest) {
  const denied = await requireAdmin();
  if (denied) return denied;

  const config = await lerConfigMercadoPago();
  return NextResponse.json(configPublica(config, baseUrl(req)));
}

export async function PUT(req: NextRequest) {
  const denied = await requireAdmin();
  if (denied) return denied;

  try {
    const body = (await req.json()) as Record<string, unknown>;

    const config = await salvarConfigMercadoPago({
      habilitado: typeof body.habilitado === "boolean" ? body.habilitado : undefined,
      ambiente: typeof body.ambiente === "string" ? body.ambiente : undefined,
      publicKey: body.publicKey === undefined ? undefined : String(body.publicKey ?? ""),
      accessToken:
        body.accessToken === undefined ? undefined : String(body.accessToken ?? ""),
      webhookSecret:
        body.webhookSecret === undefined ? undefined : String(body.webhookSecret ?? ""),
      cartao:
        body.cartao && typeof body.cartao === "object"
          ? {
              habilitado:
                typeof (body.cartao as Record<string, unknown>).habilitado === "boolean"
                  ? ((body.cartao as Record<string, unknown>).habilitado as boolean)
                  : undefined,
              maxParcelas: Number((body.cartao as Record<string, unknown>).maxParcelas),
              semJurosAte: Number((body.cartao as Record<string, unknown>).semJurosAte),
            }
          : undefined,
    });

    return NextResponse.json(configPublica(config, baseUrl(req)));
  } catch (erro) {
    console.error("[admin/pagamentos/mercadopago] falha ao salvar:", erro);
    return NextResponse.json(
      { error: "Não foi possível salvar a conta do Mercado Pago." },
      { status: 500 }
    );
  }
}

export async function POST() {
  const denied = await requireAdmin();
  if (denied) return denied;

  const config = await lerConfigMercadoPago();

  if (!config.accessToken) {
    return NextResponse.json(
      {
        ok: false,
        error:
          "Cole o Access Token de produção (ou de teste) antes de testar a conexão.",
      },
      { status: 400 }
    );
  }

  try {
    const conta = await testarCredencial(config);

    return NextResponse.json({
      ok: true,
      conta: {
        id: conta.id,
        apelido: conta.nickname ?? null,
        email: conta.email ?? null,
        site: conta.site_id ?? null,
      },
      ambiente: config.ambiente,
    });
  } catch (erro) {
    const mensagem =
      erro instanceof ErroMercadoPago
        ? erro.status === 401
          ? "Access Token recusado. Copie de novo em Suas integrações → Credenciais (produção ou teste, conforme o ambiente) e salve."
          : erro.message
        : "Não foi possível falar com o Mercado Pago.";

    return NextResponse.json(
      { ok: false, error: mensagem },
      { status: erro instanceof ErroMercadoPago && erro.status === 401 ? 401 : 502 }
    );
  }
}
