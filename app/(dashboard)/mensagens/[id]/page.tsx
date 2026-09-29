"use client"

import { useState, useEffect, useLayoutEffect, useRef, use } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Send, ArrowLeft, Loader2, MessageCircleOff } from "lucide-react"
import Link from "next/link"
import { toast } from "sonner"
import { useAuth } from "@/context/AuthContext"
import {
    subscribeToChatMessages,
    sendMessage,
    getGroupDetails,
    loadOlderMessages,
    mergeMessages,
    LIVE_WINDOW_SIZE,
    ChatMessage,
    ChatGroup,
} from "@/services/chatService"
import { AddParticipantsModal } from "@/components/modals/add-participants-modal"
import { getIniciais } from "@/lib/formatters"

// Até essa distância do fim (em px), a conversa acompanha as mensagens que chegam
const MARGEM_DO_FIM = 80;

// Mesmo limite das regras do Firestore
const TAMANHO_MAXIMO = 2000;

export default function ChatDetalhePage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params);

    const { firestoreUser } = useAuth();
    const [mensagens, setMensagens] = useState<ChatMessage[]>([]);
    const [grupo, setGrupo] = useState<ChatGroup | null>(null);
    const [texto, setTexto] = useState("");
    const [loading, setLoading] = useState(true);
    const [semAcesso, setSemAcesso] = useState(false);
    const [enviando, setEnviando] = useState(false);
    const [temAnteriores, setTemAnteriores] = useState(false);
    const [carregandoAnteriores, setCarregandoAnteriores] = useState(false);

    const areaRef = useRef<HTMLDivElement>(null);
    const pertoDoFim = useRef(true);
    const ultimaMensagemId = useRef<string | null>(null);
    const posicaoAntesDasAnteriores = useRef<{ altura: number; topo: number } | null>(null);

    const podeGerenciar = firestoreUser?.profile.role === 'admin' || firestoreUser?.profile.role === 'coordenador';

    // Grupo e, se houver acesso, as mensagens em tempo real (as mais recentes).
    // A assinatura só começa depois do grupo: duas leituras negadas ao mesmo tempo
    // disparam um erro interno do SDK do Firestore que o deixa inutilizável até recarregar.
    useEffect(() => {
        let ativo = true;
        let primeiraLeitura = true;
        let cancelarAssinatura: (() => void) | undefined;

        getGroupDetails(id).then(g => {
            if (!ativo) return;
            if (!g) {
                setSemAcesso(true);
                setLoading(false);
                return;
            }
            setGrupo(g);

            cancelarAssinatura = subscribeToChatMessages(
                id,
                (janela) => {
                    if (primeiraLeitura) {
                        primeiraLeitura = false;
                        // Janela cheia: pode haver mensagens anteriores a ela
                        setTemAnteriores(janela.length === LIVE_WINDOW_SIZE);
                    }
                    setMensagens(atuais => mergeMessages(atuais, janela));
                    setLoading(false);
                },
                (erro) => {
                    console.error("Erro ao carregar mensagens:", erro);
                    setSemAcesso(true);
                    setLoading(false);
                }
            );
        });

        return () => {
            ativo = false;
            cancelarAssinatura?.();
        };
    }, [id]);

    // Scroll: ao abrir vai direto para o fim; depois só acompanha quem está no fim ou acabou de enviar
    useLayoutEffect(() => {
        const area = areaRef.current;
        if (!area || mensagens.length === 0) return;

        // Mensagens anteriores entraram no topo: mantém na tela o que a pessoa estava lendo
        const posicao = posicaoAntesDasAnteriores.current;
        if (posicao) {
            posicaoAntesDasAnteriores.current = null;
            area.scrollTop = area.scrollHeight - posicao.altura + posicao.topo;
            return;
        }

        const ultima = mensagens[mensagens.length - 1];
        const primeiraVez = ultimaMensagemId.current === null;
        const chegouNova = ultima.id !== ultimaMensagemId.current;
        ultimaMensagemId.current = ultima.id;

        if (primeiraVez) {
            area.scrollTop = area.scrollHeight;
        } else if (chegouNova && (pertoDoFim.current || ultima.senderId === firestoreUser?.uid)) {
            // Anima só trajetos curtos; de longe (lendo o histórico), salta direto para o fim
            const distancia = area.scrollHeight - area.scrollTop - area.clientHeight;
            area.scrollTo({ top: area.scrollHeight, behavior: distancia < area.clientHeight * 2 ? "smooth" : "auto" });
        }
    }, [mensagens, firestoreUser?.uid]);

    const handleScroll = () => {
        const area = areaRef.current;
        if (!area) return;
        pertoDoFim.current = area.scrollHeight - area.scrollTop - area.clientHeight < MARGEM_DO_FIM;
    };

    const carregarAnteriores = async () => {
        const area = areaRef.current;
        if (!area || carregandoAnteriores || mensagens.length === 0) return;

        setCarregandoAnteriores(true);
        try {
            const pagina = await loadOlderMessages(id, mensagens[0]);
            posicaoAntesDasAnteriores.current = { altura: area.scrollHeight, topo: area.scrollTop };
            setMensagens(atuais => mergeMessages(pagina.messages, atuais));
            setTemAnteriores(pagina.hasMore);
        } catch (erro) {
            console.error("Erro ao carregar mensagens anteriores:", erro);
            toast.error("Não foi possível carregar as mensagens anteriores.");
        } finally {
            setCarregandoAnteriores(false);
        }
    };

    const handleEnviar = async () => {
        const conteudo = texto.trim();
        if (!conteudo || !firestoreUser || enviando) return;

        setEnviando(true);
        setTexto("");

        const resultado = await sendMessage(id, {
            content: conteudo,
            senderId: firestoreUser.uid,
            senderName: firestoreUser.displayName,
            senderRole: firestoreUser.profile.role
        });
        setEnviando(false);

        if (!resultado.success) {
            // Devolve o texto para tentar de novo, sem apagar o que a pessoa já começou a digitar
            setTexto(atual => atual || conteudo);
            toast.error("Não foi possível enviar a mensagem. Tente novamente.");
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            handleEnviar();
        }
    };

    if (!firestoreUser) return <div className="p-8 flex justify-center"><Loader2 className="animate-spin text-primary-teal" /></div>;

    if (semAcesso) {
        return (
            <div className="flex flex-col items-center justify-center h-[calc(100vh-120px)] text-center text-muted-foreground gap-3">
                <MessageCircleOff className="h-12 w-12 opacity-50" />
                <p className="font-medium text-gray-700">Não foi possível abrir esta conversa.</p>
                <p className="text-sm">Ela não existe ou você não tem acesso a ela.</p>
                <Button asChild variant="outline" className="mt-2">
                    <Link href="/mensagens">Voltar para as mensagens</Link>
                </Button>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-[calc(100vh-120px)] bg-slate-50">
            {/* --- CABEÇALHO --- */}
            <div className="flex justify-between items-center bg-white p-4 border-b border-gray-200 shadow-sm z-10">
                <div className="flex items-center gap-3">
                    <Button asChild variant="ghost" size="icon" className="h-8 w-8 hover:bg-slate-100 rounded-full">
                        <Link href="/mensagens" aria-label="Voltar para as mensagens">
                            <ArrowLeft className="h-4 w-4 text-gray-600" />
                        </Link>
                    </Button>
                    <div>
                        <h2 className="text-sm font-bold text-gray-800">
                            {grupo ? grupo.pacienteNome : "Carregando..."}
                        </h2>
                        {grupo && (
                            <p className="text-xs text-muted-foreground">
                               Responsável: {grupo.responsavelNome}
                            </p>
                        )}
                    </div>
                </div>
                {grupo && podeGerenciar && (
                    <AddParticipantsModal
                        groupId={id}
                        existingIds={grupo.terapeutaIds}
                        onAdded={() => {
                            getGroupDetails(id).then(g => {
                                if(g) setGrupo(g);
                            });
                        }}
                    />
                )}
            </div>

            {/* --- ÁREA DE MENSAGENS --- */}
            <div ref={areaRef} onScroll={handleScroll} className="flex-1 overflow-y-auto p-4 space-y-6">
                {loading ? (
                    <div className="flex justify-center py-10"><Loader2 className="animate-spin h-6 w-6 text-gray-300" /></div>
                ) : mensagens.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-muted-foreground text-sm opacity-60 space-y-2">
                        <p>Nenhuma mensagem ainda.</p>
                        <p className="text-xs">Envie a primeira mensagem para o grupo.</p>
                    </div>
                ) : (
                    <>
                        {temAnteriores && (
                            <div className="flex justify-center">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={carregarAnteriores}
                                    disabled={carregandoAnteriores}
                                    className="rounded-full text-xs"
                                >
                                    {carregandoAnteriores && <Loader2 className="mr-2 h-3 w-3 animate-spin" />}
                                    Carregar mensagens anteriores
                                </Button>
                            </div>
                        )}
                        {mensagens.map((msg) => {
                            const isMe = msg.senderId === firestoreUser.uid;

                            return (
                                <div
                                    key={msg.id}
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
                                            {getIniciais(msg.senderName)}
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

                                        <div className={`text-[9px] mt-1 text-right w-full select-none ${isMe ? "text-white/70" : "text-gray-400"}`}>
                                            {msg.createdAt?.toDate().toLocaleTimeString("pt-BR", { hour: '2-digit', minute: '2-digit' })}
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </>
                )}
            </div>

            {/* --- INPUT --- */}
            <div className="p-4 bg-white border-t border-gray-200">
                <div className="flex items-center gap-2 max-w-4xl mx-auto">
                    <Input
                        value={texto}
                        onChange={(e) => setTexto(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder="Digite sua mensagem..."
                        maxLength={TAMANHO_MAXIMO}
                        className="flex-1 bg-gray-50 border-gray-200 focus-visible:ring-primary-teal focus-visible:ring-offset-0 rounded-full px-4"
                    />
                    <Button
                        onClick={handleEnviar}
                        disabled={!texto.trim() || enviando}
                        aria-label="Enviar mensagem"
                        className="bg-primary-teal hover:bg-primary-teal/90 h-10 w-10 p-0 rounded-full shadow-sm transition-all active:scale-95"
                    >
                        {enviando
                            ? <Loader2 className="h-4 w-4 text-white animate-spin" />
                            : <Send className="h-4 w-4 text-white ml-0.5" />}
                    </Button>
                </div>
            </div>
        </div>
    );
}
