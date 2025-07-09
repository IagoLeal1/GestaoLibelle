import { db } from '@/lib/firebaseConfig';
import { collection, doc, getDocs, query, updateDoc, where, deleteDoc, addDoc, runTransaction, Timestamp } from 'firebase/firestore';

// Interface para o objeto de usuário que vamos buscar
export interface UserForApproval {
    id: string;
    displayName: string;
    email: string;
    cpf?: string;
    phone?: string;
    profile: {
        role: 'familiar' | 'profissional' | 'funcionario' | 'admin';
        status: 'pendente' | 'aprovado' | 'rejeitado';
        vinculo?: string; // Usaremos os campos do cadastro aqui
        [key: string]: any;
    };
    [key: string]: any;
}

// Busca usuários com status 'pendente'
export const getPendingUsers = async (): Promise<UserForApproval[]> => {
  const usersRef = collection(db, 'users');
  const q = query(usersRef, where('profile.status', '==', 'pendente'));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as UserForApproval));
};

// Busca usuários já processados (aprovados ou rejeitados)
export const getProcessedUsers = async (): Promise<UserForApproval[]> => {
    const usersRef = collection(db, 'users');
    const q = query(usersRef, where('profile.status', 'in', ['aprovado', 'rejeitado']));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as UserForApproval));
};

// Sua função de aprovação inteligente continua a mesma
export const approveUserAndCreateProfile = async (userData: UserForApproval) => { /* ... seu código existente ... */ };

// Sua função de rejeição continua a mesma
export const rejectUser = async (userId: string) => { /* ... seu código existente ... */ };