import { NextRequest, NextResponse } from "next/server";
import { auditar } from "@/lib/auditoria";
import { validarChave } from "@/modules/fiscal/dados/retorno";
import { lerCertificadoParaEmissor } from "@/modules/fiscal/dados/certificado-emissor";

/**
 * Certificado A1 para o worker do emissor (Bearer cc_…).
 *
 * Devolve o .pfx em base64 e a senha decifrada — é o mínimo para assinar a nota.
 * `no-store` para não ficar em cache de borda, e cada leitura é auditada.
 */
export async function GET(req: NextRequest) {
  const autorizado = await validarChave(req.headers.get("authorization"));
  if (!autorizado) {
    return NextResponse.json({ error: "Chave de API inválida ou ausente" }, { status: 401 });
  }

  try {
    const certificado = await lerCertificadoParaEmissor();
    if (!certificado) {
      return NextResponse.json({ error: "Nenhum certificado cadastrado no painel" }, { status: 404 });
    }

    await auditar({
      entidade: "configuracao",
      entidadeId: "certificado-emissor",
      acao: "alterar",
      antes: null,
      depois: { evento: "certificado lido pelo emissor", titular: certificado.titular },
    });

    return NextResponse.json(certificado, {
      headers: { "Cache-Control": "no-store, max-age=0" },
    });
  } catch (error) {
    const mensagem = error instanceof Error ? error.message : "Falha ao ler o certificado";
    return NextResponse.json({ error: mensagem }, { status: 500 });
  }
}
