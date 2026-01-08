"use client"

import { useState, useEffect } from "react"
import { useParams } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"
import { getPatientById, Patient } from "@/services/patientService"
// Importamos o componente oficial
import { PatientForm } from "@/components/forms/patient-form" 

export default function EditPatientPage() {
  const params = useParams();
  const patientId = params.id as string;

  const [loading, setLoading] = useState(true);
  const [patientData, setPatientData] = useState<Patient | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!patientId) return;

    const fetchPatientData = async () => {
      setLoading(true);
      const data = await getPatientById(patientId);
      
      if (data) {
        setPatientData(data);
      } else {
        setError("Paciente não encontrado.");
      }
      setLoading(false);
    };

    fetchPatientData();
  }, [patientId]);

  if (loading) return <p className="p-8 text-center text-muted-foreground">Carregando dados do paciente...</p>;
  if (error) return <p className="p-8 text-center text-red-500">{error}</p>

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/pacientes">
          <Button variant="ghost" size="icon"><ArrowLeft className="h-4 w-4" /></Button>
        </Link>
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Editar Paciente</h2>
          <p className="text-muted-foreground">Altere os dados de {patientData?.fullName}</p>
        </div>
      </div>

      {/* Passamos os dados carregados para o formulário oficial */}
      {patientData && (
          <PatientForm initialData={patientData} />
      )}
      
    </div>
  );
}