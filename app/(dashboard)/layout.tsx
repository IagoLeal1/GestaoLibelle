'use client';

import type React from "react";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";

// Importando os componentes de layout como eles foram projetados
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { Header } from "@/components/header";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, userProfile, loading } = useAuth();
  const router = useRouter();

  // Lógica de proteção (continua perfeita)
  useEffect(() => {
    if (!loading && !user) router.push("/login");
    if (user && userProfile?.status === 'pendente') router.push("/aguardando-aprovacao");
  }, [user, userProfile, loading, router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Carregando...</p>
      </div>
    );
  }

  // A MÁGICA FINAL: Usamos a estrutura original do V0
  if (user && userProfile?.status === 'aprovado') {
    return (
      <SidebarProvider>
        {/* A Sidebar fica aqui... */}
        <AppSidebar />
        
        {/* E o conteúdo principal vai DENTRO do SidebarInset */}
        <SidebarInset>
          <Header />
          <main className="p-6 bg-support-light-gray">
            {children}
          </main>
        </SidebarInset>
      </SidebarProvider>
    );
  }

  return null;
}