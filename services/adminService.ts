import {
  collection,
  doc,
  getDocs,
  query,
  runTransaction,
  Timestamp,
  where,
  deleteDoc
} from 'firebase/firestore';
import { db } from '@/lib/firebaseConfig';

// A INTERFACE DEVE SER DECLARADA AQUI, DENTRO DO PRÓPRIO ARQUIVO.
// Este foi o ponto da correção.
export interface UserForApproval {
  id: string;
  displayName: string;
  email: string;
  role: string;
  cpf: string;
  telefone: string;
  createdAt: string;
}

/**
 * Busca todos os usuários que estão com o status 'pendente' de aprovação.
 */
export const getPendingUsers = async (): Promise<UserForApproval[]> => {
  const usersRef = collection(db, 'users');
  const q = query(usersRef, where('profile.status', '==', 'pendente'));
  const querySnapshot = await getDocs(q);
  const pendingUsers: UserForApproval[] = [];
  querySnapshot.forEach((doc) => {
    const data = doc.data();
    pendingUsers.push({
      id: doc.id,
      displayName: data.displayName,
      email: data.email,
      role: data.profile.role,
      cpf: data.profile.cpf || 'N/A',
      telefone: data.profile.telefone || 'N/A',
      createdAt: data.profile.createdAt.toDate().toLocaleDateString('pt-BR'),
    });
  });
  return pendingUsers;
};

/**
 * Aprova um usuário. Se o usuário for um profissional, esta função também
 * cria o documento correspondente na coleção 'professionals'.
 */
export const approveUser = async (userId: string) => {
  const userDocRef = doc(db, 'users', userId);

  try {
    await runTransaction(db, async (transaction) => {
      const userDoc = await transaction.get(userDocRef);
      if (!userDoc.exists() || userDoc.data().profile.status !== 'pendente') {
        throw new Error("Usuário não encontrado ou não está mais pendente.");
      }

      const userData = userDoc.data();
      const userProfile = userData.profile;

      if (userProfile.role === 'profissional') {
        const newProfessionalRef = doc(collection(db, "professionals"));
        
        transaction.set(newProfessionalRef, {
            userId: userData.uid,
            fullName: userData.displayName,
            email: userData.email,
            cpf: userProfile.cpf,
            celular: userProfile.telefone,
            telefone: '',
            especialidade: userProfile.professionalData?.especialidade || "",
            conselho: userProfile.professionalData?.conselho || "",
            numeroConselho: userProfile.professionalData?.numeroConselho || "",
            status: 'ativo',
            diasAtendimento: [],
            horarioInicio: '08:00',
            horarioFim: '18:00',
            dataContratacao: Timestamp.now(),
            financeiro: {
              tipoPagamento: 'repasse',
              percentualRepasse: 70
            }
        });

        const { professionalData, ...profileWithoutTempData } = userProfile;
        const updatedProfile = {
            ...profileWithoutTempData,
            status: 'aprovado',
            professionalId: newProfessionalRef.id
        };

        transaction.update(userDocRef, { 'profile': updatedProfile });

      } else {
        transaction.update(userDocRef, { 'profile.status': 'aprovado' });
      }
    });

    return { success: true };
  } catch (error) {
    console.error("Erro ao aprovar usuário:", error);
    const errorMessage = error instanceof Error ? error.message : "Ocorreu um erro desconhecido ao aprovar o usuário.";
    return { success: false, error: errorMessage };
  }
};

/**
 * Recusa um usuário pendente, excluindo seu registro da coleção 'users'.
 */
export const rejectUser = async (userId: string) => {
    const userDocRef = doc(db, 'users', userId);
    try {
        await deleteDoc(userDocRef);
        return { success: true };
    } catch (error) {
        console.error("Erro ao recusar usuário:", error);
        return { success: false, error: "Ocorreu um erro ao recusar o usuário." };
    }
};

/**
 * Busca usuários já processados (aprovados ou rejeitados) que não estão ocultos do histórico.
 * (Esta função foi adicionada com base na estrutura do seu projeto)
 */
export const getProcessedUsers = async (): Promise<UserForApproval[]> => {
  try {
    const usersRef = collection(db, 'users');
    const q = query(
        usersRef,
        where('profile.status', 'in', ['aprovado', 'rejeitado']),
        where('profile.historyHidden', '==', false) 
    );
    const querySnapshot = await getDocs(q);
    const processedUsers: UserForApproval[] = [];
    querySnapshot.forEach((doc) => {
        const data = doc.data();
        processedUsers.push({
            id: doc.id,
            displayName: data.displayName,
            email: data.email,
            role: data.profile.role,
            cpf: data.profile.cpf || 'N/A',
            telefone: data.profile.telefone || 'N/A',
            createdAt: data.profile.createdAt.toDate().toLocaleDateString('pt-BR'),
            // Adicione aqui outros campos que possam ser úteis, como o status final
        });
    });
    return processedUsers;
  } catch (error) {
    console.error("Erro ao buscar usuários processados:", error);
    return [];
  }
};