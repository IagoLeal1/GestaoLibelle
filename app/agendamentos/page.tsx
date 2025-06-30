"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Plus, Search, Filter, MoreHorizontal, Sun, Sunset, Moon } from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import Link from "next/link"

const appointments = [
  {
    id: 1,
    patient: "Maria Santos",
    professional: "Dr. João Silva",
    date: "2024-01-15",
    time: "09:00",
    periodo: "manha",
    status: "agendado",
    statusSecundario: "confirmado",
    tipo: "Consulta",
    sala: "101",
  },
  {
    id: 2,
    patient: "Pedro Oliveira",
    professional: "Dra. Ana Costa",
    date: "2024-01-15",
    time: "09:30",
    periodo: "manha",
    status: "finalizado",
    statusSecundario: "pago",
    tipo: "Retorno",
    sala: "102",
  },
  {
    id: 3,
    patient: "Carla Mendes",
    professional: "Dr. João Silva",
    date: "2024-01-15",
    time: "10:00",
    periodo: "manha",
    status: "nao_compareceu",
    statusSecundario: "sem_justificativa",
    tipo: "Consulta",
    sala: "101",
  },
  {
    id: 4,
    patient: "José Santos",
    professional: "Dra. Ana Costa",
    date: "2024-01-15",
    time: "10:30",
    periodo: "manha",
    status: "cancelado",
    statusSecundario: "reagendado",
    tipo: "Exame",
    sala: "102",
  },
  {
    id: 5,
    patient: "Ana Silva",
    professional: "Dr. João Silva",
    date: "2024-01-15",
    time: "11:00",
    periodo: "manha",
    status: "agendado",
    statusSecundario: "pendente_confirmacao",
    tipo: "Consulta",
    sala: "101",
  },
  {
    id: 6,
    patient: "Carlos Costa",
    professional: "Dra. Lucia Santos",
    date: "2024-01-15",
    time: "14:00",
    periodo: "tarde",
    status: "agendado",
    statusSecundario: "confirmado",
    tipo: "Terapia",
    sala: "103",
  },
  {
    id: 7,
    patient: "Fernanda Lima",
    professional: "Dr. Carlos Mendes",
    date: "2024-01-15",
    time: "15:30",
    periodo: "tarde",
    status: "em_atendimento",
    statusSecundario: "em_sala",
    tipo: "Fonoaudiologia",
    sala: "102",
  },
  {
    id: 8,
    patient: "Roberto Silva",
    professional: "Dra. Ana Costa",
    date: "2024-01-15",
    time: "16:00",
    periodo: "tarde",
    status: "agendado",
    statusSecundario: "confirmado",
    tipo: "Avaliação",
    sala: "201",
  },
  {
    id: 9,
    patient: "Juliana Mendes",
    professional: "Dr. João Silva",
    date: "2024-01-15",
    time: "19:00",
    periodo: "noite",
    status: "agendado",
    statusSecundario: "confirmado",
    tipo: "Consulta",
    sala: "101",
  },
  {
    id: 10,
    patient: "Paulo Santos",
    professional: "Dra. Lucia Santos",
    date: "2024-01-15",
    time: "20:00",
    periodo: "noite",
    status: "finalizado",
    statusSecundario: "pago",
    tipo: "Terapia",
    sala: "103",
  },
]

const getStatusBadge = (status: string) => {
  const statusConfig = {
    agendado: {
      label: "Agendado",
      className: "bg-primary-teal text-white",
    },
    finalizado: {
      label: "Finalizado",
      className: "bg-primary-medium-green text-white",
    },
    nao_compareceu: {
      label: "Não compareceu",
      className: "bg-secondary-red text-white",
    },
    cancelado: {
      label: "Cancelado",
      className: "bg-support-dark-purple text-white",
    },
    em_atendimento: {
      label: "Em Atendimento",
      className: "bg-secondary-orange text-white animate-pulse",
    },
  }

  const config = statusConfig[status as keyof typeof statusConfig]
  return <Badge className={config.className}>{config.label}</Badge>
}

const getStatusSecundarioBadge = (statusSecundario: string) => {
  const statusConfig = {
    confirmado: {
      label: "Confirmado",
      className: "bg-primary-medium-green/20 text-primary-medium-green border-primary-medium-green",
    },
    pendente_confirmacao: {
      label: "Pendente",
      className: "bg-secondary-orange/20 text-secondary-orange border-secondary-orange animate-pulse",
    },
    pago: {
      label: "Pago",
      className: "bg-primary-soft-green/20 text-primary-medium-green border-primary-soft-green",
    },
    sem_justificativa: {
      label: "Sem Justificativa",
      className: "bg-secondary-red/20 text-secondary-red border-secondary-red",
    },
    reagendado: {
      label: "Reagendado",
      className: "bg-primary-teal/20 text-primary-teal border-primary-teal",
    },
    em_sala: {
      label: "Em Sala",
      className: "bg-secondary-orange/20 text-secondary-orange border-secondary-orange",
    },
  }

  const config = statusConfig[statusSecundario as keyof typeof statusConfig]
  return (
    <Badge variant="outline" className={`text-xs ${config.className}`}>
      {config.label}
    </Badge>
  )
}

const getPeriodoIcon = (periodo: string) => {
  const periodoIcons = {
    manha: Sun,
    tarde: Sunset,
    noite: Moon,
  }
  return periodoIcons[periodo as keyof typeof periodoIcons] || Sun
}

const getPeriodoLabel = (periodo: string) => {
  const periodoLabels = {
    manha: "Manhã",
    tarde: "Tarde",
    noite: "Noite",
  }
  return periodoLabels[periodo as keyof typeof periodoLabels] || "Manhã"
}

const filterAppointmentsByPeriod = (appointments: any[], periodo: string) => {
  if (periodo === "todos") return appointments
  return appointments.filter((appointment) => appointment.periodo === periodo)
}

const getAppointmentStats = (appointments: any[]) => {
  return {
    total: appointments.length,
    agendados: appointments.filter((a) => a.status === "agendado").length,
    finalizados: appointments.filter((a) => a.status === "finalizado").length,
    cancelados: appointments.filter((a) => a.status === "cancelado").length,
    naoCompareceu: appointments.filter((a) => a.status === "nao_compareceu").length,
    emAtendimento: appointments.filter((a) => a.status === "em_atendimento").length,
  }
}

export default function Agendamentos() {
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("todos")
  const [professionalFilter, setProfessionalFilter] = useState("todos")
  const [periodoAtivo, setPeriodoAtivo] = useState("todos")

  const appointmentsFiltrados = appointments.filter((appointment) => {
    const matchesSearch = appointment.patient.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === "todos" || appointment.status === statusFilter
    const matchesProfessional = professionalFilter === "todos" || appointment.professional.includes(professionalFilter)
    const matchesPeriodo = periodoAtivo === "todos" || appointment.periodo === periodoAtivo

    return matchesSearch && matchesStatus && matchesProfessional && matchesPeriodo
  })

  const appointmentsPorPeriodo = {
    manha: filterAppointmentsByPeriod(appointments, "manha"),
    tarde: filterAppointmentsByPeriod(appointments, "tarde"),
    noite: filterAppointmentsByPeriod(appointments, "noite"),
  }

  const statsGeral = getAppointmentStats(appointments)
  const statsPeriodo = getAppointmentStats(appointmentsFiltrados)

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-primary-dark-blue">Agendamentos</h2>
          <p className="text-muted-foreground">Gerencie todos os agendamentos da clínica por período</p>
        </div>
        <Link href="agendamentos/novo">
          <Button className="w-full sm:w-auto">
            <Plus className="mr-2 h-4 w-4" />
            Novo Agendamento
          </Button>
        </Link>
      </div>

      {/* Estatísticas Gerais */}
      <div className="grid gap-4 grid-cols-2 md:grid-cols-3 lg:grid-cols-6">
        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-primary-dark-blue">{statsGeral.total}</p>
              <p className="text-xs text-primary-teal font-medium">Total</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-primary-teal">{statsGeral.agendados}</p>
              <p className="text-xs text-primary-teal font-medium">Agendados</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-secondary-orange">{statsGeral.emAtendimento}</p>
              <p className="text-xs text-secondary-orange font-medium">Em Atendimento</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-primary-medium-green">{statsGeral.finalizados}</p>
              <p className="text-xs text-primary-medium-green font-medium">Finalizados</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-support-dark-purple">{statsGeral.cancelados}</p>
              <p className="text-xs text-support-dark-purple font-medium">Cancelados</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-secondary-red">{statsGeral.naoCompareceu}</p>
              <p className="text-xs text-secondary-red font-medium">Faltas</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filtros */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filtros
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
            <div className="space-y-2">
              <Label htmlFor="search">Buscar paciente</Label>
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  id="search"
                  placeholder="Nome do paciente..."
                  className="pl-8"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="date">Data</Label>
              <Input id="date" type="date" defaultValue="2024-01-15" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="professional">Profissional</Label>
              <Select value={professionalFilter} onValueChange={setProfessionalFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos</SelectItem>
                  <SelectItem value="dr-joao">Dr. João Silva</SelectItem>
                  <SelectItem value="dra-ana">Dra. Ana Costa</SelectItem>
                  <SelectItem value="dra-lucia">Dra. Lucia Santos</SelectItem>
                  <SelectItem value="dr-carlos">Dr. Carlos Mendes</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos</SelectItem>
                  <SelectItem value="agendado">Agendado</SelectItem>
                  <SelectItem value="em_atendimento">Em Atendimento</SelectItem>
                  <SelectItem value="finalizado">Finalizado</SelectItem>
                  <SelectItem value="nao_compareceu">Não compareceu</SelectItem>
                  <SelectItem value="cancelado">Cancelado</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabs por Período */}
      <Tabs value={periodoAtivo} onValueChange={setPeriodoAtivo} className="w-full">
        <TabsList className="grid w-full grid-cols-2 lg:grid-cols-4">
          <TabsTrigger value="todos" className="text-xs sm:text-sm">
            Todos
          </TabsTrigger>
          <TabsTrigger value="manha" className="flex items-center gap-1 text-xs sm:text-sm">
            <Sun className="h-3 w-3 sm:h-4 sm:w-4" />
            <span className="hidden sm:inline">Manhã</span>
            <span className="sm:hidden">M</span>({appointmentsPorPeriodo.manha.length})
          </TabsTrigger>
          <TabsTrigger value="tarde" className="flex items-center gap-1 text-xs sm:text-sm">
            <Sunset className="h-3 w-3 sm:h-4 sm:w-4" />
            <span className="hidden sm:inline">Tarde</span>
            <span className="sm:hidden">T</span>({appointmentsPorPeriodo.tarde.length})
          </TabsTrigger>
          <TabsTrigger value="noite" className="flex items-center gap-1 text-xs sm:text-sm">
            <Moon className="h-3 w-3 sm:h-4 sm:w-4" />
            <span className="hidden sm:inline">Noite</span>
            <span className="sm:hidden">N</span>({appointmentsPorPeriodo.noite.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="todos" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Todos os Agendamentos ({appointmentsFiltrados.length})</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="min-w-[80px]">Período</TableHead>
                      <TableHead className="min-w-[120px]">Paciente</TableHead>
                      <TableHead className="min-w-[120px] hidden sm:table-cell">Profissional</TableHead>
                      <TableHead className="min-w-[60px]">Hora</TableHead>
                      <TableHead className="min-w-[60px] hidden md:table-cell">Sala</TableHead>
                      <TableHead className="min-w-[100px]">Status</TableHead>
                      <TableHead className="min-w-[100px] hidden xl:table-cell">Status Sec.</TableHead>
                      <TableHead className="text-right min-w-[60px]">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {appointmentsFiltrados.map((appointment) => {
                      const PeriodoIcon = getPeriodoIcon(appointment.periodo)
                      return (
                        <TableRow key={appointment.id}>
                          <TableCell>
                            <div className="flex items-center gap-1">
                              <PeriodoIcon className="h-3 w-3 text-primary-teal" />
                              <span className="text-xs hidden sm:inline">{getPeriodoLabel(appointment.periodo)}</span>
                            </div>
                          </TableCell>
                          <TableCell className="font-medium text-sm">{appointment.patient}</TableCell>
                          <TableCell className="hidden sm:table-cell text-sm">{appointment.professional}</TableCell>
                          <TableCell className="text-sm">{appointment.time}</TableCell>
                          <TableCell className="hidden md:table-cell">
                            <Badge variant="outline" className="text-xs">
                              {appointment.sala}
                            </Badge>
                          </TableCell>
                          <TableCell>{getStatusBadge(appointment.status)}</TableCell>
                          <TableCell className="hidden xl:table-cell">
                            {getStatusSecundarioBadge(appointment.statusSecundario)}
                          </TableCell>
                          <TableCell className="text-right">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" className="h-8 w-8 p-0">
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem>Editar</DropdownMenuItem>
                                <DropdownMenuItem>Finalizar</DropdownMenuItem>
                                <DropdownMenuItem>Remarcar</DropdownMenuItem>
                                <DropdownMenuItem className="text-red-600">Cancelar</DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      )
                    })}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {["manha", "tarde", "noite"].map((periodo) => {
          const appointmentsPeriodo = filterAppointmentsByPeriod(appointmentsFiltrados, periodo)
          const PeriodoIcon = getPeriodoIcon(periodo)
          const statsPeriodoAtual = getAppointmentStats(appointmentsPeriodo)

          return (
            <TabsContent key={periodo} value={periodo} className="space-y-4">
              {/* Estatísticas do Período */}
              <div className="grid gap-4 grid-cols-2 md:grid-cols-3 lg:grid-cols-5">
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2">
                      <PeriodoIcon className="h-4 w-4 text-primary-teal" />
                      <div>
                        <p className="text-xl font-bold text-primary-dark-blue">{statsPeriodoAtual.total}</p>
                        <p className="text-xs font-medium text-primary-teal">Total</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4">
                    <div className="text-center">
                      <p className="text-xl font-bold text-primary-teal">{statsPeriodoAtual.agendados}</p>
                      <p className="text-xs text-primary-teal font-medium">Agendados</p>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4">
                    <div className="text-center">
                      <p className="text-xl font-bold text-secondary-orange">{statsPeriodoAtual.emAtendimento}</p>
                      <p className="text-xs text-secondary-orange font-medium">Em Atend.</p>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4">
                    <div className="text-center">
                      <p className="text-xl font-bold text-primary-medium-green">{statsPeriodoAtual.finalizados}</p>
                      <p className="text-xs text-primary-medium-green font-medium">Finalizados</p>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4">
                    <div className="text-center">
                      <p className="text-xl font-bold text-secondary-red">
                        {statsPeriodoAtual.cancelados + statsPeriodoAtual.naoCompareceu}
                      </p>
                      <p className="text-xs text-secondary-red font-medium">Cancel./Faltas</p>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <PeriodoIcon className="h-5 w-5" />
                    Agendamentos da {getPeriodoLabel(periodo)} ({appointmentsPeriodo.length})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="min-w-[120px]">Paciente</TableHead>
                          <TableHead className="min-w-[120px] hidden sm:table-cell">Profissional</TableHead>
                          <TableHead className="min-w-[60px]">Hora</TableHead>
                          <TableHead className="min-w-[60px] hidden md:table-cell">Sala</TableHead>
                          <TableHead className="min-w-[100px]">Status</TableHead>
                          <TableHead className="min-w-[100px] hidden xl:table-cell">Status Sec.</TableHead>
                          <TableHead className="text-right min-w-[60px]">Ações</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {appointmentsPeriodo.map((appointment) => (
                          <TableRow key={appointment.id}>
                            <TableCell className="font-medium text-sm">{appointment.patient}</TableCell>
                            <TableCell className="hidden sm:table-cell text-sm">{appointment.professional}</TableCell>
                            <TableCell className="text-sm">{appointment.time}</TableCell>
                            <TableCell className="hidden md:table-cell">
                              <Badge variant="outline" className="text-xs">
                                {appointment.sala}
                              </Badge>
                            </TableCell>
                            <TableCell>{getStatusBadge(appointment.status)}</TableCell>
                            <TableCell className="hidden xl:table-cell">
                              {getStatusSecundarioBadge(appointment.statusSecundario)}
                            </TableCell>
                            <TableCell className="text-right">
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" className="h-8 w-8 p-0">
                                    <MoreHorizontal className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem>Editar</DropdownMenuItem>
                                  <DropdownMenuItem>Finalizar</DropdownMenuItem>
                                  <DropdownMenuItem>Remarcar</DropdownMenuItem>
                                  <DropdownMenuItem className="text-red-600">Cancelar</DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          )
        })}
      </Tabs>
    </div>
  )
}
