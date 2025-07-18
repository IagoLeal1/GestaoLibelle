
import { db } from "@/lib/firebaseConfig";
import { 
  collection, 
  addDoc, 
  getDocs, 
  query, 
  where, 
  Timestamp, 
  orderBy,
  doc,
  getDoc 
} from 'firebase/firestore';

// --- Interfaces ---

// Representa um agendamento como ele é salvo no Firestore
export interface Appointment {
  id: string;
  patientId: string;
  professionalId: string;
  start: Timestamp;
  end: Timestamp;
 status: 'agendado' | 'finalizado' | 'nao_compareceu' | 'cancelado' | 'em_atendimento';
  statusSecundario: string;
  tipo: string;
  sala?: string;
  convenio?: string;
  observacoes?: string;
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

// Representa um evento para o componente de calendário
export interface CalendarEvent {
  id: string;
  title: string;
  start: Date;
  end: Date;
  resourceId: string;
  data: Appointment;
}


// --- Funções do Serviço ---

export const getAppointmentsByDate = async (date: Date): Promise<Appointment[]> => {
  try {
    const dayStart = new Date(date);
    dayStart.setHours(0, 0, 0, 0);
    const dayEnd = new Date(date);
    dayEnd.setHours(23, 59, 59, 999);

    const q = query(
      collection(db, 'appointments'),
      where('start', '>=', Timestamp.fromDate(dayStart)),
      where('start', '<=', Timestamp.fromDate(dayEnd)),
      orderBy('start')
    );

    const snapshot = await getDocs(q);
    if (snapshot.empty) return [];

    const appointments = await Promise.all(snapshot.docs.map(async (d) => {
      const data = d.data();
      let patientName = 'Paciente não encontrado';
      if (data.patientId) {
        const patientDoc = await getDoc(doc(db, 'patients', data.patientId));
        if (patientDoc.exists()) patientName = patientDoc.data().fullName;
      }
      let professionalName = 'Profissional não encontrado';
      if (data.professionalId) {
        const professionalDoc = await getDoc(doc(db, 'professionals', data.professionalId));
        if (professionalDoc.exists()) professionalName = professionalDoc.data().fullName;
      }
      return {
        id: d.id, ...data, patientName, professionalName,
      } as Appointment;
    }));
    return appointments;
  } catch (error) {
    console.error("Erro ao buscar agendamentos:", error);
    return [];
  }
};

export const createAppointment = async (data: AppointmentFormData) => {
  try {
    const [year, month, day] = data.data.split('-').map(Number);
    const [hour, minute] = data.hora.split(':').map(Number);
    
    const startDate = new Date(year, month - 1, day, hour, minute);
    const endDate = new Date(startDate.getTime() + 50 * 60000);

    const patientDoc = await getDoc(doc(db, 'patients', data.patientId));
    const professionalDoc = await getDoc(doc(db, 'professionals', data.professionalId));
    const title = `${patientDoc.data()?.fullName} - ${professionalDoc.data()?.fullName}`;

    const appointmentData = {
      title,
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