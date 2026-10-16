import type { Metadata, Viewport } from "next";
import { Barlow_Condensed, IBM_Plex_Mono, Inter } from "next/font/google";
import { site } from "@/content/site";
import MotionProvider from "@/providers/MotionProvider";
import Fundo3D from "@/components/background/Fundo3D";
import SkipLink from "@/components/layout/SkipLink";
import ScrollProgress from "@/components/layout/ScrollProgress";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import "./globals.css";

// Mesmos pesos que o <link> do Google Fonts pedia. adjustFontFallback desligado:
// as reservas com métrica medida à mão estão em styles/fonts.css.
const barlow = Barlow_Condensed({
  subsets: ["latin"],
  weight: "600",
  display: "swap",
  adjustFontFallback: false,
  variable: "--font-barlow-face",
});

const plex = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  display: "swap",
  adjustFontFallback: false,
  variable: "--font-plex-face",
});

const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "500"],
  display: "swap",
  adjustFontFallback: false,
  variable: "--font-inter-face",
});

// Domínio absoluto para og:image/og:url. A Vercel injeta o de produção.
const dominio = process.env.VERCEL_PROJECT_PRODUCTION_URL
  ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
  : "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(dominio),
  title: site.titulo,
  description: site.descricao,
  openGraph: {
    type: "website",
    title: site.titulo,
    description: site.descricaoOg,
    images: [site.imagemOg],
    url: "/",
  },
  twitter: { card: "summary_large_image" },
};

export const viewport: Viewport = {
  // Espelha --ink de styles/tokens.css: aqui é gerado no servidor e não lê CSS.
  themeColor: "#131619",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="pt-BR"
      className={`${barlow.variable} ${plex.variable} ${inter.variable}`}
    >
      <body>
        <MotionProvider>
          <Fundo3D />
          <SkipLink />
          <ScrollProgress />
          <Header />
          {children}
          <Footer />
        </MotionProvider>
      </body>
    </html>
  );
}
