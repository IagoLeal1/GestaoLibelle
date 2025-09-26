import { db } from "@/lib/firebaseConfig";
import {
  collection,
  query,
  where,
  getDocs,
  doc,
  getDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  Timestamp,
  orderBy
} from 'firebase/firestore';

// Define a estrutura para uma regra de repasse especial
export interface RegraRepasseEspecial {
  especialidade: string;
  percentual: number;
}

export interface Professional {
  id: string;
  userId?: string;
  fullName: string;
  email: string;
  status: 'ativo' | 'inativo' | 'licenca';
  especialidade: string;
  conselho: string;
  numeroConselho: string;
  cpf: string;
  telefone: string;
  celular: string;
  diasAtendimento: string[];
  horarioInicio: string;
  horarioFim: string;
  dataContratacao: Timestamp;
  financeiro: {
    tipoPagamento: 'fixo' | 'repasse' | 'ambos';
    percentualRepasse?: number;
    horarioFixoInicio?: string;
    horarioFixoFim?: string;
    regrasEspeciais?: RegraRepasseEspecial[]; // ✅ NOVO CAMPO ADICIONADO AQUI
  }
}

export interface ProfessionalFormData {
  fullName: string;
  especialidade: string;
  conselho: string;
  numeroConselho: string;
  cpf: string;
  telefone: string;
  celular: string;
  email: string;
  diasAtendimento: string[];
  horarioInicio: string;
  horarioFim: string;
  financeiro: {
    tipoPagamento: 'fixo' | 'repasse' | 'ambos';
    percentualRepasse?: number;
    horarioFixoInicio?: string;
    horarioFixoFim?: string;
    regrasEspeciais?: RegraRepasseEspecial[]; // ✅ E AQUI TAMBÉM
  }
}

export const getProfessionals = async (status?: 'ativo' | 'inativo' | 'licenca'): Promise<Professional[]> => {
  try {
    let q;
    if (status) {
      q = query(collection(db, 'professionals'), where('status', '==', status), orderBy('fullName'));
    } else {
      q = query(collection(db, 'professionals'), orderBy('fullName'));
    }
    const snapshot = await getDocs(q);
    if (snapshot.empty) {
      return [];
    }
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Professional));
  } catch (error) {
    console.error("Erro ao buscar profissionais:", error);
    return [];
  }
};

export const getProfessionalById = async (id: string): Promise<Professional | null> => {
  try {
    const docRef = doc(db, 'professionals', id);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return { id: docSnap.id, ...docSnap.data() } as Professional;
    }
    return null;
  } catch (error) {
    console.error("Erro ao buscar profissional por ID:", error);
    return null;
  }
};

export const createProfessional = async (data: ProfessionalFormData): Promise<{success: boolean, error?: string}> => {
  try {
    const q = query(collection(db, "professionals"), where("cpf", "==", data.cpf));
    const querySnapshot = await getDocs(q);

    if (!querySnapshot.empty) {
      return { success: false, error: "Já existe um profissional cadastrado com este CPF." };
    }

    await addDoc(collection(db, 'professionals'), {
      ...data,
      status: 'ativo',
      dataContratacao: Timestamp.now(),
    });
    return { success: true };
  } catch (error) {
    console.error("Erro ao criar profissional:", error);
    return { success: false, error: "Falha ao criar profissional." };
  }
};

export const updateProfessional = async (id: string, data: Partial<ProfessionalFormData>) => {
  try {
    const docRef = doc(db, 'professionals', id);
    await updateDoc(docRef, data);
    return { success: true };
  } catch (error) {
    console.error("Erro ao atualizar profissional:", error);
    return { success: false, error: "Falha ao atualizar profissional." };
  }
};

export const deleteProfessional = async (id: string) => {
  try {
    const docRef = doc(db, 'professionals', id);
    await deleteDoc(docRef);
    return { success: true };
  } catch (error) {
    console.error("Erro ao deletar profissional:", error);
    return { success: false, error: "Falha ao deletar profissional." };
  }
};

export const updateProfessionalStatus = async (id: string, status: 'ativo' | 'inativo' | 'licenca') => {
  try {
    const docRef = doc(db, 'professionals', id);
    await updateDoc(docRef, { status: status });
    return { success: true };
  } catch (error) {
    console.error("Erro ao atualizar status do profissional:", error);
    return { success: false, error: "Falha ao atualizar status." };
  }
};