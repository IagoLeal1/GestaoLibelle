import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { Header } from "@/components/header";
import { AuthGuard } from "@/components/auth/auth-guard";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // A única responsabilidade do layout agora é montar a estrutura visual.
  // Ele é "envolvido" pelo AuthGuard, que faz toda a verificação.
  return (
    <AuthGuard>
      <SidebarProvider>
        <AppSidebar />
        <SidebarInset>
          <Header />
          <main className="p-4 sm:p-6 bg-gray-50 min-h-screen">
            {children}
          </main>
        </SidebarInset>
      </SidebarProvider>
    </AuthGuard>
  );
}