// lib/evolucoes.ts
// Evoluções diárias: o registro que o terapeuta escreve de cada sessão. Uma por sessão da agenda,
// gravada em patients/{criança}/evolucoes/{atendimento}.
// A sessão pede evolução quando termina o horário dela, sem esperar a recepção marcar presença.
// A recepção não interfere: quando o que ela marcou não bate com a evolução, a evolução ganha um
// alerta de "incompatível com a recepção" para a coordenação conferir.
// A sessão da agenda guarda só a marca da evolução (escrita ou "não aconteceu"), sem o texto: as
// pendências e os alertas saem da agenda, sem ler cada evolução.
import { differenceInCalendarDays, max, startOfDay, subDays } from "date-fns";

/**
 * O dia em que as evoluções começam a valer: sessões de antes não são cobradas.
 * Ao publicar, trocar pelo dia da publicação (até lá, vale para os testes no emulador).
 */
export const EVOLUCOES_DESDE = new Date(2026, 9, 1);

/** Quantos dias para trás a cobrança olha (contando hoje). */
export const JANELA_EM_DIAS = 14;

export interface SessaoDaAgenda {
  id: string;
  patientId: string;
  patientName: string;
  professionalId: string;
  professionalName: string;
  tipo: string;
  start: Date;
  end?: Date;
  status: string;
  /** A marca da evolução na sessão: escrita, ou o terapeuta informou que não aconteceu. */
  evolucao?: MarcaDaEvolucao;
}

export type MarcaDaEvolucao = "escrita" | "nao_aconteceu";

export interface Evolucao {
  appointmentId: string;
  patientId: string;
  patientName: string;
  professionalId: string;
  professionalName: string;
  terapia: string;
  dataDaSessao: Date;
  autorId: string;
  autorNome: string;
  /** false: o terapeuta informou que a sessão não aconteceu (o texto fica vazio). */
  aconteceu: boolean;
  /** O que aconteceu na sessão, num texto só, como no papel. */
  texto: string;
  criadoEm?: Date;
  editadoEm?: Date;
}

export interface Pendencia {
  sessao: SessaoDaAgenda;
  /** 0 = de hoje. */
  diasDeAtraso: number;
}

const NAO_PEDEM_EVOLUCAO = ["cancelado", "nao_compareceu"];

/** De quando a cobrança começa: os últimos 14 dias, nunca antes do começo das evoluções. */
export const inicioDaJanela = (agora: Date, desde: Date = EVOLUCOES_DESDE) =>
  max([startOfDay(subDays(agora, JANELA_EM_DIAS - 1)), desde]);

/** A sessão já terminou e não foi falta nem cancelamento. */
const pedeEvolucao = (sessao: SessaoDaAgenda, { agora, desde }: { agora: Date; desde: Date }) =>
  !NAO_PEDEM_EVOLUCAO.includes(sessao.status) && sessao.start >= desde && (sessao.end ?? sessao.start) <= agora;

/** As sessões sem evolução, das mais antigas para as de hoje. */
export function paraEscrever(sessoes: SessaoDaAgenda[], quando: { agora: Date; desde: Date }): Pendencia[] {
  return sessoes
    .filter((s) => pedeEvolucao(s, quando) && !s.evolucao)
    .sort((a, b) => a.start.getTime() - b.start.getTime())
    .map((sessao) => ({ sessao, diasDeAtraso: differenceInCalendarDays(quando.agora, sessao.start) }));
}

export const textoDoAtraso = (dias: number) =>
  dias <= 0 ? "Hoje" : dias === 1 ? "Atrasada há 1 dia" : `Atrasada há ${dias} dias`;

/**
 * Por que a evolução não bate com o que a recepção marcou na agenda (null quando bate).
 * aconteceu: a evolução foi escrita (true) ou informou que a sessão não aconteceu (false).
 */
export function incompatibilidade(sessao: Pick<SessaoDaAgenda, "status"> | undefined, aconteceu: boolean): string | null {
  if (!sessao) return "A sessão não está mais na agenda.";
  if (aconteceu && sessao.status === "nao_compareceu") return "A recepção marcou falta nesta sessão.";
  if (aconteceu && sessao.status === "cancelado") return "A recepção marcou esta sessão como cancelada.";
  if (!aconteceu && sessao.status === "finalizado") return "A recepção marcou que a criança veio.";
  return null;
}

/** As evoluções incompatíveis com a recepção, para a coordenação conferir. */
export function paraConferir(sessoes: SessaoDaAgenda[]) {
  return sessoes.flatMap((sessao) => {
    const motivo = sessao.evolucao ? incompatibilidade(sessao, sessao.evolucao === "escrita") : null;
    return motivo ? [{ sessao, motivo }] : [];
  });
}

export interface ResumoDoTerapeuta {
  professionalId: string;
  nome: string;
  /** Sessões que já pedem evolução. */
  sessoes: number;
  /** Escritas ou informadas como "não aconteceu". */
  escritas: number;
  pendentes: Pendencia[];
}

/** O acompanhamento da coordenação: quantas foram escritas, quantas faltam e quem está em dia. */
export function resumoDaEquipe(sessoes: SessaoDaAgenda[], quando: { agora: Date; desde: Date }) {
  const pedem = sessoes.filter((s) => pedeEvolucao(s, quando));
  const pendentes = paraEscrever(pedem, quando);
  const porTerapeuta = new Map<string, ResumoDoTerapeuta>();
  for (const s of pedem) {
    const linha = porTerapeuta.get(s.professionalId) ?? { professionalId: s.professionalId, nome: s.professionalName, sessoes: 0, escritas: 0, pendentes: [] };
    linha.sessoes++;
    if (s.evolucao) linha.escritas++;
    porTerapeuta.set(s.professionalId, linha);
  }
  for (const p of pendentes) porTerapeuta.get(p.sessao.professionalId)?.pendentes.push(p);

  const escritas = pedem.length - pendentes.length;
  return {
    escritas,
    pendentes: pendentes.length,
    emDia: pedem.length === 0 ? 100 : Math.round((escritas / pedem.length) * 100),
    porTerapeuta: [...porTerapeuta.values()].sort((a, b) => b.pendentes.length - a.pendentes.length || a.nome.localeCompare(b.nome)),
  };
}

/** A evolução anterior da mesma terapia, para o terapeuta dar continuidade. */
export function ultimaEvolucao(historia: Evolucao[], { terapia, antesDe }: { terapia: string; antesDe: Date }) {
  return historia
    .filter((e) => e.terapia === terapia && e.aconteceu && e.dataDaSessao < antesDe)
    .sort((a, b) => b.dataDaSessao.getTime() - a.dataDaSessao.getTime())[0];
}
