// services/communicationService.ts
// Os avisos da clínica (coleção communications). Para quem vai cada aviso, o que é novo e quem
// pode mexer estão em lib/avisos.ts; as regras do banco seguem o mesmo desenho.
import { db } from "@/lib/firebaseConfig";
import { ehGestao } from "@/lib/permissoes";
import { PapelDeUsuario, PublicoDoAviso, publicosQueRecebe } from "@/lib/avisos";
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  limit,
  orderBy,
  query,
  Timestamp,
  updateDoc,
  where,
} from "firebase/firestore";
import { FirestoreUser } from "@/context/AuthContext";

// --- Interfaces ---
export interface Communication {
  id: string;
  title: string;
  message: string;
  authorId: string;
  authorName: string;
  createdAt: Timestamp;
  isImportant: boolean;
  targetRole: PublicoDoAviso;
  readBy: { [uid: string]: Timestamp };
}

export interface CommunicationFormData {
  title: string;
  message: string;
  isImportant: boolean;
  targetRole: PublicoDoAviso;
}

/** Uma pessoa com cadastro aprovado: é com elas que se conta quem recebeu e quem leu cada aviso. */
export interface PessoaDaClinica {
  uid: string;
  displayName: string;
  papel: PapelDeUsuario;
}

// --- Funções do Serviço ---

/**
 * Os avisos que a pessoa pode ver, do mais novo para o mais antigo. A gestão vê todos; os demais
 * buscam só os do seu público, como as regras exigem. A ordem é feita aqui, sem índice no banco.
 */
export const getCommunications = async (userRole: string): Promise<Communication[]> => {
  try {
    const avisos = collection(db, "communications");
    let busca;
    if (ehGestao(userRole)) {
      busca = avisos;
    } else {
      const publicos = publicosQueRecebe(userRole as PapelDeUsuario);
      if (publicos.length === 0) return [];
      busca = query(avisos, publicos.length === 1 ? where("targetRole", "==", publicos[0]) : where("targetRole", "in", publicos));
    }
    const snapshot = await getDocs(busca);
    return snapshot.docs
      .map((aviso) => ({ id: aviso.id, ...aviso.data() }) as Communication)
      .sort((a, b) => (b.createdAt?.toMillis() ?? 0) - (a.createdAt?.toMillis() ?? 0));
  } catch (error) {
    console.error("Erro ao buscar avisos:", error);
    return [];
  }
};

// Só para o sininho: a gestão contava os novos lendo todos os avisos já publicados; os 30 mais
// recentes bastam (menos leituras). Os demais papéis já recebem só os do seu público.
const AVISOS_DO_SININHO = 30;

export const getAvisosParaContar = async (userRole: string): Promise<Communication[]> => {
  if (!ehGestao(userRole)) return getCommunications(userRole);
  try {
    const snapshot = await getDocs(query(collection(db, "communications"), orderBy("createdAt", "desc"), limit(AVISOS_DO_SININHO)));
    return snapshot.docs.map((aviso) => ({ id: aviso.id, ...aviso.data() }) as Communication);
  } catch (error) {
    console.error("Erro ao buscar avisos:", error);
    return [];
  }
};

export const createCommunication = async (data: CommunicationFormData, author: FirestoreUser) => {
  try {
    const novo = await addDoc(collection(db, "communications"), {
      ...data,
      authorId: author.uid,
      authorName: author.displayName,
      createdAt: Timestamp.now(),
      readBy: {},
    });
    return { success: true, id: novo.id };
  } catch (error) {
    console.error("Erro ao enviar aviso:", error);
    return { success: false, error: "Não foi possível enviar o aviso." };
  }
};

/** Edita o título e o texto de um aviso (quem recebe não muda depois de enviado). */
export const updateCommunication = async (id: string, data: { title: string; message: string }) => {
  try {
    await updateDoc(doc(db, "communications", id), data);
    return { success: true };
  } catch (error) {
    console.error("Erro ao editar aviso:", error);
    return { success: false, error: "Não foi possível salvar o aviso." };
  }
};

/** Confirma a leitura (ou o "Estou ciente" dos importantes) de quem está usando. */
export const markCommunicationAsRead = async (communicationId: string, userId: string) => {
  try {
    await updateDoc(doc(db, "communications", communicationId), { [`readBy.${userId}`]: Timestamp.now() });
    return { success: true };
  } catch (error) {
    console.error("Erro ao marcar aviso como lido:", error);
    return { success: false, error: "Não foi possível confirmar a leitura." };
  }
};

export const deleteCommunication = async (communicationId: string) => {
  try {
    await deleteDoc(doc(db, "communications", communicationId));
    return { success: true };
  } catch (error) {
    console.error("Erro ao excluir aviso:", error);
    return { success: false, error: "Não foi possível excluir o aviso." };
  }
};

/** As pessoas com cadastro aprovado e o papel de cada uma (só a gestão consegue ler). */
export const getPessoasDaClinica = async (): Promise<PessoaDaClinica[]> => {
  try {
    const snapshot = await getDocs(query(collection(db, "users"), where("profile.status", "==", "aprovado")));
    return snapshot.docs.map((pessoa) => ({
      uid: pessoa.id,
      displayName: pessoa.data().displayName,
      papel: pessoa.data().profile?.role,
    }));
  } catch (error) {
    console.error("Erro ao buscar as pessoas da clínica:", error);
    return [];
  }
};
