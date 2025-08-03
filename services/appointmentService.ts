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
import { addWeeks, addDays, startOfDay, endOfDay } from 'date-fns';

// --- Interfaces ---
export type AppointmentStatus = 'agendado' | 'finalizado' | 'nao_compareceu' | 'cancelado' | 'em_atendimento';

export interface Appointment {
  id: string;
  title: string;
  patientId: string;
  patientName: string; // Desnormalizado para otimização de leitura
  professionalId: string;
  professionalName: string; // Desnormalizado para otimização de leitura
  start: Timestamp;
  end: Timestamp;
  status: AppointmentStatus;
  statusSecundario?: string;
  tipo: string;
  sala?: string;
  convenio?: string;
  observacoes?: string;
  blockId?: string;
  isLastInBlock?: boolean;
  valorConsulta?: number; 
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
  statusSecundario?: string;
  valorConsulta?: number; 
}

export interface AppointmentBlockFormData {
  patientId: string;
  professionalId:string;
  data: string;
  hora: string;
  sessions: number;
  tipo: string;
  sala?: string;
  convenio?: string;
  observacoes?: string;
  valorConsulta?: number; 
}

// --- Funções Otimizadas ---

// Busca agendamentos por data (Agora muito mais barata)
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
    const snapshot = await getDocs(q); // Custo: Apenas 1 leitura, não importa quantos agendamentos

    // Não há mais N+1 leituras aqui. Os nomes já vêm nos dados.
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Appointment));
  } catch (error) {
    console.error("Erro ao buscar agendamentos por data:", error);
    return [];
  }
};

// Cria agendamento único com desnormalização
export const createAppointment = async (data: AppointmentFormData) => {
  try {
    // 2 leituras extras na escrita para economizar centenas na leitura
    const patientDoc = await getDoc(doc(db, 'patients', data.patientId));
    const professionalDoc = await getDoc(doc(db, 'professionals', data.professionalId));

    if (!patientDoc.exists() || !professionalDoc.exists()) {
      throw new Error("Paciente ou Profissional não encontrado.");
    }
    const patientName = patientDoc.data().fullName;
    const professionalName = professionalDoc.data().fullName;

    const [year, month, day] = data.data.split('-').map(Number);
    const [hour, minute] = data.hora.split(':').map(Number);
    const startDate = new Date(year, month - 1, day, hour, minute);
    const endDate = new Date(startDate.getTime() + 50 * 60000);

    const appointmentData = {
      title: `${patientName} - ${professionalName}`,
      patientId: data.patientId,
      patientName, // <-- SALVANDO O NOME
      professionalId: data.professionalId,
      professionalName, // <-- SALVANDO O NOME
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

// Cria agendamentos em lote com desnormalização
export const createAppointmentBlock = async (data: AppointmentBlockFormData) => {
  try {
    const { patientId, professionalId, data: startDateStr, hora, sessions, ...restData } = data;
    
    // 2 leituras extras na escrita para economizar centenas na leitura
    const patientDoc = await getDoc(doc(db, 'patients', patientId));
    const professionalDoc = await getDoc(doc(db, 'professionals', professionalId));
    if (!patientDoc.exists() || !professionalDoc.exists()) throw new Error("Paciente ou profissional não encontrado.");
    
    const patientName = patientDoc.data().fullName;
    const professionalName = professionalDoc.data().fullName;
    const title = `${patientName} - ${professionalName}`;
    
    const [year, month, day] = startDateStr.split('-').map(Number);
    const [hour, minute] = hora.split(':').map(Number);
    const firstAppointmentDate = new Date(year, month - 1, day, hour, minute);

    const batch = writeBatch(db);
    const blockId = doc(collection(db, 'idGenerator')).id; // Gera um ID único para o bloco

    for (let i = 0; i < sessions; i++) {
      const sessionDate = addWeeks(firstAppointmentDate, i);
      const sessionEndDate = new Date(sessionDate.getTime() + 50 * 60000);
      const newAppointmentRef = doc(collection(db, "appointments"));
      
      batch.set(newAppointmentRef, {
        ...restData,
        title,
        patientId,
        patientName, // <-- SALVANDO O NOME
        professionalId,
        professionalName, // <-- SALVANDO O NOME
        start: Timestamp.fromDate(sessionDate),
        end: Timestamp.fromDate(sessionEndDate),
        status: 'agendado',
        statusSecundario: 'pendente_confirmacao',
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

// Busca agendamentos para renovação (Agora muito mais barata)
export const getRenewableAppointments = async (): Promise<Appointment[]> => {
  try {
    const q = query(
      collection(db, 'appointments'),
      where('isLastInBlock', '==', true),
      where('status', '==', 'agendado'),
      orderBy('start')
    );
    const snapshot = await getDocs(q); // Custo: Apenas 1 leitura
    if (snapshot.empty) return [];
    
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Appointment));
  } catch (error) {
    console.error("Erro ao buscar agendamentos para renovação:", error);
    return [];
  }
}

// Renova o bloco, agora com número de sessões variável
export const renewAppointmentBlock = async (lastAppointment: Appointment, sessionsToRenew: number) => {
  try {
    if (!sessionsToRenew || sessionsToRenew <= 0) {
      return { success: false, error: "O número de sessões para renovação deve ser maior que zero." };
    }
    const batch = writeBatch(db);
    const newBlockId = doc(collection(db, 'idGenerator')).id;
    const firstNewDate = addWeeks(lastAppointment.start.toDate(), 1);

    for (let i = 0; i < sessionsToRenew; i++) {
      const sessionDate = addWeeks(firstNewDate, i);
      const sessionEndDate = new Date(sessionDate.getTime() + 50 * 60000);
      const newAppointmentRef = doc(collection(db, "appointments"));

      batch.set(newAppointmentRef, {
        // Copiamos os dados desnormalizados do último agendamento. Custo: 0 leituras extras!
        title: lastAppointment.title,
        patientId: lastAppointment.patientId,
        patientName: lastAppointment.patientName,
        professionalId: lastAppointment.professionalId,
        professionalName: lastAppointment.professionalName,
        tipo: lastAppointment.tipo,
        sala: lastAppointment.sala,
        convenio: lastAppointment.convenio,
        observacoes: lastAppointment.observacoes,
        start: Timestamp.fromDate(sessionDate),
        end: Timestamp.fromDate(sessionEndDate),
        status: 'agendado',
        statusSecundario: 'pendente_confirmacao',
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
}

// Dispensa o aviso de renovação
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

// Busca agendamentos para um profissional em um período (para relatórios)
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

    return await Promise.all(snapshot.docs.map(async (d) => {
      const data = d.data();
      const patientDoc = await getDoc(doc(db, 'patients', data.patientId));
      return {
        id: d.id, ...data,
        patientName: patientDoc.exists() ? patientDoc.data().fullName : 'Paciente Excluído',
      } as Appointment;
    }));
  } catch (error) {
    console.error("Erro ao buscar agendamentos para relatório:", error);
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
      where('professionalId', '==', professionalId), // O filtro chave para o profissional
      where('start', '>=', Timestamp.fromDate(dayStart)),
      where('start', '<=', Timestamp.fromDate(dayEnd)),
      orderBy('start')
    );

    const snapshot = await getDocs(q);
    if (snapshot.empty) return [];

    // Retorna os dados diretamente, já que patientName está desnormalizado.
    // Custo super baixo!
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Appointment));
  } catch (error) {
    console.error("Erro ao buscar agendamentos do profissional:", error);
    return [];
  }
};
/**
 * --- NOVA FUNÇÃO ---
 * Busca os IDs das salas que já possuem agendamentos em um determinado intervalo de tempo.
 * Essencial para a funcionalidade de "select de salas inteligente".
 * @param startTime A data e hora de início do agendamento desejado.
 * @param endTime A data e hora de fim do agendamento desejado.
 * @returns Uma promessa que resolve para um array de strings com os IDs das salas ocupadas.
 */
export const getOccupiedRoomIdsByTime = async (startTime: Date, endTime: Date): Promise<string[]> => {
  try {
    const appointmentsRef = collection(db, 'appointments');
    
    // A query para encontrar agendamentos que se sobrepõem no tempo.
    // Condição: (startA < endB) && (endA > startB)
    const q = query(
      appointmentsRef,
      where('status', '==', 'agendado'), // Apenas agendamentos ativos
      where('start', '<', Timestamp.fromDate(endTime)),
      where('end', '>', Timestamp.fromDate(startTime))
    );

    const snapshot = await getDocs(q);
    
    if (snapshot.empty) {
      return []; // Nenhuma sala ocupada
    }

    // Extrai e retorna apenas os IDs das salas dos agendamentos encontrados
    const occupiedRoomIds = snapshot.docs.map(doc => doc.data().sala).filter(Boolean); // .filter(Boolean) remove valores nulos/undefined
    
    // Retorna uma lista de IDs únicos
    return [...new Set(occupiedRoomIds)];

  } catch (error) {
    console.error("Erro ao verificar salas ocupadas:", error);
    return []; // Retorna vazio em caso de erro para não quebrar a UI
  }
};