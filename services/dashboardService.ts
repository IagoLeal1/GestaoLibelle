import { db } from "@/lib/firebaseConfig";
import { collection, query, where, getDocs, Timestamp, orderBy, limit, getCountFromServer } from 'firebase/firestore';
import { startOfDay, endOfDay } from 'date-fns';

// --- INTERFACES ---

// Para os cards de estatísticas no topo
export interface AdminDashboardStats {
  activePatients: number;
  activeProfessionals: number;
  appointmentsToday: number;
  pendingUsers: number;
}

// Para a lista de "Próximos Agendamentos"
export interface UpcomingAppointment {
  id: string;
  time: string;
  patientName: string;
  professionalName: string;
  sala: string;
  status: string;
}

// --- FUNÇÕES DO SERVIÇO ---

/**
 * Busca os dados agregados para as estatísticas do dashboard do administrador.
 * Usa getCountFromServer para máxima eficiência (baixo custo de leitura).
 */
export const getAdminDashboardStats = async (): Promise<AdminDashboardStats> => {
  try {
    const patientsQuery = query(collection(db, 'patients'), where('status', '==', 'ativo'));
    const professionalsQuery = query(collection(db, 'professionals'), where('status', '==', 'ativo'));
    const pendingUsersQuery = query(collection(db, 'users'), where('profile.status', '==', 'pendente'));
    
    const todayStart = startOfDay(new Date());
    const todayEnd = endOfDay(new Date());
    const appointmentsQuery = query(
      collection(db, 'appointments'),
      where('start', '>=', Timestamp.fromDate(todayStart)),
      where('start', '<=', Timestamp.fromDate(todayEnd)),
      where('status', '==', 'agendado')
    );

    const [patientsSnapshot, professionalsSnapshot, pendingUsersSnapshot, appointmentsSnapshot] = await Promise.all([
        getCountFromServer(patientsQuery),
        getCountFromServer(professionalsQuery),
        getCountFromServer(pendingUsersQuery),
        getCountFromServer(appointmentsQuery)
    ]);

    return {
      activePatients: patientsSnapshot.data().count,
      activeProfessionals: professionalsSnapshot.data().count,
      pendingUsers: pendingUsersSnapshot.data().count,
      appointmentsToday: appointmentsSnapshot.data().count,
    };
  } catch (error) {
    console.error("Erro ao buscar estatísticas do dashboard:", error);
    return { activePatients: 0, activeProfessionals: 0, appointmentsToday: 0, pendingUsers: 0 };
  }
};


/**
 * Busca os próximos 5 agendamentos do dia.
 * Versão otimizada que não faz leituras extras (N+1).
 */
export const getUpcomingAppointments = async (): Promise<UpcomingAppointment[]> => {
  try {
    const now = new Date();
    const todayEnd = endOfDay(now);

    const q = query(
      collection(db, 'appointments'),
      where('start', '>=', Timestamp.fromDate(now)),
      where('start', '<=', Timestamp.fromDate(todayEnd)),
      orderBy('start'),
      limit(5)
    );

    const querySnapshot = await getDocs(q);
    
    // Mapeia diretamente os resultados, pois os nomes já estão no documento do agendamento
    const appointments = querySnapshot.docs.map(doc => {
        const data = doc.data();
        return {
            id: doc.id,
            time: data.start.toDate().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
            patientName: data.patientName || 'Paciente Excluído',
            professionalName: data.professionalName || 'Profissional Excluído',
            sala: data.sala || 'N/A', // Supondo que o ID da sala esteja aqui
            status: data.status,
        }
    });

    return appointments;
  } catch (error) {
    console.error("Erro ao buscar próximos agendamentos:", error);
    return [];
  }
};