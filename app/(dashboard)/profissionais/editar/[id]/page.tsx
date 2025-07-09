// /app/profissionais/editar/[id]/page.tsx

import { ProfessionalForm } from "@/components/forms/professional-form";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

// A página não é mais 'async'
export default function EditProfessionalPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/profissionais" passHref>
          <Button variant="ghost" size="icon"><ArrowLeft className="h-4 w-4" /></Button>
        </Link>
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Editar Profissional</h2>
          <p className="text-muted-foreground">Altere os dados do profissional abaixo.</p>
        </div>
      </div>
      
      {/* O formulário agora é inteligente e buscará seus próprios dados */}
      <ProfessionalForm />
    </div>
  );
}