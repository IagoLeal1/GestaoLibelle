// app/api/schedule-assistant/route.ts
// O assistente de agendamento: lê os profissionais ativos e a agenda das próximas 12 semanas e
// devolve, para cada terapia pedida, a sugestão de horários e as outras opções. O cálculo fica em
// lib/horariosRecorrentes.ts; nenhum dado sai da clínica.

import { NextRequest, NextResponse } from "next/server";
import { Timestamp } from "firebase-admin/firestore";
import { initAdmin } from "@/lib/firebaseAdmin";
import { verificarAcesso } from "@/lib/acessoServidor";
import { PAPEIS_DA_GESTAO } from "@/lib/permissoes";
import {
  AtendimentoDaGrade,
  encontrarPadroesRecorrentes,
  montarSugestoes,
  NecessidadeDeTerapia,
  Preferencias,
  ProfissionalDaGrade,
  SEMANAS_ANALISADAS,
} from "@/lib/horariosRecorrentes";

const UM_DIA = 24 * 60 * 60 * 1000;
const TURNOS = ["manha", "tarde", "noite"];

/** As terapias pedidas, ou nada se o pedido vier malformado. No máximo 5 sessões por semana (dias úteis). */
const lerNecessidades = (pedido: unknown): NecessidadeDeTerapia[] | null => {
  if (!Array.isArray(pedido) || pedido.length === 0) return null;
  const necessidades = pedido.map((n) => ({
    terapia: typeof n?.terapia === "string" ? n.terapia.trim() : "",
    frequencia: Math.min(5, Math.max(1, Math.floor(Number(n?.frequencia) || 1))),
  }));
  return necessidades.every((n) => n.terapia) ? necessidades : null;
};

const lerPreferencias = (pedido: any): Preferencias => ({
  turno: TURNOS.includes(pedido?.turno) ? pedido.turno : undefined,
  profissionaisIds: Array.isArray(pedido?.profissionaisIds)
    ? pedido.profissionaisIds.filter((id: unknown) => typeof id === "string")
    : [],
});

/** Os profissionais ativos e os atendimentos das próximas 12 semanas. */
async function lerAgenda() {
  const db = initAdmin();
  const agora = Date.now();
  // Um dia de folga em cada ponta: o recorte exato, nas datas da clínica, é feito no cálculo
  const [profissionais, atendimentos] = await Promise.all([
    db.collection("professionals").where("status", "==", "ativo").get(),
    db.collection("appointments")
      .where("start", ">=", Timestamp.fromMillis(agora - UM_DIA))
      .where("start", "<=", Timestamp.fromMillis(agora + (SEMANAS_ANALISADAS * 7 + 1) * UM_DIA))
      .get(),
  ]);

  return {
    profissionais: profissionais.docs
      .map((doc) => ({ id: doc.id, ...doc.data() }) as ProfissionalDaGrade)
      .sort((a, b) => (a.fullName ?? "").localeCompare(b.fullName ?? "", "pt-BR")),
    atendimentos: atendimentos.docs.map((doc): AtendimentoDaGrade => {
      const atendimento = doc.data();
      return {
        professionalId: atendimento.professionalId,
        patientId: atendimento.patientId,
        status: atendimento.status,
        start: atendimento.start.toDate(),
        end: atendimento.end.toDate(),
      };
    }),
  };
}

export async function POST(req: NextRequest) {
  try {
    // Só a gestão aprovada: a rota lê a agenda da clínica inteira com acesso de administrador
    const acesso = await verificarAcesso(req.headers.get("authorization"), PAPEIS_DA_GESTAO);
    if (!acesso.ok) return NextResponse.json({ error: acesso.erro }, { status: acesso.status });

    const { patientId, patientNeeds, preferences } = await req.json();
    const necessidades = lerNecessidades(patientNeeds);
    if (!necessidades) {
      return NextResponse.json({ error: "Necessidades de terapia inválidas." }, { status: 400 });
    }

    const { profissionais, atendimentos } = await lerAgenda();
    const padroes = encontrarPadroesRecorrentes({
      necessidades,
      preferencias: lerPreferencias(preferences),
      profissionais,
      atendimentos,
      pacienteId: typeof patientId === "string" ? patientId : undefined,
    });

    return NextResponse.json({ sugestoes: montarSugestoes(necessidades, padroes) });
  } catch (error) {
    console.error("Erro na API do Assistente de Agendamento:", error);
    // O detalhe do erro fica só no registro do servidor
    return NextResponse.json({ error: "Não foi possível buscar os horários agora. Tente de novo em alguns minutos." }, { status: 500 });
  }
}
