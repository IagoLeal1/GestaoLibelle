// lib/prontuario.ts
// O prontuário da criança: uma aba por terapia, com o "Para lembrar" (as anotações fixadas), as
// anotações com data e a história das evoluções daquela terapia. As anotações ficam em
// patients/{criança}/anotacoes; cada terapeuta escreve só na terapia dele, e ninguém apaga.
import { addDays, differenceInMonths, differenceInYears, isSameDay, isValid, parseISO } from "date-fns";
import type { SessaoDaAgenda } from "@/lib/evolucoes";

export interface Anotacao {
  id: string;
  terapia: string;
  texto: string;
  /** Fixada: aparece em "Para lembrar", no topo da terapia e na hora de escrever a evolução. */
  fixada: boolean;
  autorId: string;
  autorNome: string;
  criadoEm?: Date;
  editadoEm?: Date;
}

const porNome = (a: string, b: string) => a.localeCompare(b, "pt-BR");
const maisNovaPrimeiro = (a: Anotacao, b: Anotacao) => (b.criadoEm?.getTime() ?? 0) - (a.criadoEm?.getTime() ?? 0);

/** As abas do prontuário: as terapias do próprio terapeuta primeiro, depois as outras, em ordem de nome. */
export function terapiasDoProntuario({ anotacoes, evolucoes, minhas }: {
  anotacoes: { terapia: string }[];
  evolucoes: { terapia: string }[];
  minhas: string[];
}) {
  const minhasSet = new Set(minhas.filter(Boolean));
  const outras = new Set([...anotacoes, ...evolucoes].map((x) => x.terapia).filter((t) => t && !minhasSet.has(t)));
  return [
    ...[...minhasSet].sort(porNome).map((terapia) => ({ terapia, minha: true })),
    ...[...outras].sort(porNome).map((terapia) => ({ terapia, minha: false })),
  ];
}

export const paraLembrar = (anotacoes: Anotacao[], terapia: string) =>
  anotacoes.filter((a) => a.terapia === terapia && a.fixada).sort(maisNovaPrimeiro);

export const daTerapia = (anotacoes: Anotacao[], terapia: string) =>
  anotacoes.filter((a) => a.terapia === terapia).sort(maisNovaPrimeiro);

/** A sessão do terapeuta com a criança naquela terapia: a prova que as regras pedem para escrever. */
export function minhaSessaoCom(sessoes: SessaoDaAgenda[], patientId: string, terapia: string) {
  return sessoes
    .filter((s) => s.patientId === patientId && s.tipo === terapia && s.status !== "cancelado")
    .sort((a, b) => b.start.getTime() - a.start.getTime())[0]?.id;
}

/** As crianças que o terapeuta atende (pela agenda dele), com as terapias de cada uma com ele. */
export function criancasDoTerapeuta(sessoes: SessaoDaAgenda[]) {
  const porId = new Map<string, { id: string; nome: string; terapias: Set<string> }>();
  for (const s of sessoes) {
    if (s.status === "cancelado") continue;
    const crianca = porId.get(s.patientId) ?? { id: s.patientId, nome: s.patientName || "Criança", terapias: new Set<string>() };
    if (s.tipo) crianca.terapias.add(s.tipo);
    porId.set(s.patientId, crianca);
  }
  return [...porId.values()]
    .map((c) => ({ id: c.id, nome: c.nome, terapias: [...c.terapias].sort(porNome) }))
    .sort((a, b) => porNome(a.nome, b.nome));
}

/** "6 anos", "1 ano", "8 meses"; null quando a data não dá para ler. */
export function idade(dataNascimento: string, hoje: Date): string | null {
  const nascimento = parseISO(dataNascimento ?? "");
  if (!isValid(nascimento)) return null;
  const anos = differenceInYears(hoje, nascimento);
  if (anos >= 1) return anos === 1 ? "1 ano" : `${anos} anos`;
  const meses = differenceInMonths(hoje, nascimento);
  return meses === 1 ? "1 mês" : `${meses} meses`;
}

export interface CriancaDaAgenda {
  id: string;
  nome: string;
  terapias: string[];
  /** A próxima sessão (ou a que está acontecendo agora); sem sessão marcada, fica vazia. */
  proxima?: Date;
}

/** As crianças do terapeuta, quem tem a próxima sessão mais cedo primeiro (a lista de Prontuários). */
export function criancasNaAgenda(sessoes: SessaoDaAgenda[], agora: Date): CriancaDaAgenda[] {
  const proximas = new Map<string, Date>();
  for (const s of sessoes) {
    if (s.status === "cancelado" || (s.end ?? s.start) < agora) continue;
    const atual = proximas.get(s.patientId);
    if (!atual || s.start < atual) proximas.set(s.patientId, s.start);
  }
  return criancasDoTerapeuta(sessoes)
    .map((c) => ({ ...c, proxima: proximas.get(c.id) }))
    .sort((a, b) => {
      if (a.proxima && b.proxima) return a.proxima.getTime() - b.proxima.getTime();
      if (a.proxima || b.proxima) return a.proxima ? -1 : 1;
      return porNome(a.nome, b.nome);
    });
}

/** Os números do topo da lista: sessões de hoje e dos próximos 7 dias (sem as canceladas). */
export function resumoDaAgenda(sessoes: SessaoDaAgenda[], agora: Date) {
  const validas = sessoes.filter((s) => s.status !== "cancelado");
  const limite = addDays(agora, 7);
  return {
    hoje: validas.filter((s) => isSameDay(s.start, agora)).length,
    proximosDias: validas.filter((s) => s.start >= agora && s.start <= limite).length,
  };
}
