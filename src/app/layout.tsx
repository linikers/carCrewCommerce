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
const storeName = "Car Crew Garage";
const storeDescription =
  "Loja especializada em suspensão automotiva custom e peças. Amortecedores, molas, calços, ponta de eixo, bolsa de ar, nivelamento e muito mais. Entrega para todo Brasil. Car Crew Garage — sua oficina de confiança em Maringá.";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: `${storeName} - Custom - Suspensões - Peças Automotivas`,
    template: `%s | ${storeName}`,
  },
  description: storeDescription,
  alternates: {
    canonical: "/",
  },
  keywords: [
    "car crew garage",
    "carcrew suspensões",
    "suspensão automotiva custom",
    "amortecedores",
    "peças de suspensão",
    "calço antirruído",
    "ponta de eixo",
    "bolsa de ar",
    "suspensão a ar",
    "nivelamento veicular",
    "peças suspensão maringá",
    "oficina suspensão maringá",
    "molas automotivas",
    "peças suspensão atacado",
    "car crew garage maringá",
  ],
  authors: [{ name: storeName }],
  manifest: "/manifest.json",
  openGraph: {
    type: "website",
    locale: "pt_BR",
    siteName: storeName,
    title: `${storeName} - Custom - Suspensões - Peças Automotivas`,
    description: storeDescription,
    url: siteUrl,
    images: [
      {
        url: "/og-image.jpg",
        width: 1200,
        height: 630,
        alt: "Car Crew Garage - Suspensão Automotiva Custom em Maringá",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: `${storeName} - Custom - Suspensões - Peças Automotivas`,
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
  icons: {
    icon: [
      { url: "/favicon/favicon.ico", sizes: "any" },
      { url: "/favicon/favicon-16x16.png", sizes: "16x16", type: "image/png" },
      { url: "/favicon/favicon-32x32.png", sizes: "32x32", type: "image/png" },
    ],
    apple: [
      { url: "/favicon/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
    ],
  },
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
              name: storeName,
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
                "https://share.google/iPKvtaL8rfQXonZW1",
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
