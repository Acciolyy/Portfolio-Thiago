import type { Metadata, Viewport } from "next";
import { Archivo, IBM_Plex_Sans, JetBrains_Mono } from "next/font/google";
import { site } from "@/content/site";
import MotionProvider from "@/providers/MotionProvider";
import ScriptTema from "@/components/tema/ScriptTema";
import FundoCobras from "@/components/background/FundoCobras";
import SkipLink from "@/components/layout/SkipLink";
import Aparelho from "@/components/Aparelho";
import "./globals.css";

// Archivo é variável: o eixo wdth (104–118% no site) vem junto com o peso.
const archivo = Archivo({
  subsets: ["latin"],
  axes: ["wdth"],
  display: "swap",
  variable: "--font-archivo",
});

const plexSans = IBM_Plex_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  display: "swap",
  variable: "--font-plex-sans",
});

const jetbrains = JetBrains_Mono({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-jetbrains",
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
  themeColor: "#0E1113",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    // suppressHydrationWarning: o script do <head> põe data-theme no <html>
    // antes de o React hidratar; o DOM vence.
    <html
      lang="pt-BR"
      className={`${archivo.variable} ${plexSans.variable} ${jetbrains.variable}`}
      suppressHydrationWarning
    >
      <head>
        <ScriptTema />
      </head>
      <body>
        <MotionProvider>
          <FundoCobras />
          <SkipLink />
          <Aparelho />
          {children}
        </MotionProvider>
      </body>
    </html>
  );
}
