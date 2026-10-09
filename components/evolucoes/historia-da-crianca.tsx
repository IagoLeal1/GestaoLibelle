"use client"

// A história de uma criança: as evoluções de todas as terapias, das mais recentes para as mais
// antigas, com filtro por terapia. O terapeuta só abre a das crianças que atende.
import { useCallback, useEffect, useMemo, useState } from "react";
import type { DocumentData, QueryDocumentSnapshot } from "firebase/firestore";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/context/AuthContext";
import { useEvolucoes } from "@/context/EvolucoesContext";
import { cn } from "@/lib/utils";
import { useDemorando } from "@/hooks/use-demorando";
import { incompatibilidade, type Evolucao, type SessaoDaAgenda } from "@/lib/evolucoes";
import { entrarNaEquipeDaCrianca, getHistoriaDaCrianca, getSessoesPorId, esquecerEquipe } from "@/services/evolucaoService";
import type { AlvoDaFolha } from "./folha-da-evolucao";
import { AlertaDeIncompatibilidade, quandoFoi, SeloIncompativel, SeloNaoAconteceu, TextoDaEvolucao } from "./comum";

export function HistoriaDaCrianca({ patientId, versao = 0, onAbrir, terapia: terapiaFixa, onTerapias, equipeConferida = false }: {
  patientId: string;
  versao?: number;
  onAbrir: (alvo: AlvoDaFolha) => void;
  /** Dentro do prontuário: só a terapia da aba, sem os botões de filtro. */
  terapia?: string;
  /** Avisa as terapias que apareceram nas evoluções carregadas (as abas do prontuário). */
  onTerapias?: (terapias: string[]) => void;
  /** O prontuário já conferiu que o terapeuta atende a criança: não precisa conferir de novo. */
  equipeConferida?: boolean;
}) {
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
  // "Tentar de novo" busca outra vez; depois de alguns segundos carregando, a tela avisa que está demorando
  const [tentativa, setTentativa] = useState(0);
  const demorando = useDemorando(carregando);

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
        if (escopo === "terapeuta" && !equipeConferida) {
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
        // A equipe lembrada no aparelho pode estar errada: na próxima tentativa, confere no banco
        if (escopo === "terapeuta" && uid) esquecerEquipe(uid, patientId);
        if (ativo) setErro(true);
      } finally {
        if (ativo) setCarregando(false);
      }
    })();
    return () => {
      ativo = false;
    };
  }, [patientId, versao, escopo, professionalId, uid, carregar, equipeConferida, tentativa]);

  const terapias = useMemo(() => [...new Set(evolucoes.map((e) => e.terapia).filter(Boolean))].sort(), [evolucoes]);
  const chaveDasTerapias = terapias.join("|");
  useEffect(() => {
    if (chaveDasTerapias) onTerapias?.(chaveDasTerapias.split("|"));
    // onTerapias vem de quem usa; o que importa é a lista mudar
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chaveDasTerapias]);

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

  const tentarDeNovo = (
    <Button variant="outline" size="sm" onClick={() => setTentativa((n) => n + 1)}>Tentar de novo</Button>
  );
  if (carregando) {
    return (
      <div className="space-y-3">
        {demorando && (
          <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-dashed p-3 text-sm text-muted-foreground">
            <span>Está demorando… Confira a internet do aparelho.</span>
            {tentarDeNovo}
          </div>
        )}
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-24 w-full" />
      </div>
    );
  }
  if (semAcesso) return <p className="py-6 text-center text-sm text-muted-foreground">Você não atende esta criança, então não vê a história dela.</p>;
  if (erro) {
    return (
      <div className="flex flex-col items-center gap-3 py-6 text-center">
        <p className="text-sm text-destructive">Não foi possível carregar a história. Confira a internet e tente de novo.</p>
        {tentarDeNovo}
      </div>
    );
  }
  if (evolucoes.length === 0) return <p className="py-6 text-center text-sm text-muted-foreground">Esta criança ainda não tem evoluções.</p>;

  const filtro = terapiaFixa ?? terapia;
  const visiveis = filtro ? evolucoes.filter((e) => e.terapia === filtro) : evolucoes;
  if (visiveis.length === 0 && !temMais) {
    return <p className="py-6 text-center text-sm text-muted-foreground">Nenhuma evolução nesta terapia ainda.</p>;
  }

  return (
    <div className="space-y-4">
      {!terapiaFixa && terapias.length > 1 && (
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
