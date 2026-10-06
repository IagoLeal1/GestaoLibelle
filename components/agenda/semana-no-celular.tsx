"use client"

// As grades da semana no celular: botões com os dias e a lista do dia escolhido (lib/semanaNoCelular).
// No computador, cada grade continua com a tabela da semana inteira.
import { useEffect, useState } from "react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Plus } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { diaInicial, linhasDoDia, rotuloDoDia, type ItemDaSemana } from "@/lib/semanaNoCelular";

function Sessao({ item }: { item: ItemDaSemana }) {
  const conteudo = (
    <>
      <div className="w-12 shrink-0">
        <p className="text-[15px] font-bold tabular-nums">{item.hora}</p>
        {item.fim && <p className="text-xs tabular-nums text-muted-foreground">{item.fim}</p>}
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-[15px] font-medium">{item.titulo}</p>
        <p className="truncate text-xs text-muted-foreground">{item.detalhe}</p>
      </div>
      {item.marca === "pendente" ? (
        <Badge className="shrink-0 border-transparent bg-yellow-200 text-yellow-900 hover:bg-yellow-200">Pendente</Badge>
      ) : item.status ? (
        <Badge variant="outline" className={cn("shrink-0 border-transparent", item.status.classe)}>{item.status.rotulo}</Badge>
      ) : null}
    </>
  );
  const estilo = cn(
    "flex w-full items-center gap-3 rounded-xl border bg-card p-3 text-left",
    item.marca === "pendente" && "border-yellow-300 bg-yellow-50",
    item.marca === "cancelada" && "opacity-60"
  );
  return item.aoTocar ? (
    <button type="button" onClick={item.aoTocar} className={cn(estilo, "hover:bg-muted/40")}>{conteudo}</button>
  ) : (
    <div className={estilo}>{conteudo}</div>
  );
}

export function SemanaNoCelular({ dias, horarios, itensDoDia, aoAgendar, className }: {
  dias: Date[];
  /** Os horários da clínica: viram os horários livres para quem agenda. */
  horarios: string[];
  itensDoDia: (dia: Date) => ItemDaSemana[];
  /** Só para quem agenda: o horário livre ganha o botão "Agendar". */
  aoAgendar?: (dia: Date, hora: string) => void;
  className?: string;
}) {
  const chaveDaSemana = dias[0] ? format(dias[0], "yyyy-MM-dd") : "";
  const [escolhido, setEscolhido] = useState(() => diaInicial(dias, new Date()));
  // Mudou a semana: volta para hoje (se ele estiver nela) ou para a segunda
  useEffect(() => {
    setEscolhido(diaInicial(dias, new Date()));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chaveDaSemana]);

  const dia = dias[escolhido] ?? dias[0];
  if (!dia) return null;
  const itens = itensDoDia(dia);
  const linhas = linhasDoDia(horarios, itens, { comLivres: !!aoAgendar });

  return (
    <div className={cn("space-y-3", className)}>
      <div role="group" aria-label="Dia da semana" className="grid grid-cols-7 gap-1.5">
        {dias.map((d, i) => {
          // As três primeiras letras ("seg", "sáb"): o nome inteiro não cabe no botão do celular
          const semana = format(d, "EEEE", { locale: ptBR }).slice(0, 3);
          const numero = format(d, "dd");
          return (
            <button
              key={format(d, "yyyy-MM-dd")}
              type="button"
              aria-pressed={i === escolhido}
              aria-label={`${semana} ${numero}`}
              onClick={() => setEscolhido(i)}
              className={cn(
                "flex h-14 flex-col items-center justify-center rounded-lg border text-xs",
                i === escolhido ? "border-[#127a7e] bg-[#127a7e] text-white" : "border-input bg-background text-foreground"
              )}
            >
              <span>{semana}</span>
              <span className="text-base font-bold">{numero}</span>
            </button>
          );
        })}
      </div>

      <p className="text-sm font-semibold">{rotuloDoDia(dia, itens.length)}</p>

      {linhas.length === 0 ? (
        <p className="rounded-xl border border-dashed bg-card p-6 text-center text-sm text-muted-foreground">Nenhuma sessão neste dia.</p>
      ) : (
        <ul aria-label="Horários do dia" className="space-y-2">
          {linhas.map((linha) =>
            linha.itens.length > 0 ? (
              linha.itens.map((item) => (
                <li key={item.id}>
                  <Sessao item={item} />
                </li>
              ))
            ) : (
              <li key={linha.hora} className="flex items-center gap-3 rounded-xl border border-dashed p-3">
                <span className="w-12 shrink-0 text-[15px] font-semibold tabular-nums text-muted-foreground">{linha.hora}</span>
                <span className="flex-1 text-sm text-muted-foreground">Livre</span>
                {aoAgendar && (
                  <Button size="sm" variant="outline" aria-label={`Agendar às ${linha.hora}`} onClick={() => aoAgendar(dia, linha.hora)}>
                    <Plus className="mr-1 h-4 w-4" />
                    Agendar
                  </Button>
                )}
              </li>
            )
          )}
        </ul>
      )}
    </div>
  );
}
