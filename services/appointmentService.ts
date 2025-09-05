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
import { addWeeks, startOfDay, endOfDay, differenceInMinutes, addDays, format, getHours, getMinutes, addMonths } from 'date-fns';
import { getProfessionalById } from "./professionalService";
import { addTransaction, deleteTransactionByAppointmentId, TransactionFormData, getBankAccounts, BankAccount } from "./financialService";
import { findOrCreateCostCenter } from "./settingsService";

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

export interface QuickAppointmentData {
  start: Date;
  end: Date;
  professionalId: string;
  specialty: string;
  valorConsulta: number;
  roomId?: string;
  isRecurring: boolean;
  sessions: number;
}


// --- FUNÇÃO DE REPASSE ATUALIZADA COM TODAS AS NOVAS REGRAS ---
const handleRepasseTransaction = async (appointment: Appointment) => {
  await deleteTransactionByAppointmentId(appointment.id);

  const shouldGenerateRepasse =
    appointment.status === 'finalizado' ||
    (appointment.status === 'nao_compareceu' && appointment.statusSecundario === 'fnj_paciente');

  if (!shouldGenerateRepasse) {
    return { success: true, message: "Nenhuma condição para repasse atendida." };
  }

  const professional = await getProfessionalById(appointment.professionalId);
  if (!professional?.financeiro) {
    return { success: false, error: "Dados financeiros do profissional não encontrados." };
  }

  // Garante que o centro de custo (especialidade) exista antes de prosseguir.
  await findOrCreateCostCenter(professional.especialidade);
  
  // Busca a conta bancária definida como padrão.
  const allBankAccounts = await getBankAccounts();
  const defaultAccount = allBankAccounts.find(acc => acc.isDefault);
  
  let valorRepasse = 0;
  const { tipoPagamento, percentualRepasse, horarioFixoInicio, horarioFixoFim } = professional.financeiro;
  const valorConsulta = appointment.valorConsulta || 0;

  if (tipoPagamento === 'fixo') {
    valorRepasse = 0;
  } 
  else if (tipoPagamento === 'repasse') {
    valorRepasse = (valorConsulta * (percentualRepasse || 0)) / 100;
  }
  else if (tipoPagamento === 'ambos') {
    const appointmentTime = appointment.start.toDate();
    const appointmentHour = getHours(appointmentTime);
    const appointmentMinute = getMinutes(appointmentTime);
    const appointmentTotalMinutes = appointmentHour * 60 + appointmentMinute;

    const [startHour = 0, startMinute = 0] = horarioFixoInicio?.split(':').map(Number) || [];
    const [endHour = 0, endMinute = 0] = horarioFixoFim?.split(':').map(Number) || [];
    const fixedStartTotalMinutes = startHour * 60 + startMinute;
    const fixedEndTotalMinutes = endHour * 60 + endMinute;

    if (appointmentTotalMinutes >= fixedStartTotalMinutes && appointmentTotalMinutes < fixedEndTotalMinutes) {
      valorRepasse = 0;
    } else {
      valorRepasse = (valorConsulta * (percentualRepasse || 0)) / 100;
    }
  }

  if (valorRepasse <= 0) {
    return { success: true, message: "Valor de repasse é zero, nenhuma transação criada." };
  }

  const transactionData: TransactionFormData = {
    type: 'despesa',
    description: `Repasse ${professional.fullName} - Sessão ${appointment.patientName} ${format(appointment.start.toDate(), 'dd/MM')}`,
    value: valorRepasse,
    dataMovimento: addMonths(appointment.start.toDate(), 2),
    dataEmissao: appointment.start.toDate(),
    status: 'pendente',
    category: 'Repasse de Profissional',
    costCenter: professional.especialidade || 'Não especificado',
    bankAccountId: defaultAccount ? defaultAccount.id : undefined,
    professionalId: appointment.professionalId,
    patientId: appointment.patientId,
    appointmentId: appointment.id,
  };

  return addTransaction(transactionData);
};


// --- Funções de Busca e CRUD ---

export const getAppointmentsByDate = async (dateString: string): Promise<Appointment[]> => {
  try {
    if (!dateString) return [];
    const [year, month, day] = dateString.split('-').map(Number);
    const dayStart = new Date(year, month - 1, day, 0, 0, 0);
    const dayEnd = new Date(year, month - 1, day, 23, 59, 59);
    if (isNaN(dayStart.getTime()) || isNaN(dayEnd.getTime())) {
        console.error("Data inválida fornecida para getAppointmentsByDate:", dateString);
        return [];
    }
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
      if (!dateString) return [];
      const [year, month, day] = dateString.split('-').map(Number);
      const dayStart = new Date(year, month - 1, day, 0, 0, 0);
      const dayEnd = new Date(year, month - 1, day, 23, 59, 59);
      if (isNaN(dayStart.getTime()) || isNaN(dayEnd.getTime())) return [];

      const q = query(
        collection(db, 'appointments'),
        where('professionalId', '==', professionalId),
        where('start', '>=', Timestamp.fromDate(dayStart)),
        where('start', '<=', Timestamp.fromDate(dayEnd)),
        orderBy('start')
      );

      const snapshot = await getDocs(q);
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

        if (options.professionalId) q = query(q, where('professionalId', '==', options.professionalId));
        if (options.patientId) q = query(q, where('patientId', '==', options.patientId));

        const snapshot = await getDocs(q);
        return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Appointment));
    } catch (error) {
        console.error("Erro ao buscar agendamentos para relatório:", error);
        return [];
    }
};

export const createAppointment = async (data: AppointmentFormData) => {
  try {
    const patientDoc = await getDoc(doc(db, 'patients', data.patientId));
    const professionalDoc = await getDoc(doc(db, 'professionals', data.professionalId));
    if (!patientDoc.exists() || !professionalDoc.exists()) throw new Error("Paciente ou Profissional não encontrado.");

    const patientName = patientDoc.data().fullName;
    const professionalName = professionalDoc.data().fullName;
    const [year, month, day] = data.data.split('-').map(Number);
    const [startHour, startMinute] = data.horaInicio.split(':').map(Number);
    const [endHour, endMinute] = data.horaFim.split(':').map(Number);
    const startDate = new Date(year, month - 1, day, startHour, startMinute);
    const endDate = new Date(year, month - 1, day, endHour, endMinute);

    await addDoc(collection(db, "appointments"), {
      title: `${patientName} - ${professionalName}`,
      patientId: data.patientId, patientName,
      professionalId: data.professionalId, professionalName,
      tipo: data.tipo, sala: data.sala || null,
      convenio: data.convenio || "", valorConsulta: data.valorConsulta || 0,
      observacoes: data.observacoes || "",
      start: Timestamp.fromDate(startDate), end: Timestamp.fromDate(endDate),
      status: 'agendado' as AppointmentStatus,
      statusSecundario: data.statusSecundario === 'nenhum' ? '' : data.statusSecundario || "",
    });
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
    if (!patientDoc.exists() || !professionalDoc.exists()) throw new Error("Paciente ou profissional não encontrado.");

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
        ...restData, title, patientId, patientName, professionalId, professionalName,
        start: Timestamp.fromDate(sessionDate), end: Timestamp.fromDate(sessionEndDate),
        status: 'agendado', statusSecundario: data.statusSecundario === 'nenhum' ? '' : data.statusSecundario || "",
        blockId: blockId, isLastInBlock: (i === sessions - 1)
      });
    }

    await batch.commit();
    return { success: true };
  } catch (error) {
    console.error("Erro ao criar agendamentos em lote:", error);
    return { success: false, error: "Falha ao criar o bloco de agendamentos." };
  }
};

export const createMultipleAppointments = async (patientId: string, appointmentsData: QuickAppointmentData[]) => {
  const patientDocRef = doc(db, 'patients', patientId);
  try {
    const patientDoc = await getDoc(patientDocRef);
    if (!patientDoc.exists()) throw new Error("Paciente não encontrado.");
    const patientName = patientDoc.data().fullName;
    const patientConvenio = patientDoc.data().convenio || "";
    const batch = writeBatch(db);
    const professionalCache = new Map<string, any>();

    for (const appData of appointmentsData) {
      if (!professionalCache.has(appData.professionalId)) {
        const profDoc = await getDoc(doc(db, 'professionals', appData.professionalId));
        if (!profDoc.exists()) throw new Error(`Profissional com ID ${appData.professionalId} não encontrado.`);
        professionalCache.set(appData.professionalId, profDoc.data());
      }
      const professionalData = professionalCache.get(appData.professionalId);
      const professionalName = professionalData.fullName;
      const newAppointmentRef = doc(collection(db, "appointments"));
      const appointmentData = {
        title: `${patientName} - ${professionalName}`,
        patientId, patientName, professionalId: appData.professionalId, professionalName,
        tipo: appData.specialty, sala: appData.roomId || null,
        convenio: patientConvenio, valorConsulta: appData.valorConsulta || 0,
        start: Timestamp.fromDate(appData.start), end: Timestamp.fromDate(appData.end),
        status: 'agendado' as AppointmentStatus,
        blockId: newAppointmentRef.id, isLastInBlock: !appData.isRecurring,
      };
      
      batch.set(newAppointmentRef, appointmentData);

      if (appData.isRecurring && appData.sessions > 1) {
        const durationInMinutes = differenceInMinutes(appData.end, appData.start);
        for (let i = 1; i < appData.sessions; i++) {
          const futureSessionRef = doc(collection(db, "appointments"));
          const sessionStartDate = addWeeks(appData.start, i);
          const sessionEndDate = new Date(sessionStartDate.getTime() + durationInMinutes * 60000);
          batch.set(futureSessionRef, {
            ...appointmentData,
            start: Timestamp.fromDate(sessionStartDate), end: Timestamp.fromDate(sessionEndDate),
            blockId: newAppointmentRef.id, isLastInBlock: (i === appData.sessions - 1),
          });
        }
      }
    }

    await batch.commit();
    return { success: true };
  } catch (error) {
    console.error("Erro ao criar múltiplos agendamentos:", error);
    const errorMessage = error instanceof Error ? error.message : "Falha ao criar agendamentos.";
    return { success: false, error: errorMessage };
  }
};

export const updateAppointment = async (id: string, data: Partial<AppointmentFormData & { status: AppointmentStatus }>) => {
  try {
    const docRef = doc(db, 'appointments', id);
    const dataToUpdate: { [key: string]: any } = { ...data };
    if (dataToUpdate.statusSecundario === 'nenhum') dataToUpdate.statusSecundario = '';

    if (data.data && data.horaInicio && data.horaFim) {
      const [year, month, day] = data.data.split('-').map(Number);
      const [startHour, startMinute] = data.horaInicio.split(':').map(Number);
      const [endHour, endMinute] = data.horaFim.split(':').map(Number);
      const startDate = new Date(year, month - 1, day, startHour, startMinute);
      const endDate = new Date(year, month - 1, day, endHour, endMinute);
      dataToUpdate.start = Timestamp.fromDate(startDate);
      dataToUpdate.end = Timestamp.fromDate(endDate);
      delete dataToUpdate.data; delete dataToUpdate.horaInicio; delete dataToUpdate.horaFim;
    }
    await updateDoc(docRef, dataToUpdate);

    const updatedAppointmentDoc = await getDoc(docRef);
    if (updatedAppointmentDoc.exists()) {
        const updatedAppointment = { id: updatedAppointmentDoc.id, ...updatedAppointmentDoc.data() } as Appointment;
        await handleRepasseTransaction(updatedAppointment);
    }
    return { success: true };
  } catch (error) {
    console.error("Erro ao atualizar agendamento:", error);
    return { success: false, error: "Falha ao atualizar agendamento." };
  }
};

export const deleteAppointment = async (id: string) => {
  try {
    await deleteTransactionByAppointmentId(id);
    await deleteDoc(doc(db, 'appointments', id));
    return { success: true };
  } catch (error) {
    console.error("Erro ao deletar agendamento:", error);
    return { success: false, error: "Falha ao deletar agendamento." };
  }
};

export const getRenewableAppointments = async (): Promise<Appointment[]> => {
  try {
    const today = startOfDay(new Date());
    const sevenDaysFromNow = endOfDay(addDays(today, 7));
    const q = query(
      collection(db, 'appointments'),
      where('isLastInBlock', '==', true), where('status', '==', 'agendado'),
      where('start', '>=', Timestamp.fromDate(today)),
      where('start', '<=', Timestamp.fromDate(sevenDaysFromNow))
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Appointment));
  } catch (error) {
    console.error("Erro ao buscar agendamentos para renovação:", error);
    return [];
  }
};

export const renewAppointmentBlock = async (lastAppointment: Appointment, sessionsToRenew: number) => {
  try {
    if (!sessionsToRenew || sessionsToRenew <= 0) return { success: false, error: "O número de sessões para renovação deve ser maior que zero." };
    const durationInMinutes = differenceInMinutes(lastAppointment.end.toDate(), lastAppointment.start.toDate());
    const batch = writeBatch(db);
    const newBlockId = doc(collection(db, 'idGenerator')).id;
    const firstNewDate = addWeeks(lastAppointment.start.toDate(), 1);

    for (let i = 0; i < sessionsToRenew; i++) {
      const sessionDate = addWeeks(firstNewDate, i);
      const sessionEndDate = new Date(sessionDate.getTime() + durationInMinutes * 60000);
      const newAppointmentRef = doc(collection(db, "appointments"));
      batch.set(newAppointmentRef, {
        title: lastAppointment.title, patientId: lastAppointment.patientId, patientName: lastAppointment.patientName,
        professionalId: lastAppointment.professionalId, professionalName: lastAppointment.professionalName,
        tipo: lastAppointment.tipo, sala: lastAppointment.sala, convenio: lastAppointment.convenio,
        observacoes: lastAppointment.observacoes, valorConsulta: lastAppointment.valorConsulta,
        start: Timestamp.fromDate(sessionDate), end: Timestamp.fromDate(sessionEndDate),
        status: 'agendado', statusSecundario: lastAppointment.statusSecundario,
        blockId: newBlockId, isLastInBlock: (i === sessionsToRenew - 1)
      });
    }

    batch.update(doc(db, 'appointments', lastAppointment.id), { isLastInBlock: false });
    await batch.commit();
    return { success: true };
  } catch (error) {
    console.error("Erro ao renovar bloco de agendamentos:", error);
    return { success: false, error: "Falha ao renovar o bloco." };
  }
};

export const dismissRenewal = async (appointmentId: string) => {
  try {
    await updateDoc(doc(db, 'appointments', appointmentId), { isLastInBlock: false });
    return { success: true };
  } catch (error) {
    console.error("Erro ao dispensar renovação:", error);
    return { success: false, error: "Falha ao dispensar o aviso de renovação." };
  }
};

export const deleteFutureAppointmentsInBlock = async (appointment: Appointment) => {
  try {
    if (!appointment.blockId) return { success: false, error: "Este agendamento não faz parte de um bloco." };
    const q = query(
      collection(db, 'appointments'),
      where('blockId', '==', appointment.blockId),
      where('start', '>=', appointment.start)
    );
    const snapshot = await getDocs(q);
    if (snapshot.empty) return { success: true };
    const batch = writeBatch(db);
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

export const getOccupiedRoomIdsByTime = async (startTime: Date, endTime: Date): Promise<string[]> => {
    try {
      const q = query(
        collection(db, 'appointments'),
        where('status', '==', 'agendado'),
        where('start', '<', Timestamp.fromDate(endTime)),
        where('end', '>', Timestamp.fromDate(startTime))
      );
      const snapshot = await getDocs(q);
      const occupiedRoomIds = snapshot.docs.map(doc => doc.data().sala).filter(Boolean);
      return [...new Set(occupiedRoomIds)];
    } catch (error) {
      console.error("Erro ao verificar salas ocupadas:", error);
      return [];
    }
};