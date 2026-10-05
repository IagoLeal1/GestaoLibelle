// lib/agendaDoDia.ts
// A Agenda no celular: o nome do dia escolhido e o resumo numa linha (no lugar dos 6 números
// grandes, que empurravam a lista do dia para depois da primeira tela).
import { differenceInCalendarDays, format } from "date-fns";
import { ptBR } from "date-fns/locale";

const semFeira = (texto: string) => texto.replace("-feira", "");
const primeiraMaiuscula = (texto: string) => texto.charAt(0).toUpperCase() + texto.slice(1);

/** { titulo: "Hoje" | "Ontem" | "Amanhã" | "Quinta", data: "segunda, 05/10" } */
export function nomeDoDia(dia: Date, hoje: Date) {
  const semana = semFeira(format(dia, "EEEE", { locale: ptBR }));
  const distancia = differenceInCalendarDays(dia, hoje);
  const titulo = distancia === 0 ? "Hoje" : distancia === -1 ? "Ontem" : distancia === 1 ? "Amanhã" : primeiraMaiuscula(semana);
  return { titulo, data: `${semana}, ${format(dia, "dd/MM")}` };
}

const contagem = (quantas: number, uma: string, varias: string) => `${quantas} ${quantas === 1 ? uma : varias}`;

/** "4 sessões · 2 finalizadas · 1 falta" */
export function resumoDoDia(sessoes: { status: string }[]): string {
  if (sessoes.length === 0) return "Nenhuma sessão";
  const finalizadas = sessoes.filter((s) => s.status === "finalizado").length;
  const faltas = sessoes.filter((s) => s.status === "nao_compareceu").length;
  return [
    contagem(sessoes.length, "sessão", "sessões"),
    finalizadas > 0 && contagem(finalizadas, "finalizada", "finalizadas"),
    faltas > 0 && contagem(faltas, "falta", "faltas"),
  ]
    .filter(Boolean)
    .join(" · ");
}
