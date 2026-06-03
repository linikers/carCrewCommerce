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
          fontSize: { xs: 18, md: 32 },
          fontWeight: 900,
          lineHeight: 1,
          color: "#ff6a00",
          textShadow: `
            0 0 2px #ff6a00,
            0 0 4px #ff6a00
          `,
        }}
      >
        Car
      </Typography>
      <Typography
        component="span"
        sx={{
          fontFamily: "var(--font-orbitron), 'Orbitron', sans-serif",
          fontSize: { xs: 18, md: 32 },
          fontWeight: 900,
          lineHeight: 1,
          color: "#fff",
          textShadow: `
            0 0 2px #fff,
            0 0 4px #fff
          `,
        }}
      >
        Crew
      </Typography>
      <Typography
        component="span"
        sx={{
          fontFamily: "var(--font-orbitron), 'Orbitron', sans-serif",
          fontSize: { xs: 14, md: 24 },
          fontWeight: 700,
          lineHeight: 1,
          color: "#ff6a00",
          textShadow: `
            0 0 2px #ff6a00,
            0 0 4px #ff6a00
          `,
          ml: { xs: 0.75, md: 1.25 },
        }}
      >
        Garage
      </Typography>
    </Box>
  );
}
