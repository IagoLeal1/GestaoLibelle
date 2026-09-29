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
  getDocs,
  Timestamp,
  limitToLast,
  endBefore,
  writeBatch,
  serverTimestamp,
  FirestoreError
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
  memberIds: string[];
  createdBy: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  lastMessage?: {
    content: string;
    senderId?: string; // ausente nos grupos antigos
    senderName: string;
    createdAt: Timestamp;
  };
  unreadCounts: Record<string, number>;
}

export interface OlderMessagesPage {
  messages: ChatMessage[];
  hasMore: boolean;
}

export interface ChatMessage {
  id: string;
  groupId: string;
  senderId: string;
  senderName: string;
  senderRole: string;
  content: string;
  createdAt: Timestamp;
  readBy?: string[]; // só nas mensagens antigas; nunca foi usado
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

export const subscribeToUserGroups = (
  userId: string,
  callback: (groups: ChatGroup[]) => void,
  onError?: (error: FirestoreError) => void
) => {
  const q = query(
    collection(db, "chat_groups"),
    where("memberIds", "array-contains", userId),
    orderBy("updatedAt", "desc")
  );

  return onSnapshot(q, (snapshot) => {
    // Prévia recém-enviada ainda sem o horário do servidor: usa a estimativa local
    const groups = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data({ serverTimestamps: 'estimate' }) } as ChatGroup));
    callback(groups);
  }, onError);
};

export const subscribeToChatMessages = (
  groupId: string,
  callback: (messages: ChatMessage[]) => void,
  onError?: (error: FirestoreError) => void
) => {
  const q = query(
    collection(db, "chat_groups", groupId, "messages"),
    orderBy("createdAt", "asc"),
    limitToLast(100)
  );

  return onSnapshot(q, (snapshot) => {
    // Mensagem recém-enviada ainda sem o horário do servidor: usa a estimativa local
    const messages = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data({ serverTimestamps: 'estimate' }) } as ChatMessage));
    callback(messages);
  }, onError);
};

// Junta as mensagens da tela com as que chegaram (janela ao vivo ou página antiga).
// Nenhuma some da tela, a versão mais nova de cada uma prevalece e a lista sai em ordem de envio.
export const mergeMessages = (current: ChatMessage[], incoming: ChatMessage[]): ChatMessage[] => {
  const byId = new Map(current.map(message => [message.id, message]));
  incoming.forEach(message => byId.set(message.id, message));
  return [...byId.values()].sort((a, b) => a.createdAt.toMillis() - b.createdAt.toMillis());
};

// Página de mensagens imediatamente anteriores a `before` (a mais antiga já exibida), em ordem crescente.
export const loadOlderMessages = async (
  groupId: string,
  before: ChatMessage,
  pageSize = 50
): Promise<OlderMessagesPage> => {
  const q = query(
    collection(db, "chat_groups", groupId, "messages"),
    orderBy("createdAt", "asc"),
    endBefore(before.createdAt),
    // Uma a mais, só para saber se ainda existem mensagens antes desta página
    limitToLast(pageSize + 1)
  );

  const snapshot = await getDocs(q);
  const messages = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ChatMessage));
  const hasMore = messages.length > pageSize;

  return {
    messages: hasMore ? messages.slice(1) : messages,
    hasMore,
  };
};

export const sendMessage = async (groupId: string, message: { content: string; senderId: string; senderName: string; senderRole: string; type?: 'text' | 'image' | 'file' }) => {
  try {
    // Horário do servidor: o relógio do aparelho pode estar errado e bagunçar a ordem
    const agora = serverTimestamp();
    const msgData = {
      ...message,
      type: message.type || 'text',
      createdAt: agora
    };

    // Mensagem e prévia da conversa vão juntas: ou as duas são gravadas, ou nenhuma
    const batch = writeBatch(db);
    batch.set(doc(collection(db, "chat_groups", groupId, "messages")), msgData);
    batch.update(doc(db, "chat_groups", groupId), {
      lastMessage: {
        content: message.type === 'image' ? '📷 Imagem' : message.content,
        senderId: message.senderId,
        senderName: message.senderName,
        createdAt: agora
      },
      updatedAt: agora
    });
    await batch.commit();

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

export const addProfessionalsToGroup = async (
  groupId: string,
  novosTerapeutas: { uid: string; nome: string }[]
) => {
  try {
    const groupRef = doc(db, "chat_groups", groupId);
    const snap = await getDoc(groupRef);
    if (!snap.exists()) return { success: false, error: "Grupo não encontrado" };
    
    const data = snap.data() as ChatGroup;
    
    const existingIds = data.terapeutaIds || [];
    const existingNames = data.terapeutaNomes || [];
    const memberIds = data.memberIds || [];
    
    const newProfessionals = novosTerapeutas.filter(t => !existingIds.includes(t.uid));
    
    if (newProfessionals.length === 0) return { success: true };
    
    const newIds = newProfessionals.map(t => t.uid);
    const newNames = newProfessionals.map(t => t.nome);
    
    await updateDoc(groupRef, {
        terapeutaIds: [...existingIds, ...newIds],
        terapeutaNomes: [...existingNames, ...newNames],
        memberIds: [...memberIds, ...newIds],
        updatedAt: Timestamp.now()
    });
    
    return { success: true };
  } catch (error) {
    console.error("Erro ao adicionar profissionais:", error);
    return { success: false, error };
  }
};