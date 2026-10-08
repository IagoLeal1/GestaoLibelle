// O diagnóstico da criança, seguindo o desenho aprovado: fica na ficha (patients), é escrito pela
// gestão e pela recepção e aparece na ficha › Diagnóstico e no topo do prontuário. Junto vai a equipe,
// que não é digitada: sai da agenda da criança (quem atendeu nos últimos 30 dias ou tem sessão marcada).
import { addDays, subDays } from "date-fns";

export type SituacaoDoDiagnostico = "confirmado" | "investigacao";

export interface Diagnostico {
  nome: string;
  cid?: string;
  situacao: SituacaoDoDiagnostico;
}

export const LIMITE_DO_NOME = 200;
export const LIMITE_DO_CID = 20;
export const MAXIMO_DE_DIAGNOSTICOS = 10;

export const ROTULO_DA_SITUACAO: Record<SituacaoDoDiagnostico, string> = {
  confirmado: "Confirmado",
  investigacao: "Em investigação",
};

/** Como vai para o banco: sem linhas vazias, sem espaços sobrando, CID em maiúsculas, no máximo 10. */
export function limparDiagnosticos(lista: Partial<Diagnostico>[]): Diagnostico[] {
  return lista
    .map((d) => {
      const nome = (d.nome ?? "").trim().slice(0, LIMITE_DO_NOME);
      const cid = (d.cid ?? "").trim().toUpperCase().slice(0, LIMITE_DO_CID);
      const situacao: SituacaoDoDiagnostico = d.situacao === "investigacao" ? "investigacao" : "confirmado";
      return cid ? { nome, cid, situacao } : { nome, situacao };
    })
    .filter((d) => d.nome)
    .slice(0, MAXIMO_DE_DIAGNOSTICOS);
}

/** O que veio da ficha: fichas antigas não têm o campo, e nada fora do formato entra na tela. */
export function diagnosticosDaFicha(valor: unknown): Diagnostico[] {
  if (!Array.isArray(valor)) return [];
  return valor.filter((d): d is Diagnostico => !!d && typeof d === "object" && typeof (d as Diagnostico).nome === "string" && !!(d as Diagnostico).nome);
}

const DIAS = ["dom", "seg", "ter", "qua", "qui", "sex", "sáb"];
const ORDEM = [1, 2, 3, 4, 5, 6, 0]; // a semana da clínica começa na segunda

/** "seg", "ter e qui", "seg, qua e sex". */
export function diasDaSemana(datas: Date[]) {
  const presentes = new Set(datas.map((d) => d.getDay()));
  const nomes = ORDEM.filter((dia) => presentes.has(dia)).map((dia) => DIAS[dia]);
  return nomes.length <= 1 ? nomes.join("") : `${nomes.slice(0, -1).join(", ")} e ${nomes[nomes.length - 1]}`;
}

/** As sessões que contam para a equipe: de 30 dias atrás até 30 dias à frente. */
export const janelaDaEquipe = (agora: Date) => ({ de: subDays(agora, 30), ate: addDays(agora, 30) });

export interface SessaoDaEquipe {
  tipo: string;
  professionalId: string;
  professionalName: string;
  status: string;
  start: Date;
}

export interface MembroDaEquipe {
  terapia: string;
  professionalId: string;
  profissional: string;
  dias: string;
  voce: boolean;
}

/** Uma linha por terapia e terapeuta, em ordem de terapia; "voce" marca o terapeuta que está olhando. */
export function equipeDaCrianca(sessoes: SessaoDaEquipe[], meuProfessionalId?: string): MembroDaEquipe[] {
  const grupos = new Map<string, { sessao: SessaoDaEquipe; datas: Date[] }>();
  for (const s of sessoes) {
    if (s.status === "cancelado" || !s.tipo || !s.professionalId) continue;
    const chave = `${s.tipo}|${s.professionalId}`;
    const grupo = grupos.get(chave) ?? { sessao: s, datas: [] };
    grupo.datas.push(s.start);
    grupos.set(chave, grupo);
  }
  return [...grupos.values()]
    .map(({ sessao, datas }) => ({
      terapia: sessao.tipo,
      professionalId: sessao.professionalId,
      profissional: sessao.professionalName,
      dias: diasDaSemana(datas),
      voce: !!meuProfessionalId && sessao.professionalId === meuProfessionalId,
    }))
    .sort((a, b) => a.terapia.localeCompare(b.terapia, "pt-BR") || a.profissional.localeCompare(b.profissional, "pt-BR"));
}
