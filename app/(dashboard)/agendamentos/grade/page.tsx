import { GradeAgendamentosClientPage } from "@/components/pages/grade-agendamentos-client-page";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function GradeAgendamentoPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/agendamentos" passHref>
          <Button variant="ghost" size="icon"><ArrowLeft className="h-4 w-4" /></Button>
        </Link>
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Grade de Agendamentos</h2>
          <p className="text-muted-foreground">Selecione um paciente e monte a grade de horários da semana.</p>
        </div>
      </div>
      <GradeAgendamentosClientPage />
    </div>
  );
}