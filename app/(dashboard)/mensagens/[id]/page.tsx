"use client"

import type React from "react"
import { useState, useRef, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { ArrowLeft, Send, Video, MoreVertical, Phone, Info } from "lucide-react"
import { useAuth } from "@/context/AuthContext"
import { 
    subscribeToChatMessages, 
    sendMessage, 
    getGroupDetails, 
    ChatMessage, 
    ChatGroup 
} from "@/services/chatService"

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

// --- Componente Principal ---

export default function ChatPage() {
  const params = useParams()
  const router = useRouter()
  const { firestoreUser } = useAuth();
  
  const id = params.id as string
  const [grupo, setGrupo] = useState<ChatGroup | null>(null);
  const [mensagens, setMensagens] = useState<ChatMessage[]>([]);
  const [novaMensagem, setNovaMensagem] = useState("")
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  // 1. Carregar detalhes do grupo
  useEffect(() => {
    getGroupDetails(id).then(g => {
        if(g) setGrupo(g);
    });
  }, [id]);

  // 2. Escutar mensagens em tempo real
  useEffect(() => {
    const unsubscribe = subscribeToChatMessages(id, (msgs) => {
        setMensagens(msgs);
        // Pequeno delay para garantir que o DOM atualizou antes de scrollar
        setTimeout(scrollToBottom, 100); 
    });
    return () => unsubscribe();
  }, [id]);

  const handleEnviarMensagem = async () => {
    if (!novaMensagem.trim() || !firestoreUser || !grupo) return
    setSending(true);

    await sendMessage(id, {
        content: novaMensagem,
        senderId: firestoreUser.uid,
        senderName: firestoreUser.displayName,
        senderRole: firestoreUser.profile.role
    });

    setNovaMensagem("");
    setSending(false);
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleEnviarMensagem()
    }
  }

  if (!grupo || !firestoreUser) {
    return <div className="h-full flex items-center justify-center">Carregando chat...</div>
  }

  return (
    <div className="h-[calc(100vh-120px)] flex flex-col bg-gray-100 -m-6 rounded-lg overflow-hidden">
      
      {/* Header Real */}
      <div className="bg-primary-dark-blue text-white px-4 py-3 flex items-center gap-3 shadow-md">
        <Button variant="ghost" size="icon" onClick={() => router.push("/mensagens")} className="text-white">
          <ArrowLeft className="h-5 w-5" />
        </Button>

        <div className="relative">
          <Avatar className="h-10 w-10">
            <AvatarFallback className="bg-primary-teal text-white font-medium">
              {getIniciais(grupo.pacienteNome)}
            </AvatarFallback>
          </Avatar>
        </div>

        <div className="flex-1 min-w-0">
          <h3 className="font-semibold truncate">{grupo.pacienteNome}</h3>
          <p className="text-xs text-white/70 truncate">
             {grupo.terapeutaNomes ? grupo.terapeutaNomes.join(", ") : "Equipe Multidisciplinar"}
          </p>
        </div>
        
        <div className="flex items-center gap-1">
             <Button variant="ghost" size="icon" className="text-white/80 hover:bg-white/10"><Video className="h-5 w-5" /></Button>
             <Button variant="ghost" size="icon" className="text-white/80 hover:bg-white/10"><MoreVertical className="h-5 w-5" /></Button>
        </div>
      </div>

      {/* Área de Mensagens */}
      <div 
        className="flex-1 overflow-y-auto p-4 space-y-4" 
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fillRule='evenodd'%3E%3Cg fill='%23d1d5db' fillOpacity='0.15'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }}
      >
        
        {mensagens.map((msg) => {
            const isMe = msg.senderId === firestoreUser.uid;
            
            return (
              <div key={msg.id} className={`flex mb-2 ${isMe ? "justify-end" : "justify-start"}`}>
                <div
                  className={`max-w-[75%] rounded-lg px-3 py-2 shadow-sm ${
                    isMe
                      ? "bg-primary-teal/90 text-white rounded-br-none"
                      : "bg-white text-gray-800 rounded-bl-none"
                  }`}
                >
                  {!isMe && (
                    <p className={`text-xs font-semibold mb-1 text-primary-dark-blue`}>
                      {msg.senderName}
                    </p>
                  )}
                  
                  <p className="text-sm whitespace-pre-wrap break-words">{msg.content}</p>
                  
                  <div className={`flex items-center justify-end gap-1 mt-1 text-[10px] ${isMe ? "text-white/70" : "text-gray-500"}`}>
                    <span>
                        {msg.createdAt 
                            ? new Date(msg.createdAt.toMillis()).toLocaleTimeString("pt-BR", {hour:'2-digit', minute:'2-digit'})
                            : "..."}
                    </span>
                  </div>
                </div>
              </div>
            );
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="bg-gray-200 px-3 py-2 flex items-center gap-2">
        <Input
          placeholder="Digite sua mensagem..."
          value={novaMensagem}
          onChange={(e) => setNovaMensagem(e.target.value)}
          onKeyPress={handleKeyPress}
          disabled={sending}
          className="flex-1 bg-white border-0 rounded-full px-4"
        />
        <Button 
            size="icon" 
            className="bg-primary-teal hover:bg-primary-teal/90 rounded-full flex-shrink-0"
            onClick={handleEnviarMensagem}
            disabled={!novaMensagem.trim() || sending}
        >
            <Send className="h-5 w-5" />
        </Button>
      </div>

    </div>
  )
}