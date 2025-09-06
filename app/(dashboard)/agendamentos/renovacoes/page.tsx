// app/(dashboard)/agendamentos/renovacoes/page.tsx
import { RenewalManagementClientPage } from "@/components/pages/renewal-management-client-page";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function RenovacoesPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/agendamentos" passHref>
          <Button variant="ghost" size="icon"><ArrowLeft className="h-4 w-4" /></Button>
        </Link>
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Gerenciar Renovações</h2>
          <p className="text-muted-foreground">Renove ou dispense os blocos de agendamentos que estão terminando.</p>
        </div>
      </div>
      <RenewalManagementClientPage />
    </div>
  );
}