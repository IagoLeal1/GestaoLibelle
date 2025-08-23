// src/services/settingsService.ts
import { db } from "@/lib/firebaseConfig";
import { collection, getDocs, addDoc, updateDoc, doc, deleteDoc, query, orderBy } from "firebase/firestore";

export interface CostCenter {
    id: string;
    name: string;
}

export interface Professional {
    id: string;
    name: string;
    // Adicione aqui outros campos do seu profissional, se existirem (ex: especialidade, cpf)
}

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

// Nova função para buscar profissionais
export const getProfessionals = async (): Promise<Professional[]> => {
    try {
        const q = query(collection(db, "professionals"), orderBy("name"));
        const querySnapshot = await getDocs(q);
        const professionals = querySnapshot.docs.map(doc => ({
            id: doc.id,
            name: doc.data().name
        } as Professional));
        return professionals;
    } catch (e) {
        console.error("Erro ao buscar profissionais: ", e);
        return [];
    }
};