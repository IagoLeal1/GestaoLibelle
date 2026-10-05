"use client"

// A página de evoluções do terapeuta: as sessões que faltam escrever (as atrasadas primeiro), as
// escritas nos últimos 14 dias e a história das crianças que ele atende.
import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useEvolucoes } from "@/context/EvolucoesContext";
import { cn } from "@/lib/utils";
import { incompatibilidade, textoDoAtraso, type SessaoDaAgenda } from "@/lib/evolucoes";
import { FolhaDaEvolucao, type AlvoDaFolha } from "./folha-da-evolucao";
import { HistoriaDaCrianca } from "./historia-da-crianca";
import { SeloIncompativel, SeloNaoAconteceu } from "./comum";

const dia = (data: Date) => new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "2-digit" }).format(data);
const hora = (data: Date) => new Intl.DateTimeFormat("pt-BR", { hour: "2-digit", minute: "2-digit" }).format(data);

/** A data e a hora da sessão, numa coluna estreita que cabe no celular. */
function Quando({ data, destaque = false }: { data: Date; destaque?: boolean }) {
  return (
    <div className={cn("w-12 shrink-0 text-center", destaque && "text-red-600 dark:text-red-400")}>
      <p className="text-xs">{dia(data)}</p>
      <p className="text-sm font-semibold tabular-nums">{hora(data)}</p>
    </div>
  );
}

export function EvolucoesDoTerapeuta({ criancaInicial }: { criancaInicial?: string }) {
  const { carregando, erro, semCadastro, sessoes, pendentes, agora } = useEvolucoes();
  const [alvo, setAlvo] = useState<AlvoDaFolha | null>(null);
  const [crianca, setCrianca] = useState(criancaInicial ?? "");
  const [versao, setVersao] = useState(0);

  const escritas = useMemo(
    () => sessoes.filter((s) => s.evolucao && s.start <= agora).sort((a, b) => b.start.getTime() - a.start.getTime()),
    [sessoes, agora]
  );
  const criancas = useMemo(() => {
    const porId = new Map<string, string>();
    for (const s of sessoes) if (s.status !== "cancelado") porId.set(s.patientId, s.patientName || "Criança");
    return [...porId].map(([id, nome]) => ({ id, nome })).sort((a, b) => a.nome.localeCompare(b.nome));
  }, [sessoes]);

  const abrir = (sessao: SessaoDaAgenda) => setAlvo({ sessao });

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Evoluções</h2>
        <p className="text-muted-foreground">Escreva a evolução de cada sessão logo depois do atendimento.</p>
      </div>

      {semCadastro ? (
        <Card>
          <CardContent className="py-8 text-center text-sm text-muted-foreground">
            Não encontramos seu cadastro de profissional, então suas sessões não aparecem aqui. Peça à coordenação para conferir.
          </CardContent>
        </Card>
      ) : (
        <>
          <Card className="min-w-0">
            <CardHeader>
              <CardTitle>Para escrever{pendentes.length > 0 && ` (${pendentes.length})`}</CardTitle>
            </CardHeader>
            <CardContent>
              {carregando ? (
                <div className="space-y-3">
                  <Skeleton className="h-12 w-full" />
                  <Skeleton className="h-12 w-full" />
                </div>
              ) : erro ? (
                <p className="py-6 text-center text-sm text-destructive">Não foi possível carregar suas sessões. Recarregue a página.</p>
              ) : pendentes.length === 0 ? (
                <p className="py-6 text-center text-sm text-muted-foreground">Tudo em dia. Cada sessão aparece aqui quando termina.</p>
              ) : (
                <ul className="divide-y">
                  {pendentes.map(({ sessao, diasDeAtraso }) => (
                    <li key={sessao.id} className="flex items-center gap-3 py-3">
                      <Quando data={sessao.start} destaque={diasDeAtraso > 0} />
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-medium">{sessao.patientName}</p>
                        <p className={cn("truncate text-xs", diasDeAtraso > 0 ? "font-medium text-red-600 dark:text-red-400" : "text-muted-foreground")}>
                          {/* O atraso vem antes: se faltar espaço no celular, quem encurta é a terapia */}
                          {[textoDoAtraso(diasDeAtraso), sessao.tipo].filter(Boolean).join(" · ")}
                        </p>
                      </div>
                      <Button size="sm" onClick={() => abrir(sessao)} className="shrink-0 bg-primary-teal text-white hover:bg-primary-teal/90">
                        Escrever
                      </Button>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>

          <Card className="min-w-0">
            <CardHeader>
              <CardTitle>Escritas nos últimos 14 dias</CardTitle>
            </CardHeader>
            <CardContent>
              {carregando ? (
                <Skeleton className="h-12 w-full" />
              ) : escritas.length === 0 ? (
                <p className="py-6 text-center text-sm text-muted-foreground">As evoluções que você escrever aparecem aqui.</p>
              ) : (
                <ul className="divide-y">
                  {escritas.map((sessao) => {
                    const motivo = incompatibilidade(sessao, sessao.evolucao === "escrita");
                    return (
                      <li key={sessao.id}>
                        <button onClick={() => abrir(sessao)} className="flex w-full items-center gap-3 py-3 text-left hover:bg-muted/40">
                          <Quando data={sessao.start} />
                          <div className="min-w-0 flex-1">
                            <p className="truncate font-medium">{sessao.patientName}</p>
                            <p className="truncate text-xs text-muted-foreground">{sessao.tipo}</p>
                          </div>
                          <div className="flex shrink-0 flex-col items-end gap-1">
                            {sessao.evolucao === "nao_aconteceu" && <SeloNaoAconteceu />}
                            {motivo && <SeloIncompativel />}
                          </div>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              )}
            </CardContent>
          </Card>

          <Card className="min-w-0">
            <CardHeader className="space-y-3">
              <CardTitle>História das crianças</CardTitle>
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
        </>
      )}

      <FolhaDaEvolucao alvo={alvo} onFechar={() => setAlvo(null)} onMudou={() => setVersao((v) => v + 1)} />
    </div>
  );
}
