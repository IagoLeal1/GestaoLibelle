// lib/semanaNoCelular.ts
// As grades da semana no celular: em vez da tabela larga (que só mostrava um dia e meio por vez),
// botões com os dias e a lista do dia escolhido. Quem agenda vê também os horários livres.
import { format, isSameDay } from "date-fns";
import { ptBR } from "date-fns/locale";

export interface ItemDaSemana {
  id: string;
  /** O horário da grade em que a sessão começa ("09:00"). */
  hora: string;
  fim?: string;
  titulo: string;
  detalhe: string;
  status?: { rotulo: string; classe: string };
  /** Pendente: montada na grade e ainda não salva. Cancelada: aparece apagada. */
  marca?: "pendente" | "cancelada";
  aoTocar?: () => void;
}

export interface LinhaDoDia {
  hora: string;
  /** Vazia: horário livre (só aparece para quem agenda). */
  itens: ItemDaSemana[];
}

/** A grade abre no dia de hoje quando ele está na semana; em outra semana, na segunda. */
export function diaInicial(dias: Date[], hoje: Date): number {
  const indice = dias.findIndex((dia) => isSameDay(dia, hoje));
  return indice === -1 ? 0 : indice;
}

/** Os horários do dia em ordem: os ocupados e, para quem agenda, os livres da clínica. */
export function linhasDoDia(horarios: string[], itens: ItemDaSemana[], { comLivres }: { comLivres: boolean }): LinhaDoDia[] {
  const todos = [...new Set([...(comLivres ? horarios : []), ...itens.map((i) => i.hora)])].sort();
  return todos.map((hora) => ({ hora, itens: itens.filter((i) => i.hora === hora) }));
}

const primeiraMaiuscula = (texto: string) => texto.charAt(0).toUpperCase() + texto.slice(1);

/** "Terça, 06/10 · 3 sessões" */
export function rotuloDoDia(dia: Date, sessoes: number): string {
  const nome = primeiraMaiuscula(format(dia, "EEEE", { locale: ptBR }).replace("-feira", ""));
  const data = `${nome}, ${format(dia, "dd/MM")}`;
  if (sessoes === 0) return data;
  return `${data} · ${sessoes} ${sessoes === 1 ? "sessão" : "sessões"}`;
}
