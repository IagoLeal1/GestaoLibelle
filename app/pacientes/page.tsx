"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Plus, Search, Filter, MoreHorizontal, User, Phone, Calendar, MapPin } from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import Link from "next/link"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"

const pacientes = [
  {
    id: 1,
    nome: "Maria Santos Silva",
    dataNascimento: "2015-03-15",
    idade: 8,
    sexo: "feminino",
    cpf: "123.456.789-00",
    telefone: "(11) 99999-1111",
    celular: "(11) 98888-1111",
    email: "maria.santos@email.com",
    endereco: "Rua das Flores, 123",
    bairro: "Centro",
    cidade: "São Paulo",
    cep: "01234-567",
    responsavel: "Ana Santos Silva",
    telefoneResponsavel: "(11) 97777-1111",
    profissao: "Estudante",
    estadoCivil: "solteiro",
    status: "ativo",
    dataCadastro: "2023-01-15",
    ultimaConsulta: "2024-01-10",
    proximaConsulta: "2024-01-20",
    terapeutaAtual: "Dra. Ana Costa",
    observacoes: "Paciente colaborativo, gosta de atividades lúdicas",
  },
  {
    id: 2,
    nome: "Pedro Oliveira Costa",
    dataNascimento: "2012-07-22",
    idade: 11,
    sexo: "masculino",
    cpf: "987.654.321-00",
    telefone: "(11) 99999-2222",
    celular: "(11) 98888-2222",
    email: "pedro.oliveira@email.com",
    endereco: "Av. Paulista, 456",
    bairro: "Bela Vista",
    cidade: "São Paulo",
    cep: "01310-100",
    responsavel: "Carlos Oliveira Costa",
    telefoneResponsavel: "(11) 97777-2222",
    profissao: "Estudante",
    estadoCivil: "solteiro",
    status: "ativo",
    dataCadastro: "2023-02-20",
    ultimaConsulta: "2024-01-08",
    proximaConsulta: "2024-01-22",
    terapeutaAtual: "Dr. João Silva",
    observacoes: "Necessita de atividades que estimulem a concentração",
  },
  {
    id: 3,
    nome: "Ana Clara Mendes",
    dataNascimento: "2017-11-10",
    idade: 6,
    sexo: "feminino",
    cpf: "456.789.123-00",
    telefone: "(11) 99999-3333",
    celular: "(11) 98888-3333",
    email: "ana.mendes@email.com",
    endereco: "Rua Augusta, 789",
    bairro: "Consolação",
    cidade: "São Paulo",
    cep: "01305-000",
    responsavel: "Lucia Mendes",
    telefoneResponsavel: "(11) 97777-3333",
    profissao: "Estudante",
    estadoCivil: "solteiro",
    status: "ativo",
    dataCadastro: "2023-03-10",
    ultimaConsulta: "2024-01-12",
    proximaConsulta: "2024-01-25",
    terapeutaAtual: "Dra. Ana Costa",
    observacoes: "Criança muito tímida, precisa de tempo para se adaptar",
  },
  {
    id: 4,
    nome: "João Pedro Santos",
    dataNascimento: "2014-05-18",
    idade: 9,
    sexo: "masculino",
    cpf: "321.654.987-00",
    telefone: "(11) 99999-4444",
    celular: "(11) 98888-4444",
    email: "joao.santos@email.com",
    endereco: "Rua da Liberdade, 321",
    bairro: "Liberdade",
    cidade: "São Paulo",
    cep: "01503-001",
    responsavel: "Roberto Santos",
    telefoneResponsavel: "(11) 97777-4444",
    profissao: "Estudante",
    estadoCivil: "solteiro",
    status: "ativo",
    dataCadastro: "2023-04-05",
    ultimaConsulta: "2024-01-05",
    proximaConsulta: "2024-01-18",
    terapeutaAtual: "Dr. Carlos Mendes",
    observacoes: "Paciente muito ativo, responde bem a atividades físicas",
  },
  {
    id: 5,
    nome: "Carla Fernanda Lima",
    dataNascimento: "2016-09-03",
    idade: 7,
    sexo: "feminino",
    cpf: "654.321.987-00",
    telefone: "(11) 99999-5555",
    celular: "(11) 98888-5555",
    email: "carla.lima@email.com",
    endereco: "Rua Vergueiro, 567",
    bairro: "Vila Mariana",
    cidade: "São Paulo",
    cep: "04101-000",
    responsavel: "Fernanda Lima",
    telefoneResponsavel: "(11) 97777-5555",
    profissao: "Estudante",
    estadoCivil: "solteiro",
    status: "inativo",
    dataCadastro: "2023-05-12",
    ultimaConsulta: "2023-12-15",
    proximaConsulta: null,
    terapeutaAtual: null,
    observacoes: "Paciente transferido para outra clínica",
  },
  {
    id: 6,
    nome: "Rafael Silva Costa",
    dataNascimento: "2013-12-28",
    idade: 10,
    sexo: "masculino",
    cpf: "789.123.456-00",
    telefone: "(11) 99999-6666",
    celular: "(11) 98888-6666",
    email: "rafael.costa@email.com",
    endereco: "Av. Ibirapuera, 890",
    bairro: "Ibirapuera",
    cidade: "São Paulo",
    cep: "04029-000",
    responsavel: "Patricia Costa",
    telefoneResponsavel: "(11) 97777-6666",
    profissao: "Estudante",
    estadoCivil: "solteiro",
    status: "ativo",
    dataCadastro: "2023-06-01",
    ultimaConsulta: "2024-01-14",
    proximaConsulta: "2024-01-28",
    terapeutaAtual: "Dra. Lucia Santos",
    observacoes: "Excelente evolução no tratamento",
  },
  {
    id: 7,
    nome: "Isabela Rodrigues",
    dataNascimento: "2015-08-14",
    idade: 8,
    sexo: "feminino",
    cpf: "147.258.369-00",
    telefone: "(11) 99999-7777",
    celular: "(11) 98888-7777",
    email: "isabela.rodrigues@email.com",
    endereco: "Rua Oscar Freire, 234",
    bairro: "Jardins",
    cidade: "São Paulo",
    cep: "01426-000",
    responsavel: "Marina Rodrigues",
    telefoneResponsavel: "(11) 97777-7777",
    profissao: "Estudante",
    estadoCivil: "solteiro",
    status: "ativo",
    dataCadastro: "2023-07-15",
    ultimaConsulta: "2024-01-11",
    proximaConsulta: "2024-01-24",
    terapeutaAtual: "Dr. Fernando Costa",
    observacoes: "Paciente com ótima resposta ao tratamento",
  },
  {
    id: 8,
    nome: "Gabriel Almeida",
    dataNascimento: "2014-01-30",
    idade: 10,
    sexo: "masculino",
    cpf: "258.369.147-00",
    telefone: "(11) 99999-8888",
    celular: "(11) 98888-8888",
    email: "gabriel.almeida@email.com",
    endereco: "Rua Haddock Lobo, 678",
    bairro: "Cerqueira César",
    cidade: "São Paulo",
    cep: "01414-000",
    responsavel: "Carlos Almeida",
    telefoneResponsavel: "(11) 97777-8888",
    profissao: "Estudante",
    estadoCivil: "solteiro",
    status: "ativo",
    dataCadastro: "2023-08-20",
    ultimaConsulta: "2024-01-09",
    proximaConsulta: "2024-01-23",
    terapeutaAtual: "Dra. Mariana Silva",
    observacoes: "Necessita acompanhamento multidisciplinar",
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
    suspenso: {
      label: "Suspenso",
      className: "bg-secondary-orange text-white",
    },
  }

  const config = statusConfig[status as keyof typeof statusConfig]
  return <Badge className={config.className}>{config.label}</Badge>
}

const getSexoBadge = (sexo: string) => {
  const sexoConfig = {
    masculino: "bg-blue-100 text-blue-800",
    feminino: "bg-pink-100 text-pink-800",
    outro: "bg-purple-100 text-purple-800",
  }

  const className = sexoConfig[sexo as keyof typeof sexoConfig] || "bg-gray-100 text-gray-800"
  return (
    <Badge variant="outline" className={className}>
      {sexo.charAt(0).toUpperCase() + sexo.slice(1)}
    </Badge>
  )
}

const calcularIdade = (dataNascimento: string) => {
  const hoje = new Date()
  const nascimento = new Date(dataNascimento)
  let idade = hoje.getFullYear() - nascimento.getFullYear()
  const mes = hoje.getMonth() - nascimento.getMonth()

  if (mes < 0 || (mes === 0 && hoje.getDate() < nascimento.getDate())) {
    idade--
  }

  return idade
}

export default function Pacientes() {
  const [searchTerm, setSearchTerm] = useState("")
  const [sexoFilter, setSexoFilter] = useState("todos")
  const [statusFilter, setStatusFilter] = useState("todos")
  const [pacienteSelecionado, setPacienteSelecionado] = useState<any>(null)
  const [modalAberto, setModalAberto] = useState(false)

  const abrirDetalhes = (paciente: any) => {
    setPacienteSelecionado(paciente)
    setModalAberto(true)
  }

  const pacientesFiltrados = pacientes.filter((paciente) => {
    const matchesSearch =
      paciente.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
      paciente.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      paciente.responsavel.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesSexo = sexoFilter === "todos" || paciente.sexo === sexoFilter
    const matchesStatus = statusFilter === "todos" || paciente.status === statusFilter

    return matchesSearch && matchesSexo && matchesStatus
  })

  const estatisticas = {
    total: pacientes.length,
    ativos: pacientes.filter((p) => p.status === "ativo").length,
    inativos: pacientes.filter((p) => p.status === "inativo").length,
    mediaIdade: Math.round(pacientes.reduce((acc, p) => acc + p.idade, 0) / pacientes.length),
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-primary-dark-blue">Pacientes</h2>
          <p className="text-muted-foreground">Gerencie o cadastro de pacientes da clínica</p>
        </div>
        <Link href="/pacientes/novo">
          <Button className="w-full sm:w-auto">
            <Plus className="mr-2 h-4 w-4" />
            Novo Paciente
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
              <p className="text-2xl font-bold text-secondary-orange">{estatisticas.mediaIdade}</p>
              <p className="text-xs text-secondary-orange font-medium">Idade Média</p>
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
                  placeholder="Nome, email ou responsável..."
                  className="pl-8"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="sexo">Sexo</Label>
              <Select value={sexoFilter} onValueChange={setSexoFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos</SelectItem>
                  <SelectItem value="masculino">Masculino</SelectItem>
                  <SelectItem value="feminino">Feminino</SelectItem>
                  <SelectItem value="outro">Outro</SelectItem>
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
                  <SelectItem value="suspenso">Suspenso</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Lista de Pacientes */}
      <Card>
        <CardHeader>
          <CardTitle>Lista de Pacientes ({pacientesFiltrados.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="min-w-[150px]">Nome</TableHead>
                  <TableHead className="min-w-[80px] hidden sm:table-cell">Idade</TableHead>
                  <TableHead className="min-w-[80px] hidden md:table-cell">Sexo</TableHead>
                  <TableHead className="min-w-[120px] hidden lg:table-cell">Responsável</TableHead>
                  <TableHead className="min-w-[120px] hidden xl:table-cell">Terapeuta</TableHead>
                  <TableHead className="min-w-[100px] hidden lg:table-cell">Última Consulta</TableHead>
                  <TableHead className="min-w-[80px]">Status</TableHead>
                  <TableHead className="text-right min-w-[60px]">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pacientesFiltrados.map((paciente) => (
                  <TableRow key={paciente.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium text-sm">{paciente.nome}</p>
                        <p className="text-xs text-muted-foreground sm:hidden">{paciente.idade} anos</p>
                      </div>
                    </TableCell>
                    <TableCell className="hidden sm:table-cell text-sm">{paciente.idade} anos</TableCell>
                    <TableCell className="hidden md:table-cell">{getSexoBadge(paciente.sexo)}</TableCell>
                    <TableCell className="hidden lg:table-cell text-sm">{paciente.responsavel}</TableCell>
                    <TableCell className="hidden xl:table-cell text-sm">
                      {paciente.terapeutaAtual || "Não definido"}
                    </TableCell>
                    <TableCell className="hidden lg:table-cell text-sm">
                      {paciente.ultimaConsulta
                        ? new Date(paciente.ultimaConsulta).toLocaleDateString("pt-BR")
                        : "Nunca"}
                    </TableCell>
                    <TableCell>{getStatusBadge(paciente.status)}</TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => abrirDetalhes(paciente)}>Ver Detalhes</DropdownMenuItem>
                          <DropdownMenuItem>Editar</DropdownMenuItem>
                          <DropdownMenuItem>Histórico</DropdownMenuItem>
                          <DropdownMenuItem>Agendar Consulta</DropdownMenuItem>
                          <DropdownMenuItem className="text-red-600">
                            {paciente.status === "ativo" ? "Desativar" : "Ativar"}
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

      {/* Modal de Detalhes do Paciente */}
      <Dialog open={modalAberto} onOpenChange={setModalAberto}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Detalhes do Paciente
            </DialogTitle>
          </DialogHeader>

          {pacienteSelecionado && (
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
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    <div>
                      <Label className="text-sm font-medium text-gray-600">Nome Completo</Label>
                      <p className="text-sm font-semibold text-gray-900">{pacienteSelecionado.nome}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-gray-600">Data de Nascimento</Label>
                      <p className="text-sm text-gray-900">
                        {new Date(pacienteSelecionado.dataNascimento).toLocaleDateString("pt-BR")}
                      </p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-gray-600">Idade</Label>
                      <p className="text-sm font-semibold text-gray-900">{pacienteSelecionado.idade} anos</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-gray-600">Sexo</Label>
                      <div className="mt-1">{getSexoBadge(pacienteSelecionado.sexo)}</div>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-gray-600">CPF</Label>
                      <p className="text-sm text-gray-900">{pacienteSelecionado.cpf}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-gray-600">Status</Label>
                      <div className="mt-1">{getStatusBadge(pacienteSelecionado.status)}</div>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-gray-600">Profissão</Label>
                      <p className="text-sm text-gray-900">{pacienteSelecionado.profissao}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-gray-600">Estado Civil</Label>
                      <p className="text-sm text-gray-900">{pacienteSelecionado.estadoCivil}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-gray-600">Data de Cadastro</Label>
                      <p className="text-sm text-gray-900">
                        {new Date(pacienteSelecionado.dataCadastro).toLocaleDateString("pt-BR")}
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
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-4">
                      <h4 className="font-medium text-gray-900">Paciente</h4>
                      <div className="space-y-2">
                        <div>
                          <Label className="text-sm font-medium text-gray-600">Telefone</Label>
                          <p className="text-sm text-gray-900">{pacienteSelecionado.telefone}</p>
                        </div>
                        <div>
                          <Label className="text-sm font-medium text-gray-600">Celular</Label>
                          <p className="text-sm text-gray-900">{pacienteSelecionado.celular}</p>
                        </div>
                        <div>
                          <Label className="text-sm font-medium text-gray-600">E-mail</Label>
                          <p className="text-sm text-gray-900">{pacienteSelecionado.email}</p>
                        </div>
                      </div>
                    </div>
                    <div className="space-y-4">
                      <h4 className="font-medium text-gray-900">Responsável</h4>
                      <div className="space-y-2">
                        <div>
                          <Label className="text-sm font-medium text-gray-600">Nome</Label>
                          <p className="text-sm text-gray-900">{pacienteSelecionado.responsavel}</p>
                        </div>
                        <div>
                          <Label className="text-sm font-medium text-gray-600">Telefone</Label>
                          <p className="text-sm text-gray-900">{pacienteSelecionado.telefoneResponsavel}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Endereço */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MapPin className="h-5 w-5" />
                    Endereço
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    <div>
                      <Label className="text-sm font-medium text-gray-600">Endereço</Label>
                      <p className="text-sm text-gray-900">{pacienteSelecionado.endereco}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-gray-600">Bairro</Label>
                      <p className="text-sm text-gray-900">{pacienteSelecionado.bairro}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-gray-600">Cidade</Label>
                      <p className="text-sm text-gray-900">{pacienteSelecionado.cidade}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-gray-600">CEP</Label>
                      <p className="text-sm text-gray-900">{pacienteSelecionado.cep}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Informações Clínicas */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Calendar className="h-5 w-5" />
                    Informações Clínicas
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div>
                      <Label className="text-sm font-medium text-gray-600">Terapeuta Atual</Label>
                      <p className="text-sm font-semibold text-gray-900">
                        {pacienteSelecionado.terapeutaAtual || "Não definido"}
                      </p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-gray-600">Última Consulta</Label>
                      <p className="text-sm text-gray-900">
                        {pacienteSelecionado.ultimaConsulta
                          ? new Date(pacienteSelecionado.ultimaConsulta).toLocaleDateString("pt-BR")
                          : "Nunca"}
                      </p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-gray-600">Próxima Consulta</Label>
                      <p className="text-sm text-gray-900">
                        {pacienteSelecionado.proximaConsulta
                          ? new Date(pacienteSelecionado.proximaConsulta).toLocaleDateString("pt-BR")
                          : "Não agendada"}
                      </p>
                    </div>
                  </div>

                  {pacienteSelecionado.observacoes && (
                    <div className="mt-4">
                      <Label className="text-sm font-medium text-gray-600">Observações</Label>
                      <p className="text-sm text-gray-900 mt-1 p-3 bg-gray-50 rounded-lg">
                        {pacienteSelecionado.observacoes}
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Estatísticas do Paciente */}
              <Card>
                <CardHeader>
                  <CardTitle>Estatísticas do Tratamento</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-4 md:grid-cols-4">
                    <div className="text-center p-4 bg-primary-teal/10 rounded-lg">
                      <p className="text-2xl font-bold text-primary-teal">12</p>
                      <p className="text-xs text-primary-teal font-medium">Consultas Realizadas</p>
                    </div>
                    <div className="text-center p-4 bg-primary-medium-green/10 rounded-lg">
                      <p className="text-2xl font-bold text-primary-medium-green">8</p>
                      <p className="text-xs text-primary-medium-green font-medium">Meses de Tratamento</p>
                    </div>
                    <div className="text-center p-4 bg-secondary-orange/10 rounded-lg">
                      <p className="text-2xl font-bold text-secondary-orange">2</p>
                      <p className="text-xs text-secondary-orange font-medium">Faltas</p>
                    </div>
                    <div className="text-center p-4 bg-support-dark-purple/10 rounded-lg">
                      <p className="text-2xl font-bold text-support-dark-purple">95%</p>
                      <p className="text-xs text-support-dark-purple font-medium">Taxa de Presença</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Últimas Consultas */}
              <Card>
                <CardHeader>
                  <CardTitle>Últimas Consultas</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {[
                      { data: "2024-01-10", terapeuta: "Dra. Ana Costa", tipo: "Fonoaudiologia", status: "Realizada" },
                      { data: "2024-01-03", terapeuta: "Dra. Ana Costa", tipo: "Fonoaudiologia", status: "Realizada" },
                      { data: "2023-12-27", terapeuta: "Dra. Ana Costa", tipo: "Fonoaudiologia", status: "Realizada" },
                      { data: "2023-12-20", terapeuta: "Dra. Ana Costa", tipo: "Fonoaudiologia", status: "Falta" },
                    ].map((consulta, index) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center gap-3">
                          <Calendar className="h-4 w-4 text-primary-teal" />
                          <div>
                            <p className="text-sm font-medium">{new Date(consulta.data).toLocaleDateString("pt-BR")}</p>
                            <p className="text-xs text-gray-600">
                              {consulta.terapeuta} • {consulta.tipo}
                            </p>
                          </div>
                        </div>
                        <Badge
                          className={
                            consulta.status === "Realizada"
                              ? "bg-primary-medium-green text-white"
                              : "bg-secondary-red text-white"
                          }
                        >
                          {consulta.status}
                        </Badge>
                      </div>
                    ))}
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
