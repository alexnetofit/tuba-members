import type { Metadata } from "next";
import { Suspense } from "react";
import { Inter, Bebas_Neue, Playfair_Display } from "next/font/google";
import { Toaster } from "sonner";
import { RouteProgress } from "@/components/layout/route-progress";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

const bebas = Bebas_Neue({
  variable: "--font-bebas",
  weight: "400",
  subsets: ["latin"],
  display: "swap",
});

const playfair = Playfair_Display({
  variable: "--font-playfair",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Curso Tubarão EAOF 2027 — Área do Aluno",
  description:
    "Plataforma oficial do Curso Tubarão. Aulas, simulados, ranking e materiais para a aprovação na EAOF 2027.",
  icons: {
    icon: "/favicon.ico",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="pt-BR"
      className={`${inter.variable} ${bebas.variable} ${playfair.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <Suspense fallback={null}>
          <RouteProgress />
        </Suspense>
        {children}
        <Toaster
          position="top-right"
          theme="dark"
          toastOptions={{
            style: {
              background: "#0f1f3a",
              border: "1px solid rgba(212, 164, 74, 0.3)",
              color: "#f8fafc",
            },
          }}
        />
      </body>
    </html>
  );
}
