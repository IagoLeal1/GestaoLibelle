"use client"

// A história de uma criança: as evoluções de todas as terapias, das mais recentes para as mais
// antigas, com filtro por terapia. O terapeuta só abre a das crianças que atende.
import { useCallback, useEffect, useState } from "react";
import type { DocumentData, QueryDocumentSnapshot } from "firebase/firestore";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/context/AuthContext";
import { useEvolucoes } from "@/context/EvolucoesContext";
import { cn } from "@/lib/utils";
import { incompatibilidade, type Evolucao, type SessaoDaAgenda } from "@/lib/evolucoes";
import { entrarNaEquipeDaCrianca, getHistoriaDaCrianca, getSessoesPorId } from "@/services/evolucaoService";
import type { AlvoDaFolha } from "./folha-da-evolucao";
import { AlertaDeIncompatibilidade, quandoFoi, SeloIncompativel, SeloNaoAconteceu, TextoDaEvolucao } from "./comum";

export function HistoriaDaCrianca({ patientId, versao = 0, onAbrir }: { patientId: string; versao?: number; onAbrir: (alvo: AlvoDaFolha) => void }) {
  const { firestoreUser } = useAuth();
  const uid = firestoreUser?.uid;
  const { escopo, professionalId } = useEvolucoes();
  const [evolucoes, setEvolucoes] = useState<Evolucao[]>([]);
  const [sessoes, setSessoes] = useState<Map<string, SessaoDaAgenda>>(new Map());
  const [ultimo, setUltimo] = useState<QueryDocumentSnapshot<DocumentData> | null>(null);
  const [temMais, setTemMais] = useState(false);
  const [carregando, setCarregando] = useState(true);
  const [semAcesso, setSemAcesso] = useState(false);
  const [erro, setErro] = useState(false);
  const [terapia, setTerapia] = useState<string | null>(null);

  const carregar = useCallback(
    async (depoisDe: QueryDocumentSnapshot<DocumentData> | null) => {
      const pagina = await getHistoriaDaCrianca(patientId, depoisDe);
      const daAgenda = await getSessoesPorId(pagina.evolucoes.map((e) => e.appointmentId));
      return { ...pagina, daAgenda };
    },
    [patientId]
  );

  useEffect(() => {
    let ativo = true;
    setCarregando(true);
    setErro(false);
    setSemAcesso(false);
    setTerapia(null);
    (async () => {
      try {
        if (escopo === "terapeuta") {
          const atende = !!uid && !!professionalId && (await entrarNaEquipeDaCrianca(uid, patientId, professionalId));
          if (!atende) {
            if (ativo) setSemAcesso(true);
            return;
          }
        }
        const { evolucoes: primeiras, ultimo: fim, temMais: mais, daAgenda } = await carregar(null);
        if (!ativo) return;
        setEvolucoes(primeiras);
        setSessoes(daAgenda);
        setUltimo(fim);
        setTemMais(mais);
      } catch (e) {
        console.error("Erro ao carregar a história da criança:", e);
        if (ativo) setErro(true);
      } finally {
        if (ativo) setCarregando(false);
      }
    })();
    return () => {
      ativo = false;
    };
  }, [patientId, versao, escopo, professionalId, uid, carregar]);

  async function carregarMais() {
    try {
      const { evolucoes: mais, ultimo: fim, temMais: aindaTem, daAgenda } = await carregar(ultimo);
      setEvolucoes((atuais) => [...atuais, ...mais]);
      setSessoes((atuais) => new Map([...atuais, ...daAgenda]));
      setUltimo(fim);
      setTemMais(aindaTem);
    } catch (e) {
      console.error("Erro ao carregar evoluções antigas:", e);
    }
  }

  if (carregando) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-24 w-full" />
      </div>
    );
  }
  if (semAcesso) return <p className="py-6 text-center text-sm text-muted-foreground">Você não atende esta criança, então não vê a história dela.</p>;
  if (erro) return <p className="py-6 text-center text-sm text-destructive">Não foi possível carregar a história. Tente de novo.</p>;
  if (evolucoes.length === 0) return <p className="py-6 text-center text-sm text-muted-foreground">Esta criança ainda não tem evoluções.</p>;

  const terapias = [...new Set(evolucoes.map((e) => e.terapia).filter(Boolean))].sort();
  const visiveis = terapia ? evolucoes.filter((e) => e.terapia === terapia) : evolucoes;

  return (
    <div className="space-y-4">
      {terapias.length > 1 && (
        <div className="flex flex-wrap gap-2" role="group" aria-label="Filtrar por terapia">
          {[null, ...terapias].map((t) => (
            <Button
              key={t ?? "todas"}
              size="sm"
              variant="outline"
              aria-pressed={terapia === t}
              onClick={() => setTerapia(t)}
              className={cn("h-8 rounded-full", terapia === t && "border-primary-teal bg-primary-teal/10 text-primary-teal hover:bg-primary-teal/10")}
            >
              {t ?? "Todas"}
            </Button>
          ))}
        </div>
      )}

      <ol className="space-y-3">
        {visiveis.map((evolucao) => {
          const sessao = sessoes.get(evolucao.appointmentId);
          const motivo = incompatibilidade(sessao, evolucao.aconteceu);
          const minha = evolucao.autorId === uid;
          return (
            <li key={evolucao.appointmentId} className="rounded-lg border bg-card p-4">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="font-medium">
                    {quandoFoi(evolucao.dataDaSessao)} · {evolucao.terapia || "Terapia"}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {evolucao.autorNome}
                    {evolucao.editadoEm && " · editada"}
                  </p>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {!evolucao.aconteceu && <SeloNaoAconteceu />}
                  {motivo && <SeloIncompativel />}
                </div>
              </div>
              <div className="mt-3">
                <TextoDaEvolucao evolucao={evolucao} />
              </div>
              {motivo && <AlertaDeIncompatibilidade motivo={motivo} className="mt-3" />}
              {minha && (
                <Button variant="link" className="mt-1 h-auto px-0 text-primary-teal" onClick={() => onAbrir({ sessao, evolucao })}>
                  Abrir para corrigir
                </Button>
              )}
            </li>
          );
        })}
      </ol>

      {temMais && (
        <Button variant="outline" className="w-full" onClick={carregarMais}>
          Carregar evoluções mais antigas
        </Button>
      )}
    </div>
  );
}
