import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

/**
 * Segunda camada de proteção (a primeira é `requireAdmin()` em cada handler).
 *
 * Cobre /admin/* e /api/admin/* antes de a página ou o handler rodarem.
 * Sem isso, um visitante anônimo que digitasse /admin/categorias recebia o
 * painel inteiro renderizado — 4 das 9 telas não tinham nem checagem no
 * cliente.
 *
 * A tela de login fica de fora: sem essa exceção, quem não estava logado
 * pedia /admin/login e era mandado para /login (a entrada do cliente), então
 * não havia como entrar no painel a partir de uma sessão expirada.
 */
export default withAuth(
  function middleware(req) {
    const { pathname } = req.nextUrl;

    if (pathname === "/admin/login") return NextResponse.next();

    // 6.7: a categoria era query string na home (`/?cat=bolsas-de-ar`), com
    // canonical apontando para `/`. Agora tem rota própria e indexável; links
    // antigos e resultados do Google caem aqui e são redirecionados de forma
    // permanente.
    if (pathname === "/") {
      const cat = req.nextUrl.searchParams.get("cat");
      if (cat) {
        return NextResponse.redirect(
          new URL(`/categoria/${encodeURIComponent(cat)}`, req.url),
          301
        );
      }
    }

    // Fora do admin, o middleware não tem assunto: só a home precisa da regra
    // de redirect acima (e o resto do site é público).
    const isAdminArea = pathname.startsWith("/admin") || pathname.startsWith("/api/admin");
    if (!isAdminArea) return NextResponse.next();

    const isAdmin = Boolean(req.nextauth.token?.admin);
    const isApi = pathname.startsWith("/api/admin");

    if (isAdmin) return NextResponse.next();

    // API responde JSON; página redireciona para o login do painel
    if (isApi) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const login = new URL("/admin/login", req.url);
    login.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(login);
  },
  {
    callbacks: {
      // deixa SEMPRE passar para o meu middleware decidir: quem não tem
      // token também precisa cair no ramo que responde 401 em JSON (API)
      // ou redireciona para o login (página). Se eu devolver false aqui, o
      // withAuth redireciona tudo — inclusive a API — antes do meu código.
      authorized: () => true,
    },
    pages: { signIn: "/login" },
  }
);

export const config = {
  matcher: ["/", "/admin/:path*", "/api/admin/:path*"],
};
