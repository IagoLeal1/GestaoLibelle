// app/(dashboard)/layout.tsx
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { Header } from "@/components/header";
import { AuthGuard } from "@/components/auth/auth-guard";
import { RoleGuard } from "@/components/auth/role-guard";
import { Toaster } from "sonner";
import { Toaster as ToasterShadcn } from "@/components/ui/toaster";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthGuard>
      <SidebarProvider>
        <AppSidebar />
        {/* min-w-0: conteúdo largo (texto longo que só corta com "…") não alarga a página no celular */}
        <SidebarInset className="min-w-0">
          <Header />
          {/* Altura da tela menos o cabeçalho (h-16): sem rolagem sobrando nas telas curtas */}
          <main className="p-4 sm:p-6 bg-support-light-gray min-h-[calc(100dvh-4rem)]">
            <RoleGuard>{children}</RoleGuard>
          </main>
        </SidebarInset>
      </SidebarProvider>
      {/* Avisos (toast) de todas as telas do painel: sonner e o do shadcn (Minha conta, Gerenciar usuários) */}
      <Toaster richColors />
      <ToasterShadcn />
    </AuthGuard>
  );
}