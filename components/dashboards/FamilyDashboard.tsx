'use client';

import { useAuth } from "@/context/AuthContext";

export function FamilyDashboard() {
  const { user } = useAuth();
  
  return (
    <div>
      <h2 className="text-2xl font-bold">Bem-vindo(a), {user?.displayName}!</h2>
      <p className="text-muted-foreground">Este é o painel da sua família.</p>
      {/* Aqui você mostraria os agendamentos APENAS dos filhos vinculados */}
    </div>
  )
}