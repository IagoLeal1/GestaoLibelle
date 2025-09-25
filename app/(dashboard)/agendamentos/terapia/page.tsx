// app/(dashboard)/agendamentos/terapia/page.tsx
import { GradeTerapiasClientPage } from "@/components/pages/grade-terapias-client-page";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function GradeTerapiaPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/agendamentos" passHref>
          <Button variant="ghost" size="icon"><ArrowLeft className="h-4 w-4" /></Button>
        </Link>
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Grade por Terapia</h2>
          <p className="text-muted-foreground">Visualize os horários dos acompanhantes terapêuticos por especialidade.</p>
        </div>
      </div>
      <GradeTerapiasClientPage />
    </div>
  );
}