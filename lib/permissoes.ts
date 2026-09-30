// lib/permissoes.ts
// Quem abre qual tela. O menu e o guarda do painel usam a mesma lista: esconder um item do menu
// e travar o endereço digitado andam juntos. Os dados em si são protegidos pelas regras do banco.
import type { Papel } from "@/services/chatService";

// Gestão da clínica: admin, coordenação e recepção (nas regras do banco, canManage)
export const PAPEIS_DA_GESTAO: readonly Papel[] = ["admin", "coordenador", "funcionario"];
export const ehGestao = (papel?: string) => PAPEIS_DA_GESTAO.includes(papel as Papel);

const TODOS: Papel[] = ["admin", "profissional", "funcionario", "familiar", "coordenador"];
const GESTAO: Papel[] = [...PAPEIS_DA_GESTAO];
const EQUIPE: Papel[] = [...GESTAO, "profissional"];

// Papéis que abrem cada tela e o que estiver dentro dela
export const PAPEIS_POR_TELA: Record<string, Papel[]> = {
  "/": TODOS,
  "/agendamentos": EQUIPE,
  // Telas de montar e alterar a agenda: o terapeuta só consulta a agenda do dia
  "/agendamentos/novo": GESTAO,
  "/agendamentos/grade": GESTAO,
  "/agendamentos/terapia": GESTAO,
  "/agendamentos/terapeuta": GESTAO,
  "/agendamentos/renovacoes": GESTAO,
  "/agendamentos/assistente": GESTAO,
  "/mapeamento-salas": GESTAO,
  "/pacientes": EQUIPE,
  // Cadastro e edição de crianças: o terapeuta só consulta
  "/pacientes/novo": GESTAO,
  "/pacientes/editar": GESTAO,
  "/profissionais": GESTAO,
  "/especialidades": ["admin"],
  "/financeiro": ["admin"],
  "/admin/usuarios": ["admin"],
  "/comercial": ["admin", "coordenador"],
  "/admin/gerenciar-usuarios": ["admin"],
  "/comunicacao": TODOS,
  "/mensagens": TODOS,
};

// A tela mais específica que contém o endereço decide. Endereço fora da lista (a própria conta,
// telas fora do menu) continua aberto para qualquer pessoa aprovada, como antes.
export const podeAcessar = (pathname: string, papel?: string): boolean => {
  const tela = Object.keys(PAPEIS_POR_TELA)
    .filter(url => pathname === url || (url !== "/" && pathname.startsWith(`${url}/`)))
    .sort((a, b) => b.length - a.length)[0];
  return !tela || PAPEIS_POR_TELA[tela].includes(papel as Papel);
};
