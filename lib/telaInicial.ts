// lib/telaInicial.ts
// A lista "Agora e a seguir" e os números do dia nas telas iniciais da gestão e do terapeuta.
// A lista começa do agora (os que já terminaram saem), mostra a sala pelo nome e nunca os
// cancelados. Os números contam o dia inteiro, não só o que ainda está "agendado".
import { statusDoAtendimento } from "@/lib/statusDoAtendimento";

export interface AtendimentoDoDia {
  id: string;
  start: Date;
  /** Atendimento sem o fim gravado só entra em "Agora" quando está em atendimento. */
  end?: Date;
  status: string;
  patientName?: string;
  professionalName?: string;
  tipo?: string;
  sala?: string;
}

export interface ItemDaAgenda {
  id: string;
  hora: string;
  paciente: string;
  profissional: string;
  terapia: string;
  /** O nome da sala; sem nome conhecido, não aparece. */
  sala?: string;
  status: { rotulo: string; classe: string };
}

export interface AgendaDeHoje {
  /** Em atendimento, ou agendado com o horário passando agora. */
  agora: ItemDaAgenda[];
  /** Os que ainda vão começar, na ordem do horário. */
  aSeguir: ItemDaAgenda[];
  /** Quantos não couberam no limite de "A seguir". */
  maisTarde: number;
}

const horaDe = (data: Date) => new Intl.DateTimeFormat("pt-BR", { hour: "2-digit", minute: "2-digit" }).format(data);

export function agendaDeHoje(
  atendimentos: AtendimentoDoDia[],
  { agora, salas, limite = Infinity }: { agora: Date; salas: { id: string; name: string }[]; limite?: number }
): AgendaDeHoje {
  const nomeDaSala = new Map(salas.map((s) => [s.id, s.name]));
  const item = (a: AtendimentoDoDia): ItemDaAgenda => ({
    id: a.id,
    hora: horaDe(a.start),
    paciente: a.patientName || "Paciente",
    profissional: a.professionalName || "Profissional",
    terapia: a.tipo || "Terapia",
    sala: a.sala ? nomeDaSala.get(a.sala) : undefined,
    status: statusDoAtendimento(a.status),
  });

  const emOrdem = atendimentos
    .filter((a) => a.status !== "cancelado")
    .sort((a, b) => a.start.getTime() - b.start.getTime());
  const acontecendo = (a: AtendimentoDoDia) =>
    a.status === "em_atendimento" || (a.status === "agendado" && a.start <= agora && !!a.end && agora < a.end);

  const agoraMesmo = emOrdem.filter(acontecendo);
  const depois = emOrdem.filter((a) => !acontecendo(a) && a.start > agora);
  return {
    agora: agoraMesmo.map(item),
    aSeguir: depois.slice(0, limite).map(item),
    maisTarde: Math.max(0, depois.length - limite),
  };
}

export function numerosDoDia(atendimentos: { status: string }[]) {
  return {
    hoje: atendimentos.filter((a) => a.status !== "cancelado").length,
    finalizados: atendimentos.filter((a) => a.status === "finalizado").length,
    faltasECancelados: atendimentos.filter((a) => a.status === "nao_compareceu" || a.status === "cancelado").length,
  };
}
