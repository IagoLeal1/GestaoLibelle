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
  updateDoc 
} from "firebase/firestore";

// Interface principal, representa um documento no Firestore.
// Todos os campos que existem no seu formulário estão aqui.
export interface Patient {
  id: string;
  fullName: string;
  dataNascimento: Timestamp;
  sexo: string;
  cpf: string;
  rg?: string;
  telefone?: string;
  celular: string;
  email?: string;
  endereco?: string;
  numero?: string;
  complemento?: string;
  bairro?: string;
  cidade?: string;
  cep?: string;
  estado?: string;
  profissao?: string;
  estadoCivil?: string;
  observacoes?: string;
  status: 'ativo' | 'inativo' | 'suspenso';
  dataCadastro: Timestamp;
  responsibleUserIds: string[];
  [key: string]: any; 
}

// Interface para os dados que vêm do formulário.
// É igual à Patient, mas a data vem como string do input.
export type PatientFormData = {
  fullName: string;
  dataNascimento: string;
  sexo: string;
  cpf: string;
  rg?: string;
  telefone?: string;
  celular: string;
  email?: string;
  endereco?: string;
  numero?: string;
  complemento?: string;
  bairro?: string;
  cidade?: string;
  cep?: string;
  estado?: string;
  profissao?: string;
  estadoCivil?: string;
  observacoes?: string;
};

// --- Funções do Serviço ---

export const getPatients = async (): Promise<Patient[]> => {
  try {
    const patientsRef = collection(db, 'patients');
    const q = query(patientsRef, orderBy('fullName'));
    
    const querySnapshot = await getDocs(q);
    
    const patients = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as Patient));

    return patients;
  } catch (error) {
    console.error("Erro ao buscar pacientes:", error);
    return [];
  }
};

export const getPatientById = async (id: string): Promise<Patient | null> => {
  try {
    const patientDocRef = doc(db, 'patients', id);
    const patientDoc = await getDoc(patientDocRef);

    if (!patientDoc.exists()) {
      console.error("Nenhum paciente encontrado com este ID.");
      return null;
    }
    
    return { id: patientDoc.id, ...patientDoc.data() } as Patient;
  } catch (error) {
    console.error("Erro ao buscar paciente por ID:", error);
    return null;
  }
};

export const createPatient = async (patientData: PatientFormData) => {
  try {
    // Separa a data (string) do resto dos dados
    const { dataNascimento, ...restData } = patientData;
    // Converte a data para o formato do Firebase
    const birthDateTimestamp = Timestamp.fromDate(new Date(dataNascimento));

    // Adiciona o novo documento na coleção 'patients'
    await addDoc(collection(db, 'patients'), {
      ...restData, // Salva todos os outros campos
      birthDate: birthDateTimestamp, // Salva a data convertida
      dataCadastro: Timestamp.now(),
      status: 'ativo',
      responsibleUserIds: [],
    });
    return { success: true };
  } catch (error) {
    console.error("Erro ao criar paciente:", error);
    return { success: false, error: "Falha ao criar paciente." };
  }
};

export const updatePatient = async (id: string, patientData: PatientFormData) => {
  try {
    const patientDocRef = doc(db, 'patients', id);
    const { dataNascimento, ...restData } = patientData;
    const birthDateTimestamp = Timestamp.fromDate(new Date(dataNascimento));

    // Atualiza o documento existente
    await updateDoc(patientDocRef, {
      ...restData,
      birthDate: birthDateTimestamp,
    });
    return { success: true };
  } catch (error) {
    console.error("Erro ao atualizar paciente:", error);
    return { success: false, error: "Falha ao atualizar paciente." };
  }
};