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
  deleteDoc,
  writeBatch
} from 'firebase/firestore';
import { addWeeks, startOfDay, endOfDay, differenceInMinutes } from 'date-fns';

// --- Interfaces ---
export type AppointmentStatus = 'agendado' | 'finalizado' | 'nao_compareceu' | 'cancelado' | 'em_atendimento';

export interface Appointment {
  id: string;
  title: string;
  patientId: string;
  patientName: string;
  professionalId: string;
  professionalName: string;
  start: Timestamp;
  end: Timestamp;
  status: AppointmentStatus;
  statusSecundario?: string;
  tipo: string;
  sala?: string;
  convenio?: string;
  valorConsulta?: number;
  observacoes?: string;
  blockId?: string;
  isLastInBlock?: boolean;
}

export interface AppointmentFormData {
  patientId: string;
  professionalId: string;
  data: string;
  horaInicio: string;
  horaFim: string;
  tipo: string;
  sala?: string;
  convenio?: string;
  valorConsulta?: number;
  observacoes?: string;
  statusSecundario?: string;
}

export interface AppointmentBlockFormData extends Omit<AppointmentFormData, 'data' | 'horaInicio' | 'horaFim'> {
  data: string;
  horaInicio: string;
  horaFim: string;
  sessions: number;
}

// --- Funções de Busca e Relatório ---

export const getAppointmentsByDate = async (dateString: string): Promise<Appointment[]> => {
  try {
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
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Appointment));
  } catch (error) {
    console.error("Erro ao buscar agendamentos por data:", error);
    return [];
  }
};

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
  
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Appointment));
    } catch (error) {
      console.error("Erro ao buscar agendamentos do profissional:", error);
      return [];
    }
};

export const getAppointmentsForReport = async (professionalId: string, startDate: Date, endDate: Date): Promise<Appointment[]> => {
    try {
      const q = query(
        collection(db, 'appointments'),
        where('professionalId', '==', professionalId),
        where('start', '>=', Timestamp.fromDate(startOfDay(startDate))),
        where('start', '<=', Timestamp.fromDate(endOfDay(endDate))),
        orderBy('start')
      );
  
      const snapshot = await getDocs(q);
      if (snapshot.empty) return [];
  
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Appointment));
    } catch (error) {
      console.error("Erro ao buscar agendamentos para relatório:", error);
      return [];
    }
};

// --- Funções de CRUD ---

export const createAppointment = async (data: AppointmentFormData) => {
  try {
    const patientDoc = await getDoc(doc(db, 'patients', data.patientId));
    const professionalDoc = await getDoc(doc(db, 'professionals', data.professionalId));
    if (!patientDoc.exists() || !professionalDoc.exists()) { throw new Error("Paciente ou Profissional não encontrado."); }
    
    const patientName = patientDoc.data().fullName;
    const professionalName = professionalDoc.data().fullName;

    const [year, month, day] = data.data.split('-').map(Number);
    const [startHour, startMinute] = data.horaInicio.split(':').map(Number);
    const [endHour, endMinute] = data.horaFim.split(':').map(Number);

    const startDate = new Date(year, month - 1, day, startHour, startMinute);
    const endDate = new Date(year, month - 1, day, endHour, endMinute);

    const appointmentData = {
      title: `${patientName} - ${professionalName}`,
      patientId: data.patientId,
      patientName,
      professionalId: data.professionalId,
      professionalName,
      tipo: data.tipo,
      sala: data.sala || null,
      convenio: data.convenio || "",
      valorConsulta: data.valorConsulta || 0,
      observacoes: data.observacoes || "",
      start: Timestamp.fromDate(startDate),
      end: Timestamp.fromDate(endDate),
      status: 'agendado' as AppointmentStatus,
      statusSecundario: data.statusSecundario === 'nenhum' ? '' : data.statusSecundario || "",
    };
    await addDoc(collection(db, "appointments"), appointmentData);
    return { success: true };
  } catch (error) {
    console.error("Erro ao criar agendamento:", error);
    return { success: false, error: "Falha ao criar agendamento." };
  }
};

export const createAppointmentBlock = async (data: AppointmentBlockFormData) => {
  try {
    const { patientId, professionalId, data: startDateStr, horaInicio, horaFim, sessions, ...restData } = data;
    
    const patientDoc = await getDoc(doc(db, 'patients', patientId));
    const professionalDoc = await getDoc(doc(db, 'professionals', professionalId));
    if (!patientDoc.exists() || !professionalDoc.exists()) { throw new Error("Paciente ou profissional não encontrado."); }

    const patientName = patientDoc.data().fullName;
    const professionalName = professionalDoc.data().fullName;
    const title = `${patientName} - ${professionalName}`;
    
    const [year, month, day] = startDateStr.split('-').map(Number);
    const [startHour, startMinute] = horaInicio.split(':').map(Number);
    const [endHour, endMinute] = horaFim.split(':').map(Number);

    const firstAppointmentDate = new Date(year, month - 1, day, startHour, startMinute);
    const endDateTime = new Date(year, month - 1, day, endHour, endMinute);
    const durationInMinutes = differenceInMinutes(endDateTime, firstAppointmentDate);

    const batch = writeBatch(db);
    const blockId = doc(collection(db, 'idGenerator')).id;

    for (let i = 0; i < sessions; i++) {
      const sessionDate = addWeeks(firstAppointmentDate, i);
      const sessionEndDate = new Date(sessionDate.getTime() + durationInMinutes * 60000);
      const newAppointmentRef = doc(collection(db, "appointments"));
      
      batch.set(newAppointmentRef, {
        ...restData,
        title,
        patientId,
        patientName,
        professionalId,
        professionalName,
        start: Timestamp.fromDate(sessionDate),
        end: Timestamp.fromDate(sessionEndDate),
        status: 'agendado',
        statusSecundario: data.statusSecundario === 'nenhum' ? '' : data.statusSecundario || "",
        blockId: blockId,
        isLastInBlock: (i === sessions - 1)
      });
    }

    await batch.commit();
    return { success: true };
  } catch (error) {
    console.error("Erro ao criar agendamentos em lote:", error);
    return { success: false, error: "Falha ao criar o bloco de agendamentos." };
  }
};

export const updateAppointment = async (id: string, data: Partial<AppointmentFormData & { status: AppointmentStatus }>) => {
  try {
    const docRef = doc(db, 'appointments', id);
    const dataToUpdate: { [key: string]: any } = { ...data };

    // Converte o valor 'nenhum' do formulário para uma string vazia no banco
    if (dataToUpdate.statusSecundario === 'nenhum') {
      dataToUpdate.statusSecundario = '';
    }

    if (data.data && data.horaInicio && data.horaFim) {
      const [year, month, day] = data.data.split('-').map(Number);
      const [startHour, startMinute] = data.horaInicio.split(':').map(Number);
      const [endHour, endMinute] = data.horaFim.split(':').map(Number);
      
      const startDate = new Date(year, month - 1, day, startHour, startMinute);
      const endDate = new Date(year, month - 1, day, endHour, endMinute);
      
      dataToUpdate.start = Timestamp.fromDate(startDate);
      dataToUpdate.end = Timestamp.fromDate(endDate);

      delete dataToUpdate.data;
      delete dataToUpdate.horaInicio;
      delete dataToUpdate.horaFim;
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

// --- Funções de Renovação ---

export const getRenewableAppointments = async (): Promise<Appointment[]> => {
  try {
    const q = query(
      collection(db, 'appointments'),
      where('isLastInBlock', '==', true),
      where('status', '==', 'agendado'),
      orderBy('start')
    );
    const snapshot = await getDocs(q);
    if (snapshot.empty) return [];
    
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Appointment));
  } catch (error) {
    console.error("Erro ao buscar agendamentos para renovação:", error);
    return [];
  }
};

export const renewAppointmentBlock = async (lastAppointment: Appointment, sessionsToRenew: number) => {
  try {
    if (!sessionsToRenew || sessionsToRenew <= 0) {
      return { success: false, error: "O número de sessões para renovação deve ser maior que zero." };
    }

    const durationInMinutes = differenceInMinutes(lastAppointment.end.toDate(), lastAppointment.start.toDate());

    const batch = writeBatch(db);
    const newBlockId = doc(collection(db, 'idGenerator')).id;
    const firstNewDate = addWeeks(lastAppointment.start.toDate(), 1);

    for (let i = 0; i < sessionsToRenew; i++) {
      const sessionDate = addWeeks(firstNewDate, i);
      const sessionEndDate = new Date(sessionDate.getTime() + durationInMinutes * 60000);
      const newAppointmentRef = doc(collection(db, "appointments"));

      batch.set(newAppointmentRef, {
        title: lastAppointment.title,
        patientId: lastAppointment.patientId,
        patientName: lastAppointment.patientName,
        professionalId: lastAppointment.professionalId,
        professionalName: lastAppointment.professionalName,
        tipo: lastAppointment.tipo,
        sala: lastAppointment.sala,
        convenio: lastAppointment.convenio,
        observacoes: lastAppointment.observacoes,
        valorConsulta: lastAppointment.valorConsulta,
        start: Timestamp.fromDate(sessionDate),
        end: Timestamp.fromDate(sessionEndDate),
        status: 'agendado',
        statusSecundario: lastAppointment.statusSecundario,
        blockId: newBlockId,
        isLastInBlock: (i === sessionsToRenew - 1)
      });
    }

    const oldAppointmentRef = doc(db, 'appointments', lastAppointment.id);
    batch.update(oldAppointmentRef, { isLastInBlock: false });
    
    await batch.commit();
    return { success: true };
  } catch (error) {
    console.error("Erro ao renovar bloco de agendamentos:", error);
    return { success: false, error: "Falha ao renovar o bloco." };
  }
};

export const dismissRenewal = async (appointmentId: string) => {
  try {
    const appointmentRef = doc(db, 'appointments', appointmentId);
    await updateDoc(appointmentRef, { isLastInBlock: false });
    return { success: true };
  } catch (error) {
    console.error("Erro ao dispensar renovação:", error);
    return { success: false, error: "Falha ao dispensar o aviso de renovação." };
  }
};

// --- Função para Salas Inteligentes ---

export const getOccupiedRoomIdsByTime = async (startTime: Date, endTime: Date): Promise<string[]> => {
    try {
      const appointmentsRef = collection(db, 'appointments');
      const q = query(
        appointmentsRef,
        where('status', '==', 'agendado'),
        where('start', '<', Timestamp.fromDate(endTime)),
        where('end', '>', Timestamp.fromDate(startTime))
      );
      const snapshot = await getDocs(q);
      if (snapshot.empty) return [];
      const occupiedRoomIds = snapshot.docs.map(doc => doc.data().sala).filter(Boolean);
      return [...new Set(occupiedRoomIds)];
    } catch (error) {
      console.error("Erro ao verificar salas ocupadas:", error);
      return [];
    }
};