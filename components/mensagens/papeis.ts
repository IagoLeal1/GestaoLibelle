// components/mensagens/papeis.ts
// Como cada papel do cadastro (profile.role) aparece nas conversas.
import type { Papel } from "@/services/chatService";

interface ComoAparece {
  rotulo: string; // ao lado do nome de quem escreveu
  grupo: string; // título da seção na lista da equipe
  cor: string; // etiqueta: fundo claro + texto escuro
}

// Admin e coordenador aparecem juntos como "Coordenação"
const PAPEIS: Record<Papel, ComoAparece> = {
  familiar: { rotulo: "Família", grupo: "Família", cor: "bg-amber-100 text-amber-900" },
  profissional: { rotulo: "Terapeuta", grupo: "Terapeutas", cor: "bg-teal-100 text-teal-900" },
  coordenador: { rotulo: "Coordenação", grupo: "Coordenação", cor: "bg-indigo-100 text-indigo-900" },
  admin: { rotulo: "Coordenação", grupo: "Coordenação", cor: "bg-indigo-100 text-indigo-900" },
  funcionario: { rotulo: "Equipe", grupo: "Equipe da clínica", cor: "bg-slate-200 text-slate-800" },
};

const OUTRO: ComoAparece = { rotulo: "Participante", grupo: "Outros", cor: "bg-slate-200 text-slate-800" };

// Ordem das seções na lista da equipe
const ORDEM_DOS_PAPEIS: Papel[] = ["familiar", "profissional", "coordenador", "admin", "funcionario"];

// `role` vem do banco (senderRole, profile.role): um valor desconhecido aparece como "Participante"
export const infoDoPapel = (role?: string): ComoAparece => PAPEIS[role as Papel] ?? OUTRO;

// Pessoas separadas nas seções da equipe, na ordem acima (seções vazias ficam de fora)
export const agruparPorPapel = <T extends { papel?: string }>(pessoas: T[]) => {
  const secoes = new Map<string, T[]>();
  for (const role of [...ORDEM_DOS_PAPEIS, ...pessoas.map(p => p.papel)]) {
    const titulo = infoDoPapel(role).grupo;
    if (!secoes.has(titulo)) secoes.set(titulo, []);
  }
  for (const pessoa of pessoas) secoes.get(infoDoPapel(pessoa.papel).grupo)!.push(pessoa);
  return [...secoes].filter(([, doGrupo]) => doGrupo.length > 0).map(([titulo, doGrupo]) => ({ titulo, pessoas: doGrupo }));
};
