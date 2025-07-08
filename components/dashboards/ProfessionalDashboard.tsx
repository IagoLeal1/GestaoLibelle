'use client';

import { useAuth } from "@/context/AuthContext";

export function ProfessionalDashboard() {
  const { user } = useAuth();

  return (
    <div>
      <h2 className="text-2xl font-bold">Olá, {user?.displayName}!</h2>
      <p className="text-muted-foreground">Este é o seu painel de Profissional.</p>
      {/* Aqui você mostraria os agendamentos APENAS deste profissional */}
    </div>
  )
}