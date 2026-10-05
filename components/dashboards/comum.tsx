"use client"

// Peças das telas iniciais da gestão e do terapeuta: os números do dia e a lista "Agora e a seguir".
import { useEffect, useId, useState } from "react";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import type { AgendaDeHoje, ItemDaAgenda } from "@/lib/telaInicial";

/** A hora de agora, atualizada a cada minuto: com a tela aberta, a lista anda sozinha. */
export function useAgora() {
  const [agora, setAgora] = useState(() => new Date());
  useEffect(() => {
    const relogio = setInterval(() => setAgora(new Date()), 60_000);
    return () => clearInterval(relogio);
  }, []);
  return agora;
}

/** Um aviso que pede uma ação, com o caminho para resolver (só aparece quando há algo a fazer). */
export function AvisoDeAtencao({ href, icone: Icone, acao = "Ver", children }: { href: string; icone: React.ElementType; acao?: string; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className="flex items-center gap-3 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900 transition-colors hover:bg-amber-100 dark:border-amber-900/50 dark:bg-amber-950/30 dark:text-amber-200 dark:hover:bg-amber-950/50"
    >
      <Icone className="h-4 w-4 shrink-0" />
      <span className="min-w-0 flex-1">{children}</span>
      <span className="flex shrink-0 items-center font-medium">
        {acao}
        <ChevronRight className="h-4 w-4" />
      </span>
    </Link>
  )
}

/** Número compacto: três cabem numa linha no celular. */
export function Numero({ titulo, valor, icone: Icone, carregando }: { titulo: string; valor: number | string; icone: React.ElementType; carregando: boolean }) {
  return (
    <Card role="group" aria-label={titulo}>
      <CardContent className="flex h-full flex-col justify-between gap-1 p-3 sm:p-5">
        <div className="flex items-start justify-between gap-2">
          <p className="text-xs font-medium leading-tight text-muted-foreground sm:text-sm">{titulo}</p>
          <Icone className="hidden h-4 w-4 shrink-0 text-muted-foreground sm:block" />
        </div>
        {carregando ? <Skeleton className="h-7 w-10" /> : <p className="text-xl font-bold sm:text-2xl">{valor}</p>}
      </CardContent>
    </Card>
  )
}

function Grupo({ titulo, itens, mostrar, destaque = false }: { titulo: string; itens: ItemDaAgenda[]; mostrar: "profissional" | "terapia"; destaque?: boolean }) {
  const id = useId();
  return (
    <section aria-labelledby={id}>
      <h3 id={id} className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{titulo}</h3>
      <ul className="divide-y">
        {itens.map((item) => (
          <li key={item.id} className="flex items-baseline gap-3 py-2.5">
            <span className={cn("w-11 shrink-0 text-sm font-semibold tabular-nums", destaque && "text-primary-teal")}>{item.hora}</span>
            {/* min-w-0 deixa os textos quebrarem em vez de alargar a tela no celular. O selo fica ao lado
                do nome (e desce quando não cabe), para o profissional e a sala usarem a linha inteira. */}
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center justify-between gap-x-2 gap-y-1">
                <p className="text-sm font-medium">{item.paciente}</p>
                <Badge variant="outline" className={cn("shrink-0 border-transparent", item.status.classe)}>{item.status.rotulo}</Badge>
              </div>
              <p className="truncate text-xs text-muted-foreground">
                {[mostrar === "profissional" ? item.profissional : item.terapia, item.sala].filter(Boolean).join(" · ")}
              </p>
            </div>
          </li>
        ))}
      </ul>
    </section>
  )
}

export function AgoraEASeguir({ agenda, hoje, carregando, mostrar, agendaCompleta, vazio, aviso }: {
  agenda: AgendaDeHoje;
  /** Atendimentos de hoje, sem os cancelados: separa "nenhum hoje" de "os de hoje já terminaram". */
  hoje: number;
  carregando: boolean;
  /** O que aparece embaixo do nome da criança: o profissional (gestão) ou a terapia (terapeuta). */
  mostrar: "profissional" | "terapia";
  agendaCompleta: { href: string; rotulo: string };
  /** A frase de quando não há atendimento nenhum hoje. */
  vazio: string;
  /** Quando a lista não dá para montar, a explicação aparece no lugar dela. */
  aviso?: string;
}) {
  const nada = agenda.agora.length === 0 && agenda.aSeguir.length === 0;
  return (
    <Card className="min-w-0">
      <CardHeader>
        <CardTitle>Agora e a seguir</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {carregando ? (
          <div className="space-y-3">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
        ) : aviso || nada ? (
          <p className="py-8 text-center text-sm text-muted-foreground">
            {aviso ?? (hoje > 0 ? "Os atendimentos de hoje já terminaram." : vazio)}
          </p>
        ) : (
          <div className="space-y-4">
            {agenda.agora.length > 0 && <Grupo titulo="Agora" itens={agenda.agora} mostrar={mostrar} destaque />}
            {agenda.aSeguir.length > 0 && <Grupo titulo="A seguir" itens={agenda.aSeguir} mostrar={mostrar} />}
            {agenda.maisTarde > 0 && (
              <p className="text-sm text-muted-foreground">
                {agenda.maisTarde === 1 ? "E mais 1 atendimento até o fim do dia." : `E mais ${agenda.maisTarde} atendimentos até o fim do dia.`}
              </p>
            )}
          </div>
        )}
        <Button asChild size="sm" className="w-full" variant="outline">
          <Link href={agendaCompleta.href}>{agendaCompleta.rotulo}</Link>
        </Button>
      </CardContent>
    </Card>
  )
}
