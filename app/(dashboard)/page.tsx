"use client";

import { useAuth } from "@/context/AuthContext";
import { AdminDashboard } from "@/components/dashboards/AdminDashboard";
import { ProfessionalDashboard } from "@/components/dashboards/ProfessionalDashboard";
import { FamilyDashboard } from "@/components/dashboards/FamilyDashboard";

// Este é o componente da sua página principal. Ele tem um export default.
export default function DashboardPage() {
  const { firestoreUser } = useAuth();

  // Enquanto o perfil não carrega, mostramos um loader.
  // O AuthGuard já nos protege, mas esta é uma segurança extra.
  if (!firestoreUser) {
    return <div>Carregando perfil do usuário...</div>;
  }

  // Com base no 'role' do usuário, renderizamos o dashboard correto.
  switch (firestoreUser.profile.role) {
    case 'admin':
      return <AdminDashboard />;
    case 'profissional':
      return <ProfessionalDashboard />; 
    case 'familiar':
      return <FamilyDashboard />; 
    case 'funcionario':
      return <div>Painel do Funcionário em construção.</div>;
    default:
      return <div>Seu perfil não tem um dashboard associado.</div>;
  }
}
