import { AgendamentosClientPage } from "@/components/pages/agendamentos-client-page";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import Link from "next/link";

export default function AgendamentosPage() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Agendamentos</h2>
          <p className="text-muted-foreground">Gerencie todos os agendamentos da clínica por período</p>
        </div>
        <Link href="/agendamentos/novo">
          <Button className="w-full sm:w-auto">
            <Plus className="mr-2 h-4 w-4" />
            Novo Agendamento
          </Button>
        </Link>
      </div>
      
      {/* Usamos o nome correto do componente aqui */}
      <AgendamentosClientPage />
    </div>
  );
}