import {
  collection,
  doc,
  getDocs,
  query,
  Timestamp,
  where,
  deleteDoc,
  updateDoc,
  getDoc,
  QueryDocumentSnapshot,
  DocumentData,
  writeBatch, // <--- NOVA IMPORTAÇÃO
} from "firebase/firestore";
import { db } from "@/lib/firebaseConfig";

// INTERFACE (Correta, sem alterações)
export interface UserForApproval {
  id: string;
  displayName: string;
  email: string;
  phone: string | null;
  cpf: string | null;
  profile: {
    role: "familiar" | "profissional" | "funcionario" | "admin";
    status: "pendente" | "aprovado" | "rejeitado";
    createdAt: Timestamp;
    historyHidden?: boolean;
    [key: string]: any;
  };
  [key: string]: any;
}

/**
 * Busca todos os usuários que estão com o status 'pendente' de aprovação.
 * (Correto, sem alterações)
 */
export const getPendingUsers = async (): Promise<UserForApproval[]> => {
  try {
    const usersRef = collection(db, "users");
    const q = query(usersRef, where("profile.status", "==", "pendente"));
    const snapshot = await getDocs(q);
    
    return snapshot.docs.map(doc => {
        const data = doc.data();
        return {
            id: doc.id,
            displayName: data.displayName,
            email: data.email,
            phone: data.profile.telefone || null,
            cpf: data.profile.cpf || null,
            profile: data.profile,
            ...data
        } as UserForApproval;
    });
  } catch (error) {
    console.error("Erro ao buscar usuários pendentes:", error);
    return [];
  }
};

/**
 * Busca usuários já processados (aprovados ou rejeitados) que não estão ocultos.
 * (Correto, sem alterações)
 */
export const getProcessedUsers = async (): Promise<UserForApproval[]> => {
  try {
    const usersRef = collection(db, "users");
    const q = query(
      usersRef,
      where("profile.status", "in", ["aprovado", "rejeitado"]),
      where("profile.historyHidden", "==", false)
    );
    const snapshot = await getDocs(q);
    
    return snapshot.docs.map(doc => {
        const data = doc.data();
        return {
            id: doc.id,
            displayName: data.displayName,
            email: data.email,
            phone: data.profile.telefone || null,
            cpf: data.profile.cpf || null,
            profile: data.profile,
            ...data
        } as UserForApproval;
    });
  } catch (error) {
    console.error("Erro ao buscar usuários processados:", error);
    return [];
  }
};

/**
 * --- FUNÇÃO REESCRITA (NOVA ABORDAGEM) ---
 * Aprova um usuário usando um Lote de Escrita (writeBatch) para
 * garantir atomicidade e eficiência.
 */
export const approveUser = async (userId: string) => {
  const userDocRef = doc(db, "users", userId);
  const professionalsRef = collection(db, "professionals");

  // ETAPA 1: LER TUDO (Fora do Lote)
  let userDocSnap;
  let userProfile: DocumentData;
  let userData: DocumentData;
  let existingProfDoc: QueryDocumentSnapshot<DocumentData> | undefined;

  try {
    userDocSnap = await getDoc(userDocRef);
    if (
      !userDocSnap.exists() ||
      userDocSnap.data().profile.status !== "pendente"
    ) {
      throw new Error("Usuário não encontrado ou não está mais pendente.");
    }
    
    userData = userDocSnap.data();
    userProfile = userData.profile;

    // Se for profissional, faz a verificação do CPF
    if (userProfile.role === "profissional") {
      if (!userProfile.cpf) {
        throw new Error(
          "Profissional não pode ser aprovado sem um CPF no perfil."
        );
      }
      const q = query(professionalsRef, where("cpf", "==", userProfile.cpf));
      const profQuerySnap = await getDocs(q);
      if (!profQuerySnap.empty) {
        existingProfDoc = profQuerySnap.docs[0];
      }
    }
  } catch (error) {
    console.error("Erro na ETAPA 1 (Leitura):", error);
    const errorMessage =
      error instanceof Error
        ? error.message
        : "Ocorreu um erro desconhecido ao ler os dados.";
    return { success: false, error: errorMessage };
  }

  // ETAPA 2: ESCREVER TUDO (Dentro de um Lote)
  try {
    const batch = writeBatch(db);

    if (userProfile.role === "profissional") {
      let professionalId: string;

      if (!existingProfDoc) {
        // CASO 1: CRIAR NOVO PROFISSIONAL
        const newProfessionalRef = doc(professionalsRef); // Gera ID
        professionalId = newProfessionalRef.id;

        // Prepara os dados do novo profissional
        const newProfData = {
          userId: userId,
          name: userData.displayName,
          email: userData.email,
          cpf: userProfile.cpf,
          phone: userProfile.telefone || "",
          registrationNumber:
            userProfile.professionalData?.numeroConselho || "",
          specialties: userProfile.professionalData?.especialidade
            ? [userProfile.professionalData.especialidade]
            : [],
          council: userProfile.professionalData?.conselho || "",
          rooms: [],
          availability: { days: [], startTime: "08:00", endTime: "18:00" },
          financial: userProfile.financeiro || {
            tipoPagamento: "repasse",
            percentualRepasse: 70,
          },
          status: "ativo",
          createdAt: Timestamp.now(),
          updatedAt: Timestamp.now(),
        };
        
        // Ação 1 do Lote: Criar o profissional
        batch.set(newProfessionalRef, newProfData);

      } else {
        // CASO 2: LINKAR PROFISSIONAL EXISTENTE
        const existingProfDocRef = doc(db, "professionals", existingProfDoc.id);
        professionalId = existingProfDoc.id;
        
        // Ação 1 do Lote: Atualizar o profissional
        batch.update(existingProfDocRef, {
          userId: userId,
          updatedAt: Timestamp.now(),
        });
      }

      // Ação 2 do Lote: Atualizar o perfil do usuário
      const { professionalData, ...profileWithoutTempData } = userProfile;
      const updatedProfile = {
        ...profileWithoutTempData,
        status: "aprovado",
        professionalId: professionalId,
      };
      
      batch.update(userDocRef, { profile: updatedProfile });

    } else {
      // CASO 3: Aprovação de não-profissionais
      batch.update(userDocRef, { "profile.status": "aprovado" });
    }

    // ETAPA 3: Commit
    // Envia todas as escritas de uma vez
    await batch.commit();
    return { success: true };

  } catch (error) {
    console.error("Erro na ETAPA 2 (Batch Write):", error);
    const errorMessage =
      error instanceof Error
        ? error.message
        : "Ocorreu um erro desconhecido ao salvar as alterações.";
    return { success: false, error: errorMessage };
  }
};


/**
 * Recusa um usuário pendente, excluindo seu registro da coleção 'users'.
 * (Correto, sem alterações)
 */
export const rejectUser = async (userId: string) => {
  const userDocRef = doc(db, "users", userId);
  try {
    await deleteDoc(userDocRef);
    return { success: true };
  } catch (error) {
    console.error("Erro ao recusar usuário:", error);
    return { success: false, error: "Ocorreu um erro ao recusar o usuário." };
  }
};

/**
 * Oculta um usuário processado do histórico de aprovações.
 * (Correto, sem alterações)
 */
export const hideUserFromHistory = async (userId: string) => {
  const userDocRef = doc(db, "users", userId);
  try {
    await updateDoc(userDocRef, { "profile.historyHidden": true });
    return { success: true };
  } catch (error) {
    console.error("Erro ao ocultar usuário do histórico:", error);
    return { success: false, error: "Falha ao ocultar usuário." };
  }
};