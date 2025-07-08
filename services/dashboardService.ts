import { db } from '@/lib/firebaseConfig';
import { collection, query, where, getDocs, Timestamp, orderBy, limit, doc, getDoc } from 'firebase/firestore';

// Interface para definir a estrutura do agendamento que a função retorna
export interface UpcomingAppointment {
  id: string;
  time: string;
  patient: string;
  professional: string;
  type: string;
}

export const getUpcomingAppointments = async (): Promise<UpcomingAppointment[]> => {
  try {
    // Pega a data de hoje no início e no fim do dia
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);

    // Converte para Timestamps do Firestore
    const startTimestamp = Timestamp.fromDate(todayStart);
    const endTimestamp = Timestamp.fromDate(todayEnd);

    // Cria a query para buscar agendamentos de hoje, ordenados por data de início
    const appointmentsRef = collection(db, 'appointments');
    const q = query(
      appointmentsRef,
      where('start', '>=', startTimestamp),
      where('start', '<=', endTimestamp),
      orderBy('start'),
      limit(5) // Limita a 5 para não sobrecarregar o dashboard
    );

    const querySnapshot = await getDocs(q);
    
    // Mapeia os resultados e busca os dados relacionados (paciente/profissional)
    const appointments = await Promise.all(querySnapshot.docs.map(async (appointmentDoc) => {
      const data = appointmentDoc.data();
      
      let patientName = 'Paciente não encontrado';
      if (data.patientId) {
        const patientDoc = await getDoc(doc(db, 'patients', data.patientId));
        if (patientDoc.exists()) {
          patientName = patientDoc.data().fullName;
        }
      }

      let professionalName = 'Profissional não encontrado';
      if (data.professionalId) {
        const professionalDoc = await getDoc(doc(db, 'professionals', data.professionalId));
        if (professionalDoc.exists()) {
          professionalName = professionalDoc.data().fullName;
        }
      }

      return {
        id: appointmentDoc.id,
        time: data.start.toDate().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
        patient: patientName,
        professional: professionalName,
        type: data.type || 'Consulta',
      };
    }));

    return appointments;
  } catch (error) {
    console.error("Erro ao buscar próximos agendamentos:", error);
    return [];
  }
};