import { db } from "@/lib/firebaseConfig";
import {
  collection,
  addDoc,
  query,
  where,
  orderBy,
  onSnapshot,
  doc,
  updateDoc,
  getDoc,
  serverTimestamp,
  Timestamp,
  limit
} from "firebase/firestore";

// Interfaces
export interface ChatGroup {
  id: string;
  pacienteId: string;
  pacienteNome: string;
  responsavelId: string;
  responsavelNome: string; // Nome do familiar responsável
  terapeutaIds: string[]; // Lista de UIDs dos terapeutas
  terapeutaNomes: string[]; // Apenas para exibição rápida
  createdBy: string; // UID do coordenador
  createdAt: Timestamp;
  lastMessage?: {
    content: string;
    senderName: string;
    createdAt: Timestamp;
  };
  unreadCounts: Record<string, number>; // { "uid_do_usuario": 5 }
}

export interface ChatMessage {
  id: string;
  groupId: string;
  senderId: string;
  senderName: string;
  senderRole: string; // 'profissional', 'familiar', 'admin'
  content: string;
  createdAt: Timestamp | null; // Pode ser null localmente antes de salvar
  readBy: string[];
  type: 'text' | 'image' | 'file';
}

// --- Funções ---

// 1. Criar um novo grupo (Apenas Coordenadores/Admins)
export const createChatGroup = async (
  paciente: { uid: string; nome: string; responsavelNome: string },
  terapeutas: { uid: string; nome: string }[],
  coordenadorId: string
) => {
  try {
    const groupData = {
      pacienteId: paciente.uid,
      pacienteNome: paciente.nome,
      responsavelId: paciente.uid, // Assumindo que o login é do responsável
      responsavelNome: paciente.responsavelNome,
      terapeutaIds: terapeutas.map(t => t.uid),
      terapeutaNomes: terapeutas.map(t => t.nome),
      memberIds: [paciente.uid, coordenadorId, ...terapeutas.map(t => t.uid)], // Todos que têm acesso
      createdBy: coordenadorId,
      createdAt: serverTimestamp(),
      unreadCounts: {},
      lastMessage: null
    };
    
    const docRef = await addDoc(collection(db, "chat_groups"), groupData);
    return { success: true, id: docRef.id };
  } catch (error) {
    console.error("Erro ao criar grupo:", error);
    return { success: false, error };
  }
};

// 2. Inscrever-se para receber a lista de grupos do usuário em tempo real
export const subscribeToUserGroups = (userId: string, callback: (groups: ChatGroup[]) => void) => {
  const q = query(
    collection(db, "chat_groups"),
    where("memberIds", "array-contains", userId),
    orderBy("lastMessage.createdAt", "desc")
  );

  return onSnapshot(q, (snapshot) => {
    const groups = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ChatGroup));
    callback(groups);
  });
};

// 3. Inscrever-se para receber mensagens de um grupo específico em tempo real
export const subscribeToChatMessages = (groupId: string, callback: (messages: ChatMessage[]) => void) => {
  const q = query(
    collection(db, "chat_groups", groupId, "messages"),
    orderBy("createdAt", "asc"),
    limit(100) // Carrega as últimas 100
  );

  return onSnapshot(q, (snapshot) => {
    const messages = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ChatMessage));
    callback(messages);
  });
};

// 4. Enviar Mensagem
export const sendMessage = async (groupId: string, message: { content: string; senderId: string; senderName: string; senderRole: string; type?: 'text' | 'image' | 'file' }) => {
  try {
    const msgData = {
      ...message,
      type: message.type || 'text',
      createdAt: serverTimestamp(),
      readBy: [message.senderId]
    };

    // Adiciona na subcoleção de mensagens
    await addDoc(collection(db, "chat_groups", groupId, "messages"), msgData);

    // Atualiza a última mensagem do grupo para aparecer na lista
    const groupRef = doc(db, "chat_groups", groupId);
    await updateDoc(groupRef, {
      lastMessage: {
        content: message.type === 'image' ? '📷 Imagem' : message.content,
        senderName: message.senderName,
        createdAt: serverTimestamp()
      }
      // Aqui você poderia incrementar contadores de não lidos com lógica de transação se quisesse ser muito preciso
    });

    return { success: true };
  } catch (error) {
    console.error("Erro ao enviar mensagem:", error);
    return { success: false };
  }
};

// 5. Buscar detalhes de um único grupo
export const getGroupDetails = async (groupId: string) => {
    try {
        const docRef = doc(db, "chat_groups", groupId);
        const snap = await getDoc(docRef);
        if (snap.exists()) return { id: snap.id, ...snap.data() } as ChatGroup;
        return null;
    } catch (error) {
        return null;
    }
}