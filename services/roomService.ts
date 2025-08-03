import { db } from "@/lib/firebaseConfig";
import { 
  collection, 
  getDocs, 
  query, 
  orderBy, 
  addDoc, 
  doc, 
  updateDoc,
  deleteDoc,
  serverTimestamp,
  Timestamp
} from "firebase/firestore";

// --- INTERFACES CORRIGIDAS E ATUALIZADAS ---

// A interface Room representa como os dados são salvos no Firestore.
export interface Room {
  id: string;
  name: string;
  number: string;
  floor: number;
  type: string;
  description?: string; // <-- Campo adicionado
  capacity?: number;
  equipment?: string[]; // <-- Salvo como um array de strings
  status: 'ativa' | 'inativa' | 'manutencao';
  createdAt: Timestamp;
}

// A interface RoomFormData representa os dados que vêm do formulário do modal.
export interface RoomFormData {
  name: string;
  number: string;
  floor: number;
  type: string;
  description?: string; // <-- Campo adicionado
  capacity?: number;
  equipment?: string; // <-- Vem como uma única string, separada por vírgulas
  status: 'ativa' | 'inativa' | 'manutencao';
}

// --- Funções do Serviço ---

/**
 * Busca todas as salas cadastradas, ordenadas por andar e número.
 */
export const getRooms = async (): Promise<Room[]> => {
  try {
    const q = query(collection(db, 'rooms'), orderBy('floor'), orderBy('number'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Room));
  } catch (error) {
    console.error("Erro ao buscar salas:", error);
    return [];
  }
};

/**
 * Cria uma nova sala no Firestore.
 */
export const createRoom = async (data: RoomFormData) => {
  try {
    // Converte a string de equipamentos em um array, removendo espaços extras.
    const equipmentArray = data.equipment ? data.equipment.split(',').map(item => item.trim()) : [];
    
    await addDoc(collection(db, 'rooms'), {
      name: data.name,
      number: data.number,
      floor: Number(data.floor) || 1,
      type: data.type,
      description: data.description || "",
      capacity: Number(data.capacity) || 1,
      equipment: equipmentArray,
      status: data.status,
      createdAt: serverTimestamp()
    });
    return { success: true };
  } catch (error) {
    console.error("Erro ao criar sala:", error);
    return { success: false, error: "Falha ao criar sala." };
  }
};

/**
 * Atualiza os dados de uma sala existente.
 */
export const updateRoom = async (id: string, data: Partial<RoomFormData>) => {
    try {
      const docRef = doc(db, 'rooms', id);
      
      const dataToUpdate: { [key: string]: any } = { ...data };

      // Converte a string de equipamentos em array, se ela foi alterada
      if (typeof data.equipment === 'string') {
        dataToUpdate.equipment = data.equipment.split(',').map(item => item.trim());
      }
      // Garante que os campos numéricos sejam salvos como números
      if (data.floor) dataToUpdate.floor = Number(data.floor);
      if (data.capacity) dataToUpdate.capacity = Number(data.capacity);

      await updateDoc(docRef, dataToUpdate);
      return { success: true };
    } catch (error) {
      console.error("Erro ao atualizar sala:", error);
      return { success: false, error: "Falha ao atualizar sala." };
    }
  };

/**
 * Deleta uma sala do Firestore.
 */
export const deleteRoom = async (id: string) => {
  try {
    const docRef = doc(db, 'rooms', id);
    await deleteDoc(docRef);
    return { success: true };
  } catch (error) {
    console.error("Erro ao deletar sala:", error);
    return { success: false, error: "Falha ao deletar sala." };
  }
};