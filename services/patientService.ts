import { db } from "@/lib/firebaseConfig";
import type { Diagnostico } from "@/lib/diagnostico";
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
  deleteDoc,
  where,
  limit,
  startAfter,
  serverTimestamp,
  deleteField,
  QueryDocumentSnapshot,
  DocumentData,
  QueryConstraint
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
  dataInicio?: Timestamp;
  dataTermino?: Timestamp;
  status: 'ativo' | 'inativo' | 'suspenso';
  dataCadastro: Timestamp;
  responsibleUserIds?: string[];
  // Diagnóstico (lib/diagnostico): escrito pela gestão e pela recepção em Pacientes › Detalhes
  diagnosticos?: Diagnostico[];
  diagnosticoAtualizadoEm?: Timestamp;
  diagnosticoAtualizadoPor?: string;
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
  dataInicio?: string;
  dataTermino?: string;
}

export interface PatientObservation {
  id: string;
  texto: string;
  criadoEm: Timestamp | null;
  autorId: string;
  autorNome: string;
  autorPerfil?: string;
}

export interface PatientObservationAuthor {
  uid: string;
  displayName: string;
  role?: string;
}

export interface PatientObservationPage {
  observations: PatientObservation[];
  lastDocument: QueryDocumentSnapshot<DocumentData> | null;
  hasMore: boolean;
}

const dateStringToTimestamp = (date: string) => {
  const [year, month, day] = date.split('-').map(Number);
  return Timestamp.fromDate(new Date(Date.UTC(year, month - 1, day)));
};

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
    const { dataNascimento, dataInicio, dataTermino, ...restData } = patientData;
    // Converte a data string para Timestamp do Firebase
    const birthDateTimestamp = dateStringToTimestamp(dataNascimento);

    await addDoc(collection(db, 'patients'), {
      ...restData,
      dataNascimento: birthDateTimestamp, // Nome do campo padronizado
      ...(dataInicio ? { dataInicio: dateStringToTimestamp(dataInicio) } : {}),
      ...(dataTermino ? { dataTermino: dateStringToTimestamp(dataTermino) } : {}),
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
    const { dataNascimento, dataInicio, dataTermino, ...restData } = patientData;
    
    // Cria um objeto para atualização para manipular a data
    const dataToUpdate: { [key: string]: any } = { ...restData };

    // Converte a data para Timestamp apenas se ela for fornecida na atualização
    if (dataNascimento) {
      dataToUpdate.dataNascimento = dateStringToTimestamp(dataNascimento);
    }

    if (dataInicio !== undefined) {
      dataToUpdate.dataInicio = dataInicio ? dateStringToTimestamp(dataInicio) : deleteField();
    }

    if (dataTermino !== undefined) {
      dataToUpdate.dataTermino = dataTermino ? dateStringToTimestamp(dataTermino) : deleteField();
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

export const getPatientObservations = async (
  patientId: string,
  lastDocument?: QueryDocumentSnapshot<DocumentData> | null,
  pageSize = 10
): Promise<PatientObservationPage> => {
  const observationsRef = collection(db, 'patients', patientId, 'observations');
  const constraints: QueryConstraint[] = [orderBy('criadoEm', 'desc'), limit(pageSize)];

  if (lastDocument) {
    constraints.push(startAfter(lastDocument));
  }

  const snapshot = await getDocs(query(observationsRef, ...constraints));
  const observations = snapshot.docs.map((observationDoc) => ({
    id: observationDoc.id,
    ...observationDoc.data(),
  } as PatientObservation));

  return {
    observations,
    lastDocument: snapshot.docs.at(-1) || null,
    hasMore: snapshot.docs.length === pageSize,
  };
};

export const addPatientObservation = async (
  patientId: string,
  texto: string,
  author: PatientObservationAuthor
): Promise<PatientObservation> => {
  const textoNormalizado = texto.trim();
  if (!textoNormalizado) {
    throw new Error('A observação não pode estar vazia.');
  }

  const observationData = {
    texto: textoNormalizado,
    criadoEm: serverTimestamp(),
    autorId: author.uid,
    autorNome: author.displayName,
    autorPerfil: author.role || '',
  };

  const observationRef = await addDoc(
    collection(db, 'patients', patientId, 'observations'),
    observationData
  );

  return {
    id: observationRef.id,
    ...observationData,
    criadoEm: Timestamp.now(),
  };
};

export const deletePatientObservation = async (
  patientId: string,
  observationId: string
): Promise<void> => {
  await deleteDoc(doc(db, 'patients', patientId, 'observations', observationId));
};

export const deleteLegacyPatientObservation = async (patientId: string): Promise<void> => {
  await updateDoc(doc(db, 'patients', patientId), {
    observacoes: deleteField(),
  });
};
