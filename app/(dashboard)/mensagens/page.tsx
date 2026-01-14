"use client"

import { useState, useEffect } from "react"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Search, MessageCircle, Users } from "lucide-react"
import Link from "next/link"
import { useAuth } from "@/context/AuthContext"
import { subscribeToUserGroups, ChatGroup } from "@/services/chatService"
import { CreateChatGroupModal } from "@/components/modals/create-chat-group-modal"

// --- Funções Auxiliares ---

function getIniciais(nome: string) {
  if (!nome) return "GL";
  return nome
    .split(" ")
    .map((n) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase()
}

function formatarData(dataString: string) {
  if (!dataString) return "";
  const data = new Date(dataString)
  const hoje = new Date()
  const ontem = new Date(hoje)
  ontem.setDate(ontem.getDate() - 1)

  if (data.toDateString() === hoje.toDateString()) {
    return data.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })
  } else if (data.toDateString() === ontem.toDateString()) {
    return "Ontem"
  } else {
    return data.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" })
  }
}

// --- Componente Principal ---

export default function MensagensPage() {
  const { firestoreUser } = useAuth();
  const [busca, setBusca] = useState("")
  const [conversas, setConversas] = useState<ChatGroup[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!firestoreUser) return;

    // Iniciar escuta em tempo real
    const unsubscribe = subscribeToUserGroups(firestoreUser.uid, (grupos) => {
      setConversas(grupos);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [firestoreUser]);

  const conversasFiltradas = conversas.filter(
    (c) =>
      c.pacienteNome.toLowerCase().includes(busca.toLowerCase()) ||
      c.responsavelNome.toLowerCase().includes(busca.toLowerCase())
  );
  
  const isCoordenador = firestoreUser?.profile.role === 'admin' || firestoreUser?.profile.role === 'coordenador';

  return (
    <div className="h-[calc(100vh-120px)] flex flex-col">
      {/* Header */}
      <div className="mb-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold tracking-tight text-primary-dark-blue">Mensagens</h2>
            <p className="text-muted-foreground">Grupos de comunicação - Pacientes, Famílias e Terapeutas</p>
          </div>
          {/* Botão de criar grupo só para coordenadores */}
          {isCoordenador && <CreateChatGroupModal />}
        </div>
      </div>

      {/* Barra de busca */}
      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Buscar grupo por paciente..."
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          className="pl-10 bg-white border-gray-200"
        />
      </div>

      {/* Lista de Conversas Real */}
      <Card className="flex-1 overflow-hidden bg-white">
        <div className="h-full overflow-y-auto">
          {loading ? (
             <div className="p-8 text-center text-muted-foreground">Carregando conversas...</div>
          ) : conversasFiltradas.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
              <MessageCircle className="h-12 w-12 mb-2 opacity-50" />
              <p>Nenhum grupo encontrado</p>
            </div>
          ) : (
            conversasFiltradas.map((conversa) => (
              <Link key={conversa.id} href={`/mensagens/${conversa.id}`} className="block">
                <div className="flex items-center gap-3 p-4 border-b border-gray-100 hover:bg-gray-50 transition-colors cursor-pointer">
                  
                  {/* Avatar */}
                  <div className="relative flex-shrink-0">
                    <Avatar className="h-14 w-14">
                      <AvatarFallback className="bg-primary-teal/20 text-primary-teal font-medium text-lg">
                        {getIniciais(conversa.pacienteNome)}
                      </AvatarFallback>
                    </Avatar>
                  </div>

                  {/* Conteúdo */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-gray-800 truncate">
                          {conversa.pacienteNome}
                        </h3>
                        <Badge variant="outline" className="text-[10px] px-1.5 py-0 border-primary-teal/30 text-primary-teal">
                          <Users className="h-3 w-3 mr-1" />
                          {conversa.terapeutaIds.length + 1}
                        </Badge>
                      </div>
                      
                      {conversa.lastMessage && (
                          <span className="text-xs text-muted-foreground flex-shrink-0">
                            {formatarData(conversa.lastMessage.createdAt.toDate().toISOString())}
                          </span>
                      )}
                    </div>

                    <p className="text-xs text-muted-foreground mb-1 truncate">
                      Resp: {conversa.responsavelNome}
                    </p>

                    <div className="flex items-center justify-between gap-2">
                      <p className="text-sm text-muted-foreground truncate">
                        {conversa.lastMessage ? (
                            <>
                                <span className="font-medium text-gray-700">{conversa.lastMessage.senderName}: </span>
                                {conversa.lastMessage.content}
                            </>
                        ) : (
                            <span className="italic">Nenhuma mensagem ainda</span>
                        )}
                      </p>
                    </div>
                  </div>
                </div>
              </Link>
            ))
          )}
        </div>
      </Card>
    </div>
  )
}