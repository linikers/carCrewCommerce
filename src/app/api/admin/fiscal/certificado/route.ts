import { requireAdmin } from "@/lib/api-auth";
import { NextRequest, NextResponse } from "next/server";
import { exigirModulo } from "@/modules/guard";
import { prepararCertificado, diasParaVencer } from "@/modules/_nucleo/certificado";
import {
  gravarCertificado,
  lerCertificadoSalvo,
  removerCertificado,
} from "@/modules/fiscal/dados/cadastro";

/**
 * Upload do certificado A1 (.pfx/.p12) com a senha.
 *
 * O arquivo é lido na hora para conferir a senha e extrair titular/CNPJ/
 * validade — senha errada é recusada aqui, não no dia da primeira nota. Depois
 * de cifrado, nem o arquivo nem a senha ficam legíveis no banco.
 */

const LIMITE_BYTES = 1024 * 1024; // 1 MB — .pfx é pequeno

export async function GET() {
  const denied = await requireAdmin();
  if (denied) return denied;
  const bloqueio = await exigirModulo("fiscal");
  if (bloqueio) return bloqueio;

  const cert = await lerCertificadoSalvo();

  if (!cert) return NextResponse.json({ certificado: null });

  return NextResponse.json({
    certificado: { ...cert, diasParaVencer: diasParaVencer(cert.validoAte) },
  });
}

export async function POST(req: NextRequest) {
  const denied = await requireAdmin();
  if (denied) return denied;
  const bloqueio = await exigirModulo("fiscal");
  if (bloqueio) return bloqueio;

  try {
    const form = await req.formData();
    const arquivo = form.get("arquivo");
    const senha = String(form.get("senha") || "");

    if (!(arquivo instanceof File)) {
      return NextResponse.json({ error: "Envie o arquivo .pfx/.p12" }, { status: 400 });
    }
    if (arquivo.size === 0 || arquivo.size > LIMITE_BYTES) {
      return NextResponse.json(
        { error: "Arquivo vazio ou maior que 1 MB" },
        { status: 400 }
      );
    }
    if (!senha) {
      return NextResponse.json({ error: "Informe a senha do certificado" }, { status: 400 });
    }

    const bytes = Buffer.from(await arquivo.arrayBuffer());
    const preparado = prepararCertificado(arquivo.name, bytes, senha);

    const salvo = await gravarCertificado({
      nomeArquivo: preparado.nomeArquivo,
      conteudo: preparado.conteudoCifrado,
      senha: preparado.senhaCifrada,
      titular: preparado.titular,
      cnpj: preparado.cnpj,
      emissor: preparado.emissor,
      validoDe: preparado.validoDe,
      validoAte: preparado.validoAte,
    });

    return NextResponse.json({
      certificado: { ...salvo, diasParaVencer: diasParaVencer(salvo.validoAte) },
    });
  } catch (error) {
    const mensagem =
      error instanceof Error ? error.message : "Não foi possível ler o certificado";
    console.error("[fiscal/certificado] falha:", error);
    return NextResponse.json({ error: mensagem }, { status: 400 });
  }
}

export async function DELETE() {
  const denied = await requireAdmin();
  if (denied) return denied;
  const bloqueio = await exigirModulo("fiscal");
  if (bloqueio) return bloqueio;

  await removerCertificado();
  return NextResponse.json({ ok: true });
}
