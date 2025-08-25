// services/appointmentService.ts
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
import { addWeeks, startOfDay, endOfDay, differenceInMinutes, addDays, format } from 'date-fns';
import { getProfessionalById } from "./professionalService"; // Importar
import { addTransaction, deleteTransactionByAppointmentId, TransactionFormData } from "./financialService"; // Importar

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


// --- NOVA FUNÇÃO CENTRALIZADORA DE REPASSE ---
/**
 * Analisa um agendamento e decide se cria ou remove um lançamento de repasse.
 * @param appointment O objeto completo do agendamento APÓS a atualização.
 */
const handleRepasseTransaction = async (appointment: Appointment) => {
  // 1. Limpa qualquer repasse antigo ligado a este agendamento para evitar duplicatas
  await deleteTransactionByAppointmentId(appointment.id);

  // 2. Define as condições para GERAR um repasse
  const shouldGenerateRepasse =
    appointment.status === 'finalizado' ||
    (appointment.status === 'nao_compareceu' && appointment.statusSecundario === 'fnj_paciente');

  if (!shouldGenerateRepasse) {
    // Se as condições não são atendidas, apenas saímos após a limpeza.
    return { success: true, message: "Nenhum repasse gerado." };
  }

  // 3. Se as condições são atendidas, busca os dados do profissional
  const professional = await getProfessionalById(appointment.professionalId);
  if (!professional?.financeiro) {
    console.error(`Dados financeiros não encontrados para o profissional ID: ${appointment.professionalId}`);
    return { success: false, error: "Dados financeiros do profissional não encontrados." };
  }

  // 4. Calcula o valor do repasse
  const valorConsulta = appointment.valorConsulta || 0;
  const percentualRepasse = professional.financeiro.percentualRepasse || 0;
  const valorRepasse = (valorConsulta * percentualRepasse) / 100;

  if (valorRepasse <= 0) {
    return { success: true, message: "Valor de repasse é zero, nenhuma transação criada." };
  }

  // 5. Cria a nova transação de despesa (repasse)
  const transactionData: TransactionFormData = {
    type: 'despesa',
    description: `Repasse - ${appointment.patientName} - ${format(appointment.start.toDate(), 'dd/MM/yyyy')}`,
    value: valorRepasse,
    date: appointment.start.toDate(),
    status: 'pendente',
    category: 'Repasse de Profissional', // Categoria padrão
    costCenter: 'Serviços Prestados', // Centro de custo padrão
    professionalId: appointment.professionalId,
    patientId: appointment.patientId,
    appointmentId: appointment.id, // Vínculo forte com o agendamento!
  };

  return addTransaction(transactionData);
};


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

export const getAppointmentsForReport = async (options: { professionalId?: string, patientId?: string, startDate: Date, endDate: Date }): Promise<Appointment[]> => {
    try {
        const appointmentsRef = collection(db, 'appointments');
        let q = query(
          appointmentsRef,
          where('start', '>=', Timestamp.fromDate(startOfDay(options.startDate))),
          where('start', '<=', Timestamp.fromDate(endOfDay(options.endDate))),
          orderBy('start')
        );

        if (options.professionalId) {
            q = query(q, where('professionalId', '==', options.professionalId));
        }
        if (options.patientId) {
            q = query(q, where('patientId', '==', options.patientId));
        }

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

    // --- LÓGICA DE REPASSE ACIONADA AQUI ---
    const updatedAppointmentDoc = await getDoc(docRef);
    if (updatedAppointmentDoc.exists()) {
        const updatedAppointment = { id: updatedAppointmentDoc.id, ...updatedAppointmentDoc.data() } as Appointment;
        await handleRepasseTransaction(updatedAppointment);
    }
    // ------------------------------------

    return { success: true };
  } catch (error) {
    console.error("Erro ao atualizar agendamento:", error);
    return { success: false, error: "Falha ao atualizar agendamento." };
  }
};

export const deleteAppointment = async (id: string) => {
  try {
    // --- LÓGICA DE REPASSE ACIONADA AQUI (ANTES DE DELETAR) ---
    await deleteTransactionByAppointmentId(id);
    // --------------------------------------------------------
    
    const docRef = doc(db, 'appointments', id);
    await deleteDoc(docRef);
    return { success: true };
  } catch (error) {
    console.error("Erro ao deletar agendamento:", error);
    return { success: false, error: "Falha ao deletar agendamento." };
  }
};

// --- Funções de Renovação e Blocos ---

export const getRenewableAppointments = async (): Promise<Appointment[]> => {
  try {
    const today = startOfDay(new Date());
    const sevenDaysFromNow = endOfDay(addDays(today, 7));

    const q = query(
      collection(db, 'appointments'),
      where('isLastInBlock', '==', true),
      where('status', '==', 'agendado'),
      where('start', '>=', Timestamp.fromDate(today)),
      where('start', '<=', Timestamp.fromDate(sevenDaysFromNow))
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

export const deleteFutureAppointmentsInBlock = async (appointment: Appointment) => {
  try {
    if (!appointment.blockId) {
      return { success: false, error: "Este agendamento não faz parte de um bloco." };
    }
    const appointmentsRef = collection(db, 'appointments');
    const q = query(
      appointmentsRef,
      where('blockId', '==', appointment.blockId),
      where('start', '>=', appointment.start)
    );
    const snapshot = await getDocs(q);
    if (snapshot.empty) return { success: true };

    const batch = writeBatch(db);
    
    // Usamos Promise.all para aguardar todas as exclusões de repasse
    await Promise.all(snapshot.docs.map(docToDelete => {
      batch.delete(docToDelete.ref);
      return deleteTransactionByAppointmentId(docToDelete.id);
    }));

    await batch.commit();
    return { success: true };
  } catch (error) {
    console.error("Erro ao deletar agendamentos em lote:", error);
    return { success: false, error: "Falha ao excluir o bloco de agendamentos." };
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