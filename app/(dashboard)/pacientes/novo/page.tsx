"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"
// Importamos o componente oficial que já tem o campo novo
import { PatientForm } from "@/components/forms/patient-form" 

export default function NovoPacientePage() {
  // Não precisamos mais de estados (loading, error, formData) aqui, 
  // pois o PatientForm já cuida de tudo isso internamente.

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/pacientes">
          <Button variant="ghost" size="icon"><ArrowLeft className="h-4 w-4" /></Button>
        </Link>
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Novo Paciente</h2>
          <p className="text-muted-foreground">Cadastre um novo paciente no sistema</p>
        </div>
      </div>

      {/* AQUI ESTÁ A MÁGICA: Substituímos 200 linhas por 1 linha */}
      <PatientForm />
      
    </div>
  )
}