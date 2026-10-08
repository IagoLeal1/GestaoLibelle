// lib/centralDeEvolucoes.ts
// A página de Evoluções do admin e da coordenação: só para olhar, sem validar nada. Mostra a situação
// de cada sessão (escrita, pendente, não bate com a recepção, não aconteceu), com números que também
// filtram, filtros de período, terapeuta, terapia e criança, e a lista por dia.
// Tudo sai da agenda (a marca da evolução fica na sessão): o texto só é lido quando alguém abre.
import { differenceInCalendarDays, endOfDay, startOfDay, subDays } from "date-fns";
import { incompatibilidade, pedeEvolucao, textoDoAtraso, type SessaoDaAgenda } from "@/lib/evolucoes";

export type Situacao = "escrita" | "pendente" | "nao_bate" | "nao_aconteceu";

export const SITUACOES: { id: Situacao; rotulo: string; curto: string; detalhe: string }[] = [
  { id: "escrita", rotulo: "Escritas", curto: "Escrita", detalhe: "das sessões em dia" },
  { id: "pendente", rotulo: "Pendentes", curto: "Pendente", detalhe: "sessão sem evolução" },
  { id: "nao_bate", rotulo: "Não bate com a recepção", curto: "Não bate", detalhe: "conferir com a agenda" },
  { id: "nao_aconteceu", rotulo: "Não aconteceram", curto: "Não aconteceu", detalhe: "o terapeuta avisou" },
];

export type Periodo = "hoje" | "ontem" | "7dias" | "14dias" | "datas";

export const PERIODOS: { id: Periodo; rotulo: string }[] = [
  { id: "hoje", rotulo: "Hoje" },
  { id: "ontem", rotulo: "Ontem" },
  { id: "7dias", rotulo: "7 dias" },
  { id: "14dias", rotulo: "14 dias" },
  { id: "datas", rotulo: "Escolher datas" },
];

export interface Filtros {
  periodo: Periodo;
  /** Só para "datas". */
  datas?: { de: Date; ate: Date };
  terapeuta?: string;
  terapia?: string;
  situacao?: Situacao;
  busca?: string;
}

export interface SessaoNaCentral extends SessaoDaAgenda {
  situacao: Situacao;
}

/** A situação da sessão; null quando ela não entra na conta (não terminou, foi falta ou é de antes do começo). */
export function situacaoDaSessao(sessao: SessaoDaAgenda, quando: { agora: Date; desde: Date }): Situacao | null {
  if (sessao.start < quando.desde) return null;
  if (sessao.evolucao) {
    if (incompatibilidade(sessao, sessao.evolucao === "escrita")) return "nao_bate";
    return sessao.evolucao === "escrita" ? "escrita" : "nao_aconteceu";
  }
  return pedeEvolucao(sessao, quando) ? "pendente" : null;
}

export function intervaloDoPeriodo(periodo: Periodo, agora: Date, datas?: { de: Date; ate: Date }) {
  const hoje = { de: startOfDay(agora), ate: endOfDay(agora) };
  switch (periodo) {
    case "hoje":
      return hoje;
    case "ontem":
      return { de: startOfDay(subDays(agora, 1)), ate: endOfDay(subDays(agora, 1)) };
    case "7dias":
      return { de: startOfDay(subDays(agora, 6)), ate: hoje.ate };
    case "14dias":
      return { de: startOfDay(subDays(agora, 13)), ate: hoje.ate };
    case "datas":
      return datas ? { de: startOfDay(datas.de), ate: endOfDay(datas.ate) } : hoje;
  }
}

const normalizar = (texto: string) => texto.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().trim();
const porNome = (a: string, b: string) => a.localeCompare(b, "pt-BR");

export interface LinhaDoTerapeuta {
  professionalId: string;
  nome: string;
  /** A terapia que ele mais atende no período (o cartão do celular mostra). */
  terapia: string;
  /** Escritas, "não aconteceu" e as que não batem: o terapeuta já fez a parte dele. */
  feitas: number;
  pendentes: number;
}

/**
 * As sessões do período com a situação de cada uma. Os números e o "por terapeuta" não usam o filtro
 * de situação (são eles que filtram); o "por terapeuta" também ignora o filtro de terapeuta (é a lista
 * para escolher).
 */
export function sessoesDaCentral(sessoes: SessaoDaAgenda[], filtros: Filtros, quando: { agora: Date; desde: Date }) {
  const { de, ate } = intervaloDoPeriodo(filtros.periodo, quando.agora, filtros.datas);
  const busca = normalizar(filtros.busca ?? "");

  const doPeriodo: SessaoNaCentral[] = [];
  for (const s of sessoes) {
    if (s.start < de || s.start > ate) continue;
    const situacao = situacaoDaSessao(s, quando);
    if (situacao) doPeriodo.push({ ...s, situacao });
  }

  const semTerapeuta = doPeriodo.filter(
    (s) => (!filtros.terapia || s.tipo === filtros.terapia) && (!busca || normalizar(s.patientName).includes(busca))
  );
  const comFiltros = semTerapeuta.filter((s) => !filtros.terapeuta || s.professionalId === filtros.terapeuta);

  const contagem: Record<Situacao, number> = { escrita: 0, pendente: 0, nao_bate: 0, nao_aconteceu: 0 };
  for (const s of comFiltros) contagem[s.situacao]++;
  const emDia = comFiltros.length === 0 ? 100 : Math.round(((comFiltros.length - contagem.pendente) / comFiltros.length) * 100);

  const linhas = new Map<string, LinhaDoTerapeuta>();
  const terapiasDe = new Map<string, Map<string, number>>();
  for (const s of semTerapeuta) {
    const linha = linhas.get(s.professionalId) ?? { professionalId: s.professionalId, nome: s.professionalName, terapia: "", feitas: 0, pendentes: 0 };
    if (s.situacao === "pendente") linha.pendentes++;
    else linha.feitas++;
    linhas.set(s.professionalId, linha);
    const contagemDasTerapias = terapiasDe.get(s.professionalId) ?? new Map<string, number>();
    contagemDasTerapias.set(s.tipo, (contagemDasTerapias.get(s.tipo) ?? 0) + 1);
    terapiasDe.set(s.professionalId, contagemDasTerapias);
  }
  for (const linha of linhas.values()) {
    linha.terapia = [...(terapiasDe.get(linha.professionalId) ?? [])].sort((a, b) => b[1] - a[1])[0]?.[0] ?? "";
  }

  const terapeutas = new Map(doPeriodo.map((s) => [s.professionalId, s.professionalName]));

  return {
    lista: comFiltros.filter((s) => !filtros.situacao || s.situacao === filtros.situacao),
    contagem,
    emDia,
    porTerapeuta: [...linhas.values()].sort((a, b) => b.pendentes - a.pendentes || porNome(a.nome, b.nome)),
    terapeutas: [...terapeutas].map(([id, nome]) => ({ id, nome })).sort((a, b) => porNome(a.nome, b.nome)),
    terapias: [...new Set(doPeriodo.map((s) => s.tipo).filter(Boolean))].sort(porNome),
  };
}

/** O selo da sessão: a pendente atrasada diz há quantos dias; as outras, a situação. */
export function rotuloDaSituacao(sessao: SessaoNaCentral, agora: Date) {
  if (sessao.situacao === "pendente") {
    const dias = differenceInCalendarDays(agora, sessao.start);
    return dias > 0 ? textoDoAtraso(dias) : "Pendente";
  }
  return SITUACOES.find((s) => s.id === sessao.situacao)?.curto ?? "";
}

/** Os dias, do mais recente para o mais antigo; dentro do dia, na ordem dos horários. */
export function agruparPorDia(lista: SessaoNaCentral[]) {
  const dias = new Map<string, { dia: Date; sessoes: SessaoNaCentral[] }>();
  for (const s of lista) {
    const dia = startOfDay(s.start);
    const chave = dia.toISOString();
    const grupo = dias.get(chave) ?? { dia, sessoes: [] };
    grupo.sessoes.push(s);
    dias.set(chave, grupo);
  }
  return [...dias.values()]
    .sort((a, b) => b.dia.getTime() - a.dia.getTime())
    .map((g) => ({ ...g, sessoes: g.sessoes.sort((a, b) => a.start.getTime() - b.start.getTime()) }));
}
