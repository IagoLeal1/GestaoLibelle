"use client"

// O acompanhamento das evoluções pela coordenação e pelo admin, nos últimos 14 dias: quantas foram
// escritas, quem tem pendências, o que não bate com a recepção e a história de cada criança.
import { useEffect, useMemo, useState } from "react";
import { CheckCircle, ChevronDown, ChevronRight, Clock, NotebookPen } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Numero } from "@/components/dashboards/comum";
import { useEvolucoes } from "@/context/EvolucoesContext";
import { cn } from "@/lib/utils";
import { paraConferir, resumoDaEquipe, textoDoAtraso } from "@/lib/evolucoes";
import { getPatients } from "@/services/patientService";
import { FolhaDaEvolucao, type AlvoDaFolha } from "./folha-da-evolucao";
import { HistoriaDaCrianca } from "./historia-da-crianca";
import { quandoFoi } from "./comum";

const dia = (data: Date) => new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "2-digit" }).format(data);

export function PainelDaCoordenacao({ criancaInicial }: { criancaInicial?: string }) {
  const { carregando, erro, sessoes, agora, desde } = useEvolucoes();
  const [alvo, setAlvo] = useState<AlvoDaFolha | null>(null);
  const [aberto, setAberto] = useState<string | null>(null);
  const [criancas, setCriancas] = useState<{ id: string; nome: string }[]>([]);
  const [crianca, setCrianca] = useState(criancaInicial ?? "");
  const [versao, setVersao] = useState(0);

  useEffect(() => {
    getPatients("ativo").then((lista) =>
      setCriancas(lista.map((p) => ({ id: p.id, nome: p.fullName })).sort((a, b) => a.nome.localeCompare(b.nome)))
    );
  }, []);

  const resumo = useMemo(() => resumoDaEquipe(sessoes, { agora, desde }), [sessoes, agora, desde]);
  const conferir = useMemo(() => paraConferir(sessoes), [sessoes]);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Evoluções</h2>
        <p className="text-muted-foreground">Acompanhamento da equipe desde {dia(desde)} (últimos 14 dias).</p>
      </div>

      <div className="grid grid-cols-3 gap-2 sm:gap-4">
        <Numero titulo="Escritas" valor={resumo.escritas} icone={NotebookPen} carregando={carregando} />
        <Numero titulo="Pendentes" valor={resumo.pendentes} icone={Clock} carregando={carregando} />
        <Numero titulo="Em dia" valor={`${resumo.emDia}%`} icone={CheckCircle} carregando={carregando} />
      </div>

      {erro && <p className="text-sm text-destructive">Não foi possível carregar as sessões. Recarregue a página.</p>}

      {conferir.length > 0 && (
        <Card className="min-w-0 border-amber-200 dark:border-amber-900/50">
          <CardHeader>
            <CardTitle>Para conferir ({conferir.length})</CardTitle>
            <p className="text-sm text-muted-foreground">Evoluções que não batem com o que a recepção marcou na agenda.</p>
          </CardHeader>
          <CardContent>
            <ul className="divide-y">
              {conferir.map(({ sessao, motivo }) => (
                <li key={sessao.id}>
                  {/* Tudo aqui é incompatível: no lugar do selo, o motivo */}
                  <button onClick={() => setAlvo({ sessao })} className="flex w-full items-center gap-3 py-3 text-left hover:bg-muted/40">
                    <div className="min-w-0 flex-1">
                      <p className="font-medium">
                        {sessao.patientName} · {sessao.professionalName}
                      </p>
                      <p className="text-xs text-muted-foreground">{quandoFoi(sessao.start)}</p>
                      <p className="mt-0.5 text-sm text-amber-800 dark:text-amber-300">{motivo}</p>
                    </div>
                    <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
                  </button>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      <Card className="min-w-0">
        <CardHeader>
          <CardTitle>Por terapeuta</CardTitle>
        </CardHeader>
        <CardContent>
          {carregando ? (
            <div className="space-y-3">
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
            </div>
          ) : resumo.porTerapeuta.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">Nenhuma sessão terminada nestes dias.</p>
          ) : (
            <ul className="divide-y">
              {resumo.porTerapeuta.map((t) => {
                const temPendencia = t.pendentes.length > 0;
                const expandido = aberto === t.professionalId;
                return (
                  <li key={t.professionalId}>
                    <button
                      onClick={() => setAberto(expandido ? null : t.professionalId)}
                      disabled={!temPendencia}
                      aria-expanded={temPendencia ? expandido : undefined}
                      className="flex w-full items-center gap-3 py-3 text-left enabled:hover:bg-muted/40"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-medium">{t.nome}</p>
                        <p className="text-xs text-muted-foreground">
                          {t.sessoes} {t.sessoes === 1 ? "sessão" : "sessões"} · {t.escritas} {t.escritas === 1 ? "escrita" : "escritas"}
                        </p>
                      </div>
                      {temPendencia ? (
                        <Badge className="shrink-0 border-transparent bg-amber-100 text-amber-800 hover:bg-amber-100">
                          {t.pendentes.length} {t.pendentes.length === 1 ? "pendente" : "pendentes"}
                        </Badge>
                      ) : (
                        <Badge className="shrink-0 border-transparent bg-green-100 text-green-800 hover:bg-green-100">Em dia</Badge>
                      )}
                      {temPendencia && <ChevronDown className={cn("h-4 w-4 shrink-0 text-muted-foreground transition-transform", expandido && "rotate-180")} />}
                    </button>
                    {expandido && (
                      <ul className="mb-3 space-y-1 rounded-lg bg-muted/40 p-3 text-sm">
                        {t.pendentes.map(({ sessao, diasDeAtraso }) => (
                          <li key={sessao.id} className="flex flex-wrap justify-between gap-x-3">
                            <span>
                              {quandoFoi(sessao.start)} · {sessao.patientName}
                            </span>
                            <span className={cn("text-xs", diasDeAtraso > 0 ? "font-medium text-red-600 dark:text-red-400" : "text-muted-foreground")}>
                              {textoDoAtraso(diasDeAtraso)}
                            </span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </CardContent>
      </Card>

      <Card className="min-w-0">
        <CardHeader className="space-y-3">
          <CardTitle>Por criança</CardTitle>
          <Select value={crianca} onValueChange={setCrianca}>
            <SelectTrigger aria-label="Escolha a criança">
              <SelectValue placeholder="Escolha a criança" />
            </SelectTrigger>
            <SelectContent>
              {criancas.map((c) => (
                <SelectItem key={c.id} value={c.id}>
                  {c.nome}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardHeader>
        <CardContent>
          {crianca ? (
            <HistoriaDaCrianca patientId={crianca} versao={versao} onAbrir={setAlvo} />
          ) : (
            <p className="py-4 text-center text-sm text-muted-foreground">Escolha uma criança para ver as evoluções de todas as terapias dela.</p>
          )}
        </CardContent>
      </Card>

      <FolhaDaEvolucao alvo={alvo} onFechar={() => setAlvo(null)} onMudou={() => setVersao((v) => v + 1)} />
    </div>
  );
}
