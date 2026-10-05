// lib/painelDaFamilia.ts
// Os próximos atendimentos na tela inicial da família: sem os cancelados, com o nome da sala
// (nunca o código interno dela), o status por extenso e o nome da criança só quando a família
// tem mais de uma.

export const STATUS_DO_ATENDIMENTO: Record<string, { rotulo: string; classe: string }> = {
  agendado: { rotulo: "Agendado", classe: "bg-blue-100 text-blue-800" },
  em_atendimento: { rotulo: "Em atendimento", classe: "bg-orange-100 text-orange-800" },
  finalizado: { rotulo: "Finalizado", classe: "bg-green-100 text-green-800" },
  nao_compareceu: { rotulo: "Não compareceu", classe: "bg-red-100 text-red-800" },
  cancelado: { rotulo: "Cancelado", classe: "bg-gray-100 text-gray-800" },
};

export interface AtendimentoDaFamilia {
  id: string;
  start: Date;
  patientName?: string;
  professionalName?: string;
  tipo?: string;
  status: string;
  sala?: string;
}

export interface ProximoAtendimento {
  id: string;
  start: Date;
  terapia: string;
  profissional: string;
  /** Só quando a família tem mais de uma criança. */
  crianca?: string;
  status: { rotulo: string; classe: string };
  /** O nome da sala; sem nome conhecido, não aparece. */
  sala?: string;
}

const QUANTOS = 5;

export function proximosAtendimentos(
  atendimentos: AtendimentoDaFamilia[],
  { salas, criancas }: { salas: { id: string; name: string }[]; criancas: number }
): ProximoAtendimento[] {
  const nomeDaSala = new Map(salas.map((s) => [s.id, s.name]));
  return atendimentos
    .filter((a) => a.status !== "cancelado")
    .sort((a, b) => a.start.getTime() - b.start.getTime())
    .slice(0, QUANTOS)
    .map((a) => ({
      id: a.id,
      start: a.start,
      terapia: a.tipo || "Terapia",
      profissional: a.professionalName || "Profissional",
      crianca: criancas > 1 ? a.patientName : undefined,
      status: STATUS_DO_ATENDIMENTO[a.status] ?? { rotulo: a.status, classe: STATUS_DO_ATENDIMENTO.cancelado.classe },
      sala: a.sala ? nomeDaSala.get(a.sala) : undefined,
    }));
}

const semPonto = (texto: string) => texto.replace(/\.$/, "");

/** As partes da data na caixinha do cartão: "dom", "11", "out" e "09:00". */
export function partesDaData(data: Date) {
  return {
    diaDaSemana: semPonto(new Intl.DateTimeFormat("pt-BR", { weekday: "short" }).format(data)),
    dia: String(data.getDate()),
    mes: semPonto(new Intl.DateTimeFormat("pt-BR", { month: "short" }).format(data)),
    hora: new Intl.DateTimeFormat("pt-BR", { hour: "2-digit", minute: "2-digit" }).format(data),
  };
}
