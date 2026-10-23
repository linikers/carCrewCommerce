import prisma from "@/lib/prisma";

/**
 * Limite de tentativas de login (7.7).
 *
 * Antes: força bruta livre contra `/api/auth/callback/credentials`. Como as
 * senhas antigas were texto puro e não há política de complexidade, um ataque
 * de dicionário era trivial.
 *
 * A chave é o e-mail normalizado — o callback `authorize` do NextAuth não
 * recebe o IP da requisição. Isso protege a conta atacada; para proteger o
 * servidor de varredura de e-mails seria preciso rate limit por IP no
 * middleware, que fica como próximo passo.
 *
 * 5 falhas em 15 minutos bloqueiam a conta por 15 minutos.
 */

const JANELA_MS = 15 * 60 * 1000;
const BLOQUEIO_MS = 15 * 60 * 1000;
const MAX_FALHAS = 5;

function chaveDe(email: string) {
  return email.trim().toLowerCase();
}

/** Segundos restantes de bloqueio, ou 0 se pode tentar. */
export async function segundosBloqueado(email: string): Promise<number> {
  const chave = chaveDe(email);
  try {
    const row = await prisma.tentativaLogin.findUnique({ where: { chave } });
    if (!row?.bloqueadoAte) return 0;
    const restante = row.bloqueadoAte.getTime() - Date.now();
    if (restante <= 0) {
      await prisma.tentativaLogin.delete({ where: { chave } }).catch(() => {});
      return 0;
    }
    return Math.ceil(restante / 1000);
  } catch (e) {
    // Nunca travar o login por falha do contador.
    console.error("[rate-limit] falha ao consultar:", e);
    return 0;
  }
}

export async function registrarFalha(email: string): Promise<void> {
  const chave = chaveDe(email);
  try {
    const agora = new Date();
    const row = await prisma.tentativaLogin.findUnique({ where: { chave } });

    if (!row || agora.getTime() - row.primeiraEm.getTime() > JANELA_MS) {
      await prisma.tentativaLogin.upsert({
        where: { chave },
        create: { chave, falhas: 1, primeiraEm: agora },
        update: { falhas: 1, primeiraEm: agora, bloqueadoAte: null },
      });
      return;
    }

    const falhas = row.falhas + 1;
    await prisma.tentativaLogin.update({
      where: { chave },
      data: {
        falhas,
        bloqueadoAte: falhas >= MAX_FALHAS ? new Date(agora.getTime() + BLOQUEIO_MS) : null,
      },
    });
  } catch (e) {
    console.error("[rate-limit] falha ao registrar:", e);
  }
}

export async function limparTentativas(email: string): Promise<void> {
  try {
    await prisma.tentativaLogin.delete({ where: { chave: chaveDe(email) } });
  } catch {
    // sem registro = nada a limpar
  }
}
