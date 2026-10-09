// app/api/schedule-assistant/route.ts
// O assistente de encaixe: lê os profissionais ativos, a agenda das próximas 12 semanas, as salas e o
// que a coordenação já recusou, e devolve as opções de horário para a criança (livres ou com uma
// troca segura). O cálculo fica em lib/encaixes.ts; nenhum dado sai da clínica.

import { NextRequest, NextResponse } from "next/server";
import { Timestamp } from "firebase-admin/firestore";
import { initAdmin } from "@/lib/firebaseAdmin";
import { verificarAcesso } from "@/lib/acessoServidor";
import { PAPEIS_DA_GESTAO } from "@/lib/permissoes";
import { AtendimentoDaAgenda, Bloqueio, encontrarEncaixes, FamiliaPode, SalaDaClinica } from "@/lib/encaixes";
import { NecessidadeDeTerapia, ORDEM_DOS_DIAS, ProfissionalDaGrade, SEMANAS_ANALISADAS } from "@/lib/horariosRecorrentes";

const UM_DIA = 24 * 60 * 60 * 1000;
const HORARIO = /^\d{2}:\d{2}$/;

/** As terapias pedidas, ou nada se o pedido vier malformado. No máximo 5 sessões por semana (dias úteis). */
const lerNecessidades = (pedido: unknown): NecessidadeDeTerapia[] | null => {
  if (!Array.isArray(pedido) || pedido.length === 0 || pedido.length > 6) return null;
  const necessidades = pedido.map((n) => ({
    terapia: typeof n?.terapia === "string" ? n.terapia.trim() : "",
    frequencia: Math.min(5, Math.max(1, Math.floor(Number(n?.frequencia) || 1))),
  }));
  return necessidades.every((n) => n.terapia) ? necessidades : null;
};

const lerFamilia = (pedido: any): FamiliaPode => ({
  dias: Array.isArray(pedido?.dias) ? pedido.dias.filter((d: unknown) => ORDEM_DOS_DIAS.includes(d as string)) : [],
  desde: HORARIO.test(pedido?.desde) ? pedido.desde : undefined,
  ate: HORARIO.test(pedido?.ate) ? pedido.ate : undefined,
});

const lerPreferidos = (pedido: unknown): string[] =>
  Array.isArray(pedido) ? pedido.filter((id): id is string => typeof id === "string") : [];

/** Os profissionais ativos, os atendimentos das próximas 12 semanas, as salas e as recusas guardadas. */
async function lerAgenda() {
  const db = initAdmin();
  const agora = Date.now();
  // Um dia de folga em cada ponta: o recorte exato, nas datas da clínica, é feito no cálculo
  const [profissionais, atendimentos, salas, recusados] = await Promise.all([
    db.collection("professionals").where("status", "==", "ativo").get(),
    db.collection("appointments")
      .where("start", ">=", Timestamp.fromMillis(agora - UM_DIA))
      .where("start", "<=", Timestamp.fromMillis(agora + (SEMANAS_ANALISADAS * 7 + 1) * UM_DIA))
      .get(),
    db.collection("rooms").get(),
    db.collection("encaixes").where("status", "==", "recusado").get(),
  ]);

  return {
    profissionais: profissionais.docs.map((doc) => ({ id: doc.id, ...doc.data() }) as ProfissionalDaGrade),
    atendimentos: atendimentos.docs.map((doc): AtendimentoDaAgenda => {
      const atendimento = doc.data();
      return {
        professionalId: atendimento.professionalId,
        patientId: atendimento.patientId,
        patientName: atendimento.patientName,
        status: atendimento.status,
        sala: atendimento.sala ?? null,
        tipo: atendimento.tipo,
        start: atendimento.start.toDate(),
        end: atendimento.end.toDate(),
      };
    }),
    salas: salas.docs.map((doc) => ({ id: doc.id, name: doc.data().name, status: doc.data().status }) as SalaDaClinica),
    bloqueios: recusados.docs.flatMap((doc) => (doc.data().bloqueios ?? []) as Bloqueio[]),
  };
}

export async function POST(req: NextRequest) {
  try {
    // Só a gestão aprovada: a rota lê a agenda da clínica inteira com acesso de administrador
    const acesso = await verificarAcesso(req.headers.get("authorization"), PAPEIS_DA_GESTAO);
    if (!acesso.ok) return NextResponse.json({ error: acesso.erro }, { status: acesso.status });

    const corpo = await req.json();
    const necessidades = lerNecessidades(corpo?.necessidades);
    if (!necessidades || typeof corpo?.pacienteId !== "string" || !corpo.pacienteId) {
      return NextResponse.json({ error: "Escolha a criança e as terapias." }, { status: 400 });
    }

    const { profissionais, atendimentos, salas, bloqueios } = await lerAgenda();
    const opcoes = encontrarEncaixes({
      pedido: {
        pacienteId: corpo.pacienteId,
        necessidades,
        familia: lerFamilia(corpo.familia),
        emendar: corpo.emendar !== false,
        preferidos: lerPreferidos(corpo.preferidos),
      },
      profissionais,
      atendimentos,
      salas,
      bloqueios,
    });

    return NextResponse.json({ opcoes });
  } catch (error) {
    console.error("Erro na API do Assistente de Agendamento:", error);
    // O detalhe do erro fica só no registro do servidor
    return NextResponse.json({ error: "Não foi possível buscar os horários agora. Tente de novo em alguns minutos." }, { status: 500 });
  }
}
