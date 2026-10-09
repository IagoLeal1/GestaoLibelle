import { db } from "@/lib/firebaseConfig";
import { esquecer, lembrar } from "@/lib/memoria";
import { 
  collection, 
  getDocs, 
  query, 
  orderBy, 
  addDoc, 
  doc, 
  updateDoc,
  deleteDoc,
  serverTimestamp
} from "firebase/firestore";

// --- Interfaces ---

export interface Specialty {
  id: string;
  name: string;
  value: number;
  description?: string;
}

export interface SpecialtyFormData {
  name: string;
  value: number;
  description?: string;
}

// --- Funções do Serviço ---

const lerTerapias = async (): Promise<Specialty[]> => {
  const q = query(collection(db, 'specialties'), orderBy('name'));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Specialty));
};

// Lida uma vez e reaproveitada pelas outras telas por 10 minutos (lib/memoria); quem grava, esquece
export const getSpecialties = async (): Promise<Specialty[]> => {
  try {
    return [...(await lembrar('specialties:todas', lerTerapias))];
  } catch (error) {
    console.error("Erro ao buscar especialidades:", error);
    return [];
  }
};

export const createSpecialty = async (data: SpecialtyFormData) => {
  try {
    await addDoc(collection(db, 'specialties'), {
      ...data,
      createdAt: serverTimestamp()
    });
    esquecer("specialties:");
    return { success: true };
  } catch (error) {
    console.error("Erro ao criar especialidade:", error);
    return { success: false, error: "Falha ao criar especialidade." };
  }
};

export const updateSpecialty = async (id: string, data: Partial<SpecialtyFormData>) => {
    try {
      const docRef = doc(db, 'specialties', id);
      await updateDoc(docRef, data);
      esquecer("specialties:");
      return { success: true };
    } catch (error) {
      console.error("Erro ao atualizar especialidade:", error);
      return { success: false, error: "Falha ao atualizar especialidade." };
    }
  };

export const deleteSpecialty = async (id: string) => {
  try {
    const docRef = doc(db, 'specialties', id);
    await deleteDoc(docRef);
    esquecer("specialties:");
    return { success: true };
  } catch (error) {
    console.error("Erro ao deletar especialidade:", error);
    return { success: false, error: "Falha ao deletar especialidade." };
  }
};