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
import {
    addWeeks, startOfDay, endOfDay, differenceInMinutes, addDays,
    format, getHours, getMinutes, addMonths, startOfWeek, endOfWeek,
    eachDayOfInterval, setHours, setMinutes, addMinutes, differenceInCalendarDays,
} from 'date-fns';
import { ptBR } from "date-fns/locale";
import { getProfessionalById, getProfessionals, Professional } from "./professionalService";
import { addTransaction, deleteTransactionByAppointmentId, TransactionFormData, getBankAccounts } from "./financialService";
import { findOrCreateCostCenter, findOrCreateAccountPlan } from "./settingsService";
import { Room, getRooms } from "./roomService";

// --- Interfaces ---
export type AppointmentStatus = 'agendado' | 'finalizado' | 'nao_compareceu' | 'cancelado' | 'em_atendimento';
export type RecurrenceFrequency = 'daily' | 'weekly' | 'bi-weekly';

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

export interface AppointmentBlockFormData extends AppointmentFormData {
  sessions: number;
  frequency: RecurrenceFrequency;
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
  frequency: RecurrenceFrequency;
}

// --- ✅ FUNÇÃO DE REPASSE ATUALIZADA ✅ ---
const handleRepasseTransaction = async (appointment: Appointment) => {
  // 1. Limpa qualquer repasse antigo associado a este agendamento
  await deleteTransactionByAppointmentId(appointment.id);

  // 2. Verifica se as condições para gerar um novo repasse são atendidas
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

  // 3. Determina o percentual de repasse
  const { tipoPagamento, percentualRepasse, horarioFixoInicio, horarioFixoFim, regrasEspeciais } = professional.financeiro;
  let percentualAplicado = percentualRepasse || 0; // Começa com o percentual padrão

  // Verifica se existe uma regra especial que se aplique a esta terapia
  if (regrasEspeciais && regrasEspeciais.length > 0 && appointment.tipo) {
    const regraAplicavel = regrasEspeciais.find(regra =>
      appointment.tipo.startsWith(regra.especialidade)
    );
    // Se encontrou uma regra, usa o percentual dela
    if (regraAplicavel) {
      percentualAplicado = regraAplicavel.percentual;
    }
  }

  // 4. Calcula o valor final do repasse
  let valorRepasse = 0;
  const valorConsulta = appointment.valorConsulta || 0;

  if (tipoPagamento === 'repasse') {
    valorRepasse = (valorConsulta * percentualAplicado) / 100;
  } else if (tipoPagamento === 'ambos') {
    const appointmentTime = appointment.start.toDate();
    const appointmentHour = getHours(appointmentTime);
    const appointmentMinute = getMinutes(appointmentTime);
    const appointmentTotalMinutes = appointmentHour * 60 + appointmentMinute;

    const [startHour = 0, startMinute = 0] = horarioFixoInicio?.split(':').map(Number) || [];
    const [endHour = 0, endMinute = 0] = horarioFixoFim?.split(':').map(Number) || [];
    const fixedStartTotalMinutes = startHour * 60 + startMinute;
    const fixedEndTotalMinutes = endHour * 60 + endMinute;

    if (appointmentTotalMinutes < fixedStartTotalMinutes || appointmentTotalMinutes >= fixedEndTotalMinutes) {
      // Fora do horário fixo, aplica o repasse
      valorRepasse = (valorConsulta * percentualAplicado) / 100;
    }
  }

  // 5. Cria a transação de despesa se o valor for positivo
  if (valorRepasse <= 0) {
    return { success: true, message: "Valor de repasse é zero, nenhuma transação criada." };
  }
  
  await findOrCreateCostCenter(appointment.tipo);
  await findOrCreateAccountPlan('Repasse de Profissional', 'despesa');
  const allBankAccounts = await getBankAccounts();
  const defaultAccount = allBankAccounts.find(acc => acc.isDefault);

  // --- LÓGICA DE DATAS CORRIGIDA (Incluindo 'Pacote') ---
  const convenio = appointment.convenio ? appointment.convenio.toLowerCase().trim() : "";
  
  // Regra de 1 Mês: Particular OU Pacote OU Sem convênio
  const isRegraUmMes = convenio === "" || 
                       convenio === "particular" || 
                       convenio === "pacote";

  // Se for Particular/Pacote: +1 mês. Outros convênios: +2 meses.
  const mesesParaAdicionar = isRegraUmMes ? 1 : 2; 

  const dataMovimento = addMonths(appointment.start.toDate(), mesesParaAdicionar);
  // -----------------------------------------------------

  const transactionData: TransactionFormData = {
    // ... restante dos dados igual ...
    type: 'despesa',
    description: `Repasse ${professional.fullName} - Sessão ${appointment.patientName} ${format(appointment.start.toDate(), 'dd/MM')}`,
    value: valorRepasse,
    dataMovimento: dataMovimento,
    dataEmissao: appointment.start.toDate(),
    status: 'pendente',
    category: 'Repasse de Profissional',
    costCenter: appointment.tipo || 'Não especificado',
    bankAccountId: defaultAccount ? defaultAccount.id : undefined,
    professionalId: appointment.professionalId,
    patientId: appointment.patientId,
    patientName: appointment.patientName,
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
    const { patientId, professionalId, data: startDateStr, horaInicio, horaFim, sessions, frequency, ...restData } = data;
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
      let sessionDate;
      switch (frequency) {
        case 'daily':
          sessionDate = addDays(firstAppointmentDate, i);
          break;
        case 'bi-weekly':
          sessionDate = addWeeks(firstAppointmentDate, i * 2);
          break;
        case 'weekly':
        default:
          sessionDate = addWeeks(firstAppointmentDate, i);
          break;
      }
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
          let sessionStartDate;
          switch (appData.frequency) {
            case 'daily':
              sessionStartDate = addDays(appData.start, i);
              break;
            case 'bi-weekly':
              sessionStartDate = addWeeks(appData.start, i * 2);
              break;
            case 'weekly':
            default:
              sessionStartDate = addWeeks(appData.start, i);
              break;
          }
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
    
    // Converte datas se fornecidas
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

    // --- CORREÇÃO: Busca nomes atualizados se IDs mudaram ---
    if (data.professionalId) {
      const pDoc = await getDoc(doc(db, 'professionals', data.professionalId));
      if (pDoc.exists()) {
        dataToUpdate.professionalName = pDoc.data().fullName;
      }
    }
    if (data.patientId) {
      const pDoc = await getDoc(doc(db, 'patients', data.patientId));
      if (pDoc.exists()) {
        dataToUpdate.patientName = pDoc.data().fullName;
      }
    }
    // Atualiza o Título se algum nome mudou
    if (dataToUpdate.professionalName || dataToUpdate.patientName) {
        // Se um deles não foi atualizado agora, precisamos buscar o atual do documento para compor o título
        // Mas para simplificar, se não temos o dado na mão, podemos deixar o título desatualizado ou fazer um getDoc extra.
        // Vamos fazer o getDoc do appointment atual para garantir integridade do título.
        const currentDoc = await getDoc(docRef);
        if (currentDoc.exists()) {
            const currentData = currentDoc.data();
            const pName = dataToUpdate.patientName || currentData.patientName;
            const profName = dataToUpdate.professionalName || currentData.professionalName;
            dataToUpdate.title = `${pName} - ${profName}`;
        }
    }
    // --------------------------------------------------------

    Object.keys(dataToUpdate).forEach(key => {
      if (dataToUpdate[key] === undefined) {
        delete dataToUpdate[key];
      }
    });
    if (dataToUpdate.statusSecundario === 'nenhum') {
        dataToUpdate.statusSecundario = '';
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
    const errorMessage = error instanceof Error ? error.message : "Falha ao atualizar agendamento.";
    return { success: false, error: errorMessage };
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
// --- 🔥 ATUALIZAÇÃO: Suporte a Frequência (Semanal/Quinzenal) ---
export const renewAppointmentBlock = async (
  lastAppointment: Appointment, 
  sessionsToRenew: number,
  frequency: 'weekly' | 'bi-weekly' = 'weekly' // Novo parâmetro padrão 'weekly'
) => {
  try {
    if (!sessionsToRenew || sessionsToRenew <= 0) return { success: false, error: "O número de sessões deve ser maior que zero." };
    
    const batch = writeBatch(db);
    const newBlockId = doc(collection(db, 'idGenerator')).id;
    
    // Define o intervalo em semanas
    const intervalWeeks = frequency === 'bi-weekly' ? 2 : 1;

    // A primeira data da nova série começa após 1 intervalo da data do último agendamento
    const lastDate = lastAppointment.start.toDate();
    const firstNewDate = addWeeks(lastDate, intervalWeeks);
    
    const durationInMinutes = differenceInMinutes(lastAppointment.end.toDate(), lastDate);

    for (let i = 0; i < sessionsToRenew; i++) {
      // Calcula a data: DataBase + (Índice * Intervalo)
      // Ex Semanal: DataBase + 0, DataBase + 1 semana, DataBase + 2 semanas...
      // Ex Quinzenal: DataBase + 0, DataBase + 2 semanas, DataBase + 4 semanas...
      const sessionDate = addWeeks(firstNewDate, i * intervalWeeks);
      const sessionEndDate = new Date(sessionDate.getTime() + durationInMinutes * 60000);
      
      const newAppointmentRef = doc(collection(db, "appointments"));
      
      batch.set(newAppointmentRef, {
        title: lastAppointment.title, 
        patientId: lastAppointment.patientId, 
        patientName: lastAppointment.patientName,
        professionalId: lastAppointment.professionalId, 
        professionalName: lastAppointment.professionalName,
        tipo: lastAppointment.tipo, 
        sala: lastAppointment.sala ?? null,
        convenio: lastAppointment.convenio ?? "",
        observacoes: lastAppointment.observacoes ?? "", 
        valorConsulta: lastAppointment.valorConsulta ?? 0,
        statusSecundario: "", // Reseta status secundário
        start: Timestamp.fromDate(sessionDate), 
        end: Timestamp.fromDate(sessionEndDate),
        status: 'agendado',
        blockId: newBlockId, 
        isLastInBlock: (i === sessionsToRenew - 1)
      });
    }

    // Remove a flag de "último" do agendamento antigo
    batch.update(doc(db, 'appointments', lastAppointment.id), { isLastInBlock: false });
    
    await batch.commit();
    return { success: true };
  } catch (error) {
    console.error("Erro ao renovar bloco:", error);
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
export interface RenewableBlock {
  patientId: string;
  patientName: string;
  appointments: Appointment[];
}
export const getRenewableAppointmentsByPatient = async (): Promise<RenewableBlock[]> => {
  try {
    const today = startOfDay(new Date());
    const sevenDaysFromNow = endOfDay(addDays(today, 7));
    const q = query(
      collection(db, 'appointments'),
      where('isLastInBlock', '==', true),
      where('status', '==', 'agendado'),
      where('start', '>=', Timestamp.fromDate(today)),
      where('start', '<=', Timestamp.fromDate(sevenDaysFromNow)),
      orderBy('start')
    );
    const snapshot = await getDocs(q);
    const appointments = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Appointment));
    const groupedByPatient = appointments.reduce((acc, app) => {
      if (!acc[app.patientId]) {
        acc[app.patientId] = {
          patientId: app.patientId,
          patientName: app.patientName,
          appointments: [],
        };
      }
      acc[app.patientId].appointments.push(app);
      return acc;
    }, {} as Record<string, RenewableBlock>);
    return Object.values(groupedByPatient);
  } catch (error) {
    console.error("Erro ao buscar e agrupar agendamentos para renovação:", error);
    return [];
  }
};
export interface Slot {
  dia: Date;
  horario: string;
  professional: Professional;
  sala: Room;
}
export interface SlotFinderOptions {
  semana: Date;
  terapia: string;
  duracaoMinutos?: number;
  turno?: 'manha' | 'tarde' | 'noite';
  profissionaisPreferidosIds?: string[];
}
export const findAvailableSlots = async (options: SlotFinderOptions): Promise<Slot[]> => {
  const { semana, terapia, duracaoMinutos = 50, turno, profissionaisPreferidosIds = [] } = options;
  const inicioSemana = startOfWeek(semana, { weekStartsOn: 1 });
  const fimSemana = endOfWeek(semana, { weekStartsOn: 1 });
  const [profissionais, salas, agendamentosDaSemana] = await Promise.all([
    getProfessionals(),
    getRooms(),
    getAppointmentsForReport({ startDate: inicioSemana, endDate: fimSemana })
  ]);
  const profissionaisQualificados = profissionais.filter(
    p => p.especialidade.toLowerCase() === terapia.toLowerCase() && p.status === 'ativo'
  );
  const salasAtivas = salas.filter(s => s.status === 'ativa');
  const horariosBase = {
    manha: ['07:20', '08:10', '09:00', '09:50', '10:40', '11:30'],
    tarde: ['12:20', '13:20', '14:10', '15:00', '15:50'],
    noite: ['16:40', '17:30']
  };
  const horariosPadrao = turno ? horariosBase[turno] : [...horariosBase.manha, ...horariosBase.tarde, ...horariosBase.noite];
  const diasDaSemana = eachDayOfInterval({ start: inicioSemana, end: fimSemana });
  const slotsDisponiveis: Slot[] = [];
  const profissionaisOrdenados = [...profissionaisQualificados].sort((a, b) => {
      const aIsPreferido = profissionaisPreferidosIds.includes(a.id);
      const bIsPreferido = profissionaisPreferidosIds.includes(b.id);
      if (aIsPreferido && !bIsPreferido) return -1;
      if (!aIsPreferido && bIsPreferido) return 1;
      return 0;
  });
  for (const dia of diasDaSemana) {
    const diaString = format(dia, 'EEEE', { locale: ptBR }).toLowerCase();
    for (const profissional of profissionaisOrdenados) {
      const diaSemanaFormatado = diaString.replace('-feira', '');
      if (!profissional.diasAtendimento.includes(diaSemanaFormatado)) {
        continue;
      }
      for (const horario of horariosPadrao) {
        const [hora, minuto] = horario.split(':').map(Number);
        const inicioSlot = setMinutes(setHours(dia, hora), minuto);
        const fimSlot = addMinutes(inicioSlot, duracaoMinutos);
        const [expInicioH, expInicioM] = profissional.horarioInicio.split(':').map(Number);
        const [expFimH, expFimM] = profissional.horarioFim.split(':').map(Number);
        if (hora < expInicioH || (hora === expInicioH && minuto < expInicioM) || hora >= expFimH) {
            continue;
        }
        const profissionalOcupado = agendamentosDaSemana.some(ag =>
            ag.professionalId === profissional.id &&
            inicioSlot < ag.end.toDate() && fimSlot > ag.start.toDate()
        );
        if (profissionalOcupado) continue;
        const salasOcupadas = agendamentosDaSemana
            .filter(ag => inicioSlot < ag.end.toDate() && fimSlot > ag.start.toDate())
            .map(ag => ag.sala);
        const salaDisponivel = salasAtivas.find(s => !salasOcupadas.includes(s.id));
        if (salaDisponivel) {
          slotsDisponiveis.push({
            dia: inicioSlot,
            horario: horario,
            professional: profissional,
            sala: salaDisponivel
          });
          break;
        }
      }
    }
  }
  return slotsDisponiveis;
};

// --- NOVA FUNÇÃO ESTRATÉGICA (COM A CORREÇÃO DO ERRO) ---

export interface SchedulePattern {
  terapia: string;
  professional: Professional;
  diaSemana: string;
  horario: string;
  consistencia: number;
  justificativa: string;
}

export const findRecurringSchedulePatterns = async (
  terapiasNecessarias: { terapia: string, frequencia: number }[],
  preferences: { turno?: 'manha' | 'tarde' | 'noite', profissionaisIds?: string[] }
): Promise<SchedulePattern[]> => {

  const { turno, profissionaisIds = [] } = preferences;

  const inicioPeriodo = startOfDay(new Date());
  const fimPeriodo = endOfDay(addMonths(new Date(), 3));

  const [todosProfissionais, agendamentosFuturos] = await Promise.all([
    getProfessionals(),
    getAppointmentsForReport({ startDate: inicioPeriodo, endDate: fimPeriodo })
  ]);

  const patterns: SchedulePattern[] = [];

  const horariosBase = {
    manha: ['07:20', '08:10', '09:00', '09:50', '10:40', '11:30'],
    tarde: ['12:20', '13:20', '14:10', '15:00', '15:50', '16:40', '17:30'],
    noite: ['16:40', '17:30']
  };
  const horariosPadrao = turno ? horariosBase[turno] : [...horariosBase.manha, ...horariosBase.tarde, ...horariosBase.noite];

  const diasDaSemana = ['segunda', 'terca', 'quarta', 'quinta', 'sexta'];

  for (const necessidade of terapiasNecessarias) {
    let profissionaisQualificados = todosProfissionais.filter(
      p => p.especialidade.toLowerCase() === necessidade.terapia.toLowerCase() && p.status === 'ativo'
    );

    if (profissionaisIds.length > 0) {
        const preferidosQualificados = profissionaisQualificados.filter(p => profissionaisIds.includes(p.id));
        if (preferidosQualificados.length > 0) {
            profissionaisQualificados = preferidosQualificados;
        }
    }

    for (const prof of profissionaisQualificados) {
      for (const dia of diasDaSemana) {
        if (!prof.diasAtendimento.includes(dia)) continue;

        for (const horario of horariosPadrao) {
          const conflitos = agendamentosFuturos.filter(ag =>
            ag.professionalId === prof.id &&
            format(ag.start.toDate(), 'EEEE', { locale: ptBR }).toLowerCase().replace('-feira', '') === dia &&
            format(ag.start.toDate(), 'HH:mm') === horario
          ).length;

          const totalSemanasAnalise = 12;
          const consistencia = 1 - (conflitos / totalSemanasAnalise);

          if (consistencia > 0.5) {
            patterns.push({
              terapia: necessidade.terapia,
              professional: prof,
              diaSemana: dia.charAt(0).toUpperCase() + dia.slice(1) + "-feira",
              horario: horario,
              consistencia: consistencia,
              justificativa: `Este horário tem uma alta taxa de disponibilidade (${(consistencia * 100).toFixed(0)}%) para ${prof.fullName} nas próximas semanas.`
            });
          }
        }
      }
    }
  }
  return patterns;
};

// --- NOVA INTERFACE E FUNÇÃO PARA SUGESTÃO DE TROCAS ---

export interface SwapCandidate {
  agendamentoParaMover: {
    id: string;
    paciente: string;
    terapia: string;
    diaAtual: string;
    horarioAtual: string;
  };
  novoSlotSugerido: {
    dia: string;
    horario: string;
  };
  profissional: Professional;
}

/**
 * Encontra agendamentos existentes que podem ser movidos para libertar espaço
 * para uma nova terapia.
 */
export const findPotentialSwapCandidates = async (
  terapiaNecessaria: string,
  profissionaisQualificados: Professional[]
): Promise<SwapCandidate[]> => {
  const inicioPeriodo = startOfDay(new Date());
  const fimPeriodo = endOfDay(addMonths(new Date(), 3));

  const agendamentosFuturos = await getAppointmentsForReport({ startDate: inicioPeriodo, endDate: fimPeriodo });
  const candidatos: SwapCandidate[] = [];

  // Encontra todos os horários livres de cada profissional qualificado
  for (const prof of profissionaisQualificados) {
    const seusAgendamentos = agendamentosFuturos.filter(a => a.professionalId === prof.id);
    const seusHorariosLivres: { dia: string, horario: string }[] = [];

    // Lógica simplificada para encontrar horários livres (pode ser aprimorada)
    const diasDaSemana = ['segunda', 'terca', 'quarta', 'quinta', 'sexta'];
    const horariosPadrao = ['09:00', '09:50', '10:40', '11:30', '13:20', '14:10', '15:00', '15:50', '16:40'];

    for (const dia of diasDaSemana) {
      if (!prof.diasAtendimento.includes(dia)) continue;
      for (const horario of horariosPadrao) {
        const ocupado = seusAgendamentos.some(a =>
            format(a.start.toDate(), 'EEEE', { locale: ptBR }).toLowerCase().replace('-feira', '') === dia &&
            format(a.start.toDate(), 'HH:mm') === horario
        );
        if (!ocupado) {
          seusHorariosLivres.push({ dia, horario });
        }
      }
    }

    // Para cada agendamento existente, verifica se ele pode ser movido para um horário livre
    for (const agendamento of seusAgendamentos) {
      if (seusHorariosLivres.length > 0) {
        // Encontramos um candidato!
        const slotDestino = seusHorariosLivres.shift(); // Pega o primeiro horário livre
        candidatos.push({
          agendamentoParaMover: {
            id: agendamento.id,
            paciente: agendamento.patientName,
            terapia: agendamento.tipo,
            diaAtual: format(agendamento.start.toDate(), 'EEEE', { locale: ptBR }),
            horarioAtual: format(agendamento.start.toDate(), 'HH:mm'),
          },
          novoSlotSugerido: {
            dia: slotDestino!.dia.charAt(0).toUpperCase() + slotDestino!.dia.slice(1) + "-feira",
            horario: slotDestino!.horario
          },
          profissional: prof,
        });
      }
    }
  }
  return candidatos;
};

// --- 🔥 VERSÃO FINAL BLINDADA: CLONAR, DETECTAR E MIGRAR ---
export const updateAppointmentBlock = async (
  currentAppointment: Appointment,
  data: Partial<AppointmentFormData & { status: AppointmentStatus }>
) => {
  if (!currentAppointment.blockId) {
    return { success: false, error: "Agendamento sem série (blockId)." };
  }

  try {
    const batch = writeBatch(db);
    
    // 1. Busca TODOS os agendamentos da série antiga
    const q = query(
      collection(db, "appointments"),
      where("blockId", "==", currentAppointment.blockId)
    );
    const snapshot = await getDocs(q);

    if (snapshot.empty) return { success: true };

    const getMillis = (d: any) => d?.toMillis ? d.toMillis() : new Date(d).getTime();
    const currentStartMs = getMillis(currentAppointment.start);

    // 2. Separa e Ordena (Do atual para o futuro)
    const futureOldAppointments = snapshot.docs
      .map(doc => ({ id: doc.id, ref: doc.ref, ...doc.data() } as Appointment & { ref: any }))
      .filter(app => getMillis(app.start) >= (currentStartMs - 60000))
      .sort((a, b) => getMillis(a.start) - getMillis(b.start));

    if (futureOldAppointments.length === 0) {
        return await updateAppointment(currentAppointment.id, data);
    }

    // 3. 🕵️ DETECTIVE DE FREQUÊNCIA
    let intervalDays = 7; 
    if (futureOldAppointments.length > 1) {
        const first = futureOldAppointments[0];
        const second = futureOldAppointments[1];
        const diff = differenceInCalendarDays(second.start.toDate(), first.start.toDate());
        intervalDays = diff <= 8 ? 7 : 14;
    }

    // 4. PREPARAÇÃO DA NOVA SÉRIE
    const newBlockId = doc(collection(db, "idGenerator")).id;
    
    const { data: dateStr, horaInicio, horaFim, ...restData } = data;
    if (!dateStr || !horaInicio || !horaFim) throw new Error("Dados incompletos.");

    const [year, month, day] = dateStr.split('-').map(Number);
    const [startHour, startMinute] = horaInicio.split(':').map(Number);
    const [endHour, endMinute] = horaFim.split(':').map(Number);

    const newBaseStart = new Date(year, month - 1, day, startHour, startMinute);
    const durationMinutes = differenceInMinutes(
      new Date(year, month - 1, day, endHour, endMinute),
      newBaseStart
    );

    // Atualiza nomes se necessário
    let newProfName = currentAppointment.professionalName;
    let newPatName = currentAppointment.patientName;
    if (restData.professionalId) {
        const pDoc = await getDoc(doc(db, 'professionals', restData.professionalId));
        if (pDoc.exists()) newProfName = pDoc.data().fullName;
    }
    if (restData.patientId) {
        const pDoc = await getDoc(doc(db, 'patients', restData.patientId));
        if (pDoc.exists()) newPatName = pDoc.data().fullName;
    }

    // 5. 🚀 CRIAÇÃO DA NOVA SÉRIE
    for (let i = 0; i < futureOldAppointments.length; i++) {
        const newStart = addDays(newBaseStart, i * intervalDays);
        const newEnd = addMinutes(newStart, durationMinutes);
        
        const newDocRef = doc(collection(db, "appointments"));

        // 🛡️ SANITIZAÇÃO: Garante que nada seja undefined
        // Prioridade: 1. Novo Dado (restData) -> 2. Dado Antigo (currentAppointment) -> 3. Valor Padrão
        const appointmentData = {
            patientId: restData.patientId || currentAppointment.patientId,
            patientName: newPatName,
            professionalId: restData.professionalId || currentAppointment.professionalId,
            professionalName: newProfName,
            title: `${newPatName} - ${newProfName}`,
            start: Timestamp.fromDate(newStart),
            end: Timestamp.fromDate(newEnd),
            
            // Campos Opcionais com Fallback Seguro
            tipo: restData.tipo ?? currentAppointment.tipo ?? "",
            sala: restData.sala ?? currentAppointment.sala ?? null,
            convenio: restData.convenio ?? currentAppointment.convenio ?? "",
            valorConsulta: restData.valorConsulta ?? currentAppointment.valorConsulta ?? 0,
            observacoes: restData.observacoes ?? currentAppointment.observacoes ?? "", // 🔥 AQUI ESTAVA O ERRO
            
            // Controle da Série
            blockId: newBlockId,
            status: i === 0 ? (data.status || 'agendado') : 'agendado',
            statusSecundario: i === 0 ? (data.statusSecundario || '') : '',
            isLastInBlock: (i === futureOldAppointments.length - 1)
        };

        // Remove chaves que ainda possam ser undefined (segurança extra)
        Object.keys(appointmentData).forEach(key => (appointmentData as any)[key] === undefined && delete (appointmentData as any)[key]);

        batch.set(newDocRef, appointmentData);
    }

    // 6. 🗑️ DELEÇÃO DA SÉRIE VELHA
    futureOldAppointments.forEach(oldApp => {
        batch.delete(oldApp.ref);
    });

    await batch.commit();

    return { success: true };

  } catch (error) {
    console.error("Erro na migração de bloco:", error);
    // Retorna o erro detalhado para facilitar o debug se acontecer de novo
    const errorMessage = error instanceof Error ? error.message : "Falha desconhecida";
    return { success: false, error: `Erro ao recriar série: ${errorMessage}` };
  }
};

/**
 * NOVO E OTIMIZADO: Busca agendamentos para múltiplas especialidades de uma vez.
 * @param specialtyNames - Um array com os nomes completos das especialidades (terapias).
 * @param startDate - A data de início para a busca.
 * @param endDate - A data de fim para a busca.
 * @returns Uma lista de agendamentos.
 */
export const getAppointmentsBySpecialties = async (
  specialtyNames: string[],
  startDate: Date,
  endDate: Date
): Promise<Appointment[]> => {
  // Se não houver especialidades, retorna um array vazio para não fazer uma consulta desnecessária.
  if (specialtyNames.length === 0) {
    return [];
  }

  const appointmentsRef = collection(db, "appointments");
  
  // A consulta agora é feita diretamente no campo 'tipo', que armazena o nome da terapia.
  const q = query(
    appointmentsRef,
    where("tipo", "in", specialtyNames), 
    where("start", ">=", startDate),
    where("start", "<=", endDate)
  );

  const querySnapshot = await getDocs(q);
  const appointments: Appointment[] = [];
  querySnapshot.forEach((doc) => {
    appointments.push({ id: doc.id, ...doc.data() } as Appointment);
  });

  return appointments;
};