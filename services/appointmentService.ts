import { db } from "@/lib/firebaseConfig";
import { 
  collection, 
  getDocs, 
  addDoc, 
  query, 
  where, 
  Timestamp, 
  orderBy,
  doc,
  getDoc
} from "firebase/firestore";

// --- Interfaces ---

// Representa um agendamento como ele é salvo no Firestore
export interface Appointment {
  id: string;
  patientId: string;
  professionalId: string;
  start: Timestamp;
  end: Timestamp;
  status: 'agendado' | 'finalizado' | 'cancelado' | 'remarcado' | 'falta';
  tipo: string;
  sala?: string;
  convenio?: string;
  observacoes?: string;
  // Campos que adicionamos para facilitar, mas não são salvos diretamente
  patientName?: string;
  professionalName?: string;
}

// Representa os dados que vêm do formulário de criação
export interface AppointmentFormData {
  patientId: string;
  professionalId: string;
  data: string;
  hora: string;
  tipo: string;
  sala?: string;
  convenio?: string;
  observacoes?: string;
}

// Representa um evento como a biblioteca de calendário espera
export interface CalendarEvent {
  id?: string;
  title: string;
  start: Date;
  end: Date;
  resourceId: string; // ID do profissional
  allDay?: boolean;
  data: Appointment; // Guarda o objeto de agendamento completo
}


// --- Funções do Serviço ---

/**
 * Busca todos os agendamentos e os formata para o calendário.
 * No futuro, podemos adicionar filtros de data aqui.
 */
export const getAppointments = async (): Promise<CalendarEvent[]> => {
  try {
    const snapshot = await getDocs(query(collection(db, "appointments"), orderBy("start")));
    
    const events = await Promise.all(snapshot.docs.map(async (d) => {
      const data = d.data();
      let patientName = 'Paciente';
      let professionalName = 'Profissional';

      if (data.patientId) {
        const patientDoc = await getDoc(doc(db, 'patients', data.patientId));
        if(patientDoc.exists()) patientName = patientDoc.data().fullName;
      }
      if (data.professionalId) {
        const professionalDoc = await getDoc(doc(db, 'professionals', data.professionalId));
        if(professionalDoc.exists()) professionalName = professionalDoc.data().fullName;
      }
      
      const event: CalendarEvent = {
        id: d.id,
        title: `${patientName} - ${professionalName}`,
        start: data.start.toDate(),
        end: data.end.toDate(),
        resourceId: data.professionalId,
        data: { id: d.id, ...data } as Appointment,
      };
      return event;
    }));

    return events;

  } catch (error) {
    console.error("Erro ao buscar agendamentos:", error);
    return [];
  }
};


/**
 * Cria um novo agendamento a partir dos dados do formulário.
 */
export const createAppointment = async (data: AppointmentFormData) => {
  try {
    // Combina a data e a hora do formulário em um objeto Date do JavaScript
    const [year, month, day] = data.data.split('-').map(Number);
    const [hour, minute] = data.hora.split(':').map(Number);
    const startDate = new Date(year, month - 1, day, hour, minute);
    
    // Define uma duração padrão de 50 minutos para o agendamento
    const endDate = new Date(startDate.getTime() + 50 * 60000);

    const appointmentData = {
      patientId: data.patientId,
      professionalId: data.professionalId,
      tipo: data.tipo || "Consulta",
      sala: data.sala || null,
      convenio: data.convenio || null,
      observacoes: data.observacoes || "",
      start: Timestamp.fromDate(startDate),
      end: Timestamp.fromDate(endDate),
      status: 'agendado',
    };

    await addDoc(collection(db, "appointments"), appointmentData);
    return { success: true };

  } catch (error) {
    console.error("Erro ao criar agendamento:", error);
    return { success: false, error: "Falha ao criar agendamento." };
  }
};