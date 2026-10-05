"use client"

import { useAuth } from "@/context/AuthContext";
import { ehGestao } from "@/lib/permissoes";
import { MuralDeAvisos } from "@/components/avisos/mural-de-avisos";
import { PainelDeAvisos } from "@/components/avisos/painel-de-avisos";

// Avisos: quem recebe (terapeutas e famílias) lê no mural; a gestão envia e acompanha pelo painel
export default function AvisosPage() {
  const { firestoreUser } = useAuth();
  if (!firestoreUser) return null;
  return ehGestao(firestoreUser.profile.role) ? <PainelDeAvisos /> : <MuralDeAvisos />;
}
