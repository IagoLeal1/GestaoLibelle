// services/chatService.ts
import { db } from "@/lib/firebaseConfig";
import type { FirestoreUser } from "@/context/AuthContext";
import { getAllApprovedUsers } from "@/services/adminService";
import { getAppointmentsForReport } from "@/services/appointmentService";
import { getPatientById } from "@/services/patientService";
import { getProfessionalById } from "@/services/professionalService";
import {
  collection,
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
  // Gravados na criação só por compatibilidade: a versão anterior do app (aberta no navegador de
  // alguém durante a publicação) lê esses campos e quebraria sem eles. A tela nova não os usa:
  // a equipe vem de memberIds + users. responsavelId também identifica os grupos antigos.
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
  unreadCounts: Record<string, number>; // compatibilidade, como os campos acima
  lastReadAt?: Record<string, Timestamp>; // até quando cada participante leu a conversa
}

// Conversa sem registro de leitura conta como lida até esta data: assim, ao publicar,
// as conversas antigas não aparecem todas como novas.
export const UNREAD_TRACKING_START = new Date("2026-09-29T00:00:00-03:00");

// Até quando `uid` leu a conversa (a data de corte, se nunca abriu depois dela)
export const readUntil = (group: ChatGroup, uid: string): Timestamp =>
  group.lastReadAt?.[uid] ?? Timestamp.fromDate(UNREAD_TRACKING_START);

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

// Papel do cadastro (profile.role)
export type Papel = FirestoreUser["profile"]["role"];

// Participante de uma conversa
export interface ChatMember {
  uid: string;
  nome: string;
  papel: Papel;
}

// --- FUNÇÕES ---

// Cada paciente tem no máximo um grupo, com id fixo
export const patientGroupId = (pacienteId: string) => `paciente-${pacienteId}`;

// Grupos antigos foram criados com a conta da família no lugar do paciente
export const isLegacyGroup = (group: ChatGroup) => group.pacienteId === group.responsavelId;

// Admin e coordenação acompanham todas as conversas e cuidam dos participantes (como nas regras)
export const isChatSupervisor = (role?: string) => role === "admin" || role === "coordenador";

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
  });
};

// Pessoas que podem entrar numa conversa: todo cadastro aprovado, em ordem alfabética
export const getApprovedPeople = async (): Promise<ChatMember[]> =>
  (await getAllApprovedUsers())
    .map(usuario => ({ uid: usuario.id, nome: usuario.displayName ?? "", papel: usuario.profile?.role }))
    .sort((a, b) => a.nome.localeCompare(b.nome, "pt-BR"));

// Nome e papel de cada participante, lidos do cadastro (users), na ordem de `memberIds`.
// Quem foi excluído do sistema não aparece.
export const getGroupMembers = async (memberIds: string[]): Promise<ChatMember[]> => {
  const encontrados = new Map<string, ChatMember>();
  // O Firestore aceita no máximo 30 ids por consulta "in"
  for (let i = 0; i < memberIds.length; i += 30) {
    const lote = query(collection(db, "users"), where(documentId(), "in", memberIds.slice(i, i + 30)));
    (await getDocs(lote)).forEach(usuario => {
      const dados = usuario.data();
      encontrados.set(usuario.id, { uid: usuario.id, nome: dados.displayName ?? "", papel: dados.profile?.role });
    });
  }
  return memberIds.flatMap(id => encontrados.get(id) ?? []);
};

// Quem sugerir para o grupo novo de um paciente: a conta da família vinculada e os terapeutas
// com atendimento nos últimos 90 dias ou nos próximos 60 (profissional ligado à conta por professionals.userId).
// A consulta de agendamentos por paciente e período é a mesma da grade de agendamentos (índice já existente).
export const getPatientTeamSuggestion = async (patientId: string): Promise<{ familia: string[]; terapeutas: string[] }> => {
  const dia = 24 * 60 * 60 * 1000;
  const [paciente, agendamentos] = await Promise.all([
    getPatientById(patientId),
    getAppointmentsForReport({ patientId, startDate: new Date(Date.now() - 90 * dia), endDate: new Date(Date.now() + 60 * dia) }),
  ]);
  const familia = paciente?.userId ? [paciente.userId] : [];

  const profissionais = await Promise.all([...new Set(agendamentos.map(a => a.professionalId))].map(getProfessionalById));
  const terapeutas = [...new Set(profissionais.map(p => p?.userId).filter((uid): uid is string => !!uid))];

  return { familia, terapeutas };
};

// Id do grupo já ligado à criança (inclusive um grupo antigo vinculado pela tela), fora `ignorar`
const findPatientGroup = async (pacienteId: string, ignorar?: string): Promise<string | undefined> => {
  const ligados = await getDocs(query(collection(db, "chat_groups"), where("pacienteId", "==", pacienteId), limit(2)));
  return ligados.docs.map(grupo => grupo.id).find(id => id !== ignorar);
};

// Liga um grupo antigo à criança (só a coordenação pode). Cada criança tem um grupo só:
// se ela já tiver outro, não liga e devolve o id dele.
export const linkGroupToPatient = async (
  groupId: string,
  paciente: { id: string; nome: string }
): Promise<{ success: true } | { success: false; id: string; error: "ja-existe" }> => {
  const outro = await findPatientGroup(paciente.id, groupId);
  if (outro) return { success: false, id: outro, error: "ja-existe" };

  await updateDoc(doc(db, "chat_groups", groupId), {
    pacienteId: paciente.id,
    pacienteNome: paciente.nome,
  });
  return { success: true };
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
    const vinculado = await findPatientGroup(paciente.id);
    if (vinculado) return { success: false, id: vinculado, error: "ja-existe" };

    const criado = await runTransaction(db, async (transacao) => {
      if ((await transacao.get(ref)).exists()) return false;
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
      return true;
    });
    return criado ? { success: true, id } : { success: false, id, error: "ja-existe" };
  } catch (error) {
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
  const q = query(collection(db, "chat_groups", group.id, "messages"), where("createdAt", ">", readUntil(group, uid)));
  const snapshot = await getCountFromServer(q);
  return snapshot.data().count;
};

// A última mensagem da conversa é de outra pessoa e chegou depois da última leitura de `uid`?
export const hasUnread = (group: ChatGroup, uid: string): boolean => {
  const last = group.lastMessage;
  if (!last?.createdAt || last.senderId === uid) return false;
  return last.createdAt.toMillis() > readUntil(group, uid).toMillis();
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
  // A mensagem recém-enviada volta do servidor com outro horário: o id evita mostrá-la duas vezes
  const latestIds = new Set(latest.map(message => message.id));
  return [
    ...earlier.filter(message => message.createdAt.toMillis() < latestStart && !latestIds.has(message.id)),
    ...latest,
  ];
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
    const envio = batch.commit();
    // Quem responde já leu tudo até aqui. A marcação entra na fila logo atrás da mensagem (o SDK
    // grava na ordem), sem esperar a confirmação: assim ela vale mesmo se a pessoa fechar a tela
    // logo depois, e a própria mensagem não conta como nova quando alguém responder.
    const leitura = markChatAsRead(groupId, message.senderId)
      .catch(erro => console.error("Erro ao marcar a conversa como lida:", erro));
    await envio;
    await leitura;

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