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
  deleteDoc, // Importamos a função de deletar
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

export const countUsersByRole = async (role: 'profissional' | 'funcionario' | 'familiar'): Promise<number> => {
    try {
        const q = query(collection(db, 'users'), where('profile.role', '==', role), where('profile.status', '==', 'aprovado'));
        const snapshot = await getCountFromServer(q);
        return snapshot.data().count;
    } catch (error) {
        console.error("Erro ao contar usuários por perfil:", error);
        return 0;
    }
}

// NOVO: Função para deletar um comunicado
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
