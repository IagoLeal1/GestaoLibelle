import { db } from '@/lib/firebaseConfig';
import { 
  collection, 
  doc, 
  getDocs, 
  query, 
  updateDoc, 
  where, 
  runTransaction, 
  Timestamp,
  getDoc
} from 'firebase/firestore';

// Interface para o objeto de usuário que a página de admin vai manipular
export interface UserForApproval {
    id: string;
    displayName: string;
    email: string;
    cpf?: string;
    phone?: string;
    profile: {
        role: 'familiar' | 'profissional' | 'funcionario' | 'admin';
        status: 'pendente' | 'aprovado' | 'rejeitado';
        createdAt: Timestamp;
        vinculo?: string;
        especialidade?: string;
        conselho?: string;
        numeroConselho?: string;
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
 * Busca todos os usuários que já foram processados (aprovados ou rejeitados).
 */
export const getProcessedUsers = async (): Promise<UserForApproval[]> => {
  try {
    const usersRef = collection(db, 'users');
    const q = query(usersRef, where('profile.status', 'in', ['aprovado', 'rejeitado']));
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
 * Aprova um usuário. Se for um profissional, também cria um perfil para ele na coleção 'professionals'.
 */
export const approveUserAndCreateProfile = async (userData: UserForApproval) => {
  const userDocRef = doc(db, 'users', userData.id);

  try {
    // Usamos uma transação para garantir que todas as operações aconteçam juntas.
    await runTransaction(db, async (transaction) => {
      const userDoc = await transaction.get(userDocRef);
      if (!userDoc.exists() || userDoc.data().profile.status !== 'pendente') {
        throw "O usuário não está mais pendente ou não foi encontrado.";
      }
      
      let finalProfileUpdate: any = { 'profile.status': 'aprovado' };

      // Se o usuário for um profissional, cria o perfil profissional base
      if (userData.profile?.role === 'profissional') {
        const newProfessionalRef = doc(collection(db, "professionals"));
        
        transaction.set(newProfessionalRef, {
          userId: userData.id,
          fullName: userData.displayName,
          email: userData.email,
          cpf: userData.cpf || "",
          celular: userData.phone || "",
          status: 'ativo',
          especialidade: userData.profile.especialidade || "A Definir",
          conselho: userData.profile.conselho || "",
          numeroConselho: userData.profile.numeroConselho || "",
          diasAtendimento: ["segunda", "terca", "quarta", "quinta", "sexta"],
          horarioInicio: "09:00",
          horarioFim: "18:00",
          dataContratacao: Timestamp.now(),
          financeiro: { percentualRepasse: 60, valorConsulta: 100 }
        });
        
        // Adiciona o ID do novo perfil profissional ao perfil do usuário
        finalProfileUpdate['profile.professionalId'] = newProfessionalRef.id;
      }
      
      // Atualiza o documento do usuário com as novas informações
      transaction.update(userDocRef, finalProfileUpdate);
    });

    return { success: true };

  } catch (error) {
    console.error("Erro na transação de aprovação:", error);
    return { success: false, error: "Falha ao aprovar usuário." };
  }
};