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
  FirestoreError,
  getCountFromServer,
  runTransaction,
  arrayUnion,
  arrayRemove,
  QuerySnapshot,
  documentId,
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
  lastReadAt?: Record<string, Timestamp>; // até quando cada participante leu a conversa
}

// Conversa sem registro de leitura conta como lida até esta data: assim, ao publicar,
// as conversas antigas não aparecem todas como novas.
export const UNREAD_TRACKING_START = new Date("2026-09-29T00:00:00-03:00");

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

// Participante de uma conversa (papel = profile.role do cadastro)
export interface ChatMember {
  uid: string;
  nome: string;
  papel: string;
}

// --- FUNÇÕES ---

// Cada paciente tem no máximo um grupo, com id fixo
export const patientGroupId = (pacienteId: string) => `paciente-${pacienteId}`;

// Grupos antigos foram criados com a conta da família no lugar do paciente
export const isLegacyGroup = (group: ChatGroup) => group.pacienteId === group.responsavelId;

// Coloca pessoas no grupo (só a coordenação pode). arrayUnion evita perder quem outra pessoa adicionou ao mesmo tempo.
export const addGroupMembers = async (groupId: string, membros: ChatMember[]) => {
  await updateDoc(doc(db, "chat_groups", groupId), {
    memberIds: arrayUnion(...membros.map(m => m.uid)),
  });
};

// Tira uma pessoa do grupo (só a coordenação pode); ela perde o acesso à conversa na hora
export const removeGroupMember = async (groupId: string, uid: string) => {
  await updateDoc(doc(db, "chat_groups", groupId), {
    memberIds: arrayRemove(uid),
    terapeutaIds: arrayRemove(uid),
  });
};

// Pessoas que podem entrar numa conversa: todo cadastro aprovado, em ordem alfabética
export const getApprovedPeople = async (): Promise<ChatMember[]> => {
  const aprovados = await getDocs(query(collection(db, "users"), where("profile.status", "==", "aprovado")));
  return aprovados.docs
    .map(usuario => ({ uid: usuario.id, nome: usuario.data().displayName as string, papel: usuario.data().profile?.role as string }))
    .sort((a, b) => a.nome.localeCompare(b.nome, "pt-BR"));
};

// Nome e papel de cada participante, lidos do cadastro (users), na ordem de `memberIds`.
// Quem foi excluído do sistema não aparece.
export const getGroupMembers = async (memberIds: string[]): Promise<ChatMember[]> => {
  const encontrados = new Map<string, ChatMember>();
  // O Firestore aceita no máximo 30 ids por consulta "in"
  for (let i = 0; i < memberIds.length; i += 30) {
    const lote = query(collection(db, "users"), where(documentId(), "in", memberIds.slice(i, i + 30)));
    (await getDocs(lote)).forEach(usuario => {
      const dados = usuario.data();
      encontrados.set(usuario.id, { uid: usuario.id, nome: dados.displayName, papel: dados.profile?.role });
    });
  }
  return memberIds.flatMap(id => encontrados.get(id) ?? []);
};

// Quem sugerir para o grupo novo de um paciente: a conta da família vinculada e os terapeutas
// com atendimento nos últimos 90 dias ou nos próximos 60 (profissional ligado à conta por professionals.userId).
export const getPatientTeamSuggestion = async (patientId: string): Promise<{ familia: string[]; terapeutas: string[] }> => {
  const paciente = (await getDoc(doc(db, "patients", patientId))).data();
  const familia = paciente?.userId ? [paciente.userId as string] : [];

  // Só pelo paciente (índice simples) e o período filtrado aqui: evita exigir índice composto em produção
  const agendamentos = await getDocs(query(collection(db, "appointments"), where("patientId", "==", patientId), limit(500)));
  const dia = 24 * 60 * 60 * 1000;
  const inicio = Date.now() - 90 * dia;
  const fim = Date.now() + 60 * dia;
  const profissionalIds = new Set(
    agendamentos.docs
      .map(agendamento => agendamento.data())
      .filter(a => a.start?.toMillis() >= inicio && a.start?.toMillis() <= fim)
      .map(a => a.professionalId as string)
  );

  const profissionais = await Promise.all([...profissionalIds].map(id => getDoc(doc(db, "professionals", id))));
  const terapeutas = [...new Set(profissionais.map(p => p.data()?.userId as string | undefined).filter((uid): uid is string => !!uid))];

  return { familia, terapeutas };
};

// Liga um grupo antigo à criança (só a coordenação pode)
export const linkGroupToPatient = async (groupId: string, paciente: { id: string; nome: string }) => {
  await updateDoc(doc(db, "chat_groups", groupId), {
    pacienteId: paciente.id,
    pacienteNome: paciente.nome,
  });
};

// Cria o grupo de conversa de um paciente. Se ele já existir, não sobrescreve e avisa.
export const createPatientChatGroup = async ({ paciente, membros, criadoPor }: {
  paciente: { id: string; nome: string };
  membros: ChatMember[];
  criadoPor: string;
}): Promise<{ success: true; id: string } | { success: false; id: string; error: "ja-existe" | "falha" }> => {
  const id = patientGroupId(paciente.id);
  const ref = doc(db, "chat_groups", id);
  const familia = membros.filter(m => m.papel === "familiar");
  const terapeutas = membros.filter(m => m.papel === "profissional");

  try {
    // Um grupo antigo ligado à criança pela tela tem outro id, então a transação abaixo não o enxergaria
    const vinculado = await getDocs(query(collection(db, "chat_groups"), where("pacienteId", "==", paciente.id), limit(1)));
    if (!vinculado.empty) return { success: false, id: vinculado.docs[0].id, error: "ja-existe" };

    await runTransaction(db, async (transacao) => {
      if ((await transacao.get(ref)).exists()) throw new Error("ja-existe");
      const agora = serverTimestamp();
      transacao.set(ref, {
        pacienteId: paciente.id,
        pacienteNome: paciente.nome,
        responsavelId: familia[0]?.uid ?? "",
        responsavelNome: familia.map(f => f.nome).join(", "),
        terapeutaIds: terapeutas.map(t => t.uid),
        terapeutaNomes: terapeutas.map(t => t.nome),
        memberIds: [...new Set([criadoPor, ...membros.map(m => m.uid)])],
        createdBy: criadoPor,
        createdAt: agora,
        updatedAt: agora,
        unreadCounts: {},
        lastReadAt: {},
        lastMessage: null,
      });
    });
    return { success: true, id };
  } catch (error) {
    if (error instanceof Error && error.message === "ja-existe") return { success: false, id, error: "ja-existe" };
    console.error("Erro ao criar grupo do paciente:", error);
    return { success: false, id, error: "falha" };
  }
};

// Registra que `uid` leu a conversa até agora (horário do servidor)
export const markChatAsRead = async (groupId: string, uid: string) => {
  await updateDoc(doc(db, "chat_groups", groupId), { [`lastReadAt.${uid}`]: serverTimestamp() });
};

// Quantas mensagens chegaram depois da última leitura de `uid` (conta no servidor, sem baixar as mensagens)
export const countUnreadMessages = async (group: ChatGroup, uid: string): Promise<number> => {
  const desde = group.lastReadAt?.[uid] ?? Timestamp.fromDate(UNREAD_TRACKING_START);
  const q = query(collection(db, "chat_groups", group.id, "messages"), where("createdAt", ">", desde));
  const snapshot = await getCountFromServer(q);
  return snapshot.data().count;
};

// A última mensagem da conversa é de outra pessoa e chegou depois da última leitura de `uid`?
export const hasUnread = (group: ChatGroup, uid: string): boolean => {
  const last = group.lastMessage;
  if (!last?.createdAt || last.senderId === uid) return false;
  const lidoAte = group.lastReadAt?.[uid]?.toMillis() ?? UNREAD_TRACKING_START.getTime();
  return last.createdAt.toMillis() > lidoAte;
};

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

  return onSnapshot(q, (snapshot) => callback(groupsFromSnapshot(snapshot)), onError);
};

// Todas as conversas da clínica, para a supervisão da coordenação (as regras barram os demais perfis)
export const subscribeToAllGroups = (
  callback: (groups: ChatGroup[]) => void,
  onError?: (error: FirestoreError) => void
) => {
  const q = query(collection(db, "chat_groups"), orderBy("updatedAt", "desc"));
  return onSnapshot(q, (snapshot) => callback(groupsFromSnapshot(snapshot)), onError);
};

// Prévia recém-enviada ainda sem o horário do servidor: usa a estimativa local
const groupsFromSnapshot = (snapshot: QuerySnapshot) =>
  snapshot.docs.map(doc => ({ id: doc.id, ...doc.data({ serverTimestamps: 'estimate' }) } as ChatGroup));

// Quantas mensagens recentes a conversa acompanha ao vivo; as anteriores vêm por loadOlderMessages
export const LIVE_WINDOW_SIZE = 100;

export const subscribeToChatMessages = (
  groupId: string,
  callback: (messages: ChatMessage[]) => void,
  onError?: (error: FirestoreError) => void
) => {
  const q = query(
    collection(db, "chat_groups", groupId, "messages"),
    orderBy("createdAt", "asc"),
    limitToLast(LIVE_WINDOW_SIZE)
  );

  return onSnapshot(q, (snapshot) => {
    // Mensagem recém-enviada ainda sem o horário do servidor: usa a estimativa local
    const messages = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data({ serverTimestamps: 'estimate' }) } as ChatMessage));
    callback(messages);
  }, onError);
};

// Como a conversa aparece na tela: divisória de dia, divisória "Novas mensagens" e grupos
// de mensagens seguidas da mesma pessoa (mesmo dia, até 5 minutos entre uma e outra).
export type TimelineItem =
  | { kind: "day"; key: string; date: Date }
  | { kind: "unread"; key: string }
  | {
      kind: "group";
      key: string;
      senderId: string;
      senderName: string;
      senderRole: string;
      mine: boolean;
      messages: ChatMessage[];
    };

const GROUP_WINDOW_MS = 5 * 60 * 1000;

// `readUntil`: até quando `uid` tinha lido ao abrir a conversa (null = não marcar novas)
export const buildTimeline = (messages: ChatMessage[], uid: string, readUntil: Timestamp | null): TimelineItem[] => {
  const items: TimelineItem[] = [];
  let currentDay = "";
  let group: Extract<TimelineItem, { kind: "group" }> | null = null;
  let unreadMarked = false;

  for (const message of messages) {
    const date = message.createdAt.toDate();
    const day = date.toDateString();
    if (day !== currentDay) {
      currentDay = day;
      group = null;
      items.push({ kind: "day", key: `day-${day}`, date });
    }

    const isNew = readUntil !== null && message.senderId !== uid && message.createdAt.toMillis() > readUntil.toMillis();
    if (isNew && !unreadMarked) {
      unreadMarked = true;
      group = null;
      items.push({ kind: "unread", key: "unread" });
    }

    const previous = group?.messages.at(-1);
    const continues = group !== null && previous !== undefined && group.senderId === message.senderId
      && message.createdAt.toMillis() - previous.createdAt.toMillis() <= GROUP_WINDOW_MS;
    if (continues && group) {
      group.messages.push(message);
    } else {
      group = {
        kind: "group",
        key: message.id,
        senderId: message.senderId,
        senderName: message.senderName,
        senderRole: message.senderRole,
        mine: message.senderId === uid,
        messages: [message],
      };
      items.push(group);
    }
  }
  return items;
};

// Junta a lista `earlier` com a `latest`, as duas em ordem de envio.
// Uso: (mensagens da tela, janela ao vivo nova) ou (página antiga, mensagens da tela).
// A partir do início de `latest`, vale só `latest`: assim some da tela uma mensagem que o
// servidor recusou. De `earlier` ficam só as mais antigas, como as que saíram da janela ao vivo
// porque chegaram novas.
export const mergeMessages = (earlier: ChatMessage[], latest: ChatMessage[]): ChatMessage[] => {
  if (latest.length === 0) return [];
  const latestStart = latest[0].createdAt.toMillis();
  return [...earlier.filter(message => message.createdAt.toMillis() < latestStart), ...latest];
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