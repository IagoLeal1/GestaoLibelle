"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { MapPin, Clock, User, Settings, Users, CheckCircle, AlertCircle, RefreshCw } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"

const salas = [
  {
    id: 1,
    numero: "101",
    nome: "Sala de Psicologia 1",
    andar: 1,
    capacidade: 2,
    tipo: "psicologia",
    equipamentos: ["Mesa", "Cadeiras", "Brinquedos terapêuticos"],
    status: "ocupada",
    ocupacao: {
      profissional: "Dra. Ana Costa",
      paciente: "Maria Santos",
      inicio: "09:00",
      fim: "10:00",
      tipo: "Consulta",
    },
  },
  {
    id: 2,
    numero: "102",
    nome: "Sala de Fonoaudiologia",
    andar: 1,
    capacidade: 2,
    tipo: "fonoaudiologia",
    equipamentos: ["Mesa", "Espelho", "Materiais de fono"],
    status: "livre",
    proximaOcupacao: {
      profissional: "Dr. Carlos Mendes",
      paciente: "Pedro Silva",
      inicio: "10:30",
      fim: "11:30",
    },
  },
  {
    id: 3,
    numero: "103",
    nome: "Sala de Terapia Ocupacional",
    andar: 1,
    capacidade: 3,
    tipo: "terapia_ocupacional",
    equipamentos: ["Mesa adaptada", "Materiais sensoriais", "Jogos"],
    status: "ocupada",
    ocupacao: {
      profissional: "Dra. Lucia Santos",
      paciente: "João Pedro",
      inicio: "09:30",
      fim: "10:30",
      tipo: "Terapia",
    },
  },
  {
    id: 4,
    numero: "201",
    nome: "Sala de Reuniões",
    andar: 2,
    capacidade: 8,
    tipo: "reuniao",
    equipamentos: ["Mesa grande", "Cadeiras", "Projetor", "TV"],
    status: "reservada",
    ocupacao: {
      profissional: "Equipe Multidisciplinar",
      paciente: "Reunião de Equipe",
      inicio: "11:00",
      fim: "12:00",
      tipo: "Reunião",
    },
  },
  {
    id: 5,
    numero: "202",
    nome: "Sala de Psicologia 2",
    andar: 2,
    capacidade: 2,
    tipo: "psicologia",
    equipamentos: ["Mesa", "Cadeiras", "Materiais lúdicos"],
    status: "livre",
    proximaOcupacao: {
      profissional: "Dr. João Silva",
      paciente: "Ana Oliveira",
      inicio: "14:00",
      fim: "15:00",
    },
  },
  {
    id: 6,
    numero: "203",
    nome: "Sala de Avaliação",
    andar: 2,
    capacidade: 4,
    tipo: "avaliacao",
    equipamentos: ["Mesa", "Cadeiras", "Materiais de teste", "Computador"],
    status: "manutencao",
    observacao: "Ar condicionado em manutenção",
  },
  {
    id: 7,
    numero: "204",
    nome: "Sala Multissensorial",
    andar: 2,
    capacidade: 3,
    tipo: "multissensorial",
    equipamentos: ["Equipamentos sensoriais", "Colchões", "Luzes LED"],
    status: "livre",
  },
  {
    id: 8,
    numero: "301",
    nome: "Sala de Fisioterapia",
    andar: 3,
    capacidade: 2,
    tipo: "fisioterapia",
    equipamentos: ["Maca", "Equipamentos de fisio", "Espelhos"],
    status: "ocupada",
    ocupacao: {
      profissional: "Dr. Roberto Lima",
      paciente: "Carlos Mendes",
      inicio: "08:30",
      fim: "09:30",
      tipo: "Fisioterapia",
    },
  },
]

const getStatusInfo = (status: string) => {
  const statusConfig = {
    ocupada: {
      label: "Ocupada",
      color: "bg-secondary-red",
      textColor: "text-white",
      icon: User,
      borderColor: "border-secondary-red",
    },
    livre: {
      label: "Livre",
      color: "bg-primary-medium-green",
      textColor: "text-white",
      icon: CheckCircle,
      borderColor: "border-primary-medium-green",
    },
    reservada: {
      label: "Reservada",
      color: "bg-secondary-orange",
      textColor: "text-white",
      icon: Clock,
      borderColor: "border-secondary-orange",
    },
    manutencao: {
      label: "Manutenção",
      color: "bg-support-dark-purple",
      textColor: "text-white",
      icon: Settings,
      borderColor: "border-support-dark-purple",
    },
  }

  return statusConfig[status as keyof typeof statusConfig]
}

const getTipoIcon = (tipo: string) => {
  const tipoIcons = {
    psicologia: User,
    fonoaudiologia: Users,
    terapia_ocupacional: Users,
    reuniao: Users,
    avaliacao: CheckCircle,
    multissensorial: AlertCircle,
    fisioterapia: User,
  }

  return tipoIcons[tipo as keyof typeof tipoIcons] || User
}

export default function MapeamentoSalas() {
  const [andarSelecionado, setAndarSelecionado] = useState("todos")
  const [tipoSelecionado, setTipoSelecionado] = useState("todos")
  const [salaSelecionada, setSalaSelecionada] = useState<any>(null)

  const salasFiltradas = salas.filter((sala) => {
    const filtroAndar = andarSelecionado === "todos" || sala.andar.toString() === andarSelecionado
    const filtroTipo = tipoSelecionado === "todos" || sala.tipo === tipoSelecionado
    return filtroAndar && filtroTipo
  })

  const estatisticas = {
    total: salas.length,
    ocupadas: salas.filter((s) => s.status === "ocupada").length,
    livres: salas.filter((s) => s.status === "livre").length,
    reservadas: salas.filter((s) => s.status === "reservada").length,
    manutencao: salas.filter((s) => s.status === "manutencao").length,
  }

  const agruparPorAndar = (salas: any[]) => {
    return salas.reduce(
      (acc, sala) => {
        if (!acc[sala.andar]) {
          acc[sala.andar] = []
        }
        acc[sala.andar].push(sala)
        return acc
      },
      {} as Record<number, any[]>,
    )
  }

  const salasAgrupadas = agruparPorAndar(salasFiltradas)

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-primary-dark-blue">Mapeamento de Salas</h2>
          <p className="text-muted-foreground">Visualize a ocupação das salas em tempo real</p>
        </div>
        <Button variant="outline" className="w-full sm:w-auto bg-transparent">
          <RefreshCw className="mr-2 h-4 w-4" />
          Atualizar
        </Button>
      </div>

      {/* Estatísticas */}
      <div className="grid gap-4 md:grid-cols-5">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4 text-primary-teal" />
              <div>
                <p className="text-2xl font-bold">{estatisticas.total}</p>
                <p className="text-xs text-muted-foreground">Total</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <User className="h-4 w-4 text-secondary-red" />
              <div>
                <p className="text-2xl font-bold">{estatisticas.ocupadas}</p>
                <p className="text-xs text-muted-foreground">Ocupadas</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-primary-medium-green" />
              <div>
                <p className="text-2xl font-bold">{estatisticas.livres}</p>
                <p className="text-xs text-muted-foreground">Livres</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-secondary-orange" />
              <div>
                <p className="text-2xl font-bold">{estatisticas.reservadas}</p>
                <p className="text-xs text-muted-foreground">Reservadas</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Settings className="h-4 w-4 text-support-dark-purple" />
              <div>
                <p className="text-2xl font-bold">{estatisticas.manutencao}</p>
                <p className="text-xs text-muted-foreground">Manutenção</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filtros */}
      <Card>
        <CardHeader>
          <CardTitle>Filtros</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <label className="text-sm font-medium">Andar</label>
              <Select value={andarSelecionado} onValueChange={setAndarSelecionado}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos os andares</SelectItem>
                  <SelectItem value="1">1º Andar</SelectItem>
                  <SelectItem value="2">2º Andar</SelectItem>
                  <SelectItem value="3">3º Andar</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Tipo de Sala</label>
              <Select value={tipoSelecionado} onValueChange={setTipoSelecionado}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos os tipos</SelectItem>
                  <SelectItem value="psicologia">Psicologia</SelectItem>
                  <SelectItem value="fonoaudiologia">Fonoaudiologia</SelectItem>
                  <SelectItem value="terapia_ocupacional">Terapia Ocupacional</SelectItem>
                  <SelectItem value="fisioterapia">Fisioterapia</SelectItem>
                  <SelectItem value="reuniao">Reunião</SelectItem>
                  <SelectItem value="avaliacao">Avaliação</SelectItem>
                  <SelectItem value="multissensorial">Multissensorial</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Mapeamento das Salas */}
      <div className="space-y-6">
        {Object.entries(salasAgrupadas)
          .sort(([a], [b]) => Number.parseInt(a) - Number.parseInt(b))
          .map(([andar, salasDoAndar]) => (
            <Card key={andar}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="h-5 w-5" />
                  {andar}º Andar
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                  {salasDoAndar.map((sala) => {
                    const statusInfo = getStatusInfo(sala.status)
                    const TipoIcon = getTipoIcon(sala.tipo)
                    const StatusIcon = statusInfo.icon

                    return (
                      <Dialog key={sala.id}>
                        <DialogTrigger asChild>
                          <Card
                            className={`cursor-pointer hover:shadow-lg transition-all duration-200 border-2 ${statusInfo.borderColor} hover:scale-105`}
                          >
                            <CardContent className="p-4">
                              <div className="space-y-3">
                                {/* Header da Sala */}
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-2">
                                    <TipoIcon className="h-4 w-4 text-primary-teal" />
                                    <span className="font-semibold text-primary-dark-blue">Sala {sala.numero}</span>
                                  </div>
                                  <Badge className={`${statusInfo.color} ${statusInfo.textColor}`}>
                                    <StatusIcon className="h-3 w-3 mr-1" />
                                    {statusInfo.label}
                                  </Badge>
                                </div>

                                {/* Nome da Sala */}
                                <h3 className="text-sm font-medium text-gray-700">{sala.nome}</h3>

                                {/* Informações de Ocupação */}
                                {sala.status === "ocupada" && sala.ocupacao && (
                                  <div className="space-y-2 p-3 bg-secondary-red/10 rounded-lg">
                                    <div className="flex items-center gap-2 text-sm">
                                      <User className="h-3 w-3 text-secondary-red" />
                                      <span className="font-medium">{sala.ocupacao.profissional}</span>
                                    </div>
                                    <div className="text-xs text-gray-600">
                                      <p>Paciente: {sala.ocupacao.paciente}</p>
                                      <p>
                                        Horário: {sala.ocupacao.inicio} - {sala.ocupacao.fim}
                                      </p>
                                    </div>
                                  </div>
                                )}

                                {sala.status === "reservada" && sala.ocupacao && (
                                  <div className="space-y-2 p-3 bg-secondary-orange/10 rounded-lg">
                                    <div className="flex items-center gap-2 text-sm">
                                      <Clock className="h-3 w-3 text-secondary-orange" />
                                      <span className="font-medium">{sala.ocupacao.profissional}</span>
                                    </div>
                                    <div className="text-xs text-gray-600">
                                      <p>{sala.ocupacao.paciente}</p>
                                      <p>
                                        Horário: {sala.ocupacao.inicio} - {sala.ocupacao.fim}
                                      </p>
                                    </div>
                                  </div>
                                )}

                                {sala.status === "livre" && sala.proximaOcupacao && (
                                  <div className="space-y-2 p-3 bg-primary-medium-green/10 rounded-lg">
                                    <div className="text-xs text-gray-600">
                                      <p className="font-medium">Próximo agendamento:</p>
                                      <p>{sala.proximaOcupacao.profissional}</p>
                                      <p>
                                        {sala.proximaOcupacao.inicio} - {sala.proximaOcupacao.fim}
                                      </p>
                                    </div>
                                  </div>
                                )}

                                {sala.status === "manutencao" && (
                                  <div className="space-y-2 p-3 bg-support-dark-purple/10 rounded-lg">
                                    <div className="text-xs text-gray-600">
                                      <p className="font-medium">Em manutenção</p>
                                      {sala.observacao && <p>{sala.observacao}</p>}
                                    </div>
                                  </div>
                                )}

                                {/* Capacidade */}
                                <div className="flex items-center gap-2 text-xs text-gray-500">
                                  <Users className="h-3 w-3" />
                                  <span>Capacidade: {sala.capacidade} pessoas</span>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        </DialogTrigger>

                        {/* Modal com Detalhes da Sala */}
                        <DialogContent className="max-w-md">
                          <DialogHeader>
                            <DialogTitle className="flex items-center gap-2">
                              <TipoIcon className="h-5 w-5 text-primary-teal" />
                              Sala {sala.numero} - {sala.nome}
                            </DialogTitle>
                          </DialogHeader>
                          <div className="space-y-4">
                            <div className="flex items-center justify-between">
                              <span className="text-sm text-gray-600">Status:</span>
                              <Badge className={`${statusInfo.color} ${statusInfo.textColor}`}>
                                <StatusIcon className="h-3 w-3 mr-1" />
                                {statusInfo.label}
                              </Badge>
                            </div>

                            <div className="space-y-2">
                              <span className="text-sm font-medium">Informações:</span>
                              <div className="text-sm text-gray-600 space-y-1">
                                <p>Andar: {sala.andar}º</p>
                                <p>Capacidade: {sala.capacidade} pessoas</p>
                                <p>Tipo: {sala.tipo.replace("_", " ")}</p>
                              </div>
                            </div>

                            <div className="space-y-2">
                              <span className="text-sm font-medium">Equipamentos:</span>
                              <div className="flex flex-wrap gap-1">
                                {sala.equipamentos.map((equipamento, index) => (
                                  <Badge key={index} variant="outline" className="text-xs">
                                    {equipamento}
                                  </Badge>
                                ))}
                              </div>
                            </div>

                            {sala.ocupacao && (
                              <div className="space-y-2">
                                <span className="text-sm font-medium">Ocupação Atual:</span>
                                <div className="p-3 bg-gray-50 rounded-lg text-sm">
                                  <p>
                                    <strong>Profissional:</strong> {sala.ocupacao.profissional}
                                  </p>
                                  <p>
                                    <strong>Paciente:</strong> {sala.ocupacao.paciente}
                                  </p>
                                  <p>
                                    <strong>Horário:</strong> {sala.ocupacao.inicio} - {sala.ocupacao.fim}
                                  </p>
                                  <p>
                                    <strong>Tipo:</strong> {sala.ocupacao.tipo}
                                  </p>
                                </div>
                              </div>
                            )}
                          </div>
                        </DialogContent>
                      </Dialog>
                    )
                  })}
                </div>
              </CardContent>
            </Card>
          ))}
      </div>
    </div>
  )
}
