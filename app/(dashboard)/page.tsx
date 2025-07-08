'use client';

import { useAuth } from "@/context/AuthContext";

// Importe os componentes de dashboard que você irá criar
import { AdminDashboard } from "@/components/dashboards/AdminDashboard";
import { ProfessionalDashboard } from "@/components/dashboards/ProfessionalDashboard";
import { FamilyDashboard } from "@/components/dashboards/FamilyDashboard";

export default function DashboardPage() {
  const { userProfile } = useAuth();

  // O layout pai (DashboardLayout) já exibe um "Carregando...".
  // Quando este componente renderiza, podemos assumir que userProfile já existe.
  // Esta verificação é apenas uma segurança extra.
  if (!userProfile) {
    return null; 
  }

  // Renderiza o dashboard correto com base no 'role' do usuário
  switch (userProfile.role) {
    case 'admin':
      return <AdminDashboard />;
    case 'profissional':
      return <ProfessionalDashboard />;
    case 'familiar':
      return <FamilyDashboard />;
    case 'funcionario':
      // Você pode criar um dashboard para funcionário também
      return <div>Painel do Funcionário em construção.</div>;
    default:
      // Um fallback caso o role seja desconhecido
      return <div>Seu perfil não tem um dashboard associado.</div>;
  }
}