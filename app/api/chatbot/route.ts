// app/api/chatbot/route.ts

import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextRequest, NextResponse } from "next/server";
import { initAdmin } from "@/lib/firebaseAdmin";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

// Importando as 'interfaces' (tipos) para garantir que nosso código trabalhe com os dados corretos
import { Professional } from "@/services/professionalService";
import { Patient } from "@/services/patientService";
import { Appointment } from "@/services/appointmentService";
import { Transaction } from "@/services/financialService";
import { Communication } from "@/services/communicationService";
import { Room } from "@/services/roomService";

// Inicializa o acesso de ADMIN ao Firestore.
const db = initAdmin();

// Inicializa o cliente da IA do Google
const genAI = new GoogleGenerativeAI(process.env.NEXT_PUBLIC_GEMINI_API_KEY || "");

// As "instruções de personalidade" da Lia
const systemInstruction = `
    Você é a "LibelleAI", a assistente virtual da Clínica Casa Libelle.
    Sua personalidade é amigável, solícita e profissional. Sempre inicie suas respostas se apresentando.
    Você receberá uma pergunta de um usuário e, opcionalmente, um bloco de 'Dados do Sistema'.
    Sua tarefa é usar os 'Dados do Sistema' para responder à pergunta do usuário de forma precisa e conversacional.
    Se os dados do sistema estiverem vazios ou não forem relevantes para a pergunta, responda usando seu conhecimento geral sobre a clínica.
    NUNCA forneça conselhos médicos ou diagnósticos. Seja concisa.
`;

export async function POST(req: NextRequest) {
  try {
    const { message, userRole } = await req.json();
    console.log(`[Chatbot Log] Mensagem: "${message}". Perfil: "${userRole}"`);

    let contextData: object | null = null;
    let contextTitle = "";
    const lowerMessage = message.toLowerCase();

    // A IA só busca dados sensíveis se o usuário for um admin.
    if (userRole === 'admin') {
      // Lógica interna para decidir quais dados buscar, sem chamar a IA
      const professionalsSnapshot = await db.collection('professionals').get();
      const allProfessionals = professionalsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Professional));

      // 1. Tenta identificar se a pergunta é sobre AGENDAMENTOS
      if (lowerMessage.includes('agenda') || lowerMessage.includes('agendamentos') || lowerMessage.includes('horários')) {
        contextTitle = "Dados de Agendamento";
        const target = allProfessionals.find(p => lowerMessage.includes(p.fullName.toLowerCase().split(' ')[0]));
        
        if (target) {
          const todayStart = new Date(); todayStart.setHours(0, 0, 0, 0);
          const todayEnd = new Date(); todayEnd.setHours(23, 59, 59, 999);
          const appointmentsSnapshot = await db.collection('appointments').where('professionalId', '==', target.id).where('start', '>=', todayStart).where('start', '<=', todayEnd).orderBy('start').get();
          const appointments = appointmentsSnapshot.docs.map(doc => doc.data() as Appointment);
          contextData = { professionalName: target.fullName, appointments };
        }
      } 
      // 2. Tenta identificar se a pergunta é sobre PACIENTES
      else if (lowerMessage.includes('paciente')) {
        contextTitle = "Dados de Pacientes";
        const patientsSnapshot = await db.collection('patients').get();
        const allPatients = patientsSnapshot.docs.map(doc => doc.data() as Patient);
        const activeCount = allPatients.filter(p => p.status === 'ativo').length;
        contextData = { total: allPatients.length, active: activeCount };
      }
      // Adicione outras lógicas "else if" aqui para mais funcionalidades (salas, comunicados, etc.)
    }

    console.log(`[Chatbot Log] Contexto Buscado: ${contextTitle} - ${JSON.stringify(contextData)}`);

    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash", systemInstruction });

    // Monta o prompt final para a única chamada à API
    const finalPrompt = `
      **Pergunta do Usuário:**
      "${message}"

      ${contextData ? `
      **Dados do Sistema para consulta:**
      ${JSON.stringify(contextData, null, 2)}
      ` : ''}
    `;

    const result = await model.generateContent(finalPrompt);
    const text = result.response.text();

    return NextResponse.json({ text });

  } catch (error: any) {
    console.error("Erro na API do Chatbot:", error);
    // Verifica se o erro é de cota excedida para dar uma resposta mais clara
    if (error.message && error.message.includes('429')) {
      return NextResponse.json(
        { text: "Olá! Sou a Lia. Parece que atingimos nosso limite de interações gratuitas por hoje. Por favor, tente novamente amanhã." },
        { status: 429 }
      );
    }
    return NextResponse.json({ error: "Ocorreu um erro ao processar sua mensagem." }, { status: 500 });
  }
}