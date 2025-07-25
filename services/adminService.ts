import { db } from '@/lib/firebaseConfig';
import { 
  collection, 
  doc, 
  getDocs, 
  query, 
  updateDoc, 
  where, 
  runTransaction, 
  Timestamp
} from 'firebase/firestore';

// Interface para o objeto de usuário
export interface UserForApproval {
    id: string; // ID do documento (que é o uid do usuário)
    displayName: string;
    email: string;
    cpf?: string;
    phone?: string;
    profile: {
        role: 'familiar' | 'profissional' | 'funcionario' | 'admin';
        status: 'pendente' | 'aprovado' | 'rejeitado';
        createdAt?: Timestamp;
        historyHidden?: boolean; // <-- Novo campo opcional
        [key: string]: any;
    };
    [key: string]: any;
}

/**
 * Busca todos os usuários cujo status do perfil é 'pendente'.
 */
export const getPendingUsers = async (): Promise<UserForApproval[]> => {
  try {
    const usersRef = collection(db, 'users');
    const q = query(usersRef, where('profile.status', '==', 'pendente'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as UserForApproval));
  } catch (error) {
    console.error("Erro ao buscar usuários pendentes:", error);
    return [];
  }
};

/**
 * --- FUNÇÃO MODIFICADA ---
 * Busca todos os usuários que já foram processados E NÃO ESTÃO ESCONDIDOS no histórico.
 */
export const getProcessedUsers = async (): Promise<UserForApproval[]> => {
  try {
    const usersRef = collection(db, 'users');
    // Usamos '==' em vez de '!=' porque agora garantimos que o campo existe.
    // Esta consulta é muito mais eficiente.
    const q = query(
        usersRef, 
        where('profile.status', 'in', ['aprovado', 'rejeitado']),
        where('profile.historyHidden', '==', false) // <-- A CONSULTA EFICIENTE
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as UserForApproval));
  } catch (error) {
    console.error("Erro ao buscar usuários processados:", error);
    return [];
  }
};

/**
 * Rejeita uma solicitação de acesso, alterando o status para 'rejeitado'.
 */
export const rejectUser = async (userId: string) => {
  try {
    const userDocRef = doc(db, 'users', userId);
    await updateDoc(userDocRef, { 'profile.status': 'rejeitado' });
    return { success: true };
  } catch (error) {
    console.error("Erro ao rejeitar usuário:", error);
    return { success: false, error: "Falha ao rejeitar a solicitação." };
  }
};

/**
 * --- NOVA FUNÇÃO ---
 * Marca um usuário para que ele não apareça mais no histórico de aprovações.
 * Esta é uma operação "soft delete", não apaga o usuário.
 */
export const hideUserFromHistory = async (userId: string) => {
    try {
        const userDocRef = doc(db, 'users', userId);
        await updateDoc(userDocRef, {
            'profile.historyHidden': true
        });
        return { success: true };
    } catch (error) {
        console.error("Erro ao arquivar usuário do histórico:", error);
        return { success: false, error: "Falha ao arquivar a solicitação." };
    }
};

/**
 * Aprova um usuário, alterando seu status para 'aprovado'.
 */
export const approveUser = async (userId: string) => {
  const userDocRef = doc(db, 'users', userId);
  try {
    await runTransaction(db, async (transaction) => {
      const userDoc = await transaction.get(userDocRef);
      if (!userDoc.exists() || userDoc.data().profile.status !== 'pendente') {
        throw "O usuário não está mais pendente ou não foi encontrado.";
      }
      transaction.update(userDocRef, { 'profile.status': 'aprovado' });
    });
    return { success: true };
  } catch (error) {
    console.error("Erro na transação de aprovação:", error);
    return { success: false, error: "Falha ao aprovar usuário." };
  }
};