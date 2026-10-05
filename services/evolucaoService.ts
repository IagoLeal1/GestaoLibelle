// services/evolucaoService.ts
// As evoluções diárias no banco: patients/{criança}/evolucoes/{atendimento}, uma por sessão.
// Quem lê e escreve está em firestore.rules; o que está pendente ou incompatível, em lib/evolucoes.ts.
// O terapeuta só lê a história das crianças cuja equipe ele integra (patients/{criança}/equipe/{uid}).
// Ele entra sozinho, com uma sessão dele com a criança como prova.
// A sessão da agenda recebe junto a marca da evolução (escrita ou "nao_aconteceu"), sem o texto:
// é por ela que as pendências e os alertas saem da agenda, sem ler cada evolução.
import { db } from "@/lib/firebaseConfig";
import {
  collection, deleteField, doc, DocumentData, getDoc, getDocs, limit, orderBy, query, QueryDocumentSnapshot,
  serverTimestamp, setDoc, startAfter, Timestamp, where, writeBatch,
} from "firebase/firestore";
import type { Appointment } from "@/services/appointmentService";
import { ultimaEvolucao, type Evolucao, type MarcaDaEvolucao, type SessaoDaAgenda } from "@/lib/evolucoes";

export interface CamposDaEvolucao {
  aconteceu: boolean;
  texto: string;
}

const POR_PAGINA = 30;

const evolucaoRef = (patientId: string, appointmentId: string) => doc(db, "patients", patientId, "evolucoes", appointmentId);
const equipeRef = (patientId: string, uid: string) => doc(db, "patients", patientId, "equipe", uid);
const sessaoRef = (appointmentId: string) => doc(db, "appointments", appointmentId);
const marca = (aconteceu: boolean): MarcaDaEvolucao => (aconteceu ? "escrita" : "nao_aconteceu");

const paraEvolucao = (dados: DocumentData): Evolucao => ({
  ...(dados as Evolucao),
  dataDaSessao: dados.dataDaSessao.toDate(),
  criadoEm: dados.criadoEm?.toDate(),
  editadoEm: dados.editadoEm?.toDate(),
});

/** Sem os espaços das pontas; quando a sessão não aconteceu, o texto fica vazio. */
const limpos = (campos: CamposDaEvolucao): CamposDaEvolucao =>
  campos.aconteceu ? { aconteceu: true, texto: campos.texto.trim() } : { aconteceu: false, texto: "" };

/** A sessão da agenda no formato das evoluções (datas em Date). */
export const sessaoDaAgenda = (a: Appointment): SessaoDaAgenda => ({
  id: a.id,
  patientId: a.patientId,
  patientName: a.patientName ?? "",
  professionalId: a.professionalId,
  professionalName: a.professionalName ?? "",
  tipo: a.tipo ?? "",
  start: a.start.toDate(),
  end: a.end?.toDate(),
  status: a.status,
  evolucao: a.evolucao,
});

/**
 * Escreve a evolução da sessão (ou informa que ela não aconteceu). Os dados da sessão vêm da agenda,
 * lidos na hora; o terapeuta entra junto na equipe da criança.
 */
export async function escreverEvolucao(appointmentId: string, autor: { uid: string; nome: string }, campos: CamposDaEvolucao): Promise<Evolucao> {
  const sessao = await getDoc(sessaoRef(appointmentId));
  if (!sessao.exists()) throw new Error("Sessão não encontrada na agenda.");
  const a = sessao.data();
  const dados = {
    appointmentId,
    patientId: a.patientId,
    patientName: a.patientName ?? "",
    professionalId: a.professionalId,
    professionalName: a.professionalName ?? "",
    terapia: a.tipo ?? "",
    dataDaSessao: a.start,
    autorId: autor.uid,
    autorNome: autor.nome,
    ...limpos(campos),
  };
  const lote = writeBatch(db);
  lote.set(equipeRef(a.patientId, autor.uid), { atendimentoId: appointmentId, criadoEm: serverTimestamp() });
  lote.set(evolucaoRef(a.patientId, appointmentId), { ...dados, criadoEm: serverTimestamp() });
  lote.update(sessaoRef(appointmentId), { evolucao: marca(dados.aconteceu) });
  await lote.commit();
  return { ...dados, dataDaSessao: a.start.toDate(), criadoEm: new Date() };
}

/** Corrige a evolução (só quem escreveu); ela fica marcada como editada. */
export async function corrigirEvolucao(patientId: string, appointmentId: string, campos: CamposDaEvolucao) {
  const corrigidos = limpos(campos);
  const lote = writeBatch(db);
  lote.update(evolucaoRef(patientId, appointmentId), { ...corrigidos, editadoEm: serverTimestamp() });
  lote.update(sessaoRef(appointmentId), { evolucao: marca(corrigidos.aconteceu) });
  await lote.commit();
}

/** Apaga a evolução e tira a marca da sessão: ela volta a ficar pendente. */
export async function apagarEvolucao(patientId: string, appointmentId: string) {
  const lote = writeBatch(db);
  lote.delete(evolucaoRef(patientId, appointmentId));
  lote.update(sessaoRef(appointmentId), { evolucao: deleteField() });
  await lote.commit();
}

/** Coloca o terapeuta na equipe de cada criança das sessões dele, para ele poder ler a história delas. */
export async function entrarNasEquipes(uid: string, sessoes: Pick<SessaoDaAgenda, "id" | "patientId" | "status">[]) {
  const provaPorCrianca = new Map<string, string>();
  for (const s of sessoes) {
    if (s.status !== "cancelado" && !provaPorCrianca.has(s.patientId)) provaPorCrianca.set(s.patientId, s.id);
  }
  await Promise.all(
    [...provaPorCrianca].map(async ([patientId, atendimentoId]) => {
      if ((await getDoc(equipeRef(patientId, uid))).exists()) return;
      await setDoc(equipeRef(patientId, uid), { atendimentoId, criadoEm: serverTimestamp() });
    })
  );
}

/** Para abrir a história de uma criança: entra na equipe se o terapeuta tem sessão com ela. */
export async function entrarNaEquipeDaCrianca(uid: string, patientId: string, professionalId: string): Promise<boolean> {
  if ((await getDoc(equipeRef(patientId, uid))).exists()) return true;
  const sessoes = await getDocs(
    query(collection(db, "appointments"), where("patientId", "==", patientId), where("professionalId", "==", professionalId), limit(20))
  );
  const prova = sessoes.docs.find((s) => s.data().status !== "cancelado");
  if (!prova) return false;
  await setDoc(equipeRef(patientId, uid), { atendimentoId: prova.id, criadoEm: serverTimestamp() });
  return true;
}

/** A evolução de uma sessão (o id dela é o do atendimento). */
export async function getEvolucao(patientId: string, appointmentId: string): Promise<Evolucao | null> {
  const snap = await getDoc(evolucaoRef(patientId, appointmentId));
  return snap.exists() ? paraEvolucao(snap.data()) : null;
}

/** A evolução anterior da mesma terapia, para dar continuidade (olha as 10 sessões anteriores da criança). */
export async function getUltimaEvolucao(patientId: string, { terapia, antesDe }: { terapia: string; antesDe: Date }) {
  const snap = await getDocs(
    query(
      collection(db, "patients", patientId, "evolucoes"),
      where("dataDaSessao", "<", Timestamp.fromDate(antesDe)),
      orderBy("dataDaSessao", "desc"),
      limit(10)
    )
  );
  return ultimaEvolucao(snap.docs.map((d) => paraEvolucao(d.data())), { terapia, antesDe }) ?? null;
}

/** A história da criança, das mais recentes para as mais antigas, de 30 em 30. */
export async function getHistoriaDaCrianca(patientId: string, depoisDe?: QueryDocumentSnapshot<DocumentData> | null) {
  const snap = await getDocs(
    query(
      collection(db, "patients", patientId, "evolucoes"),
      orderBy("dataDaSessao", "desc"),
      ...(depoisDe ? [startAfter(depoisDe)] : []),
      limit(POR_PAGINA)
    )
  );
  return {
    evolucoes: snap.docs.map((d) => paraEvolucao(d.data())),
    ultimo: snap.docs.at(-1) ?? null,
    temMais: snap.docs.length === POR_PAGINA,
  };
}

/** As sessões da agenda pelos ids (para ver o que a recepção marcou em cada uma). */
export async function getSessoesPorId(ids: string[]): Promise<Map<string, SessaoDaAgenda>> {
  const lidas = await Promise.all(
    ids.map(async (id) => {
      const snap = await getDoc(sessaoRef(id));
      return snap.exists() ? sessaoDaAgenda({ id, ...snap.data() } as Appointment) : null;
    })
  );
  return new Map(lidas.filter((s): s is SessaoDaAgenda => s !== null).map((s) => [s.id, s]));
}
