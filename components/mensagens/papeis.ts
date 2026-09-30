// components/mensagens/papeis.ts
// Como cada papel do cadastro (profile.role) aparece nas conversas.

interface ComoAparece {
  rotulo: string; // ao lado do nome de quem escreveu
  grupo: string; // título da seção na lista da equipe
  cor: string; // etiqueta: fundo claro + texto escuro
}

const PAPEIS: Record<string, ComoAparece> = {
  familiar: { rotulo: "Família", grupo: "Família", cor: "bg-amber-100 text-amber-900" },
  profissional: { rotulo: "Terapeuta", grupo: "Terapeutas", cor: "bg-teal-100 text-teal-900" },
  coordenador: { rotulo: "Coordenação", grupo: "Coordenação", cor: "bg-indigo-100 text-indigo-900" },
  admin: { rotulo: "Administração", grupo: "Administração", cor: "bg-indigo-100 text-indigo-900" },
  funcionario: { rotulo: "Equipe", grupo: "Equipe da clínica", cor: "bg-slate-200 text-slate-800" },
};

const OUTRO: ComoAparece = { rotulo: "Participante", grupo: "Outros", cor: "bg-slate-200 text-slate-800" };

// Ordem das seções na lista da equipe
export const ORDEM_DOS_PAPEIS = ["familiar", "profissional", "coordenador", "admin", "funcionario"];

export const papel = (role?: string): ComoAparece => PAPEIS[role ?? ""] ?? OUTRO;

export const isCoordenacao = (role?: string) => role === "admin" || role === "coordenador";
