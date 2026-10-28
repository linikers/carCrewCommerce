"use client";

import { createContext, useContext, type ReactNode } from "react";
import { CONTATO_PADRAO, type ContatoEmpresa } from "@/lib/empresa-contato";

/**
 * Dados de contato da empresa para os componentes de cliente.
 *
 * O layout raiz (servidor) lê "Minha empresa" e injeta aqui; assim rodapé,
 * cabeçalho, cards e checkout mostram o mesmo telefone/e-mail que estão no
 * painel, sem cada componente fazer sua própria consulta.
 */
const EmpresaContext = createContext<ContatoEmpresa>(CONTATO_PADRAO);

export function EmpresaProvider({
  valor,
  children,
}: {
  valor: ContatoEmpresa;
  children: ReactNode;
}) {
  return <EmpresaContext.Provider value={valor}>{children}</EmpresaContext.Provider>;
}

export function useEmpresa(): ContatoEmpresa {
  return useContext(EmpresaContext);
}
