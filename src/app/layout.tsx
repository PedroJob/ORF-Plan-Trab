import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Plan Trab Manager",
  description: "Sistema de gestão de operações militares e planos de trabalho",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}
