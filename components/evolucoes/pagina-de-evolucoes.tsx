"use client"

// A página de evoluções: o terapeuta escreve as dele; a coordenação e o admin acompanham a equipe.
// O endereço antigo /evolucoes?crianca=ID (da ficha da criança) abre o prontuário dela.
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useEvolucoes } from "@/context/EvolucoesContext";
import { EvolucoesDoTerapeuta } from "./evolucoes-do-terapeuta";
import { PainelDaCoordenacao } from "./painel-da-coordenacao";

export function PaginaDeEvolucoes({ criancaInicial }: { criancaInicial?: string }) {
  const { escopo } = useEvolucoes();
  const router = useRouter();
  useEffect(() => {
    if (criancaInicial) router.replace(`/prontuario/${encodeURIComponent(criancaInicial)}`);
  }, [criancaInicial, router]);

  if (criancaInicial) return null;
  if (escopo === "terapeuta") return <EvolucoesDoTerapeuta />;
  if (escopo === "equipe") return <PainelDaCoordenacao />;
  return null;
}
