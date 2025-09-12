// src/services/settingsService.ts
import { db } from "@/lib/firebaseConfig";
import { 
  collection, 
  getDocs, 
  addDoc, 
  updateDoc, 
  doc, 
  deleteDoc, 
  query, 
  orderBy,
  getDoc,
  setDoc,
  where, // Adicionado
  limit  // Adicionado
} from "firebase/firestore";

// --- INTERFACES ---
export interface CompanyData {
    name?: string;
    cnpj?: string;
    address?: string;
    city?: string;
    zipCode?: string;
    phone?: string;
    email?: string;
}

export interface CostCenter {
    id: string;
    name: string;
}

export interface Professional {
    id: string;
    name: string;
}

// --- FUNÇÕES DE DADOS DA EMPRESA ---
/**
 * Busca os dados da empresa.
 * Os dados são armazenados num único documento para facilitar a gestão.
 */
export const getCompanyData = async (): Promise<CompanyData | null> => {
    try {
        const docRef = doc(db, "settings", "companyInfo");
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
            return docSnap.data() as CompanyData;
        }
        return null; // Retorna nulo se a empresa ainda não foi configurada
    } catch (e) {
        console.error("Erro ao buscar dados da empresa: ", e);
        return null;
    }
};

/**
 * Cria ou atualiza os dados da empresa.
 */
export const updateCompanyData = async (data: CompanyData) => {
    try {
        const docRef = doc(db, "settings", "companyInfo");
        // Usamos setDoc com { merge: true } para criar ou atualizar o documento
        await setDoc(docRef, data, { merge: true });
        return { success: true };
    } catch (e) {
        console.error("Erro ao atualizar dados da empresa: ", e);
        return { success: false, error: "Falha ao salvar dados da empresa." };
    }
};

// --- FUNÇÕES DE CENTRO DE CUSTO ---

export const getCostCenters = async (): Promise<CostCenter[]> => {
    try {
        const q = query(collection(db, "costCenters"), orderBy("name"));
        const querySnapshot = await getDocs(q);
        const costCenters = querySnapshot.docs.map(doc => ({
            id: doc.id,
            name: doc.data().name
        } as CostCenter));
        return costCenters;
    } catch (e) {
        console.error("Erro ao buscar centros de custo: ", e);
        return [];
    }
};

export const addCostCenter = async (name: string) => {
    try {
        await addDoc(collection(db, "costCenters"), { name });
        return { success: true };
    } catch (e) {
        return { success: false, error: "Falha ao adicionar centro de custo." };
    }
};

export const updateCostCenter = async (id: string, name: string) => {
    try {
        await updateDoc(doc(db, "costCenters", id), { name });
        return { success: true };
    } catch (e) {
        return { success: false, error: "Falha ao atualizar centro de custo." };
    }
};

export const deleteCostCenter = async (id: string) => {
    try {
        await deleteDoc(doc(db, "costCenters", id));
        return { success: true };
    } catch (e) {
        return { success: false, error: "Falha ao excluir centro de custo." };
    }
};

/**
 * --- NOVA FUNÇÃO ---
 * Verifica se um centro de custo com um nome específico já existe.
 * Se não existir, cria um novo.
 */
export const findOrCreateCostCenter = async (name: string) => {
  if (!name || name.trim() === '') {
    // Não faz nada se o nome for inválido
    return;
  }

  try {
    const costCentersRef = collection(db, "costCenters");
    // Cria uma consulta para buscar um centro de custo com o nome exato.
    const q = query(costCentersRef, where("name", "==", name), limit(1));
    const querySnapshot = await getDocs(q);

    // Se a consulta não retornar nenhum documento, significa que ele não existe.
    if (querySnapshot.empty) {
      console.log(`Centro de custo "${name}" não encontrado. Criando...`);
      await addDoc(costCentersRef, { name });
    }
    // Se existir, não fazemos nada.
  } catch (error) {
    console.error(`Erro ao verificar/criar centro de custo "${name}":`, error);
  }
};

/**
 * --- NOVA FUNÇÃO ---
 * Verifica se um plano de contas (categoria) com um nome específico já existe.
 * Se não existir, cria um novo com um código padrão.
 */
export const findOrCreateAccountPlan = async (name: string, category: 'receita' | 'despesa') => {
  if (!name || name.trim() === '') {
    return;
  }

  try {
    const accountPlansRef = collection(db, "accountPlans");
    const q = query(accountPlansRef, where("name", "==", name), where("category", "==", category), limit(1));
    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
      console.log(`Plano de contas "${name}" não encontrado. Criando...`);
      // Gera um código simples para identificação
      const code = `${category.substring(0, 1)}.${name.replace(/\s+/g, '').substring(0, 4).toLowerCase()}.${Date.now().toString().slice(-4)}`;
      await addDoc(accountPlansRef, { name, category, code });
    }
  } catch (error) {
    console.error(`Erro ao verificar/criar plano de contas "${name}":`, error);
  }
};


// --- FUNÇÕES DE PROFISSIONAIS (PARA REPASSE) ---

export const getProfessionalsForRepasse = async (): Promise<Professional[]> => {
    try {
        const q = query(collection(db, "professionals"), orderBy("fullName"));
        const querySnapshot = await getDocs(q);
        const professionals = querySnapshot.docs.map(doc => ({
            id: doc.id,
            name: doc.data().fullName 
        } as Professional));
        return professionals;
    } catch (e) {
        console.error("Erro ao buscar profissionais:", e);
        return [];
    }
};