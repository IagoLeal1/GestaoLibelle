"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import {
  ArrowLeft,
  Send,
  Paperclip,
  Smile,
  MoreVertical,
  Phone,
  Video,
  Check,
  CheckCheck,
  ImageIcon,
  FileText,
  Mic,
  Users,
  Info,
} from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"

const gruposData: Record<
  string,
  {
    id: number
    pacienteNome: string
    responsavel: string
    terapeutas: Array<{ nome: string; cargo: string; online: boolean }>
    membrosOnline: number
  }
> = {
  "1": {
    id: 1,
    pacienteNome: "Maria Santos Silva",
    responsavel: "Ana Santos Silva",
    terapeutas: [
      { nome: "Dra. Juliana Costa", cargo: "Fonoaudióloga", online: true },
      { nome: "Dr. Marcos Oliveira", cargo: "Psicólogo", online: true },
      { nome: "Dra. Camila Reis", cargo: "Terapeuta Ocupacional", online: false },
    ],
    membrosOnline: 3,
  },
  "2": {
    id: 2,
    pacienteNome: "Pedro Oliveira Costa",
    responsavel: "Carlos Oliveira Costa",
    terapeutas: [
      { nome: "Dra. Amanda Lima", cargo: "Fonoaudióloga", online: true },
      { nome: "Dr. Felipe Santos", cargo: "Psicólogo", online: false },
    ],
    membrosOnline: 2,
  },
  "3": {
    id: 3,
    pacienteNome: "Ana Clara Mendes",
    responsavel: "Lucia Mendes",
    terapeutas: [
      { nome: "Dra. Juliana Costa", cargo: "Fonoaudióloga", online: true },
      { nome: "Dra. Patricia Rocha", cargo: "Psicopedagoga", online: true },
      { nome: "Dr. Bruno Alves", cargo: "Psicólogo", online: true },
    ],
    membrosOnline: 4,
  },
  "4": {
    id: 4,
    pacienteNome: "João Pedro Santos",
    responsavel: "Roberto Santos",
    terapeutas: [
      { nome: "Dr. Marcos Oliveira", cargo: "Psicólogo", online: false },
      { nome: "Dra. Camila Reis", cargo: "Terapeuta Ocupacional", online: false },
    ],
    membrosOnline: 0,
  },
  "5": {
    id: 5,
    pacienteNome: "Rafael Silva Costa",
    responsavel: "Patricia Costa",
    terapeutas: [
      { nome: "Dra. Amanda Lima", cargo: "Fonoaudióloga", online: true },
      { nome: "Dr. Felipe Santos", cargo: "Psicólogo", online: false },
      { nome: "Dra. Juliana Costa", cargo: "Fonoaudióloga", online: true },
    ],
    membrosOnline: 3,
  },
  "6": {
    id: 6,
    pacienteNome: "Isabela Rodrigues",
    responsavel: "Marina Rodrigues",
    terapeutas: [
      { nome: "Dra. Patricia Rocha", cargo: "Psicopedagoga", online: true },
      { nome: "Dr. Bruno Alves", cargo: "Psicólogo", online: false },
    ],
    membrosOnline: 2,
  },
  "7": {
    id: 7,
    pacienteNome: "Gabriel Almeida",
    responsavel: "Carlos Almeida",
    terapeutas: [{ nome: "Dr. Marcos Oliveira", cargo: "Psicólogo", online: false }],
    membrosOnline: 0,
  },
  "8": {
    id: 8,
    pacienteNome: "Carla Fernanda Lima",
    responsavel: "Fernanda Lima",
    terapeutas: [
      { nome: "Dra. Camila Reis", cargo: "Terapeuta Ocupacional", online: false },
      { nome: "Dra. Amanda Lima", cargo: "Fonoaudióloga", online: false },
      { nome: "Dr. Felipe Santos", cargo: "Psicólogo", online: false },
    ],
    membrosOnline: 0,
  },
}

const mensagensData: Record<
  string,
  Array<{
    id: number
    remetenteNome: string
    remetenteTipo: "terapeuta" | "responsavel" | "eu"
    conteudo: string
    dataHora: string
    lido: boolean
    tipo: "texto" | "imagem" | "documento"
  }>
> = {
  "1": [
    {
      id: 1,
      remetenteNome: "Ana Santos Silva",
      remetenteTipo: "responsavel",
      conteudo: "Bom dia! Gostaria de saber como foi a sessão de ontem.",
      dataHora: "2024-01-15T08:30:00",
      lido: true,
      tipo: "texto",
    },
    {
      id: 2,
      remetenteNome: "Dra. Juliana Costa",
      remetenteTipo: "terapeuta",
      conteudo:
        "Bom dia, Ana! A sessão foi muito produtiva. A Maria está evoluindo muito bem nas atividades de coordenação motora.",
      dataHora: "2024-01-15T08:45:00",
      lido: true,
      tipo: "texto",
    },
    {
      id: 3,
      remetenteNome: "Dr. Marcos Oliveira",
      remetenteTipo: "terapeuta",
      conteudo:
        "Concordo com a Juliana! Observei uma melhora significativa na concentração da Maria também. Ótimo trabalho em equipe!",
      dataHora: "2024-01-15T08:50:00",
      lido: true,
      tipo: "texto",
    },
    {
      id: 4,
      remetenteNome: "Ana Santos Silva",
      remetenteTipo: "responsavel",
      conteudo: "Que ótimo! Ela tem praticado os exercícios em casa também. Faz todo dia antes de dormir!",
      dataHora: "2024-01-15T09:00:00",
      lido: true,
      tipo: "texto",
    },
    {
      id: 5,
      remetenteNome: "Dra. Camila Reis",
      remetenteTipo: "terapeuta",
      conteudo:
        "Isso é muito importante! Continue incentivando. Vou preparar algumas atividades extras que vocês podem fazer juntas em casa. Envio até amanhã!",
      dataHora: "2024-01-15T09:15:00",
      lido: true,
      tipo: "texto",
    },
    {
      id: 6,
      remetenteNome: "Você",
      remetenteTipo: "eu",
      conteudo: "Excelente progresso! Vamos agendar uma reunião para alinhar o plano terapêutico do próximo mês?",
      dataHora: "2024-01-15T09:30:00",
      lido: true,
      tipo: "texto",
    },
    {
      id: 7,
      remetenteNome: "Ana Santos Silva",
      remetenteTipo: "responsavel",
      conteudo: "A Maria está melhorando bastante com as sessões. Estamos muito felizes! Podemos sim agendar.",
      dataHora: "2024-01-15T10:30:00",
      lido: false,
      tipo: "texto",
    },
  ],
  "2": [
    {
      id: 1,
      remetenteNome: "Dra. Amanda Lima",
      remetenteTipo: "terapeuta",
      conteudo: "Olá Carlos! Lembrando da sessão de amanhã às 14h com o Pedro.",
      dataHora: "2024-01-15T08:00:00",
      lido: true,
      tipo: "texto",
    },
    {
      id: 2,
      remetenteNome: "Carlos Oliveira Costa",
      remetenteTipo: "responsavel",
      conteudo: "Confirmo a sessão de amanhã às 14h. Estaremos lá!",
      dataHora: "2024-01-15T09:15:00",
      lido: true,
      tipo: "texto",
    },
  ],
  "3": [
    {
      id: 1,
      remetenteNome: "Lucia Mendes",
      remetenteTipo: "responsavel",
      conteudo: "Boa tarde! Infelizmente não conseguiremos ir na quinta-feira.",
      dataHora: "2024-01-14T18:00:00",
      lido: true,
      tipo: "texto",
    },
    {
      id: 2,
      remetenteNome: "Dra. Juliana Costa",
      remetenteTipo: "terapeuta",
      conteudo: "Boa tarde, Lucia! Sem problemas. Podemos remarcar. Qual horário seria melhor?",
      dataHora: "2024-01-14T18:30:00",
      lido: true,
      tipo: "texto",
    },
    {
      id: 3,
      remetenteNome: "Dr. Bruno Alves",
      remetenteTipo: "terapeuta",
      conteudo: "Eu tenho disponibilidade na sexta às 10h ou 15h, caso ajude!",
      dataHora: "2024-01-14T18:35:00",
      lido: true,
      tipo: "texto",
    },
    {
      id: 4,
      remetenteNome: "Lucia Mendes",
      remetenteTipo: "responsavel",
      conteudo: "Podemos remarcar para sexta-feira às 15h então?",
      dataHora: "2024-01-14T18:45:00",
      lido: false,
      tipo: "texto",
    },
  ],
}

function getIniciais(nome: string) {
  return nome
    .split(" ")
    .map((n) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase()
}

function formatarHora(dataString: string) {
  const data = new Date(dataString)
  return data.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })
}

function formatarDataMensagem(dataString: string) {
  const data = new Date(dataString)
  const hoje = new Date()
  const ontem = new Date(hoje)
  ontem.setDate(ontem.getDate() - 1)

  if (data.toDateString() === hoje.toDateString()) {
    return "Hoje"
  } else if (data.toDateString() === ontem.toDateString()) {
    return "Ontem"
  } else {
    return data.toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" })
  }
}

function agruparMensagensPorData(mensagens: (typeof mensagensData)["1"]) {
  const grupos: Record<string, typeof mensagens> = {}

  mensagens.forEach((msg) => {
    const data = new Date(msg.dataHora).toDateString()
    if (!grupos[data]) {
      grupos[data] = []
    }
    grupos[data].push(msg)
  })

  return grupos
}

function getCorRemetente(tipo: string, nome: string) {
  if (tipo === "eu") return "bg-primary-teal/90 text-white"
  if (tipo === "responsavel") return "bg-amber-100 text-amber-900"
  // Terapeutas - cores diferentes baseadas no nome
  const cores = [
    "bg-blue-100 text-blue-900",
    "bg-purple-100 text-purple-900",
    "bg-pink-100 text-pink-900",
    "bg-cyan-100 text-cyan-900",
    "bg-emerald-100 text-emerald-900",
  ]
  const index = nome.length % cores.length
  return cores[index]
}

function getCorNome(tipo: string, nome: string) {
  if (tipo === "responsavel") return "text-amber-700"
  const cores = ["text-blue-700", "text-purple-700", "text-pink-700", "text-cyan-700", "text-emerald-700"]
  const index = nome.length % cores.length
  return cores[index]
}

export default function ChatPage() {
  const params = useParams()
  const router = useRouter()
  const id = params.id as string
  const grupo = gruposData[id]
  const [mensagens, setMensagens] = useState(mensagensData[id] || [])
  const [novaMensagem, setNovaMensagem] = useState("")
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    scrollToBottom()
  }, [mensagens])

  if (!grupo) {
    return (
      <div className="h-[calc(100vh-120px)] flex items-center justify-center">
        <p className="text-muted-foreground">Grupo não encontrado</p>
      </div>
    )
  }

  const enviarMensagem = () => {
    if (!novaMensagem.trim()) return

    const nova = {
      id: mensagens.length + 1,
      remetenteNome: "Você",
      remetenteTipo: "eu" as const,
      conteudo: novaMensagem,
      dataHora: new Date().toISOString(),
      lido: false,
      tipo: "texto" as const,
    }

    setMensagens([...mensagens, nova])
    setNovaMensagem("")
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      enviarMensagem()
    }
  }

  const mensagensAgrupadas = agruparMensagensPorData(mensagens)
  const totalMembros = grupo.terapeutas.length + 1 // +1 para o responsável

  return (
    <div className="h-[calc(100vh-120px)] flex flex-col bg-gray-100 -m-6 rounded-lg overflow-hidden">
      {/* Header do Chat em Grupo */}
      <div className="bg-primary-dark-blue text-white px-4 py-3 flex items-center gap-3 shadow-md">
        <Button
          variant="ghost"
          size="icon"
          className="text-white hover:bg-white/10"
          onClick={() => router.push("/mensagens")}
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>

        <div className="relative">
          <Avatar className="h-10 w-10">
            <AvatarFallback className="bg-primary-teal text-white font-medium">
              {getIniciais(grupo.pacienteNome)}
            </AvatarFallback>
          </Avatar>
          <span className="absolute -bottom-1 -right-1 bg-white text-primary-dark-blue text-[10px] font-bold p-0.5 rounded-full">
            <Users className="h-3 w-3" />
          </span>
        </div>

        <div className="flex-1 min-w-0">
          <h3 className="font-semibold truncate">{grupo.pacienteNome}</h3>
          <p className="text-xs text-white/70 truncate">
            {totalMembros + 1} membros • {grupo.membrosOnline} online
          </p>
        </div>

        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" className="text-white hover:bg-white/10">
            <Video className="h-5 w-5" />
          </Button>
          <Button variant="ghost" size="icon" className="text-white hover:bg-white/10">
            <Phone className="h-5 w-5" />
          </Button>

          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="text-white hover:bg-white/10">
                <Info className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent>
              <SheetHeader>
                <SheetTitle>Informações do Grupo</SheetTitle>
                <SheetDescription>Grupo de acompanhamento de {grupo.pacienteNome}</SheetDescription>
              </SheetHeader>
              <div className="mt-6 space-y-6">
                {/* Responsável */}
                <div>
                  <h4 className="text-sm font-semibold text-muted-foreground mb-3">Responsável</h4>
                  <div className="flex items-center gap-3 p-2 rounded-lg bg-amber-50">
                    <Avatar className="h-10 w-10">
                      <AvatarFallback className="bg-amber-200 text-amber-800">
                        {getIniciais(grupo.responsavel)}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium text-sm">{grupo.responsavel}</p>
                      <p className="text-xs text-muted-foreground">Responsável</p>
                    </div>
                  </div>
                </div>

                {/* Terapeutas */}
                <div>
                  <h4 className="text-sm font-semibold text-muted-foreground mb-3">
                    Equipe Terapêutica ({grupo.terapeutas.length})
                  </h4>
                  <div className="space-y-2">
                    {grupo.terapeutas.map((terapeuta, index) => (
                      <div key={index} className="flex items-center gap-3 p-2 rounded-lg bg-gray-50">
                        <div className="relative">
                          <Avatar className="h-10 w-10">
                            <AvatarFallback className="bg-primary-teal/20 text-primary-teal">
                              {getIniciais(terapeuta.nome)}
                            </AvatarFallback>
                          </Avatar>
                          {terapeuta.online && (
                            <span className="absolute bottom-0 right-0 h-2.5 w-2.5 bg-green-500 border-2 border-white rounded-full" />
                          )}
                        </div>
                        <div>
                          <p className="font-medium text-sm">{terapeuta.nome}</p>
                          <p className="text-xs text-muted-foreground">{terapeuta.cargo}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </SheetContent>
          </Sheet>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="text-white hover:bg-white/10">
                <MoreVertical className="h-5 w-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem>Ver perfil do paciente</DropdownMenuItem>
              <DropdownMenuItem>Buscar mensagens</DropdownMenuItem>
              <DropdownMenuItem>Silenciar grupo</DropdownMenuItem>
              <DropdownMenuItem>Arquivar conversa</DropdownMenuItem>
              <DropdownMenuItem className="text-red-600">Limpar conversa</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Área de Mensagens */}
      <div
        className="flex-1 overflow-y-auto p-4 space-y-4"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fillRule='evenodd'%3E%3Cg fill='%23d1d5db' fillOpacity='0.15'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }}
      >
        {Object.entries(mensagensAgrupadas).map(([data, msgs]) => (
          <div key={data}>
            {/* Separador de Data */}
            <div className="flex items-center justify-center my-4">
              <span className="bg-white/80 text-gray-600 text-xs px-3 py-1 rounded-full shadow-sm">
                {formatarDataMensagem(msgs[0].dataHora)}
              </span>
            </div>

            {/* Mensagens do dia */}
            {msgs.map((msg) => (
              <div key={msg.id} className={`flex mb-2 ${msg.remetenteTipo === "eu" ? "justify-end" : "justify-start"}`}>
                <div
                  className={`max-w-[75%] md:max-w-[65%] rounded-lg px-3 py-2 shadow-sm ${
                    msg.remetenteTipo === "eu"
                      ? "bg-primary-teal/90 text-white rounded-br-none"
                      : `${getCorRemetente(msg.remetenteTipo, msg.remetenteNome)} rounded-bl-none`
                  }`}
                >
                  {msg.remetenteTipo !== "eu" && (
                    <p className={`text-xs font-semibold mb-1 ${getCorNome(msg.remetenteTipo, msg.remetenteNome)}`}>
                      {msg.remetenteNome}
                    </p>
                  )}
                  <p className="text-sm whitespace-pre-wrap break-words">{msg.conteudo}</p>
                  <div
                    className={`flex items-center justify-end gap-1 mt-1 ${
                      msg.remetenteTipo === "eu" ? "text-white/70" : "text-gray-500"
                    }`}
                  >
                    <span className="text-[10px]">{formatarHora(msg.dataHora)}</span>
                    {msg.remetenteTipo === "eu" &&
                      (msg.lido ? (
                        <CheckCheck className="h-3.5 w-3.5 text-blue-300" />
                      ) : (
                        <Check className="h-3.5 w-3.5" />
                      ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Input de Mensagem */}
      <div className="bg-gray-200 px-3 py-2 flex items-center gap-2">
        <Button variant="ghost" size="icon" className="text-gray-600 hover:bg-gray-300 flex-shrink-0">
          <Smile className="h-5 w-5" />
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="text-gray-600 hover:bg-gray-300 flex-shrink-0">
              <Paperclip className="h-5 w-5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-48">
            <DropdownMenuItem>
              <ImageIcon className="h-4 w-4 mr-2 text-purple-500" />
              Fotos e vídeos
            </DropdownMenuItem>
            <DropdownMenuItem>
              <FileText className="h-4 w-4 mr-2 text-blue-500" />
              Documento
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <Input
          placeholder="Mensagem para o grupo..."
          value={novaMensagem}
          onChange={(e) => setNovaMensagem(e.target.value)}
          onKeyPress={handleKeyPress}
          className="flex-1 bg-white border-0 rounded-full px-4"
        />

        {novaMensagem.trim() ? (
          <Button
            size="icon"
            className="bg-primary-teal hover:bg-primary-teal/90 rounded-full flex-shrink-0"
            onClick={enviarMensagem}
          >
            <Send className="h-5 w-5" />
          </Button>
        ) : (
          <Button variant="ghost" size="icon" className="text-gray-600 hover:bg-gray-300 flex-shrink-0">
            <Mic className="h-5 w-5" />
          </Button>
        )}
      </div>
    </div>
  )
}
