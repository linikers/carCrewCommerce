"use client";

import { Box, Typography } from "@mui/material";
import { Fragment, type ReactNode } from "react";

/**
 * Renderiza o texto das páginas institucionais (#182).
 *
 * Formato aceito (o mesmo que o painel mostra):
 * - linha em branco separa parágrafos
 * - linha começando com "- " vira item de lista (pode conviver com texto no
 *   mesmo bloco: "Para que a troca seja aceita:\n- item 1\n- item 2")
 * - **texto** fica em negrito
 */
function comNegrito(linha: string, chave: string): ReactNode[] {
  return linha.split("**").map((parte, i) =>
    i % 2 === 1 ? (
      <strong key={`${chave}-${i}`}>{parte}</strong>
    ) : (
      <Fragment key={`${chave}-${i}`}>{parte}</Fragment>
    )
  );
}

export default function TextoRico({ texto }: { texto: string }) {
  const blocos = texto.split(/\n\s*\n/).map((b) => b.trim()).filter(Boolean);

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
      {blocos.map((bloco, i) => {
        const linhas = bloco.split("\n").map((l) => l.trim()).filter(Boolean);

        // Agrupa linhas consecutivas em parágrafos e listas (- item).
        const partes: { tipo: "texto" | "lista"; itens: string[] }[] = [];
        for (const linha of linhas) {
          const ehItem = linha.startsWith("- ");
          const ultima = partes[partes.length - 1];
          if (ehItem) {
            if (ultima?.tipo === "lista") ultima.itens.push(linha.slice(2));
            else partes.push({ tipo: "lista", itens: [linha.slice(2)] });
          } else if (ultima?.tipo === "texto") {
            ultima.itens.push(linha);
          } else {
            partes.push({ tipo: "texto", itens: [linha] });
          }
        }

        return (
          <Fragment key={i}>
            {partes.map((parte, j) =>
              parte.tipo === "lista" ? (
                <Box component="ul" key={j} sx={{ ml: 2, my: 0, lineHeight: 1.8, color: "#444" }}>
                  {parte.itens.map((item, k) => (
                    <li key={k}>
                      <Typography component="span" variant="body1" sx={{ lineHeight: 1.8, color: "#444" }}>
                        {comNegrito(item, `${i}-${j}-${k}`)}
                      </Typography>
                    </li>
                  ))}
                </Box>
              ) : (
                <Typography key={j} variant="body1" sx={{ lineHeight: 1.9, color: "#444" }}>
                  {parte.itens.map((linha, k) => (
                    <Fragment key={k}>
                      {k > 0 && <br />}
                      {comNegrito(linha, `${i}-${j}-${k}`)}
                    </Fragment>
                  ))}
                </Typography>
              )
            )}
          </Fragment>
        );
      })}
    </Box>
  );
}
