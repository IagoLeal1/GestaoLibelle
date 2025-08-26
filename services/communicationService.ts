// services/communicationService.ts
import { db } from "@/lib/firebaseConfig";
import { 
  collection, 
  addDoc, 
  getDocs, 
  query, 
  where, 
  Timestamp, 
  orderBy,
  doc,
  updateDoc,
  deleteDoc,
  getCountFromServer
} from "firebase/firestore";
import { FirestoreUser } from "@/context/AuthContext";

// --- Interfaces ---
export interface Communication {
  id: string;
  title: string;
  message: string;
  authorName: string;
  createdAt: Timestamp;
  isImportant: boolean;
  targetRole: 'profissional' | 'funcionario' | 'familiar';
  readBy: { [key: string]: Timestamp };
}
export interface CommunicationFormData {
    title: string;
    message: string;
    isImportant: boolean;
    targetRole: 'profissional' | 'funcionario' | 'familiar';
}

// Interface para buscar detalhes básicos dos usuários
export interface UserDetails {
    uid: string;
    displayName: string;
}

// --- Funções do Serviço ---

export const getCommunications = async (userRole: string): Promise<Communication[]> => {
    try {
        let q;
        if (userRole === 'admin' || userRole === 'funcionario') {
            q = query(collection(db, 'communications'), orderBy('createdAt', 'desc'));
        } else {
            q = query(collection(db, 'communications'), where('targetRole', '==', userRole), orderBy('createdAt', 'desc'));
        }
        const snapshot = await getDocs(q);
        return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Communication));
    } catch (error) {
        console.error("Erro ao buscar comunicados:", error);
        return [];
    }
}

export const createCommunication = async (data: CommunicationFormData, author: FirestoreUser) => {
    try {
        await addDoc(collection(db, 'communications'), {
            ...data,
            authorId: author.uid,
            authorName: author.displayName,
            createdAt: Timestamp.now(),
            readBy: {}
        });
        return { success: true };
    } catch (error) {
        console.error("Erro ao criar comunicado:", error);
        return { success: false, error: "Falha ao criar comunicado." };
    }
}

/**
 * Atualiza o título e a mensagem de um comunicado existente.
 */
export const updateCommunication = async (id: string, data: { title: string, message: string }) => {
    try {
        const docRef = doc(db, 'communications', id);
        await updateDoc(docRef, data);
        return { success: true };
    } catch (error) {
        console.error("Erro ao atualizar comunicado:", error);
        return { success: false, error: "Falha ao atualizar o comunicado." };
    }
}

/**
 * Busca todos os usuários aprovados de um determinado perfil para a lista de leitura.
 */
export const getUsersByRole = async (role: 'profissional' | 'familiar' | 'funcionario' | 'admin'): Promise<UserDetails[]> => {
    try {
        const q = query(
            collection(db, 'users'), 
            where('profile.role', '==', role), 
            where('profile.status', '==', 'aprovado')
        );
        const snapshot = await getDocs(q);
        return snapshot.docs.map(doc => ({
            uid: doc.id,
            displayName: doc.data().displayName
        }));
    } catch (error) {
        console.error(`Erro ao buscar usuários do perfil ${role}:`, error);
        return [];
    }
};

export const markCommunicationAsRead = async (communicationId: string, userId: string) => {
    try {
        const docRef = doc(db, 'communications', communicationId);
        const fieldToUpdate = `readBy.${userId}`;
        await updateDoc(docRef, { [fieldToUpdate]: Timestamp.now() });
        return { success: true };
    } catch (error) {
        console.error("Erro ao marcar como lido:", error);
        return { success: false, error: "Falha ao marcar como lido." };
    }
}

// --- FUNÇÃO CORRIGIDA ---
// Adicionamos 'admin' aos tipos de perfis que a função aceita.
export const countUsersByRole = async (role: 'profissional' | 'funcionario' | 'familiar' | 'admin'): Promise<number> => {
    try {
        const q = query(collection(db, 'users'), where('profile.role', '==', role), where('profile.status', '==', 'aprovado'));
        const snapshot = await getCountFromServer(q);
        return snapshot.data().count;
    } catch (error) {
        console.error("Erro ao contar usuários por perfil:", error);
        return 0;
    }
}

export const deleteCommunication = async (communicationId: string) => {
    try {
        const docRef = doc(db, 'communications', communicationId);
        await deleteDoc(docRef);
        return { success: true };
    } catch (error) {
        console.error("Erro ao deletar comunicado:", error);
        return { success: false, error: "Falha ao deletar comunicado." };
    }
}