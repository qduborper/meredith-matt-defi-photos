import type { Metadata, Viewport } from "next";
import { Dancing_Script, Nunito_Sans } from "next/font/google";

import { EVENT } from "@/lib/constants";
import "./globals.css";

const dancingScript = Dancing_Script({
  variable: "--font-dancing",
  subsets: ["latin"],
  weight: ["500", "600", "700"],
  display: "swap",
});

// Repli d'Avenir Next hors appareils Apple. Les graisses 300 et 400 servent
// aux sous-textes « très légers » de la charte.
const nunitoSans = Nunito_Sans({
  variable: "--font-nunito",
  subsets: ["latin"],
  weight: ["300", "400", "600", "700"],
  display: "swap",
});

export const metadata: Metadata = {
  title: `Défi Photo · ${EVENT.brideAndGroom}`,
  description: `Relevez les défis photo du mariage de ${EVENT.brideAndGroom}, ${EVENT.place}, ${EVENT.dateLabel}.`,
  // Événement privé : jamais indexé.
  robots: { index: false, follow: false },
};

export const viewport: Viewport = {
  themeColor: "#F8F5E5",
  // Pas de maximumScale : brider le zoom casse l'accessibilité.
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="fr"
      className={`${dancingScript.variable} ${nunitoSans.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col">{children}</body>
    </html>
  );
}
