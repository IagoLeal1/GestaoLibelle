"use client"

import { ProfessionalForm } from "@/components/forms/professional-form";
import { Professional } from "@/services/professionalService";

export default function EditProfessionalPage() {
  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Editar Profissional</h1>
      <ProfessionalForm />
    </div>
  );
}