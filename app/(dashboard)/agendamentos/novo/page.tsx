import { AppointmentForm } from "@/components/forms/appointment-form";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function NovoAgendamentoPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/agendamentos" passHref> {/* ou /agendamentos */}
          <Button variant="ghost" size="icon"><ArrowLeft className="h-4 w-4" /></Button>
        </Link>
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Novo Agendamento</h2>
          <p className="text-muted-foreground">Cadastre um novo agendamento no sistema.</p>
        </div>
      </div>
      <AppointmentForm />
    </div>
  );
}