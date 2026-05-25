"use client";

import { createTheme } from "@mui/material/styles";

const theme = createTheme({
  palette: {
    primary: {
      main: "#E65100",
      light: "#FF8A3D",
      dark: "#BF360C",
      contrastText: "#ffffff",
    },
    secondary: {
      main: "#1A1A1A",
      light: "#333333",
      dark: "#000000",
      contrastText: "#ffffff",
    },
    background: {
      default: "#FAFAFA",
      paper: "#ffffff",
    },
    text: {
      primary: "#1A1A1A",
      secondary: "#555555",
    },
  },
  typography: {
    fontFamily:
      '"Geist Sans", "Inter", "Roboto", "Helvetica", "Arial", sans-serif',
    h1: {
      fontWeight: 700,
      fontSize: "2.5rem",
      lineHeight: 1.1,
      color: "#1A1A1A",
    },
    h2: {
      fontWeight: 700,
      fontSize: "2rem",
      lineHeight: 1.15,
      color: "#1A1A1A",
    },
    h3: {
      fontWeight: 600,
      fontSize: "1.5rem",
      color: "#1A1A1A",
    },
    h4: {
      fontWeight: 600,
      fontSize: "1.25rem",
    },
    h5: {
      fontWeight: 600,
      fontSize: "1.1rem",
    },
    h6: {
      fontWeight: 600,
      fontSize: "1rem",
    },
    button: {
      textTransform: "none",
      fontWeight: 600,
    },
  },
  shape: {
    borderRadius: 8,
  },
  components: {
    MuiButtonBase: {
      defaultProps: {
        disableRipple: true,
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          padding: "0.6rem 1.5rem",
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          boxShadow: "0 1px 4px rgba(0,0,0,0.1)",
        },
      },
    },
  },
});

export default theme;
