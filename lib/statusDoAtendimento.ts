// lib/statusDoAtendimento.ts
// O status do atendimento por extenso e com a cor do selo, igual em todas as telas iniciais.

export const STATUS_DO_ATENDIMENTO: Record<string, { rotulo: string; classe: string }> = {
  agendado: { rotulo: "Agendado", classe: "bg-blue-100 text-blue-800" },
  em_atendimento: { rotulo: "Em atendimento", classe: "bg-orange-100 text-orange-800" },
  finalizado: { rotulo: "Finalizado", classe: "bg-green-100 text-green-800" },
  nao_compareceu: { rotulo: "Não compareceu", classe: "bg-red-100 text-red-800" },
  cancelado: { rotulo: "Cancelado", classe: "bg-gray-100 text-gray-800" },
};

/** Status desconhecido aparece como está gravado, com a cor neutra. */
export const statusDoAtendimento = (status: string) =>
  STATUS_DO_ATENDIMENTO[status] ?? { rotulo: status, classe: STATUS_DO_ATENDIMENTO.cancelado.classe };
