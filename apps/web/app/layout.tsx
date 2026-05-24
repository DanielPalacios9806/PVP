import "./globals.css";
import type { Metadata } from "next";
import { Oxanium, Sora } from "next/font/google";

const headingFont = Oxanium({
  subsets: ["latin"],
  variable: "--font-heading"
});

const bodyFont = Sora({
  subsets: ["latin"],
  variable: "--font-body"
});

export const metadata: Metadata = {
  title: "Darkside.cool",
  description: "Plataforma universitaria de torneos de eSports con gestion competitiva y tokens internos"
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body className={`${headingFont.variable} ${bodyFont.variable}`}>{children}</body>
    </html>
  );
}
