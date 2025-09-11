// app/api/schedule-assistant/route.ts

import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextRequest, NextResponse } from "next/server";
import { findRecurringSchedulePatterns, findPotentialSwapCandidates } from "@/services/appointmentService";
import { getProfessionals } from "@/services/professionalService";

const genAI = new GoogleGenerativeAI(process.env.NEXT_PUBLIC_GEMINI_API_KEY || "");

const systemInstruction = `
    Você é a "LibelleAI", a Coordenadora de Terapias virtual da Clínica Casa Libelle. A sua missão é criar um plano de terapia contínuo, eficaz e sustentável, sendo especialista em otimizar agendas complexas.

    Sua resposta DEVE SEMPRE ser estratégica e focada em soluções:
    - Se receber uma lista de "Padrões de Horário", sua tarefa é montar a melhor grade possível e justificar com base na "consistência" de cada horário.
    - Se receber uma lista de "Candidatos a Troca", significa que não há vagas diretas. Sua tarefa é criar um **plano de ação passo a passo** para o gestor.
    
    **Exemplo de Plano de Ação (quando sugerindo trocas):**
    "Não encontrei uma grade de horários direta, mas identifiquei uma oportunidade de otimização na agenda. Aqui está um plano de 2 passos para acomodar o novo paciente:
    
    * **Passo 1: Remarcar o Paciente Existente.**
        * **Ação:** Mova o agendamento de Fonoaudiologia de *(Nome do Paciente Existente)* com * (Nome do Profissional)* do horário atual *(Terça-feira às 09:50)* para o novo horário vago *(Quinta-feira às 14:10)*.
        * **Justificativa:** Esta mudança é de baixo impacto, pois o novo horário também possui alta disponibilidade para o profissional.
    
    * **Passo 2: Agendar o Novo Paciente.**
        * **Ação:** Agora que o horário de *(Terça-feira às 09:50)* com *(Nome do Profissional)* está livre, pode agendar a Fonoaudiologia para o *(Nome do Novo Paciente)*.
    
    Este plano garante a continuidade para ambos os pacientes com o mínimo de disrupção."

    Seja sempre claro, profissional e focado em apresentar soluções práticas.
`;

export async function POST(req: NextRequest) {
  try {
    const { patientNeeds, preferences = {} } = await req.json();

    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash", systemInstruction });

    // FASE 1: Tenta encontrar padrões de horários livres
    let schedulePatterns = await findRecurringSchedulePatterns(patientNeeds, preferences);

    let prompt;

    if (schedulePatterns.length > 0) {
      // Se encontrou, monta o prompt padrão
      prompt = `
        **Análise de Grade de Horário (Cenário 1: Vagas Diretas Encontradas)**

        **Necessidades do Paciente:**
        ${JSON.stringify(patientNeeds, null, 2)}

        **Preferências do Usuário:**
        ${JSON.stringify(preferences, null, 2)}

        **Padrões de Horário Recorrentes Encontrados:**
        ${JSON.stringify(schedulePatterns, null, 2)}

        Monte o melhor plano de terapia recorrente com base nos dados acima. Justifique suas escolhas com foco na consistência dos horários.
      `;
    } else {
      // FASE 2: Se não encontrou, busca por candidatos a troca
      const todosProfissionais = await getProfessionals();
      const swapCandidates = await findPotentialSwapCandidates(patientNeeds[0].terapia, todosProfissionais);

      if (swapCandidates.length === 0) {
        return NextResponse.json({ suggestion: "Infelizmente, a agenda está muito cheia e não foi possível encontrar nem mesmo oportunidades de otimização para encaixar este paciente. Recomendo verificar a possibilidade de contratar novos profissionais ou ajustar os horários de atendimento existentes." });
      }

      prompt = `
        **Análise de Grade de Horário (Cenário 2: Otimização de Agenda Necessária)**

        **Necessidades do Paciente:**
        ${JSON.stringify(patientNeeds, null, 2)}

        **Contexto:** Não foram encontradas vagas diretas para um novo plano de terapia recorrente. No entanto, o sistema identificou os seguintes agendamentos que poderiam ser remarcados para abrir espaço.

        **Candidatos a Troca Identificados:**
        ${JSON.stringify(swapCandidates, null, 2)}

        Crie um plano de ação claro e passo a passo para o gestor, explicando como remarcar um dos agendamentos existentes para abrir uma vaga para o novo paciente. Seja estratégico e convincente.
      `;
    }

    const result = await model.generateContent(prompt);
    const text = result.response.text();

    return NextResponse.json({ suggestion: text });

  } catch (error: any) {
    console.error("Erro na API do Assistente de Agendamento:", error);
    return NextResponse.json({ error: `Ocorreu um erro interno: ${error.message}` }, { status: 500 });
  }
}