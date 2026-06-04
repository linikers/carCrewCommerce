import { Box, Typography } from "@mui/material";

export default function CarCrewLogoText() {
  return (
    <Box
      sx={{
        display: "flex",
        alignItems: "baseline",
        gap: 0,
        width: "fit-content",
      }}
    >
      <Typography
        component="span"
        sx={{
          fontFamily: "var(--font-orbitron), 'Orbitron', sans-serif",
          fontSize: { xs: 22, md: 36 },
          fontWeight: 900,
          lineHeight: 1,
          color: "#E65100",
          textShadow: `
            0 0 1px #E65100,
            0 0 2px #E65100
          `,
        }}
      >
        CAR
      </Typography>
      <Typography
        component="span"
        sx={{
          fontFamily: "var(--font-orbitron), 'Orbitron', sans-serif",
          fontSize: { xs: 22, md: 36 },
          fontWeight: 900,
          lineHeight: 1,
          color: "#1A1A1A",
          textShadow: `
            0 0 1px rgba(0,0,0,0.15),
            0 0 2px rgba(0,0,0,0.08)
          `,
        }}
      >
        CREW
      </Typography>
      <Typography
        component="span"
        sx={{
          fontFamily: "var(--font-orbitron), 'Orbitron', sans-serif",
          fontSize: { xs: 14, md: 22 },
          fontWeight: 700,
          lineHeight: 1,
          color: "#E65100",
          textShadow: `
            0 0 1px #E65100,
            0 0 2px #E65100
          `,
          ml: { xs: 0.75, md: 1.25 },
        }}
      >
        GARAGE
      </Typography>
    </Box>
  );
}
