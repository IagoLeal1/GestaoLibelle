"use client"

import { useState } from "react"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Search, MessageCircle, Users } from "lucide-react"
import Link from "next/link"

const conversas = [
  {
    id: 1,
    pacienteNome: "Maria Santos Silva",
    responsavel: "Ana Santos Silva",
    terapeutas: ["Dra. Juliana Costa", "Dr. Marcos Oliveira", "Dra. Camila Reis"],
    ultimaMensagem: "Dra. Juliana: A Maria está melhorando bastante com as sessões.",
    dataUltimaMensagem: "2024-01-15T10:30:00",
    naoLidas: 2,
    membrosOnline: 2,
    avatar: null,
  },
  {
    id: 2,
    pacienteNome: "Pedro Oliveira Costa",
    responsavel: "Carlos Oliveira Costa",
    terapeutas: ["Dra. Amanda Lima", "Dr. Felipe Santos"],
    ultimaMensagem: "Carlos: Confirmo a sessão de amanhã às 14h.",
    dataUltimaMensagem: "2024-01-15T09:15:00",
    naoLidas: 0,
    membrosOnline: 1,
    avatar: null,
  },
  {
    id: 3,
    pacienteNome: "Ana Clara Mendes",
    responsavel: "Lucia Mendes",
    terapeutas: ["Dra. Juliana Costa", "Dra. Patricia Rocha", "Dr. Bruno Alves"],
    ultimaMensagem: "Lucia: Podemos remarcar para sexta-feira?",
    dataUltimaMensagem: "2024-01-14T18:45:00",
    naoLidas: 1,
    membrosOnline: 3,
    avatar: null,
  },
  {
    id: 4,
    pacienteNome: "João Pedro Santos",
    responsavel: "Roberto Santos",
    terapeutas: ["Dr. Marcos Oliveira", "Dra. Camila Reis"],
    ultimaMensagem: "Roberto: Muito obrigado pelo relatório de evolução!",
    dataUltimaMensagem: "2024-01-14T16:20:00",
    naoLidas: 0,
    membrosOnline: 0,
    avatar: null,
  },
  {
    id: 5,
    pacienteNome: "Rafael Silva Costa",
    responsavel: "Patricia Costa",
    terapeutas: ["Dra. Amanda Lima", "Dr. Felipe Santos", "Dra. Juliana Costa"],
    ultimaMensagem: "Dra. Amanda: Vou preparar o relatório para a reunião.",
    dataUltimaMensagem: "2024-01-14T14:00:00",
    naoLidas: 3,
    membrosOnline: 2,
    avatar: null,
  },
  {
    id: 6,
    pacienteNome: "Isabela Rodrigues",
    responsavel: "Marina Rodrigues",
    terapeutas: ["Dra. Patricia Rocha", "Dr. Bruno Alves"],
    ultimaMensagem: "Marina: Recebemos os exercícios para fazer em casa. Obrigada!",
    dataUltimaMensagem: "2024-01-13T11:30:00",
    naoLidas: 0,
    membrosOnline: 1,
    avatar: null,
  },
  {
    id: 7,
    pacienteNome: "Gabriel Almeida",
    responsavel: "Carlos Almeida",
    terapeutas: ["Dr. Marcos Oliveira"],
    ultimaMensagem: "Carlos: Gabriel está muito animado com as atividades novas.",
    dataUltimaMensagem: "2024-01-13T09:00:00",
    naoLidas: 0,
    membrosOnline: 0,
    avatar: null,
  },
  {
    id: 8,
    pacienteNome: "Carla Fernanda Lima",
    responsavel: "Fernanda Lima",
    terapeutas: ["Dra. Camila Reis", "Dra. Amanda Lima", "Dr. Felipe Santos"],
    ultimaMensagem: "Fernanda: Preciso do laudo médico para a escola.",
    dataUltimaMensagem: "2024-01-12T15:45:00",
    naoLidas: 1,
    membrosOnline: 0,
    avatar: null,
  },
]

function formatarData(dataString: string) {
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

function getIniciais(nome: string) {
  return nome
    .split(" ")
    .map((n) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase()
}

export default function MensagensPage() {
  const [busca, setBusca] = useState("")

  const conversasFiltradas = conversas.filter(
    (c) =>
      c.pacienteNome.toLowerCase().includes(busca.toLowerCase()) ||
      c.responsavel.toLowerCase().includes(busca.toLowerCase()) ||
      c.terapeutas.some((t) => t.toLowerCase().includes(busca.toLowerCase())),
  )

  const totalNaoLidas = conversas.reduce((acc, c) => acc + c.naoLidas, 0)

  return (
    <div className="h-[calc(100vh-120px)] flex flex-col">
      {/* Header */}
      <div className="mb-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold tracking-tight text-primary-dark-blue">Mensagens</h2>
            <p className="text-muted-foreground">Grupos de comunicação - Pacientes, Famílias e Terapeutas</p>
          </div>
          {totalNaoLidas > 0 && (
            <Badge className="bg-primary-teal text-white px-3 py-1">
              {totalNaoLidas} não lida{totalNaoLidas > 1 ? "s" : ""}
            </Badge>
          )}
        </div>
      </div>

      {/* Barra de busca */}
      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Buscar grupo por paciente, responsável ou terapeuta..."
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          className="pl-10 bg-white border-gray-200"
        />
      </div>

      {/* Lista de Conversas em Grupo */}
      <Card className="flex-1 overflow-hidden">
        <div className="h-full overflow-y-auto">
          {conversasFiltradas.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
              <MessageCircle className="h-12 w-12 mb-2 opacity-50" />
              <p>Nenhum grupo encontrado</p>
            </div>
          ) : (
            conversasFiltradas.map((conversa) => (
              <Link key={conversa.id} href={`/mensagens/${conversa.id}`} className="block">
                <div
                  className={`flex items-center gap-3 p-4 border-b border-gray-100 hover:bg-gray-50 transition-colors cursor-pointer ${
                    conversa.naoLidas > 0 ? "bg-primary-teal/5" : ""
                  }`}
                >
                  {/* Avatar do Grupo */}
                  <div className="relative flex-shrink-0">
                    <Avatar className="h-14 w-14">
                      <AvatarImage src={conversa.avatar || undefined} />
                      <AvatarFallback className="bg-primary-teal/20 text-primary-teal font-medium text-lg">
                        {getIniciais(conversa.pacienteNome)}
                      </AvatarFallback>
                    </Avatar>
                    {conversa.membrosOnline > 0 && (
                      <span className="absolute -bottom-1 -right-1 bg-green-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full border-2 border-white">
                        {conversa.membrosOnline}
                      </span>
                    )}
                  </div>

                  {/* Conteúdo */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <h3
                          className={`font-semibold truncate ${
                            conversa.naoLidas > 0 ? "text-primary-dark-blue" : "text-gray-800"
                          }`}
                        >
                          {conversa.pacienteNome}
                        </h3>
                        <Badge
                          variant="outline"
                          className="text-[10px] px-1.5 py-0 border-primary-teal/30 text-primary-teal"
                        >
                          <Users className="h-3 w-3 mr-1" />
                          {conversa.terapeutas.length + 1}
                        </Badge>
                      </div>
                      <span
                        className={`text-xs flex-shrink-0 ${
                          conversa.naoLidas > 0 ? "text-primary-teal font-medium" : "text-muted-foreground"
                        }`}
                      >
                        {formatarData(conversa.dataUltimaMensagem)}
                      </span>
                    </div>

                    <p className="text-xs text-muted-foreground mb-1 truncate">
                      {conversa.responsavel} • {conversa.terapeutas.join(", ")}
                    </p>

                    <div className="flex items-center justify-between gap-2">
                      <p
                        className={`text-sm truncate ${
                          conversa.naoLidas > 0 ? "text-gray-800 font-medium" : "text-muted-foreground"
                        }`}
                      >
                        {conversa.ultimaMensagem}
                      </p>
                      {conversa.naoLidas > 0 && (
                        <Badge className="bg-primary-teal text-white text-xs px-2 py-0.5 flex-shrink-0">
                          {conversa.naoLidas}
                        </Badge>
                      )}
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
