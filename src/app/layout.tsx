import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";

import { AppProviders } from "@/app/providers";

import "./globals.css";

export const metadata: Metadata = {
  description: "Découvre qui est disponible maintenant autour de toi, selon sa vibe.",
  title: {
    default: "Leco — Ça bouge comment ?",
    template: "%s · Leco",
  },
};

export const viewport: Viewport = {
  colorScheme: "light dark",
  themeColor: [
    { color: "#fff9ef", media: "(prefers-color-scheme: light)" },
    { color: "#21191f", media: "(prefers-color-scheme: dark)" },
  ],
  width: "device-width",
};

export default function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="fr">
      <body>
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  );
}
