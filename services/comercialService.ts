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
  getDoc, // Precisamos do getDoc para a lógica de update
} from "firebase/firestore"

// --- Interfaces (Definidas e Exportadas aqui) ---
// É uma boa prática exportar as interfaces junto com o service
export interface Evento {
  id: string
  codigo: string
  nome: string
  data: string
  status: "pendente" | "sucesso" | "falha"
  criadoEm?: Timestamp
}

export interface Lead {
  id: string
  nome: string
  contato: string
  eventoOrigem: string // Código do evento
  status: "pendente" | "sucesso" | "falha"
  acolhimentoRealizado: boolean
  dataAcolhimento: string
  orcamentoEnviado: boolean
  qhEnviado: boolean
  anamneseRealizada: boolean // Corrigido
  contratoAssinado: boolean
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
      // Você pode chamar o callback com um array vazio ou um erro
      callback([])
    },
  )
  return unsubscribe // Retorna a função de unsubscribe
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
  return unsubscribe // Retorna a função de unsubscribe
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
  novoLead: Omit<Lead, "id" | "status" | "criadoEm" | "acolhimentoRealizado" | "dataAcolhimento" | "orcamentoEnviado" | "qhEnviado" | "anamneseRealizada" | "contratoAssinado">,
) => {
  const leadData = {
    ...novoLead,
    status: "pendente" as const,
    acolhimentoRealizado: false,
    dataAcolhimento: "",
    orcamentoEnviado: false,
    qhEnviado: false,
    anamneseRealizada: false, // Corrigido
    contratoAssinado: false,
    criadoEm: Timestamp.now(),
  }
  return await addDoc(leadsColRef, leadData)
}

export const updateLead = async (
  id: string,
  data: Partial<Lead>,
) => {
  const leadRef = doc(db, "comercial_leads", id)

  // Esta é a "lógica de negócios" que agora vive no service
  // Para garantir que a lógica de status funcione, buscamos o documento atual
  const docSnap = await getDoc(leadRef)
  if (!docSnap.exists()) {
    throw new Error("Lead não encontrado!")
  }

  const currentLead = docSnap.data() as Lead
  const finalData = { ...currentLead, ...data } // Mescla o dado atual com o novo

  // Lógica de status automático (lógica de negócios)
  // Se as duas sub-etapas da proposta estão OK, status vira sucesso
  if (finalData.orcamentoEnviado && finalData.qhEnviado && !finalData.anamneseRealizada) {
    finalData.status = "sucesso"
  }

  // Se as duas sub-etapas do fechamento estão OK, status vira sucesso
  if (finalData.anamneseRealizada && finalData.contratoAssinado) {
    finalData.status = "sucesso"
  }
  
  // Se o acolhimento é marcado, o status avança
  if (data.acolhimentoRealizado === true) {
     finalData.status = "sucesso"
  }

  // Atualiza o documento com os dados recebidos E o status calculado
  return await updateDoc(leadRef, { ...data, status: finalData.status })
}

export const deleteLead = async (id: string) => {
  const leadRef = doc(db, "comercial_leads", id)
  return await deleteDoc(leadRef)
}