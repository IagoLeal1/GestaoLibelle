"use client"

import { CommunicationsClientPage } from "@/components/pages/communications-client-page";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { useAuth } from "@/context/AuthContext";

export default function ComunicacaoPage() {
  const { firestoreUser } = useAuth();

  // Verifica se o usuário tem permissão para criar comunicados
  const canCreate = firestoreUser?.profile.role === 'admin' || firestoreUser?.profile.role === 'funcionario';

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Comunicação Interna</h2>
          <p className="text-muted-foreground">Gerencie avisos e comunicados para a equipe</p>
        </div>
        
        {/* Botão "Novo Comunicado" só aparece para quem tem permissão */}
        {canCreate && (
          <CommunicationsClientPage.CreateCommunicationModal />
        )}
      </div>
      
      <CommunicationsClientPage />
    </div>
  );
}