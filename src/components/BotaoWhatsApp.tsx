"use client";

import type { ReactNode } from "react";
import NextLink from "next/link";
import Button, { type ButtonProps } from "@mui/material/Button";
import { WhatsApp } from "@mui/icons-material";
import { useEmpresa } from "@/components/EmpresaProvider";
import { linkWhatsApp } from "@/lib/empresa-contato";

/**
 * Botão que abre o WhatsApp da empresa cadastrada em "Minha empresa".
 *
 * Existe porque páginas de servidor (as LPs) não podem usar o contexto —
 * assim o número não fica escrito em cada página, e trocar o telefone no
 * painel muda todos os botões de uma vez.
 *
 * Recebe só as props visuais (variant, size, sx…) em vez de espalhar
 * `ButtonProps`: o `ref` do MUI aponta para <button> e quebra o tipo do <a>.
 */
export default function BotaoWhatsApp({
  mensagem,
  children,
  variant = "contained",
  size,
  color,
  sx,
  fullWidth,
}: {
  mensagem?: string;
  children: ReactNode;
  variant?: ButtonProps["variant"];
  size?: ButtonProps["size"];
  color?: ButtonProps["color"];
  sx?: ButtonProps["sx"];
  fullWidth?: boolean;
}) {
  const contato = useEmpresa();

  return (
    <Button
      component={NextLink}
      href={linkWhatsApp(contato.telefone, mensagem)}
      target="_blank"
      rel="noopener noreferrer"
      variant={variant}
      size={size}
      color={color}
      sx={sx}
      fullWidth={fullWidth}
      startIcon={<WhatsApp />}
    >
      {children}
    </Button>
  );
}
