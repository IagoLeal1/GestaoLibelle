"use client"

import { useState, useEffect, useLayoutEffect, useRef, use } from "react"
import Link from "next/link"
import { ArrowLeft, ChevronRight, Eye, Loader2, MessageCircleOff, Send } from "lucide-react"
import { toast } from "sonner"
import { Timestamp } from "firebase/firestore"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/context/AuthContext"
import {
    subscribeToChatMessages,
    sendMessage,
    getGroupDetails,
    getGroupMembers,
    loadOlderMessages,
    mergeMessages,
    markChatAsRead,
    buildTimeline,
    isChatSupervisor,
    readUntil,
    LIVE_WINDOW_SIZE,
    ChatMessage,
    ChatGroup,
    ChatMember,
} from "@/services/chatService"
import { getIniciais, horaCurta, rotuloDoDia } from "@/lib/formatters"
import { EquipeDaConversa } from "@/components/mensagens/equipe-da-conversa"
import { infoDoPapel } from "@/components/mensagens/papeis"

// Até essa distância do fim (em px), a conversa acompanha as mensagens que chegam
const MARGEM_DO_FIM = 80;

// Mesmo limite das regras do Firestore
const TAMANHO_MAXIMO = 2000;

export default function ChatDetalhePage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params);

    const { firestoreUser } = useAuth();
    const uid = firestoreUser?.uid ?? "";
    const [mensagens, setMensagens] = useState<ChatMessage[]>([]);
    const [grupo, setGrupo] = useState<ChatGroup | null>(null);
    const [membros, setMembros] = useState<ChatMember[]>([]);
    const [lidoAteAoAbrir, setLidoAteAoAbrir] = useState<Timestamp | null>(null);
    const [texto, setTexto] = useState("");
    const [loading, setLoading] = useState(true);
    const [semAcesso, setSemAcesso] = useState(false);
    const [enviando, setEnviando] = useState(false);
    const [temAnteriores, setTemAnteriores] = useState(false);
    const [carregandoAnteriores, setCarregandoAnteriores] = useState(false);
    const [verEquipe, setVerEquipe] = useState(false);

    const areaRef = useRef<HTMLDivElement>(null);
    const campoRef = useRef<HTMLTextAreaElement>(null);
    const pertoDoFim = useRef(true);
    const ultimaMensagemId = useRef<string | null>(null);
    const posicaoAntesDasAnteriores = useRef<{ altura: number; topo: number } | null>(null);
    const marcarLidaTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

    const podeGerenciar = isChatSupervisor(firestoreUser?.profile.role);

    // "Li até aqui": só com a conversa visível; espera um instante para juntar várias mensagens seguidas
    const marcarComoLida = () => {
        if (!uid) return;
        if (marcarLidaTimer.current) clearTimeout(marcarLidaTimer.current);
        marcarLidaTimer.current = setTimeout(() => {
            if (document.visibilityState !== "visible") return;
            markChatAsRead(id, uid).catch(erro => console.error("Erro ao marcar a conversa como lida:", erro));
        }, 800);
    };
    const marcarComoLidaRef = useRef(marcarComoLida);
    marcarComoLidaRef.current = marcarComoLida;

    const carregarEquipe = async (g: ChatGroup) => {
        try {
            setMembros(await getGroupMembers(g.memberIds));
        } catch (erro) {
            console.error("Erro ao carregar a equipe da conversa:", erro);
        }
    };

    const recarregarGrupo = async () => {
        const g = await getGroupDetails(id);
        if (!g) {
            setSemAcesso(true);
            return;
        }
        setGrupo(g);
        carregarEquipe(g);
    };

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
            carregarEquipe(g);
            // Fixa onde começam as novas para esta visita (não muda ao marcar como lida)
            setLidoAteAoAbrir(readUntil(g, uid));

            cancelarAssinatura = subscribeToChatMessages(
                id,
                (janela) => {
                    const ultima = janela.at(-1);
                    if (primeiraLeitura) {
                        primeiraLeitura = false;
                        // Janela cheia: pode haver mensagens anteriores a ela
                        setTemAnteriores(janela.length === LIVE_WINDOW_SIZE);
                        marcarComoLidaRef.current();
                    } else if (ultima && ultima.senderId !== uid) {
                        // A própria mensagem já marca a leitura ao ser enviada (sendMessage)
                        marcarComoLidaRef.current();
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

        // Voltar para a aba também conta como ler
        const aoVoltarParaAba = () => {
            if (document.visibilityState === "visible") marcarComoLidaRef.current();
        };
        document.addEventListener("visibilitychange", aoVoltarParaAba);

        return () => {
            ativo = false;
            cancelarAssinatura?.();
            document.removeEventListener("visibilitychange", aoVoltarParaAba);
            if (marcarLidaTimer.current) clearTimeout(marcarLidaTimer.current);
        };
        // Só refaz ao trocar de conversa ou de pessoa (a marcação de leitura vem por ref)
    }, [id, uid]);

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
        } else if (chegouNova && (pertoDoFim.current || ultima.senderId === uid)) {
            // Anima só trajetos curtos; de longe (lendo o histórico), salta direto para o fim
            const distancia = area.scrollHeight - area.scrollTop - area.clientHeight;
            area.scrollTo({ top: area.scrollHeight, behavior: distancia < area.clientHeight * 2 ? "smooth" : "auto" });
        }
    }, [mensagens, uid]);

    // Caixa de texto cresce com o conteúdo, até umas 5 linhas
    useLayoutEffect(() => {
        const campo = campoRef.current;
        if (!campo) return;
        campo.style.height = "auto";
        // scrollHeight não inclui a borda nem as frações de pixel da altura da linha:
        // a barra de rolagem só aparece quando o texto passa do limite
        const altura = campo.scrollHeight + campo.offsetHeight - campo.clientHeight;
        campo.style.height = `${Math.min(altura, 140)}px`;
        campo.style.overflowY = altura > 140 ? "auto" : "hidden";
    }, [texto]);

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

    // No computador, Enter envia e Shift+Enter quebra a linha; no celular, Enter quebra a linha e envia-se pelo botão
    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key !== "Enter" || e.shiftKey || e.nativeEvent.isComposing) return;
        if (!window.matchMedia("(pointer: fine)").matches) return;
        e.preventDefault();
        handleEnviar();
    };

    if (!firestoreUser) return <div className="m-auto"><Loader2 className="h-6 w-6 animate-spin text-slate-300" /></div>;

    if (semAcesso) {
        return (
            <div className="m-auto flex max-w-xs flex-col items-center gap-3 p-6 text-center text-slate-500">
                <MessageCircleOff className="h-12 w-12 opacity-50" />
                <p className="font-medium text-slate-700">Não foi possível abrir esta conversa.</p>
                <p className="text-sm">Ela não existe ou você não tem acesso a ela.</p>
                <Button asChild variant="outline" className="mt-2">
                    <Link href="/mensagens">Voltar para as mensagens</Link>
                </Button>
            </div>
        );
    }

    const outros = membros.filter(m => m.uid !== uid).map(m => m.nome.split(" ")[0]);
    const resumoDaEquipe = outros.length === 0
        ? "Toque para ver a equipe"
        : `${outros.slice(0, 3).join(", ")}${outros.length > 3 ? ` e mais ${outros.length - 3}` : ""}`;
    const souMembro = grupo?.memberIds.includes(uid) ?? true;
    const itens = buildTimeline(mensagens, uid, lidoAteAoAbrir);

    return (
        <>
            {/* --- CABEÇALHO --- */}
            <header className="flex items-center gap-1 border-b bg-white px-2 py-2 sm:px-3">
                <Button asChild variant="ghost" size="icon" className="h-9 w-9 shrink-0 rounded-full lg:hidden">
                    <Link href="/mensagens" aria-label="Voltar para as conversas">
                        <ArrowLeft className="h-5 w-5 text-slate-700" />
                    </Link>
                </Button>
                <button
                    onClick={() => setVerEquipe(true)}
                    disabled={!grupo}
                    className="flex min-w-0 flex-1 items-center gap-3 rounded-lg p-1.5 text-left hover:bg-slate-50"
                >
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#16375b] text-sm font-semibold text-white">
                        {grupo ? getIniciais(grupo.pacienteNome) : ""}
                    </span>
                    <span className="min-w-0">
                        <span className="block truncate text-base font-semibold text-slate-900">
                            {grupo ? grupo.pacienteNome : "Carregando..."}
                        </span>
                        <span className="block truncate text-sm text-slate-500">{resumoDaEquipe}</span>
                    </span>
                    <ChevronRight className="ml-auto h-4 w-4 shrink-0 text-slate-400" />
                </button>
            </header>

            {!souMembro && (
                <p className="flex items-center gap-2 border-b bg-slate-100 px-4 py-1.5 text-xs font-medium text-slate-600">
                    <Eye className="h-3.5 w-3.5" /> Você acompanha esta conversa como supervisão
                </p>
            )}

            {/* --- MENSAGENS --- */}
            <div ref={areaRef} onScroll={handleScroll} className="flex-1 space-y-2 overflow-y-auto px-3 py-4 sm:px-6">
                {loading ? (
                    <div className="flex justify-center py-10"><Loader2 className="h-6 w-6 animate-spin text-slate-300" /></div>
                ) : mensagens.length === 0 ? (
                    <div className="flex h-full flex-col items-center justify-center space-y-1 text-center text-sm text-slate-500">
                        <p>Nenhuma mensagem ainda.</p>
                        <p className="text-xs">Envie a primeira mensagem para o grupo.</p>
                    </div>
                ) : (
                    <>
                        {temAnteriores && (
                            <div className="flex justify-center pb-2">
                                <Button variant="outline" size="sm" onClick={carregarAnteriores} disabled={carregandoAnteriores} className="rounded-full bg-white text-xs">
                                    {carregandoAnteriores && <Loader2 className="mr-2 h-3 w-3 animate-spin" />}
                                    Carregar mensagens anteriores
                                </Button>
                            </div>
                        )}
                        {itens.map(item => {
                            if (item.kind === "day") {
                                return (
                                    <div key={item.key} className="flex justify-center py-2">
                                        <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-slate-600 shadow-sm">
                                            {rotuloDoDia(item.date)}
                                        </span>
                                    </div>
                                );
                            }
                            if (item.kind === "unread") {
                                return (
                                    <div key={item.key} className="flex items-center gap-3 py-2">
                                        <div className="h-px flex-1 bg-[#1da7ac]" />
                                        <span className="text-xs font-bold uppercase tracking-wide text-[#1da7ac]">Novas mensagens</span>
                                        <div className="h-px flex-1 bg-[#1da7ac]" />
                                    </div>
                                );
                            }
                            const comoAparece = infoDoPapel(item.senderRole);
                            return (
                                <div key={item.key} className={`flex items-end gap-2 ${item.mine ? "justify-end" : ""}`}>
                                    {!item.mine && (
                                        <span className="mb-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white text-xs font-semibold text-slate-700 shadow-sm">
                                            {getIniciais(item.senderName)}
                                        </span>
                                    )}
                                    <div className={`flex max-w-[85%] flex-col gap-1 sm:max-w-[65%] ${item.mine ? "items-end" : "items-start"}`}>
                                        {!item.mine && (
                                            <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 pl-1">
                                                <span className="text-[13px] font-semibold text-slate-800">{item.senderName}</span>
                                                <span className={`rounded px-1.5 py-0.5 text-[11px] font-semibold ${comoAparece.cor}`}>{comoAparece.rotulo}</span>
                                            </div>
                                        )}
                                        {item.messages.map(msg => (
                                            <div
                                                key={msg.id}
                                                className={`rounded-2xl px-3.5 py-2 text-[15px] leading-relaxed shadow-sm ${item.mine ? "rounded-br-md bg-[#1da7ac] text-white" : "rounded-bl-md bg-white text-slate-900"}`}
                                            >
                                                <p className="whitespace-pre-wrap break-words">{msg.content}</p>
                                                <p className={`mt-0.5 text-right text-xs ${item.mine ? "text-white/80" : "text-slate-500"}`}>
                                                    {msg.createdAt ? horaCurta(msg.createdAt.toDate()) : ""}
                                                </p>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            );
                        })}
                    </>
                )}
            </div>

            {/* --- CAIXA DE TEXTO --- */}
            <footer className="border-t bg-white p-3">
                <div className="mx-auto flex max-w-4xl items-end gap-2">
                    <textarea
                        ref={campoRef}
                        value={texto}
                        onChange={(e) => setTexto(e.target.value)}
                        onKeyDown={handleKeyDown}
                        rows={1}
                        placeholder="Escreva uma mensagem"
                        maxLength={TAMANHO_MAXIMO}
                        className="flex-1 resize-none rounded-2xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-[15px] leading-relaxed outline-none focus:border-[#1da7ac]"
                    />
                    <Button
                        onClick={handleEnviar}
                        disabled={!texto.trim() || enviando}
                        aria-label="Enviar mensagem"
                        className="h-11 w-11 shrink-0 rounded-full bg-[#1da7ac] p-0 shadow-sm hover:bg-[#1da7ac]/90"
                    >
                        {enviando
                            ? <Loader2 className="h-5 w-5 animate-spin text-white" />
                            : <Send className="h-5 w-5 text-white" />}
                    </Button>
                </div>
                <p className="mx-auto mt-1.5 hidden max-w-4xl pl-2 text-xs text-slate-400 [@media(pointer:fine)]:block">
                    Enter envia · Shift+Enter quebra a linha
                </p>
            </footer>

            {grupo && (
                <EquipeDaConversa
                    open={verEquipe}
                    onOpenChange={setVerEquipe}
                    grupo={grupo}
                    membros={membros}
                    meuUid={uid}
                    podeGerenciar={podeGerenciar}
                    onMudou={recarregarGrupo}
                />
            )}
        </>
    );
}
