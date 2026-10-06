import type { Metadata, Viewport } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { AuthProvider } from "@/context/AuthContext" // Importe o AuthProvider
import { OuvirInstalacao } from "@/components/ouvir-instalacao"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Casa Libelle - Sistema de Gestão Clínica",
  description: "Sistema completo para gestão de clínicas de terapias integradas",
  // No iPhone, "Adicionar à Tela de Início" abre o site como aplicativo, com este nome (app/manifest.ts)
  appleWebApp: { capable: true, title: "Libelle", statusBarStyle: "default" },
}

// A cor da barra do celular quando o site abre como aplicativo: a mesma do cabeçalho
export const viewport: Viewport = {
  themeColor: "#fff6da",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="pt-BR">
      <body className={inter.className}>
        <OuvirInstalacao />
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  )
}