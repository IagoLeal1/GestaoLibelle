// services/chatService.ts
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
  Timestamp,
  limit
} from "firebase/firestore";

// --- INTERFACES (Obrigatório ter 'export' nelas) ---
export interface ChatGroup {
  id: string;
  pacienteId: string;
  pacienteNome: string;
  responsavelId: string;
  responsavelNome: string;
  terapeutaIds: string[];
  terapeutaNomes: string[];
  createdBy: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  lastMessage?: {
    content: string;
    senderName: string;
    createdAt: Timestamp;
  };
  unreadCounts: Record<string, number>;
}

export interface ChatMessage {
  id: string;
  groupId: string;
  senderId: string;
  senderName: string;
  senderRole: string;
  content: string;
  createdAt: Timestamp; 
  readBy: string[];
  type: 'text' | 'image' | 'file';
}

// --- FUNÇÕES ---

export const createChatGroup = async (
  paciente: { uid: string; nome: string; responsavelNome: string },
  terapeutas: { uid: string; nome: string }[],
  coordenadorId: string
) => {
  try {
    const agora = Timestamp.now();
    const groupData = {
      pacienteId: paciente.uid,
      pacienteNome: paciente.nome,
      responsavelId: paciente.uid,
      responsavelNome: paciente.responsavelNome,
      terapeutaIds: terapeutas.map(t => t.uid),
      terapeutaNomes: terapeutas.map(t => t.nome),
      memberIds: [paciente.uid, coordenadorId, ...terapeutas.map(t => t.uid)],
      createdBy: coordenadorId,
      createdAt: agora,
      updatedAt: agora,
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

export const subscribeToUserGroups = (userId: string, callback: (groups: ChatGroup[]) => void) => {
  const q = query(
    collection(db, "chat_groups"),
    where("memberIds", "array-contains", userId),
    orderBy("updatedAt", "desc")
  );

  return onSnapshot(q, (snapshot) => {
    const groups = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ChatGroup));
    callback(groups);
  });
};

export const subscribeToChatMessages = (groupId: string, callback: (messages: ChatMessage[]) => void) => {
  const q = query(
    collection(db, "chat_groups", groupId, "messages"),
    orderBy("createdAt", "asc"),
    limit(100)
  );

  return onSnapshot(q, (snapshot) => {
    const messages = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ChatMessage));
    callback(messages);
  });
};

export const sendMessage = async (groupId: string, message: { content: string; senderId: string; senderName: string; senderRole: string; type?: 'text' | 'image' | 'file' }) => {
  try {
    const agora = Timestamp.now(); 
    const msgData = {
      ...message,
      type: message.type || 'text',
      createdAt: agora,
      readBy: [message.senderId]
    };

    await addDoc(collection(db, "chat_groups", groupId, "messages"), msgData);

    const groupRef = doc(db, "chat_groups", groupId);
    await updateDoc(groupRef, {
      lastMessage: {
        content: message.type === 'image' ? '📷 Imagem' : message.content,
        senderName: message.senderName,
        createdAt: agora
      },
      updatedAt: agora
    });

    return { success: true };
  } catch (error) {
    console.error("Erro ao enviar mensagem:", error);
    return { success: false };
  }
};

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