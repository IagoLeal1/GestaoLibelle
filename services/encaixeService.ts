// services/encaixeService.ts
// Os encaixes do assistente de agendamento: a coordenação escolhe uma opção ("Vamos com essa") e manda
// para a recepção, ou recusa com o motivo ("Não"). A recepção vê os que chegaram em "Para agendar",
// como um recado guardado: agenda pelo Novo Agendamento, como sempre, e toca em "Já agendei"; o
// encaixe vira "Agendado" e sai da lista depois de 7 dias. O assistente nunca cria atendimentos.
// A criança pode ainda não ter cadastro: vai só o nome e o convênio, e a recepção cadastra antes.
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getCountFromServer,
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

/** A criança do encaixe. Sem cadastro: o id é "sem-cadastro:<nome>", e vão o nome e o convênio. */
export interface CriancaDoEncaixe extends Pessoa {
  semCadastro?: boolean;
  convenio?: string;
}

export interface Encaixe {
  id: string;
  status: StatusDoEncaixe;
  paciente: CriancaDoEncaixe;
  opcao: OpcaoDeEncaixe;
  criadoPor: { uid: string; nome: string };
  criadoEm?: Timestamp;
  /** Para agendar: a data da primeira sessão (aaaa-mm-dd) e o recado da coordenação. */
  comecaEm?: string;
  recado?: string;
  agendadoEm?: Timestamp;
  /** Recusado: o motivo e o que ele tira das próximas buscas. */
  motivo?: { tipo: MotivoDoNao; texto?: string };
  bloqueios?: Bloqueio[];
}

const DIAS_NA_LISTA_DEPOIS_DE_AGENDADO = 7;
const UM_DIA = 24 * 60 * 60 * 1000;
const encaixes = () => collection(db, "encaixes");

export async function mandarParaRecepcao(dados: {
  paciente: CriancaDoEncaixe;
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
    criadoPor: dados.autor,
    criadoEm: serverTimestamp(),
  });
  return novo.id;
}

export async function dizerNao(dados: {
  paciente: CriancaDoEncaixe;
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

/** Excluir da lista "Para agendar", ou desfazer um "Não" (a sugestão pode voltar). */
export const excluirEncaixe = (id: string) => deleteDoc(doc(db, "encaixes", id));

/** A recepção agendou tudo pelo Novo Agendamento: o encaixe vira "Agendado" e sai da conta laranja. */
export async function marcarComoAgendado(id: string) {
  await updateDoc(doc(db, "encaixes", id), { status: "agendado", agendadoEm: serverTimestamp() });
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
