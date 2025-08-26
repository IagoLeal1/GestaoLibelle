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
  setDoc 
} from "firebase/firestore";

// --- NOVAS INTERFACES ---
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

// --- NOVAS FUNÇÕES ---
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

// --- FUNÇÕES EXISTENTES ---

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