// services/comercialService.ts

import { db } from "@/lib/firebaseConfig" // Importe sua config do Firebase
import {
  collection,
  onSnapshot,
  addDoc,
  doc,
  updateDoc,
  deleteDoc,
  query,
  orderBy,
  Timestamp,
  getDoc,
} from "firebase/firestore"

// --- Interfaces (Definidas e Exportadas aqui) ---
export interface Evento {
  id: string
  codigo: string
  nome: string
  data: string
  status: "pendente" | "sucesso" | "falha"
  criadoEm?: Timestamp
}

export type TipoFluxo = "novo_paciente" | "avaliacao" | "liminar";

export interface LeadChecklist {
  // Recepção Inicial
  agendar: boolean;
  inserirPlControle: boolean;
  enviarGrupoAcolhimento: boolean; // novo paciente
  avisarProfissional: boolean; // avaliação
  email: boolean; // liminar
  
  // Coord. Famílias / Profissional
  acolher: boolean; // novo paciente, liminar
  fazerCarta: boolean; // novo paciente, liminar
  qtdHorasOrcamento: boolean; // novo paciente, avaliação
  avaliar: boolean; // avaliação

  // Fin.
  fazerOrcamento: boolean; // novo paciente, avaliação
  confPlano: boolean; // liminar

  // Comercial
  enviarCarta: boolean; // todos
  cOrcamento: boolean; // novo paciente, avaliação
  pos: boolean; // todos
  anamnese: boolean; // todos
  avisarFinNegativa: boolean; // avaliação

  // Coord. Clínica
  qhHorarios: boolean; // todos
  pastaDrive: boolean; // todos
  dataInicio: boolean; // todos
  avisarProf: boolean; // todos

  // Recepção Final
  avisarFamilia: boolean; // todos
  cadastroInthegra: boolean; // todos

  // Gerente. Op.
  contrato: boolean; // novo paciente, avaliação
  brinde: boolean; // todos
  termo: boolean; // todos
  regulamento: boolean; // todos
}

export interface Lead {
  id: string
  nome: string
  contato: string
  eventoOrigem: string // Código do evento
  status: "pendente" | "sucesso" | "falha"
  tipoFluxo: TipoFluxo
  etapaAtual: string // "recepcao1", "coord_familias", "fin", "comercial", "coord_clinica", "recepcao2", "gerente_op"
  checklist: LeadChecklist
  criadoEm?: Timestamp
}

// --- Coleções ---
const eventosColRef = collection(db, "comercial_eventos")
const leadsColRef = collection(db, "comercial_leads")

// --- Funções de "Escuta" (Listeners) ---

export const listenToEventos = (
  callback: (data: Evento[]) => void,
) => {
  const q = query(eventosColRef, orderBy("criadoEm", "desc"))
  const unsubscribe = onSnapshot(
    q,
    (snapshot) => {
      const eventosData = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Evento[]
      callback(eventosData)
    },
    (error) => {
      console.error("Erro ao escutar eventos: ", error)
      callback([])
    },
  )
  return unsubscribe
}

export const listenToLeads = (
  callback: (data: Lead[]) => void,
) => {
  const q = query(leadsColRef, orderBy("criadoEm", "desc"))
  const unsubscribe = onSnapshot(
    q,
    (snapshot) => {
      const leadsData = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Lead[]
      callback(leadsData)
    },
    (error) => {
      console.error("Erro ao escutar leads: ", error)
      callback([])
    },
  )
  return unsubscribe
}

// --- Funções CRUD (Create, Read, Update, Delete) ---

// EVENTOS
export const addEvento = async (
  novoEvento: Omit<Evento, "id" | "status" | "criadoEm">,
) => {
  const eventoData = {
    ...novoEvento,
    status: "pendente" as const,
    criadoEm: Timestamp.now(),
  }
  return await addDoc(eventosColRef, eventoData)
}

export const updateEvento = async (
  id: string,
  data: Partial<Evento>,
) => {
  const eventoRef = doc(db, "comercial_eventos", id)
  return await updateDoc(eventoRef, data)
}

export const deleteEvento = async (id: string) => {
  const eventoRef = doc(db, "comercial_eventos", id)
  return await deleteDoc(eventoRef)
}

// LEADS
export const addLead = async (
  novoLead: Omit<Lead, "id" | "status" | "criadoEm" | "checklist" | "etapaAtual">,
) => {
  const defaultChecklist: LeadChecklist = {
    agendar: false, inserirPlControle: false, enviarGrupoAcolhimento: false, avisarProfissional: false, email: false,
    acolher: false, fazerCarta: false, qtdHorasOrcamento: false, avaliar: false,
    fazerOrcamento: false, confPlano: false,
    enviarCarta: false, cOrcamento: false, pos: false, anamnese: false, avisarFinNegativa: false,
    qhHorarios: false, pastaDrive: false, dataInicio: false, avisarProf: false,
    avisarFamilia: false, cadastroInthegra: false,
    contrato: false, brinde: false, termo: false, regulamento: false,
  };

  const leadData = {
    ...novoLead,
    status: "pendente" as const,
    etapaAtual: "recepcao1", // Inicia na primeira etapa
    checklist: defaultChecklist,
    criadoEm: Timestamp.now(),
  }
  return await addDoc(leadsColRef, leadData)
}

export const updateLead = async (
  id: string,
  data: Partial<Lead>,
) => {
  const leadRef = doc(db, "comercial_leads", id)
  return await updateDoc(leadRef, data as any)
}

export const deleteLead = async (id: string) => {
  const leadRef = doc(db, "comercial_leads", id)
  return await deleteDoc(leadRef)
}