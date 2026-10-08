"use client"

// A equipe da criança (lib/diagnostico), lida da agenda uma vez por criança aberta.
import { useEffect, useMemo, useState } from "react";
import { equipeDaCrianca, type SessaoDaEquipe } from "@/lib/diagnostico";
import { getSessoesDaEquipe } from "@/services/diagnosticoService";

/** Sem patientId, não busca (o prontuário só pede depois de abrir a criança). */
export function useEquipeDaCrianca(patientId: string | undefined, meuProfessionalId?: string) {
  const [sessoes, setSessoes] = useState<SessaoDaEquipe[] | null>(null);
  const [erro, setErro] = useState(false);

  useEffect(() => {
    if (!patientId) return;
    let ativo = true;
    setSessoes(null);
    setErro(false);
    getSessoesDaEquipe(patientId)
      .then((lidas) => ativo && setSessoes(lidas))
      .catch((e) => {
        console.error("Erro ao carregar a equipe da criança:", e);
        if (ativo) setErro(true);
      });
    return () => {
      ativo = false;
    };
  }, [patientId]);

  const equipe = useMemo(() => (sessoes ? equipeDaCrianca(sessoes, meuProfessionalId) : null), [sessoes, meuProfessionalId]);
  return { equipe, erro };
}
