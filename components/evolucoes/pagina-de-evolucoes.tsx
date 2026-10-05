"use client"

// A página de evoluções: o terapeuta escreve as dele; a coordenação e o admin acompanham a equipe.
import { useEvolucoes } from "@/context/EvolucoesContext";
import { EvolucoesDoTerapeuta } from "./evolucoes-do-terapeuta";
import { PainelDaCoordenacao } from "./painel-da-coordenacao";

export function PaginaDeEvolucoes({ criancaInicial }: { criancaInicial?: string }) {
  const { escopo } = useEvolucoes();
  if (escopo === "terapeuta") return <EvolucoesDoTerapeuta criancaInicial={criancaInicial} />;
  if (escopo === "equipe") return <PainelDaCoordenacao criancaInicial={criancaInicial} />;
  return null;
}
