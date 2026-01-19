"use client"

import { useState, useEffect, useRef, use } from "react" // <-- Adicionado 'use'
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Send, ArrowLeft, Loader2 } from "lucide-react"
import Link from "next/link"
import { useAuth } from "@/context/AuthContext"
import { subscribeToChatMessages, sendMessage, getGroupDetails, ChatMessage, ChatGroup } from "@/services/chatService"

// Definindo que params é uma Promise
export default function ChatDetalhePage({ params }: { params: Promise<{ id: string }> }) {
    // 1. DESEMBRULHAR O PARAMS (Correção do erro do Next.js 15)
    const { id } = use(params);

    const { firestoreUser } = useAuth();
    const [mensagens, setMensagens] = useState<ChatMessage[]>([]);
    const [grupo, setGrupo] = useState<ChatGroup | null>(null);
    const [texto, setTexto] = useState("");
    const [loading, setLoading] = useState(true);
    const scrollRef = useRef<HTMLDivElement>(null);

    // 2. Carregar Detalhes do Grupo (Usando 'id' ao invés de 'params.id')
    useEffect(() => {
        getGroupDetails(id).then(g => {
            if(g) setGrupo(g);
        });
    }, [id]);

    // 3. Escutar as Mensagens (Realtime)
    useEffect(() => {
        const unsubscribe = subscribeToChatMessages(id, (msgs) => {
            setMensagens(msgs);
            setLoading(false);
        });
        return () => unsubscribe();
    }, [id]);

    // 4. Scroll automático
    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollIntoView({ behavior: "smooth" });
        }
    }, [mensagens]);

    const handleEnviar = async () => {
        if (!texto.trim() || !firestoreUser) return;

        const conteudo = texto;
        setTexto(""); 

        // Usa 'id' aqui também
        await sendMessage(id, {
            content: conteudo,
            senderId: firestoreUser.uid,
            senderName: firestoreUser.displayName || firestoreUser.profile?.name || "Usuário", 
            senderRole: firestoreUser.profile.role
        });
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            handleEnviar();
        }
    };

    if (!firestoreUser) return <div className="p-8 flex justify-center"><Loader2 className="animate-spin text-primary-teal" /></div>;

    return (
        <div className="flex flex-col h-[calc(100vh-120px)] bg-slate-50">
            {/* --- CABEÇALHO --- */}
            <div className="flex items-center gap-3 bg-white p-4 border-b border-gray-200 shadow-sm z-10">
                <Link href="/mensagens">
                    <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-slate-100 rounded-full">
                        <ArrowLeft className="h-4 w-4 text-gray-600" />
                    </Button>
                </Link>
                <div>
                    <h2 className="text-sm font-bold text-gray-800">
                        {grupo ? grupo.pacienteNome : "Carregando..."}
                    </h2>
                    {grupo && (
                        <p className="text-xs text-muted-foreground flex items-center gap-1">
                           <span className="w-1.5 h-1.5 rounded-full bg-green-500 inline-block"></span>
                           Responsável: {grupo.responsavelNome}
                        </p>
                    )}
                </div>
            </div>

            {/* --- ÁREA DE MENSAGENS --- */}
            <div className="flex-1 overflow-y-auto p-4 space-y-6">
                {loading ? (
                    <div className="flex justify-center py-10"><Loader2 className="animate-spin h-6 w-6 text-gray-300" /></div>
                ) : mensagens.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-muted-foreground text-sm opacity-60 space-y-2">
                        <p>Nenhuma mensagem ainda.</p>
                        <p className="text-xs">Envie a primeira mensagem para o grupo.</p>
                    </div>
                ) : (
                    mensagens.map((msg, index) => {
                        const isMe = msg.senderId === firestoreUser.uid;
                        const avatarTexto = isMe ? "IM" : (msg.senderName?.[0] || "?").toUpperCase();

                        return (
                            <div 
                                key={msg.id || index} 
                                className={`flex items-end gap-2 ${isMe ? "flex-row-reverse" : "flex-row"}`}
                            >
                                <Avatar className="h-8 w-8 border-2 border-white shadow-sm flex-shrink-0">
                                    <AvatarFallback 
                                        className={`text-[10px] font-bold ${
                                            isMe 
                                            ? "bg-primary-dark-blue text-white" 
                                            : "bg-gray-200 text-gray-600"
                                        }`}
                                    >
                                        {avatarTexto}
                                    </AvatarFallback>
                                </Avatar>

                                <div className={`max-w-[75%] p-3 rounded-2xl text-sm shadow-sm relative group ${
                                    isMe 
                                    ? "bg-primary-teal text-white rounded-br-none" 
                                    : "bg-white text-gray-800 border border-gray-100 rounded-bl-none"
                                }`}>
                                    {!isMe && (
                                        <span className="text-[10px] font-bold text-primary-teal/80 block mb-1">
                                            {msg.senderName}
                                        </span>
                                    )}
                                    
                                    <p className="whitespace-pre-wrap leading-relaxed break-words">
                                        {msg.content}
                                    </p>

                                    {/* Proteção contra data undefined */}
                                    <div className={`text-[9px] mt-1 text-right w-full select-none ${isMe ? "text-white/70" : "text-gray-400"}`}>
                                        {msg.createdAt && typeof msg.createdAt.toDate === 'function'
                                            ? msg.createdAt.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) 
                                            : "..."}
                                    </div>
                                </div>
                            </div>
                        );
                    })
                )}
                <div ref={scrollRef} />
            </div>

            {/* --- INPUT --- */}
            <div className="p-4 bg-white border-t border-gray-200">
                <div className="flex items-center gap-2 max-w-4xl mx-auto">
                    <Input 
                        value={texto}
                        onChange={(e) => setTexto(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder="Digite sua mensagem..."
                        className="flex-1 bg-gray-50 border-gray-200 focus-visible:ring-primary-teal focus-visible:ring-offset-0 rounded-full px-4"
                    />
                    <Button 
                        onClick={handleEnviar} 
                        disabled={!texto.trim()}
                        className="bg-primary-teal hover:bg-primary-teal/90 h-10 w-10 p-0 rounded-full shadow-sm transition-all active:scale-95"
                    >
                        <Send className="h-4 w-4 text-white ml-0.5" />
                    </Button>
                </div>
            </div>
        </div>
    );
}