"use client"
// hooks/use-conversas.ts
// Conversas do usuário em tempo real. A coordenação recebe também as que só acompanha (supervisão);
// os demais, as suas. Duas telas com a mesma consulta compartilham a mesma escuta no Firestore,
// então não há leitura em dobro.
import { useEffect, useState } from "react"
import { useAuth } from "@/context/AuthContext"
import {
  ChatGroup,
  countUnreadMessages,
  hasUnread,
  isChatSupervisor,
  subscribeToAllGroups,
  subscribeToUserGroups,
} from "@/services/chatService"

// incluirSupervisao: false para quem só precisa das conversas de que participa (o número do menu).
// Assim o menu, que aparece em todas as telas, não escuta todas as conversas da clínica.
export function useConversas({ incluirSupervisao = true }: { incluirSupervisao?: boolean } = {}) {
  const { firestoreUser } = useAuth()
  const uid = firestoreUser?.uid
  const coordenacao = isChatSupervisor(firestoreUser?.profile.role)
  const todas = coordenacao && incluirSupervisao
  const [grupos, setGrupos] = useState<ChatGroup[]>([])
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState(false)

  useEffect(() => {
    if (!uid) return
    const aoReceber = (lista: ChatGroup[]) => {
      setGrupos(lista)
      setErro(false)
      setCarregando(false)
    }
    const aoFalhar = (error: unknown) => {
      console.error("Erro ao carregar conversas:", error)
      setErro(true)
      setCarregando(false)
    }
    const cancelar = todas ? subscribeToAllGroups(aoReceber, aoFalhar) : subscribeToUserGroups(uid, aoReceber, aoFalhar)
    return () => cancelar()
  }, [uid, todas])

  // O número do menu conta só as conversas de que a pessoa participa (a supervisão não soma)
  const naoLidas = uid ? grupos.filter(g => g.memberIds.includes(uid) && hasUnread(g, uid)).length : 0

  return { grupos, carregando, erro, naoLidas, uid, coordenacao }
}

// Quantas mensagens novas tem cada conversa com algo não lido (conta no servidor)
export function useContagemDeNaoLidas(grupos: ChatGroup[], uid?: string) {
  const [contagens, setContagens] = useState<Record<string, number>>({})
  const comNaoLidas = uid ? grupos.filter(g => hasUnread(g, uid)) : []
  // Só refaz a contagem quando muda a última mensagem ou a leitura de alguma conversa
  const quandoRecontar = comNaoLidas
    .map(g => `${g.id}:${g.lastMessage?.createdAt?.toMillis()}:${uid ? g.lastReadAt?.[uid]?.toMillis() : ""}`)
    .join("|")

  useEffect(() => {
    if (!uid) return
    let ativo = true
    Promise.all(comNaoLidas.map(async g => [g.id, await countUnreadMessages(g, uid)] as const))
      .then(pares => {
        if (ativo) setContagens(Object.fromEntries(pares))
      })
      .catch(error => console.error("Erro ao contar mensagens não lidas:", error))
    return () => {
      ativo = false
    }
  }, [quandoRecontar, uid])

  return contagens
}
