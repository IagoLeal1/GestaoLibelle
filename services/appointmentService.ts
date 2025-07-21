import { db } from "@/lib/firebaseConfig";
import { 
  collection, 
  query, 
  where, 
  getDocs, 
  Timestamp, 
  orderBy, 
  doc, 
  getDoc,
  addDoc,
  updateDoc,
  deleteDoc
} from 'firebase/firestore';
// A biblioteca date-fns não é mais necessária para a busca, simplificando o código
// import { startOfDay, endOfDay } from 'date-fns';

// --- Interfaces ---
export type AppointmentStatus = 'agendado' | 'finalizado' | 'nao_compareceu' | 'cancelado' | 'em_atendimento';

export interface Appointment {
  id: string;
  title: string;
  patientId: string;
  professionalId: string;
  start: Timestamp;
  end: Timestamp;
  status: AppointmentStatus;
  statusSecundario?: string;
  tipo: string;
  sala?: string;
  convenio?: string;
  observacoes?: string;
  patientName?: string;
  professionalName?: string;
}

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

// --- Funções do Serviço ---

// CORREÇÃO: A função agora aceita a string da data (ex: "2025-07-21")
export const getAppointmentsByDate = async (dateString: string): Promise<Appointment[]> => {
  try {
    // Lógica de data robusta que interpreta a string de data como local
    const [year, month, day] = dateString.split('-').map(Number);
    const dayStart = new Date(year, month - 1, day, 0, 0, 0);
    const dayEnd = new Date(year, month - 1, day, 23, 59, 59);

    const q = query(
      collection(db, 'appointments'),
      where('start', '>=', Timestamp.fromDate(dayStart)),
      where('start', '<=', Timestamp.fromDate(dayEnd)),
      orderBy('start')
    );

    const snapshot = await getDocs(q);
    if (snapshot.empty) return [];

    return await Promise.all(snapshot.docs.map(async (d) => {
      const data = d.data();
      const patientDoc = await getDoc(doc(db, 'patients', data.patientId));
      const professionalDoc = await getDoc(doc(db, 'professionals', data.professionalId));
      return {
        id: d.id, ...data,
        patientName: patientDoc.exists() ? patientDoc.data().fullName : 'Paciente Excluído',
        professionalName: professionalDoc.exists() ? professionalDoc.data().fullName : 'Profissional Excluído',
      } as Appointment;
    }));
  } catch (error) {
    console.error("Erro ao buscar agendamentos por data:", error);
    return [];
  }
};

// CORREÇÃO: A função agora também aceita a string da data
export const getAppointmentsByProfessional = async (professionalId: string, dateString: string): Promise<Appointment[]> => {
  try {
    const [year, month, day] = dateString.split('-').map(Number);
    const dayStart = new Date(year, month - 1, day, 0, 0, 0);
    const dayEnd = new Date(year, month - 1, day, 23, 59, 59);

    const q = query(
      collection(db, 'appointments'),
      where('professionalId', '==', professionalId),
      where('start', '>=', Timestamp.fromDate(dayStart)),
      where('start', '<=', Timestamp.fromDate(dayEnd)),
      orderBy('start')
    );

    const snapshot = await getDocs(q);
    if (snapshot.empty) return [];

    return await Promise.all(snapshot.docs.map(async (d) => {
      const data = d.data();
      const patientDoc = await getDoc(doc(db, 'patients', data.patientId));
      return {
        id: d.id, ...data,
        patientName: patientDoc.exists() ? patientDoc.data().fullName : 'Paciente Excluído',
        professionalName: data.professionalName || 'Profissional',
      } as Appointment;
    }));
  } catch (error) {
    console.error("Erro ao buscar agendamentos do profissional:", error);
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
      statusSecundario: 'pendente_confirmacao'
    };
    await addDoc(collection(db, "appointments"), appointmentData);
    return { success: true };
  } catch (error) {
    console.error("Erro ao criar agendamento:", error);
    return { success: false, error: "Falha ao criar agendamento." };
  }
};

export const updateAppointment = async (id: string, data: Partial<AppointmentFormData & { status: AppointmentStatus }>) => {
  try {
    const docRef = doc(db, 'appointments', id);
    let dataToUpdate: any = { ...data };

    if (data.data && data.hora) {
      const [year, month, day] = data.data.split('-').map(Number);
      const [hour, minute] = data.hora.split(':').map(Number);
      const startDate = new Date(year, month - 1, day, hour, minute);
      const endDate = new Date(startDate.getTime() + 50 * 60000);
      dataToUpdate.start = Timestamp.fromDate(startDate);
      dataToUpdate.end = Timestamp.fromDate(endDate);
      delete dataToUpdate.data;
      delete dataToUpdate.hora;
    }
    await updateDoc(docRef, dataToUpdate);
    return { success: true };
  } catch (error) {
    console.error("Erro ao atualizar agendamento:", error);
    return { success: false, error: "Falha ao atualizar agendamento." };
  }
};

export const deleteAppointment = async (id: string) => {
  try {
    const docRef = doc(db, 'appointments', id);
    await deleteDoc(docRef);
    return { success: true };
  } catch (error) {
    console.error("Erro ao deletar agendamento:", error);
    return { success: false, error: "Falha ao deletar agendamento." };
  }
};
