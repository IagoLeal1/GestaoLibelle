import { GradeTerapeutaClientPage } from "@/components/pages/grade-terapeuta-client-page";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

type Props = {
  searchParams: Promise<{ professionalId?: string }>;
};

export default async function GradeTerapeutaPage({ searchParams }: Props) {
  const { professionalId } = await searchParams;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/agendamentos" aria-label="Voltar para agendamentos">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Grade por Terapeuta</h2>
          <p className="text-muted-foreground">Visualize os atendimentos semanais e agende diretamente com o profissional.</p>
        </div>
      </div>
      <GradeTerapeutaClientPage initialProfessionalId={professionalId ?? ""} />
    </div>
  );
}
