"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Plus, Search, Filter, MoreHorizontal, User, Phone, Mail, DollarSign } from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import Link from "next/link"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"

const profissionais = [
  {
    id: 1,
    nome: "Dr. João Silva",
    especialidade: "Psicologia",
    crm: "123456/SP",
    telefone: "(11) 99999-1111",
    celular: "(11) 98888-1111",
    email: "joao.silva@clinica.com",
    percentualRepasse: 60,
    valorConsulta: 150.0,
    diasAtendimento: ["segunda", "terca", "quarta", "quinta"],
    horarioInicio: "08:00",
    horarioFim: "17:00",
    status: "ativo",
    dataContratacao: "2023-01-15",
  },
  {
    id: 2,
    nome: "Dra. Ana Costa",
    especialidade: "Fonoaudiologia",
    crm: "654321/SP",
    telefone: "(11) 99999-2222",
    celular: "(11) 98888-2222",
    email: "ana.costa@clinica.com",
    percentualRepasse: 65,
    valorConsulta: 120.0,
    diasAtendimento: ["segunda", "terca", "quinta", "sexta"],
    horarioInicio: "09:00",
    horarioFim: "18:00",
    status: "ativo",
    dataContratacao: "2023-02-20",
  },
  {
    id: 3,
    nome: "Dr. Carlos Mendes",
    especialidade: "Terapia Ocupacional",
    crm: "789123/SP",
    telefone: "(11) 99999-3333",
    celular: "(11) 98888-3333",
    email: "carlos.mendes@clinica.com",
    percentualRepasse: 55,
    valorConsulta: 140.0,
    diasAtendimento: ["terca", "quarta", "quinta", "sexta"],
    horarioInicio: "08:30",
    horarioFim: "17:30",
    status: "ativo",
    dataContratacao: "2023-03-10",
  },
  {
    id: 4,
    nome: "Dra. Lucia Santos",
    especialidade: "Fisioterapia",
    crm: "456789/SP",
    telefone: "(11) 99999-4444",
    celular: "(11) 98888-4444",
    email: "lucia.santos@clinica.com",
    percentualRepasse: 60,
    valorConsulta: 130.0,
    diasAtendimento: ["segunda", "quarta", "quinta", "sexta", "sabado"],
    horarioInicio: "07:00",
    horarioFim: "16:00",
    status: "ativo",
    dataContratacao: "2023-04-05",
  },
  {
    id: 5,
    nome: "Dr. Roberto Lima",
    especialidade: "Neurologia",
    crm: "321654/SP",
    telefone: "(11) 99999-5555",
    celular: "(11) 98888-5555",
    email: "roberto.lima@clinica.com",
    percentualRepasse: 70,
    valorConsulta: 200.0,
    diasAtendimento: ["segunda", "terca", "quinta"],
    horarioInicio: "14:00",
    horarioFim: "20:00",
    status: "ativo",
    dataContratacao: "2023-05-12",
  },
  {
    id: 6,
    nome: "Dra. Patricia Oliveira",
    especialidade: "Psicologia",
    crm: "987654/SP",
    telefone: "(11) 99999-6666",
    celular: "(11) 98888-6666",
    email: "patricia.oliveira@clinica.com",
    percentualRepasse: 65,
    valorConsulta: 160.0,
    diasAtendimento: ["terca", "quarta", "sexta", "sabado"],
    horarioInicio: "09:00",
    horarioFim: "18:00",
    status: "inativo",
    dataContratacao: "2023-06-01",
  },
  {
    id: 7,
    nome: "Dr. Fernando Costa",
    especialidade: "Pediatria",
    crm: "147258/SP",
    telefone: "(11) 99999-7777",
    celular: "(11) 98888-7777",
    email: "fernando.costa@clinica.com",
    percentualRepasse: 58,
    valorConsulta: 180.0,
    diasAtendimento: ["segunda", "terca", "quarta", "quinta", "sexta"],
    horarioInicio: "08:00",
    horarioFim: "17:00",
    status: "ativo",
    dataContratacao: "2023-07-15",
  },
  {
    id: 8,
    nome: "Dra. Mariana Silva",
    especialidade: "Dermatologia",
    crm: "369258/SP",
    telefone: "(11) 99999-8888",
    celular: "(11) 98888-8888",
    email: "mariana.silva@clinica.com",
    percentualRepasse: 62,
    valorConsulta: 170.0,
    diasAtendimento: ["segunda", "quarta", "sexta"],
    horarioInicio: "13:00",
    horarioFim: "19:00",
    status: "ativo",
    dataContratacao: "2023-08-20",
  },
]

const getStatusBadge = (status: string) => {
  const statusConfig = {
    ativo: {
      label: "Ativo",
      className: "bg-primary-medium-green text-white",
    },
    inativo: {
      label: "Inativo",
      className: "bg-secondary-red text-white",
    },
    licenca: {
      label: "Licença",
      className: "bg-secondary-orange text-white",
    },
  }

  const config = statusConfig[status as keyof typeof statusConfig]
  return <Badge className={config.className}>{config.label}</Badge>
}

const getEspecialidadeBadge = (especialidade: string) => {
  const especialidadeConfig = {
    Psicologia: "bg-blue-100 text-blue-800",
    Fonoaudiologia: "bg-green-100 text-green-800",
    "Terapia Ocupacional": "bg-purple-100 text-purple-800",
    Fisioterapia: "bg-orange-100 text-orange-800",
    Neurologia: "bg-red-100 text-red-800",
    Pediatria: "bg-pink-100 text-pink-800",
    Dermatologia: "bg-yellow-100 text-yellow-800",
  }

  const className =
    especialidadeConfig[especialidade as keyof typeof especialidadeConfig] || "bg-gray-100 text-gray-800"
  return (
    <Badge variant="outline" className={className}>
      {especialidade}
    </Badge>
  )
}

const formatDiasAtendimento = (dias: string[]) => {
  const diasMap = {
    segunda: "Seg",
    terca: "Ter",
    quarta: "Qua",
    quinta: "Qui",
    sexta: "Sex",
    sabado: "Sáb",
    domingo: "Dom",
  }

  return dias.map((dia) => diasMap[dia as keyof typeof diasMap]).join(", ")
}

export default function Profissionais() {
  const [searchTerm, setSearchTerm] = useState("")
  const [especialidadeFilter, setEspecialidadeFilter] = useState("todos")
  const [statusFilter, setStatusFilter] = useState("todos")
  const [profissionalSelecionado, setProfissionalSelecionado] = useState<any>(null)
  const [modalAberto, setModalAberto] = useState(false)

  const abrirDetalhes = (profissional: any) => {
    setProfissionalSelecionado(profissional)
    setModalAberto(true)
  }

  const profissionaisFiltrados = profissionais.filter((profissional) => {
    const matchesSearch =
      profissional.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
      profissional.email.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesEspecialidade = especialidadeFilter === "todos" || profissional.especialidade === especialidadeFilter
    const matchesStatus = statusFilter === "todos" || profissional.status === statusFilter

    return matchesSearch && matchesEspecialidade && matchesStatus
  })

  const estatisticas = {
    total: profissionais.length,
    ativos: profissionais.filter((p) => p.status === "ativo").length,
    inativos: profissionais.filter((p) => p.status === "inativo").length,
    mediaRepasse: Math.round(profissionais.reduce((acc, p) => acc + p.percentualRepasse, 0) / profissionais.length),
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-primary-dark-blue">Profissionais</h2>
          <p className="text-muted-foreground">Gerencie o cadastro de profissionais da clínica</p>
        </div>
        <Link href="/profissionais/novo">
          <Button className="w-full sm:w-auto">
            <Plus className="mr-2 h-4 w-4" />
            Novo Profissional
          </Button>
        </Link>
      </div>

      {/* Estatísticas */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <User className="h-4 w-4 text-primary-teal" />
              <div>
                <p className="text-2xl font-bold text-primary-dark-blue">{estatisticas.total}</p>
                <p className="text-xs text-primary-teal font-medium">Total</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-primary-medium-green">{estatisticas.ativos}</p>
              <p className="text-xs text-primary-medium-green font-medium">Ativos</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-secondary-red">{estatisticas.inativos}</p>
              <p className="text-xs text-secondary-red font-medium">Inativos</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-secondary-orange">{estatisticas.mediaRepasse}%</p>
              <p className="text-xs text-secondary-orange font-medium">Repasse Médio</p>
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
              <Label htmlFor="search">Buscar profissional</Label>
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  id="search"
                  placeholder="Nome ou email..."
                  className="pl-8"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="especialidade">Especialidade</Label>
              <Select value={especialidadeFilter} onValueChange={setEspecialidadeFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todas</SelectItem>
                  <SelectItem value="Psicologia">Psicologia</SelectItem>
                  <SelectItem value="Fonoaudiologia">Fonoaudiologia</SelectItem>
                  <SelectItem value="Terapia Ocupacional">Terapia Ocupacional</SelectItem>
                  <SelectItem value="Fisioterapia">Fisioterapia</SelectItem>
                  <SelectItem value="Neurologia">Neurologia</SelectItem>
                  <SelectItem value="Pediatria">Pediatria</SelectItem>
                  <SelectItem value="Dermatologia">Dermatologia</SelectItem>
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
                  <SelectItem value="ativo">Ativo</SelectItem>
                  <SelectItem value="inativo">Inativo</SelectItem>
                  <SelectItem value="licenca">Licença</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Lista de Profissionais */}
      <Card>
        <CardHeader>
          <CardTitle>Lista de Profissionais ({profissionaisFiltrados.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="min-w-[150px]">Nome</TableHead>
                  <TableHead className="min-w-[120px] hidden sm:table-cell">Especialidade</TableHead>
                  <TableHead className="min-w-[100px] hidden md:table-cell">CRM</TableHead>
                  <TableHead className="min-w-[120px] hidden lg:table-cell">Contato</TableHead>
                  <TableHead className="min-w-[100px] hidden xl:table-cell">Dias</TableHead>
                  <TableHead className="min-w-[80px] hidden xl:table-cell">Horário</TableHead>
                  <TableHead className="min-w-[80px] hidden lg:table-cell">Repasse</TableHead>
                  <TableHead className="min-w-[80px]">Status</TableHead>
                  <TableHead className="text-right min-w-[60px]">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {profissionaisFiltrados.map((profissional) => (
                  <TableRow key={profissional.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium text-sm">{profissional.nome}</p>
                        <p className="text-xs text-muted-foreground sm:hidden">{profissional.especialidade}</p>
                      </div>
                    </TableCell>
                    <TableCell className="hidden sm:table-cell">
                      {getEspecialidadeBadge(profissional.especialidade)}
                    </TableCell>
                    <TableCell className="hidden md:table-cell text-sm">{profissional.crm}</TableCell>
                    <TableCell className="hidden lg:table-cell">
                      <div className="space-y-1">
                        <div className="flex items-center gap-1 text-xs">
                          <Phone className="h-3 w-3" />
                          {profissional.celular}
                        </div>
                        <div className="flex items-center gap-1 text-xs">
                          <Mail className="h-3 w-3" />
                          {profissional.email}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="hidden xl:table-cell text-xs">
                      {formatDiasAtendimento(profissional.diasAtendimento)}
                    </TableCell>
                    <TableCell className="hidden xl:table-cell text-xs">
                      {profissional.horarioInicio} - {profissional.horarioFim}
                    </TableCell>
                    <TableCell className="hidden lg:table-cell">
                      <div className="flex items-center gap-1">
                        <DollarSign className="h-3 w-3 text-primary-medium-green" />
                        <span className="text-sm font-medium">{profissional.percentualRepasse}%</span>
                      </div>
                    </TableCell>
                    <TableCell>{getStatusBadge(profissional.status)}</TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => abrirDetalhes(profissional)}>Ver Detalhes</DropdownMenuItem>
                          <DropdownMenuItem>Editar</DropdownMenuItem>
                          <DropdownMenuItem>Agenda</DropdownMenuItem>
                          <DropdownMenuItem>Relatório</DropdownMenuItem>
                          <DropdownMenuItem className="text-red-600">
                            {profissional.status === "ativo" ? "Desativar" : "Ativar"}
                          </DropdownMenuItem>
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

      {/* Modal de Detalhes do Profissional */}
      <Dialog open={modalAberto} onOpenChange={setModalAberto}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Detalhes do Profissional
            </DialogTitle>
          </DialogHeader>

          {profissionalSelecionado && (
            <div className="space-y-6">
              {/* Informações Básicas */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <User className="h-5 w-5" />
                    Informações Pessoais
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div>
                      <Label className="text-sm font-medium text-gray-600">Nome Completo</Label>
                      <p className="text-sm font-semibold text-gray-900">{profissionalSelecionado.nome}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-gray-600">Especialidade</Label>
                      <div className="mt-1">{getEspecialidadeBadge(profissionalSelecionado.especialidade)}</div>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-gray-600">CRM/Registro</Label>
                      <p className="text-sm text-gray-900">{profissionalSelecionado.crm}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-gray-600">Status</Label>
                      <div className="mt-1">{getStatusBadge(profissionalSelecionado.status)}</div>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-gray-600">Data de Contratação</Label>
                      <p className="text-sm text-gray-900">
                        {new Date(profissionalSelecionado.dataContratacao).toLocaleDateString("pt-BR")}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Contato */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Phone className="h-5 w-5" />
                    Informações de Contato
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-4 md:grid-cols-3">
                    <div>
                      <Label className="text-sm font-medium text-gray-600">Telefone</Label>
                      <p className="text-sm text-gray-900">{profissionalSelecionado.telefone}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-gray-600">Celular</Label>
                      <p className="text-sm text-gray-900">{profissionalSelecionado.celular}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-gray-600">E-mail</Label>
                      <p className="text-sm text-gray-900">{profissionalSelecionado.email}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Configurações Profissionais */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <DollarSign className="h-5 w-5" />
                    Configurações Financeiras
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div>
                      <Label className="text-sm font-medium text-gray-600">Percentual de Repasse</Label>
                      <p className="text-lg font-bold text-primary-medium-green">
                        {profissionalSelecionado.percentualRepasse}%
                      </p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-gray-600">Valor da Consulta</Label>
                      <p className="text-lg font-bold text-primary-teal">
                        R$ {profissionalSelecionado.valorConsulta.toFixed(2).replace(".", ",")}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Horários de Atendimento */}
              <Card>
                <CardHeader>
                  <CardTitle>Horários de Atendimento</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <Label className="text-sm font-medium text-gray-600">Dias da Semana</Label>
                      <div className="flex flex-wrap gap-2 mt-2">
                        {["segunda", "terca", "quarta", "quinta", "sexta", "sabado", "domingo"].map((dia) => {
                          const diasMap = {
                            segunda: "Segunda-feira",
                            terca: "Terça-feira",
                            quarta: "Quarta-feira",
                            quinta: "Quinta-feira",
                            sexta: "Sexta-feira",
                            sabado: "Sábado",
                            domingo: "Domingo",
                          }
                          const isActive = profissionalSelecionado.diasAtendimento.includes(dia)
                          return (
                            <Badge
                              key={dia}
                              variant={isActive ? "default" : "outline"}
                              className={isActive ? "bg-primary-teal text-white" : ""}
                            >
                              {diasMap[dia as keyof typeof diasMap]}
                            </Badge>
                          )
                        })}
                      </div>
                    </div>
                    <div className="grid gap-4 md:grid-cols-2">
                      <div>
                        <Label className="text-sm font-medium text-gray-600">Horário de Início</Label>
                        <p className="text-sm font-semibold text-gray-900">{profissionalSelecionado.horarioInicio}</p>
                      </div>
                      <div>
                        <Label className="text-sm font-medium text-gray-600">Horário de Fim</Label>
                        <p className="text-sm font-semibold text-gray-900">{profissionalSelecionado.horarioFim}</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Estatísticas do Profissional */}
              <Card>
                <CardHeader>
                  <CardTitle>Estatísticas do Mês</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-4 md:grid-cols-4">
                    <div className="text-center p-4 bg-primary-teal/10 rounded-lg">
                      <p className="text-2xl font-bold text-primary-teal">15</p>
                      <p className="text-xs text-primary-teal font-medium">Atendimentos</p>
                    </div>
                    <div className="text-center p-4 bg-primary-medium-green/10 rounded-lg">
                      <p className="text-2xl font-bold text-primary-medium-green">R$ 2.250</p>
                      <p className="text-xs text-primary-medium-green font-medium">Faturamento</p>
                    </div>
                    <div className="text-center p-4 bg-secondary-orange/10 rounded-lg">
                      <p className="text-2xl font-bold text-secondary-orange">R$ 1.350</p>
                      <p className="text-xs text-secondary-orange font-medium">Repasse</p>
                    </div>
                    <div className="text-center p-4 bg-support-dark-purple/10 rounded-lg">
                      <p className="text-2xl font-bold text-support-dark-purple">2</p>
                      <p className="text-xs text-support-dark-purple font-medium">Faltas</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
