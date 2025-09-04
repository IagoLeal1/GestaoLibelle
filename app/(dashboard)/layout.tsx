// app/(dashboard)/layout.tsx
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { Header } from "@/components/header";
import { AuthGuard } from "@/components/auth/auth-guard";
import { Chatbot } from "@/components/chatbot/Chatbot"; // <-- 1. IMPORTE AQUI

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthGuard>
      <SidebarProvider>
        <AppSidebar />
        <SidebarInset>
          <Header />
          <main className="p-4 sm:p-6 bg-support-light-gray min-h-screen">
            {children}
          </main>
        </SidebarInset>
      </SidebarProvider>
      <Chatbot /> {/* <-- 2. ADICIONE AQUI */}
    </AuthGuard>
  );
}