import { Box } from "@mui/material";

/**
 * Emblema da marca (8.1).
 *
 * Antes era texto em Orbitron com `textShadow` — não era o emblema hexagonal
 * que a marca usa no Instagram e nos adesivos, e três pesos diferentes no
 * mesmo bloco brigavam com o resto do header.
 *
 * Agora é o emblema vetorial (`/brand/emblema.svg`): mesmo desenho do arquivo
 * de marca, sem sombra, sem fonte substituta e nítido em qualquer densidade
 * de tela.
 */
export default function CarCrewLogoText({
  height,
}: {
  /** Altura em px. Sem valor, acompanha o header. */
  height?: number | { xs: number; md: number };
}) {
  return (
    <Box
      component="img"
      src="/brand/emblema.svg"
      alt="Car Crew Garage"
      sx={{
        height: height ?? { xs: 44, md: 56 },
        width: "auto",
        display: "block",
      }}
    />
  );
}
