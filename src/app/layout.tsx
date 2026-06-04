import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono, Orbitron } from "next/font/google";
import MuiProvider from "@/lib/MuiProvider";
import { CartProvider } from "@/lib/CartContext";
import AuthProvider from "@/lib/AuthProvider";
import "./globals.css";
import Script from "next/script";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const orbitron = Orbitron({
  variable: "--font-orbitron",
  subsets: ["latin"],
  weight: ["700", "800", "900"],
});

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://carcrew.com.br";
const storeName = "CarCrew Suspensões";
const storeDescription =
  "Loja especializada em peças para suspensão automotiva. Amortecedores, molas, calços, ponta de eixo, bolsa de ar e muito mais. Entrega para todo Brasil.";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: `${storeName} — Peças para Suspensão Automotiva`,
    template: `%s | ${storeName}`,
  },
  description: storeDescription,
  keywords: [
    "suspensão automotiva",
    "amortecedores",
    "peças de suspensão",
    "calço antirruído",
    "ponta de eixo",
    "bolsa de ar",
    "car crew suspensões",
    "peças suspensão maringá",
  ],
  authors: [{ name: "CarCrew Suspensões" }],
  manifest: "/manifest.json",
  openGraph: {
    type: "website",
    locale: "pt_BR",
    siteName: storeName,
    title: `${storeName} — Peças para Suspensão Automotiva`,
    description: storeDescription,
    url: siteUrl,
    images: [
      {
        url: "/og-image.jpg",
        width: 1200,
        height: 630,
        alt: "CarCrew Suspensões",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: `${storeName} — Peças para Suspensão Automotiva`,
    description: storeDescription,
    images: ["/og-image.jpg"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  category: "vehicles",
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
      className={`${geistSans.variable} ${geistMono.variable} ${orbitron.variable}`}
    >
      <body>
        <AuthProvider>
          <MuiProvider>
            <CartProvider>{children}</CartProvider>
          </MuiProvider>
        </AuthProvider>

        {/* Structured Data — LocalBusiness */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "Store",
              name: "CarCrew Suspensões",
              image: `${siteUrl}/og-image.jpg`,
              "@id": siteUrl,
              url: siteUrl,
              telephone: "(44) 99813-3182",
              address: {
                "@type": "PostalAddress",
                streetAddress: "Av. Dona Sophia Rasgulaeff, 2825 - Jardim Novo Oasis",
                addressLocality: "Maringá",
                addressRegion: "PR",
                postalCode: "87047-300",
                addressCountry: "BR",
              },
              openingHoursSpecification: [
                { "@type": "OpeningHoursSpecification", dayOfWeek: "Monday", opens: "08:00", closes: "18:00" },
                { "@type": "OpeningHoursSpecification", dayOfWeek: "Tuesday", opens: "08:00", closes: "18:00" },
                { "@type": "OpeningHoursSpecification", dayOfWeek: "Wednesday", opens: "08:00", closes: "18:00" },
                { "@type": "OpeningHoursSpecification", dayOfWeek: "Thursday", opens: "08:00", closes: "18:00" },
                { "@type": "OpeningHoursSpecification", dayOfWeek: "Friday", opens: "08:00", closes: "18:00" },
                { "@type": "OpeningHoursSpecification", dayOfWeek: "Saturday", opens: "09:00", closes: "11:00" },
              ],
              sameAs: [
                "https://www.instagram.com/carcrewgarage_/",
                "https://www.facebook.com/CarCrewG",
              ],
            }),
          }}
        />

        {/* Google tag (gtag.js) */}
        <Script
          src="https://www.googletagmanager.com/gtag/js?id=G-6YMBYX21SF"
          strategy="afterInteractive"
        />
        <Script id="google-analytics" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', 'G-6YMBYX21SF');
          `}
        </Script>

        {/* Cloudinary Upload Widget */}
        <script
          src="https://upload-widget.cloudinary.com/global/all.js"
          async
        />
      </body>
    </html>
  );
}
