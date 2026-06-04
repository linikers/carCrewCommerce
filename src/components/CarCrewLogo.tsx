import { Box, Typography } from "@mui/material";

export default function CarCrewLogo() {
  return (
    <Box
      sx={{
        width: "fit-content",
        p: { xs: 2.5, md: 4 },
        bgcolor: "#000",
        border: { xs: "5px solid #000", md: "8px solid #000" },
        clipPath:
          "polygon(25% 0%, 75% 0%, 100% 50%, 75% 100%, 25% 100%, 0% 50%)",
        position: "relative",
      }}
    >
      <Box
        sx={{
          border: { xs: "4px solid white", md: "6px solid white" },
          p: { xs: 2.5, md: 4 },
          clipPath:
            "polygon(25% 0%, 75% 0%, 100% 50%, 75% 100%, 25% 100%, 0% 50%)",
        }}
      >
        <Typography
          sx={{
            fontFamily: "var(--font-orbitron), 'Orbitron', sans-serif",
            fontSize: { xs: 28, md: 72 },
            fontWeight: 900,
            lineHeight: 1,
            color: "#ff6a00",
            textAlign: "center",
            textShadow: `
              0 0 5px #ff6a00,
              0 0 10px #ff6a00,
              0 0 20px #ff6a00
            `,
          }}
        >
          CAR
        </Typography>

        <Typography
          sx={{
            fontFamily: "var(--font-orbitron), 'Orbitron', sans-serif",
            fontSize: { xs: 36, md: 90 },
            fontWeight: 900,
            lineHeight: 0.9,
            color: "#fff",
            textAlign: "center",
            textShadow: `
              0 0 5px #fff,
              0 0 10px #fff,
              0 0 20px #fff
            `,
          }}
        >
          CREW
        </Typography>

        <Typography
          sx={{
            fontFamily: "var(--font-orbitron), 'Orbitron', sans-serif",
            fontSize: { xs: 22, md: 52 },
            fontWeight: 900,
            lineHeight: 1,
            color: "#ff6a00",
            textAlign: "center",
            textShadow: `
              0 0 5px #ff6a00,
              0 0 10px #ff6a00,
              0 0 20px #ff6a00
            `,
          }}
        >
          GARAGE
        </Typography>
      </Box>
    </Box>
  );
}
