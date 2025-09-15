// app/api/schedule-assistant/route.ts

import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextRequest, NextResponse } from "next/server";
import { initAdmin } from "@/lib/firebaseAdmin";
import { Timestamp } from "firebase-admin/firestore";
import { startOfDay, endOfDay, addMonths, format, setHours, setMinutes, addMinutes, parse } from 'date-fns';
import { ptBR } from 'date-fns/locale';

// --- INTERFACES E TIPOS ---
interface TherapyNeed { terapia: string; frequencia: number; }
interface Preferences { turno?: 'manha' | 'tarde' | 'noite'; profissionaisIds?: string[]; }
interface ProfessionalAdmin {
    id: string;
    fullName: string;
    especialidade: string;
    diasAtendimento: string[];
    horarioInicio: string;
    horarioFim: string;
    status: string;
    [key: string]: any;
}
interface SchedulePattern {
    terapia: string;
    professional: { id: string, fullName: string };
    diaSemana: string;
    horario: string;
    consistencia: number;
}

// --- LÓGICA DE BUSCA NO SERVIDOR (ADMIN) ---
const db = initAdmin();

async function getProfessionalsAdmin(status?: string): Promise<ProfessionalAdmin[]> {
    let query: FirebaseFirestore.Query<FirebaseFirestore.DocumentData> = db.collection('professionals');
    if (status) {
        query = query.where('status', '==', status);
    }
    const snapshot = await query.orderBy('fullName').get();
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ProfessionalAdmin));
}

async function getAppointmentsForReportAdmin(startDate: Date, endDate: Date) {
    const snapshot = await db.collection('appointments')
        .where('start', '>=', Timestamp.fromDate(startDate))
        .where('start', '<=', Timestamp.fromDate(endDate))
        .get();
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
}

// FUNÇÃO COM A LÓGICA DE CONFLITO TOTALMENTE CORRIGIDA
async function findRecurringSchedulePatternsAdmin(terapiasNecessarias: TherapyNeed[], preferences: Preferences): Promise<SchedulePattern[]> {
    const { turno, profissionaisIds = [] } = preferences;
    const inicioPeriodo = startOfDay(new Date());
    const fimPeriodo = endOfDay(addMonths(new Date(), 3));

    const [todosProfissionais, agendamentosFuturos] = await Promise.all([
        getProfessionalsAdmin('ativo'),
        getAppointmentsForReportAdmin(inicioPeriodo, fimPeriodo)
    ]);

    const patterns: SchedulePattern[] = [];
    const horariosBase = {
        manha: ['07:20', '08:10', '09:00', '09:50', '10:40', '11:30'],
        tarde: ['12:20', '13:20', '14:10', '15:00', '15:50', '16:40', '17:30'],
        noite: []
    };
    const horariosPadrao = turno ? horariosBase[turno] : [...horariosBase.manha, ...horariosBase.tarde, ...horariosBase.noite];
    const diasDaSemana = ['segunda', 'terca', 'quarta', 'quinta', 'sexta'];
    const duracaoSessao = 50; // Duração em minutos

    for (const necessidade of terapiasNecessarias) {
        let profissionaisQualificados = todosProfissionais.filter(
          (p) => necessidade.terapia.toLowerCase().includes(p.especialidade.toLowerCase()) && p.status === 'ativo'
        );

        if (profissionaisIds.length > 0) {
            const preferidosQualificados = profissionaisQualificados.filter((p) => profissionaisIds.includes(p.id));
            if (preferidosQualificados.length > 0) {
                profissionaisQualificados = preferidosQualificados;
            }
        }

        for (const prof of profissionaisQualificados) {
          if (!prof.horarioInicio || prof.horarioInicio.trim() === '' || !prof.horarioFim || prof.horarioFim.trim() === '') {
              continue;
          }

          for (const dia of diasDaSemana) {
            if (!prof.diasAtendimento || !prof.diasAtendimento.includes(dia)) {
                continue;
            }

            for (const horario of horariosPadrao) {
              const [horaSlot, minutoSlot] = horario.split(':').map(Number);
              const [horaInicioProf, minutoInicioProf] = prof.horarioInicio.split(':').map(Number);
              const [horaFimProf, minutoFimProf] = prof.horarioFim.split(':').map(Number);

              const slotEmMinutos = horaSlot * 60 + minutoSlot;
              const inicioProfEmMinutos = horaInicioProf * 60 + minutoInicioProf;
              const fimProfEmMinutos = horaFimProf * 60 + minutoFimProf;

              if (slotEmMinutos < inicioProfEmMinutos || (slotEmMinutos + duracaoSessao) > fimProfEmMinutos) {
                  continue;
              }

              // --- NOVA LÓGICA DE VERIFICAÇÃO DE CONFLITO ---
              // Verifica se existe algum agendamento que sobreponha o slot de 50 minutos
              const conflitos = agendamentosFuturos.filter((ag: any) => {
                  if (ag.professionalId !== prof.id) return false;

                  const diaAgendamento = format(ag.start.toDate(), 'EEEE', { locale: ptBR }).toLowerCase().replace('-feira', '');
                  if (diaAgendamento !== dia) return false;

                  const inicioAgendamento = ag.start.toDate();
                  const fimAgendamento = ag.end.toDate();

                  const inicioSlot = setMinutes(setHours(inicioPeriodo, horaSlot), minutoSlot);
                  const fimSlot = addMinutes(inicioSlot, duracaoSessao);

                  // Verifica sobreposição de intervalos
                  return (inicioAgendamento < fimSlot && fimAgendamento > inicioSlot);
              }).length;
              // --- FIM DA NOVA LÓGICA ---

              const totalSemanasAnalise = 12;
              const consistencia = 1 - (conflitos / totalSemanasAnalise);

              patterns.push({
                terapia: necessidade.terapia,
                professional: { id: prof.id, fullName: prof.fullName },
                diaSemana: dia.charAt(0).toUpperCase() + dia.slice(1) + "-feira",
                horario: horario,
                consistencia: consistencia,
              });
            }
          }
        }
    }
    return patterns;
}

// --- CÉREBRO DA IA (PROMPT) ---
const genAI = new GoogleGenerativeAI(process.env.NEXT_PUBLIC_GEMINI_API_KEY || "");
const systemInstruction = `
    Você é a "LibelleAI", uma coordenadora de terapias virtual especialista em otimizar agendas na Clínica Casa Libelle.
    Sua missão é apresentar as melhores soluções de agendamento recorrente.
    Você receberá uma lista de "Padrões de Horário Encontrados". Cada padrão tem um score de "consistência" de 0 a 1 (1 = 100% livre nas próximas 12 semanas).
    Sua tarefa é seguir esta lógica:
    1.  **Filtre por Padrões IDEAIS:** Considere como "ideal" qualquer padrão com consistência > 0.7 (70%).
    2.  **Se encontrar padrões IDEAIS:** Monte o "Plano de Terapia Otimizado" usando apenas eles. Justifique a escolha com base na alta consistência, garantindo a continuidade do tratamento.
    3.  **Se NÃO encontrar padrões IDEAIS:**
        a. Filtre por padrões ALTERNATIVOS (consistência <= 0.7 mas > 0).
        b. Se existirem alternativas, apresente-as como "Opções de Encaixe", explicando que são horários com alguma ocupação futura, mas que podem funcionar. Ex: "Encontrei uma opção na Terça-feira às 16:40, porém este horário tem uma consistência de 40%. Isso significa que pode haver necessidade de reagendamentos futuros."
        c. Se não houver NENHUM padrão (nem ideal, nem alternativo), informe que a agenda está cheia e que não foi possível encontrar uma solução.
    Seja sempre clara, objetiva e apresente os horários em formato de lista (markdown).
`;

// --- ROTA DA API ---
export async function POST(req: NextRequest) {
  try {
    const { patientNeeds, preferences = {} } = await req.json();

    if (!patientNeeds || !Array.isArray(patientNeeds) || patientNeeds.length === 0) {
      return NextResponse.json({ error: "Necessidades de terapia inválidas." }, { status: 400 });
    }

    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash", systemInstruction });

    let schedulePatterns = await findRecurringSchedulePatternsAdmin(patientNeeds, preferences);

    const prompt = `
        **Necessidades do Paciente:**
        ${JSON.stringify(patientNeeds, null, 2)}

        **Preferências do Usuário (se houver):**
        ${JSON.stringify(preferences, null, 2)}

        **Padrões de Horário Encontrados (Dados brutos para sua análise):**
        ${JSON.stringify(schedulePatterns, null, 2)}

        Siga as suas instruções para analisar os dados e fornecer a melhor resposta possível, seja um plano ideal, opções alternativas ou a informação de que não há vagas.
    `;

    const result = await model.generateContent(prompt);
    const text = result.response.text();

    return NextResponse.json({ suggestion: text });

  } catch (error: any) {
    console.error("Erro na API do Assistente de Agendamento:", error);
    return NextResponse.json({ error: `Ocorreu um erro interno: ${error.message}` }, { status: 500 });
  }
}