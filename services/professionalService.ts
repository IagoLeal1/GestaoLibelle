import { db } from "@/lib/firebaseConfig";
import { 
  collection, 
  getDocs, 
  query, 
  orderBy, 
  Timestamp, 
  addDoc, 
  doc, 
  updateDoc,
  getDoc
} from "firebase/firestore";

// --- Interfaces ---

export interface Professional {
  id: string;
  userId: string;
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
    percentualRepasse: number;
    valorConsulta: number;
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
  percentualRepasse: number;
  valorConsulta: number;
  diasAtendimento: string[];
  horarioInicio: string;
  horarioFim: string;
}

// --- Funções do Serviço ---

export const getProfessionals = async (): Promise<Professional[]> => {
  try {
    const q = query(collection(db, 'professionals'), orderBy('fullName'));
    const snapshot = await getDocs(q);
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
    return docSnap.exists() ? { id: docSnap.id, ...docSnap.data() } as Professional : null;
  } catch (error) {
    console.error("Erro ao buscar profissional por ID:", error);
    return null;
  }
};

export const createProfessional = async (data: ProfessionalFormData) => {
  try {
    const { percentualRepasse, valorConsulta, ...restData } = data;
    await addDoc(collection(db, 'professionals'), {
      ...restData,
      status: 'ativo',
      dataContratacao: Timestamp.now(),
      financeiro: {
        percentualRepasse: Number(percentualRepasse) || 0,
        valorConsulta: Number(valorConsulta) || 0,
      }
    });
    return { success: true };
  } catch (error) {
    console.error("Erro ao criar profissional:", error);
    return { success: false, error: "Falha ao criar profissional." };
  }
};

export const updateProfessional = async (id: string, data: ProfessionalFormData) => {
  try {
    const docRef = doc(db, 'professionals', id);
    const { percentualRepasse, valorConsulta, ...restData } = data;
    await updateDoc(docRef, {
      ...restData,
      financeiro: {
        percentualRepasse: Number(percentualRepasse) || 0,
        valorConsulta: Number(valorConsulta) || 0,
      }
    });
    return { success: true };
  } catch (error) {
    console.error("Erro ao atualizar profissional:", error);
    return { success: false, error: "Falha ao atualizar profissional." };
  }
};

// >>> A FUNÇÃO QUE ESTAVA FALTANDO <<<
export const updateProfessionalStatus = async (id: string, newStatus: 'ativo' | 'inativo' | 'licenca') => {
  try {
    const docRef = doc(db, 'professionals', id);
    await updateDoc(docRef, { status: newStatus });
    return { success: true };
  } catch (error) {
    console.error("Erro ao atualizar status do profissional:", error);
    return { success: false, error: "Falha ao atualizar o status." };
  }
};