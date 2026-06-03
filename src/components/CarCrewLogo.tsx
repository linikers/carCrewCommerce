import { Box, Typography } from "@mui/material";

export default function CarCrewLogo() {
  return (
    <Box
      sx={{
        width: "fit-content",
        p: { xs: 2, md: 3.2 },
        bgcolor: "#000",
        border: { xs: "4px solid #000", md: "6px solid #000" },
        clipPath:
          "polygon(20% 0%, 80% 0%, 100% 50%, 80% 100%, 20% 100%, 0% 50%)",
        position: "relative",
      }}
    >
      <Box
        sx={{
          border: { xs: "3px solid white", md: "5px solid white" },
          p: { xs: 2, md: 3.2 },
          clipPath:
            "polygon(20% 0%, 80% 0%, 100% 50%, 80% 100%, 20% 100%, 0% 50%)",
        }}
      >
        <Typography
          sx={{
            fontFamily: "var(--font-orbitron), 'Orbitron', sans-serif",
            fontSize: { xs: 22, md: 58 },
            fontWeight: 900,
            lineHeight: 1,
            color: "#ff6a00",
            textAlign: "center",
            textShadow: `
              0 0 2px #ff6a00,
              0 0 4px #ff6a00
            `,
          }}
        >
          CAR
        </Typography>

        <Typography
          sx={{
            fontFamily: "var(--font-orbitron), 'Orbitron', sans-serif",
            fontSize: { xs: 29, md: 72 },
            fontWeight: 900,
            lineHeight: 0.9,
            color: "#fff",
            textAlign: "center",
            textShadow: `
              0 0 2px #fff,
              0 0 4px #fff
            `,
          }}
        >
          CREW
        </Typography>

        <Typography
          sx={{
            fontFamily: "var(--font-orbitron), 'Orbitron', sans-serif",
            fontSize: { xs: 18, md: 42 },
            fontWeight: 900,
            lineHeight: 1,
            color: "#ff6a00",
            textAlign: "center",
            textShadow: `
              0 0 2px #ff6a00,
              0 0 4px #ff6a00
            `,
          }}
        >
          GARAGE
        </Typography>
      </Box>
    </Box>
  );
}
