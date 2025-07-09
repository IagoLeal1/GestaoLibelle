import Link from 'next/link';
import { PlusCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ProfessionalsClientPage } from '@/components/pages/professionals-client-page'; // Corrigido o nome aqui

// A página não é mais 'async'
export default function ProfissionaisPage() {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Profissionais</h2>
          <p className="text-muted-foreground">
            Gerencie os profissionais da sua clínica.
          </p>
        </div>
        <Link href="/profissionais/novo">
          <Button><PlusCircle className="h-4 w-4 mr-2" />Novo Profissional</Button>
        </Link>
      </div>

      {/* Renderiza o componente de cliente sem props. Ele busca seus próprios dados. */}
      <ProfessionalsClientPage />
    </div>
  );
}