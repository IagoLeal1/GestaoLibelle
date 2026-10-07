// services/prontuarioService.ts
// As anotações do prontuário no banco: patients/{criança}/anotacoes. Quem lê e escreve está em
// firestore.rules (como as evoluções: a equipe da criança, a coordenação e o admin). O terapeuta escreve
// só na terapia dele, mandando uma sessão sua com a criança como prova; ninguém apaga.
import { db } from "@/lib/firebaseConfig";
import {
  collection, doc, DocumentData, getDocs, limit, orderBy, query, serverTimestamp, updateDoc, where, writeBatch,
} from "firebase/firestore";
import type { Anotacao } from "@/lib/prontuario";

const anotacoesRef = (patientId: string) => collection(db, "patients", patientId, "anotacoes");
const equipeRef = (patientId: string, uid: string) => doc(db, "patients", patientId, "equipe", uid);

const paraAnotacao = (id: string, d: DocumentData): Anotacao => ({
  id,
  terapia: d.terapia ?? "",
  texto: d.texto ?? "",
  fixada: d.fixada === true,
  autorId: d.autorId,
  autorNome: d.autorNome ?? "",
  criadoEm: d.criadoEm?.toDate?.(),
  editadoEm: d.editadoEm?.toDate?.(),
});

const maisNovaPrimeiro = (a: Anotacao, b: Anotacao) => (b.criadoEm?.getTime() ?? 0) - (a.criadoEm?.getTime() ?? 0);

/** Todas as anotações da criança (de todas as terapias), das mais novas para as mais antigas. */
export async function getAnotacoes(patientId: string): Promise<Anotacao[]> {
  const snap = await getDocs(query(anotacoesRef(patientId), orderBy("criadoEm", "desc"), limit(300)));
  return snap.docs.map((d) => paraAnotacao(d.id, d.data()));
}

/** O "Para lembrar" de uma terapia: só as fixadas (duas igualdades, sem índice novo). */
export async function getParaLembrar(patientId: string, terapia: string): Promise<Anotacao[]> {
  const snap = await getDocs(query(anotacoesRef(patientId), where("terapia", "==", terapia), where("fixada", "==", true)));
  return snap.docs.map((d) => paraAnotacao(d.id, d.data())).sort(maisNovaPrimeiro);
}

export interface CamposDaAnotacao {
  terapia: string;
  texto: string;
  fixada: boolean;
  /** Uma sessão do terapeuta com a criança, naquela terapia: a prova que as regras pedem. */
  atendimentoId: string;
}

/** Escreve a anotação e, junto, garante o terapeuta na equipe da criança (para ler o prontuário). */
export async function escreverAnotacao(patientId: string, autor: { uid: string; nome: string }, campos: CamposDaAnotacao): Promise<Anotacao> {
  const nova = doc(anotacoesRef(patientId));
  const dados = {
    terapia: campos.terapia,
    texto: campos.texto.trim(),
    fixada: campos.fixada,
    autorId: autor.uid,
    autorNome: autor.nome,
    atendimentoId: campos.atendimentoId,
  };
  const lote = writeBatch(db);
  lote.set(equipeRef(patientId, autor.uid), { atendimentoId: campos.atendimentoId, criadoEm: serverTimestamp() });
  lote.set(nova, { ...dados, criadoEm: serverTimestamp() });
  await lote.commit();
  return { id: nova.id, ...dados, criadoEm: new Date() };
}

/** Corrige o texto ou tira/põe em "Para lembrar" (só quem escreveu); fica marcada como editada. */
export async function corrigirAnotacao(patientId: string, id: string, campos: { texto: string; fixada: boolean }) {
  await updateDoc(doc(anotacoesRef(patientId), id), { texto: campos.texto.trim(), fixada: campos.fixada, editadoEm: serverTimestamp() });
}
