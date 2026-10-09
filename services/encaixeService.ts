// services/encaixeService.ts
// Os encaixes do assistente de agendamento: a coordenação escolhe uma opção ("Vamos com essa") e manda
// para a recepção, ou recusa com o motivo ("Não"). A recepção vê os que chegaram em "Para agendar" e
// agenda pelo Novo Agendamento, que marca cada sessão agendada; com todas, o encaixe vira "Agendado"
// e sai da lista depois de 7 dias. O assistente nunca cria atendimentos.
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getCountFromServer,
  getDoc,
  getDocs,
  query,
  serverTimestamp,
  Timestamp,
  updateDoc,
  where,
} from "firebase/firestore";
import { db } from "@/lib/firebaseConfig";
import { Bloqueio, bloqueiosDoNao, MotivoDoNao, OpcaoDeEncaixe, Pessoa } from "@/lib/encaixes";

export type StatusDoEncaixe = "para_agendar" | "agendado" | "recusado";

export interface Encaixe {
  id: string;
  status: StatusDoEncaixe;
  paciente: Pessoa;
  opcao: OpcaoDeEncaixe;
  criadoPor: { uid: string; nome: string };
  criadoEm?: Timestamp;
  /** Para agendar: a data da primeira sessão (aaaa-mm-dd) e o recado da coordenação. */
  comecaEm?: string;
  recado?: string;
  /** As sessões da opção já agendadas pela recepção, pela posição em opcao.sessoes. */
  agendadas?: Record<string, boolean>;
  agendadoEm?: Timestamp;
  /** Recusado: o motivo e o que ele tira das próximas buscas. */
  motivo?: { tipo: MotivoDoNao; texto?: string };
  bloqueios?: Bloqueio[];
}

const DIAS_NA_LISTA_DEPOIS_DE_AGENDADO = 7;
const UM_DIA = 24 * 60 * 60 * 1000;
const encaixes = () => collection(db, "encaixes");

export async function mandarParaRecepcao(dados: {
  paciente: Pessoa;
  opcao: OpcaoDeEncaixe;
  comecaEm: string;
  recado?: string;
  autor: { uid: string; nome: string };
}) {
  const recado = dados.recado?.trim().slice(0, 1000) ?? "";
  const novo = await addDoc(encaixes(), {
    status: "para_agendar",
    paciente: dados.paciente,
    opcao: dados.opcao,
    comecaEm: dados.comecaEm,
    recado,
    agendadas: {},
    criadoPor: dados.autor,
    criadoEm: serverTimestamp(),
  });
  return novo.id;
}

export async function dizerNao(dados: {
  paciente: Pessoa;
  opcao: OpcaoDeEncaixe;
  motivo: MotivoDoNao;
  texto?: string;
  autor: { uid: string; nome: string };
}) {
  const texto = dados.texto?.trim().slice(0, 500) ?? "";
  const novo = await addDoc(encaixes(), {
    status: "recusado",
    paciente: dados.paciente,
    opcao: dados.opcao,
    motivo: { tipo: dados.motivo, texto },
    bloqueios: bloqueiosDoNao(dados.motivo, dados.opcao, dados.paciente.id),
    criadoPor: dados.autor,
    criadoEm: serverTimestamp(),
  });
  return novo.id;
}

/** Um encaixe só: o Novo Agendamento abre preenchido com uma das sessões dele. */
export async function lerEncaixe(id: string): Promise<Encaixe | null> {
  const encaixe = await getDoc(doc(db, "encaixes", id));
  return encaixe.exists() ? { id: encaixe.id, ...(encaixe.data() as Omit<Encaixe, "id">) } : null;
}

/** Excluir da lista "Para agendar", ou desfazer um "Não" (a sugestão pode voltar). */
export const excluirEncaixe = (id: string) => deleteDoc(doc(db, "encaixes", id));

/** A recepção agendou uma das sessões pelo Novo Agendamento; com todas, o encaixe vira "Agendado". */
export async function marcarSessaoAgendada(encaixe: Pick<Encaixe, "id" | "opcao" | "agendadas">, indice: number) {
  const agendadas: Record<string, boolean> = { ...encaixe.agendadas, [indice]: true };
  const todas = encaixe.opcao.sessoes.every((_, i) => agendadas[i]);
  await updateDoc(doc(db, "encaixes", encaixe.id), {
    [`agendadas.${indice}`]: true,
    ...(todas ? { status: "agendado", agendadoEm: serverTimestamp() } : {}),
  });
  return todas;
}

const ler = (snapshot: Awaited<ReturnType<typeof getDocs>>) =>
  snapshot.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<Encaixe, "id">) }));
const maisNovosAntes = (a: Encaixe, b: Encaixe) => (b.criadoEm?.toMillis() ?? Date.now()) - (a.criadoEm?.toMillis() ?? Date.now());

/** Os que faltam agendar e os agendados há menos de 7 dias (os mais antigos saem da lista e do banco). */
export async function listarParaAgendar(agora = Date.now()): Promise<Encaixe[]> {
  const [faltam, agendados] = await Promise.all([
    getDocs(query(encaixes(), where("status", "==", "para_agendar"))),
    getDocs(query(encaixes(), where("status", "==", "agendado"))),
  ]);
  const limite = agora - DIAS_NA_LISTA_DEPOIS_DE_AGENDADO * UM_DIA;
  const antigo = (e: Encaixe) => (e.agendadoEm?.toMillis() ?? agora) < limite;
  await Promise.all(ler(agendados).filter(antigo).map((e) => excluirEncaixe(e.id).catch(() => undefined)));
  const recentes = ler(agendados).filter((e) => !antigo(e));
  return [...ler(faltam).sort(maisNovosAntes), ...recentes.sort(maisNovosAntes)];
}

export async function listarRecusados(): Promise<Encaixe[]> {
  return ler(await getDocs(query(encaixes(), where("status", "==", "recusado")))).sort(maisNovosAntes);
}

/** O número laranja do menu de Agendamentos: uma leitura só, quantos forem. */
export async function contarParaAgendar(): Promise<number> {
  const snapshot = await getCountFromServer(query(encaixes(), where("status", "==", "para_agendar")));
  return snapshot.data().count;
}
