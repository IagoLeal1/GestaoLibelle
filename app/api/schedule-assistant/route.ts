// app/api/schedule-assistant/route.ts

import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextRequest, NextResponse } from "next/server";

const genAI = new GoogleGenerativeAI(process.env.NEXT_PUBLIC_GEMINI_API_KEY || "");

// --- INSTRUÇÕES ATUALIZADAS PARA A IA ---
const systemInstruction = `
    Você é a "LibelleAI", a assistente virtual da Clínica Casa Libelle, especialista em otimização de agendamentos.
    Sua tarefa é analisar uma lista de horários disponíveis e as necessidades de um paciente, incluindo suas preferências, para criar a melhor grade de horários possível.
    
    Você receberá:
    1.  **Necessidades do Paciente:** Uma lista de terapias e a frequência semanal.
    2.  **Preferências do Paciente:** Informações sobre turno (manhã, tarde, noite) e/ou profissionais de preferência.
    3.  **Lista de Horários Vagos:** Uma lista em formato JSON com todos os slots disponíveis que já foram pré-filtrados pelo sistema.
    
    Sua resposta DEVE ser:
    -   Apresentar de 1 a 3 sugestões de grades de horário completas.
    -   Para cada sugestão, explicar brevemente o porquê dela ser uma boa opção, **levando em conta as preferências do usuário**.
    -   Priorize agrupar os agendamentos nos mesmos dias para facilitar a logística da família.
    -   Se não for possível atender a todas as preferências (ex: um profissional preferido não tem horário), **explique isso claramente e apresente a melhor alternativa possível com outros profissionais**.
    -   Seja amigável, profissional e direta. Use formatação Markdown para clareza (listas, negrito).
    -   Se não for possível montar uma grade completa, explique o motivo e aponte quais terapias não puderam ser encaixadas.
`;

export async function POST(req: NextRequest) {
  try {
    // --- RECEBE AS NOVAS PREFERÊNCIAS ---
    const { patientNeeds, availableSlots, preferences } = await req.json();

    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash", systemInstruction });

    // --- MONTA O PROMPT COMPLETO COM AS PREFERÊNCIAS ---
    const prompt = `
      **Necessidades do Paciente:**
      ${JSON.stringify(patientNeeds, null, 2)}

      **Preferências do Paciente:**
      ${JSON.stringify(preferences, null, 2)}

      **Lista de Horários Vagos Disponíveis (já pré-filtrados):**
      ${JSON.stringify(availableSlots, null, 2)}

      Analise os dados acima e me dê as melhores sugestões de grade de horário, considerando as preferências.
    `;

    const result = await model.generateContent(prompt);
    const text = result.response.text();

    return NextResponse.json({ suggestion: text });

  } catch (error) {
    console.error("Erro na API do Assistente de Agendamento:", error);
    return NextResponse.json({ error: "Não foi possível gerar sugestões no momento." }, { status: 500 });
  }
}