import { db } from "@/lib/firebaseConfig";
import { 
  collection, 
  addDoc, 
  getDocs, 
  query, 
  orderBy, 
  Timestamp, 
  doc, 
  getDoc, 
  updateDoc,
  where
} from "firebase/firestore";

// --- INTERFACES REESTRUTURADAS ---

// Interface para os dados do Responsável (como são salvos no DB)
interface Responsavel {
    nome: string;
    celular: string;
    cpf?: string; // <-- O CAMPO DE CPF DO RESPONSÁVEL
    email?: string;
    profissao?: string;
    estadoCivil?: string;
}

// Interface principal do Paciente, com o Responsável como um objeto aninhado
export interface Patient {
  id: string;
  fullName: string;
  dataNascimento: Timestamp;
  sexo?: string;
  cpf: string;
  rg?: string;
  convenio?: string;
  emailCadastro?: string; // O e-mail chave para o login
  userId?: string;        // O ID do usuário que será vinculado depois
  
  responsavel: Responsavel; // Objeto aninhado para o responsável

  endereco?: string;
  numero?: string;
  complemento?: string;
  bairro?: string;
  cidade?: string;
  cep?: string;
  estado?: string;
  
  observacoes?: string;
  status: 'ativo' | 'inativo' | 'suspenso';
  dataCadastro: Timestamp;
  responsibleUserIds?: string[];
}

// --- INTERFACES PARA O FORMULÁRIO ---

// Interface para o formulário do responsável, com campos opcionais.
interface ResponsavelFormData {
    nome?: string;
    celular?: string;
    cpf?: string; // <-- O CAMPO DE CPF DO RESPONSÁVEL
    email?: string;
    profissao?: string;
    estadoCivil?: string;
}

// Interface para os dados que vêm do formulário, usando a interface flexível para o responsável.
export interface PatientFormData {
  fullName: string;
  dataNascimento: string;
  cpf: string;
  sexo?: string;
  rg?: string;
  convenio?: string;
  emailCadastro?: string;
  
  responsavel: ResponsavelFormData;

  endereco?: string;
  numero?: string;
  complemento?: string;
  bairro?: string;
  cidade?: string;
  cep?: string;
  estado?: string;

  observacoes?: string;
}

// --- Funções do Serviço ---

export const getPatients = async (status?: 'ativo' | 'inativo' | 'suspenso'): Promise<Patient[]> => {
  try {
    let q;
    if (status) {
      q = query(collection(db, 'patients'), where('status', '==', status), orderBy('fullName'));
    } else {
      q = query(collection(db, 'patients'), orderBy('fullName'));
    }
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Patient));
  } catch (error) {
    console.error("Erro ao buscar pacientes:", error);
    return [];
  }
};

export const getPatientById = async (id: string): Promise<Patient | null> => {
  try {
    const docRef = doc(db, 'patients', id);
    const docSnap = await getDoc(docRef);
    return docSnap.exists() ? { id: docSnap.id, ...docSnap.data() } as Patient : null;
  } catch (error) {
    console.error("Erro ao buscar paciente por ID:", error);
    return null;
  }
};

export const createPatient = async (patientData: PatientFormData) => {
  try {
    const { dataNascimento, ...restData } = patientData;
    // Converte a data string para Timestamp do Firebase
    const birthDateTimestamp = Timestamp.fromDate(new Date(dataNascimento));

    await addDoc(collection(db, 'patients'), {
      ...restData,
      dataNascimento: birthDateTimestamp, // Nome do campo padronizado
      dataCadastro: Timestamp.now(),
      status: 'ativo',
    });
    return { success: true };
  } catch (error) {
    console.error("Erro ao criar paciente:", error);
    return { success: false, error: "Falha ao criar paciente." };
  }
};

export const updatePatient = async (id: string, patientData: Partial<PatientFormData>) => {
  try {
    const patientDocRef = doc(db, 'patients', id);
    const { dataNascimento, ...restData } = patientData;
    
    // Cria um objeto para atualização para manipular a data
    const dataToUpdate: { [key: string]: any } = { ...restData };

    // Converte a data para Timestamp apenas se ela for fornecida na atualização
    if (dataNascimento) {
      dataToUpdate.dataNascimento = Timestamp.fromDate(new Date(dataNascimento));
    }

    await updateDoc(patientDocRef, dataToUpdate);
    return { success: true };
  } catch (error) {
    console.error("Erro ao atualizar paciente:", error);
    return { success: false, error: "Falha ao atualizar paciente." };
  }
};

export const updatePatientStatus = async (id: string, newStatus: 'ativo' | 'inativo' | 'suspenso') => {
  try {
    const docRef = doc(db, 'patients', id);
    await updateDoc(docRef, { status: newStatus });
    return { success: true };
  } catch (error) {
    console.error("Erro ao atualizar status do paciente:", error);
    return { success: false, error: "Falha ao atualizar o status." };
  }
};