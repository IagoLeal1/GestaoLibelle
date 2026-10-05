import { db } from "@/lib/firebaseConfig";
import { collection, query, where, getCountFromServer } from 'firebase/firestore';

// --- INTERFACES ---

// Para os números no topo da tela inicial da gestão. Os atendimentos de hoje saem da própria
// lista do dia (lib/telaInicial), para o número bater com a lista.
export interface AdminDashboardStats {
  activePatients: number;
  activeProfessionals: number;
  /** Pedidos de acesso esperando aprovação. Só o admin aprova: para os outros fica 0. */
  pendingUsers: number;
}

// --- FUNÇÕES DO SERVIÇO ---

/**
 * Busca os dados agregados para as estatísticas do dashboard da gestão.
 * Usa getCountFromServer para máxima eficiência (baixo custo de leitura).
 */
export const getAdminDashboardStats = async ({ comAprovacoes }: { comAprovacoes: boolean }): Promise<AdminDashboardStats> => {
  try {
    const patientsQuery = query(collection(db, 'patients'), where('status', '==', 'ativo'));
    const professionalsQuery = query(collection(db, 'professionals'), where('status', '==', 'ativo'));

    const [patientsSnapshot, professionalsSnapshot, pendingUsersSnapshot] = await Promise.all([
        getCountFromServer(patientsQuery),
        getCountFromServer(professionalsQuery),
        comAprovacoes
          ? getCountFromServer(query(collection(db, 'users'), where('profile.status', '==', 'pendente')))
          : null,
    ]);

    return {
      activePatients: patientsSnapshot.data().count,
      activeProfessionals: professionalsSnapshot.data().count,
      pendingUsers: pendingUsersSnapshot?.data().count ?? 0,
    };
  } catch (error) {
    console.error("Erro ao buscar estatísticas do dashboard:", error);
    return { activePatients: 0, activeProfessionals: 0, pendingUsers: 0 };
  }
};
