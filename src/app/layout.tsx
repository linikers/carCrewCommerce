import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import MuiProvider from "@/lib/MuiProvider";
import { CartProvider } from "@/lib/CartContext";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "CarCrew Suspensões — Peças para Suspensão Automotiva",
  description:
    "Loja especializada em peças para suspensão automotiva. Amortecedores, molas, calços, ponta de eixo e muito mais.",
  keywords: [
    "suspensão automotiva",
    "amortecedores",
    "peças de suspensão",
    "calço antirruído",
    "ponta de eixo",
    "bolsa de ar",
    "car crew",
  ],
  authors: [{ name: "CarCrew Suspensões" }],
  manifest: "/manifest.json",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#E65100",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="pt-BR"
      className={`${geistSans.variable} ${geistMono.variable}`}
    >
      <body>
        <MuiProvider>
          <CartProvider>{children}</CartProvider>
        </MuiProvider>
      </body>
    </html>
  );
}
