"use client";

import { useEffect } from "react";

/**
 * Aviso de alterações não salvas (#183).
 *
 * Dois buracos no painel:
 * 1. F5 / fechar a aba descartava o texto digitado sem avisar.
 * 2. Clicar em qualquer link da barra lateral saía da tela e perdia tudo —
 *    o `beforeunload` sozinho não pega navegação interna do App Router.
 *
 * Aqui o segundo caso é resolvido interceptando o clique em `<a href>`
 * (menu lateral, breadcrumb, "Ver no site"): se o formulário está sujo, o
 * usuário confirma antes de sair e a navegação acontece por `location.href`.
 *
 * Uso: `useAlteracoesNaoSalvas(alterado)` — `alterado` deve ser `estado !==
 * snapshot carregado`, não um booleano que nunca volta a falso depois de salvar.
 */
export function useAlteracoesNaoSalvas(
  alterado: boolean,
  mensagem = "Você tem alterações não salvas nesta tela. Sair agora descarta o que foi digitado."
) {
  useEffect(() => {
    if (!alterado) return;

    const aoSair = (evento: BeforeUnloadEvent) => {
      evento.preventDefault();
      // Navegador antigo exige returnValue para mostrar o diálogo.
      evento.returnValue = mensagem;
      return mensagem;
    };

    const aoClicar = (evento: MouseEvent) => {
      if (evento.defaultPrevented || evento.button !== 0) return;
      if (evento.metaKey || evento.ctrlKey || evento.shiftKey || evento.altKey) return;

      const alvo = evento.target as HTMLElement | null;
      const link = alvo?.closest?.("a[href]") as HTMLAnchorElement | null;
      if (!link) return;
      if (link.target === "_blank" || link.hasAttribute("download")) return;

      const destino = link.getAttribute("href") ?? "";
      if (!destino || destino.startsWith("#")) return;

      // Já estamos nessa página: deixar o Next cuidar (ex.: filtros, abas).
      if (destino === window.location.pathname + window.location.search) return;

      evento.preventDefault();
      evento.stopPropagation();
      if (window.confirm(mensagem)) {
        window.location.href = link.href;
      }
    };

    window.addEventListener("beforeunload", aoSair);
    document.addEventListener("click", aoClicar, true);
    return () => {
      window.removeEventListener("beforeunload", aoSair);
      document.removeEventListener("click", aoClicar, true);
    };
  }, [alterado, mensagem]);
}

/** Serializa o estado para comparar "carregado" x "atual" sem deep equal. */
export function serializar(estado: unknown): string {
  try {
    return JSON.stringify(estado);
  } catch {
    return "";
  }
}
