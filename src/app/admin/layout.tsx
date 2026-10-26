import type { Metadata } from "next";

/**
 * 5.1: o admin não tinha layout próprio — cada tela montava o seu, e três
 * delas chegaram a renderizar o Header da loja por cima do painel.
 *
 * A proteção de sessão fica no middleware (rota + API) e `requireAdmin()` nos
 * handlers; aqui o layout existe para título, metadados e um ponto único de
 * mudança para o esqueleto do painel.
 */
export const metadata: Metadata = {
  // Sem `template` aqui: o layout raiz já aplica " | Car Crew Garage".
  // Com os dois, a aba virava "Painel · Car Crew Garage | Car Crew Garage".
  // As telas do painel ainda definem o título pelo AdminLayout (client).
  title: "Painel",
  robots: { index: false, follow: false },
};

export default function AdminRootLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
