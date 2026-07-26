import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";

import "@fontsource-variable/bodoni-moda";
import "@fontsource-variable/jost";

import { AppProviders } from "@/app/providers";

import "./globals.css";

export const metadata: Metadata = {
  description:
    "Découvre qui est disponible maintenant autour de toi, sans exposer ta position exacte.",
  title: {
    default: "Leco — Qui est partant maintenant ?",
    template: "%s · Leco",
  },
};

export const viewport: Viewport = {
  colorScheme: "light dark",
  themeColor: [
    { color: "#f8f4ec", media: "(prefers-color-scheme: light)" },
    { color: "#211d1a", media: "(prefers-color-scheme: dark)" },
  ],
  viewportFit: "cover",
  width: "device-width",
};

export default function RootLayout({
  children,
}: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="fr">
      <body>
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  );
}
