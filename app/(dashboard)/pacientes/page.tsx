import Link from 'next/link';
import { PlusCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PatientClientPage } from '@/components/pages/patient-client-page';

// A página não é mais 'async', está correto.
export default function PacientesPage() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-primary-dark-blue">
            Pacientes
          </h2>
          <p className="text-muted-foreground">
            Gerencie o cadastro de pacientes da clínica
          </p>
        </div>
        <Link href="/pacientes/novo">
          <Button className="w-full sm:w-auto">
            <PlusCircle className="h-4 w-4 mr-2" />
            Novo Paciente
          </Button>
        </Link>
      </div>

      {/* Renderizamos o componente de cliente sem props. Ele se vira para buscar os dados. */}
      <PatientClientPage />
    </div>
  );
}