"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Plus, Search, Filter, CheckCircle, Clock, AlertCircle, User, Users } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"

const funcionarios = [
  { id: "todos", nome: "Todos os Funcionários" },
  { id: "maria", nome: "Maria Silva", setor: "recepcao" },
  { id: "joao", nome: "João Santos", setor: "coordenacao" },
  { id: "ana", nome: "Ana Costa", setor: "financeiro" },
  { id: "carlos", nome: "Carlos Oliveira", setor: "recepcao" },
  { id: "lucia", nome: "Lúcia Ferreira", setor: "coordenacao" },
]

const tarefas = [
  {
    id: 1,
    titulo: "Confirmar agendamentos da manhã",
    descricao: "Ligar para todos os pacientes agendados para o período da manhã",
    setor: "recepcao",
    status: "pendente",
    funcionario: "maria",
    criadoPor: "Coordenador Geral",
    dataVencimento: "2024-01-16",
    prioridade: "alta",
  },
  {
    id: 2,
    titulo: "Organizar prontuários médicos",
    descricao: "Separar e organizar prontuários para os atendimentos do dia",
    setor: "recepcao",
    status: "em_andamento",
    funcionario: "carlos",
    criadoPor: "Coordenador Geral",
    dataVencimento: "2024-01-16",
    prioridade: "media",
  },
  {
    id: 3,
    titulo: "Revisar relatórios financeiros",
    descricao: "Analisar receitas e despesas do mês anterior",
    setor: "coordenacao",
    status: "concluida",
    funcionario: "joao",
    criadoPor: "Coordenador Geral",
    dataVencimento: "2024-01-15",
    prioridade: "alta",
  },
  {
    id: 4,
    titulo: "Atualizar planilhas de repasse",
    descricao: "Calcular e atualizar valores de repasse dos profissionais",
    setor: "financeiro",
    status: "pendente",
    funcionario: "ana",
    criadoPor: "Coordenador Geral",
    dataVencimento: "2024-01-17",
    prioridade: "alta",
  },
  {
    id: 5,
    titulo: "Preparar relatório mensal",
    descricao: "Compilar dados de atendimentos do mês",
    setor: "coordenacao",
    status: "em_andamento",
    funcionario: "lucia",
    criadoPor: "Coordenador Geral",
    dataVencimento: "2024-01-18",
    prioridade: "media",
  },
  {
    id: 6,
    titulo: "Conferir estoque de materiais",
    descricao: "Verificar materiais de limpeza e reposição",
    setor: "recepcao",
    status: "concluida",
    funcionario: "maria",
    criadoPor: "Coordenador Geral",
    dataVencimento: "2024-01-14",
    prioridade: "baixa",
  },
]

const colunas = [
  {
    id: "pendente",
    titulo: "Pendente",
    cor: "bg-red-50 border-red-200",
    corHeader: "bg-red-100 text-red-800",
    icon: AlertCircle,
  },
  {
    id: "em_andamento",
    titulo: "Em Andamento",
    cor: "bg-yellow-50 border-yellow-200",
    corHeader: "bg-yellow-100 text-yellow-800",
    icon: Clock,
  },
  {
    id: "concluida",
    titulo: "Concluída",
    cor: "bg-green-50 border-green-200",
    corHeader: "bg-green-100 text-green-800",
    icon: CheckCircle,
  },
]

const getPrioridadeBadge = (prioridade: string) => {
  const prioridadeConfig = {
    baixa: { label: "Baixa", className: "bg-gray-100 text-gray-800" },
    media: { label: "Média", className: "bg-blue-100 text-blue-800" },
    alta: { label: "Alta", className: "bg-red-100 text-red-800" },
  }

  const config = prioridadeConfig[prioridade as keyof typeof prioridadeConfig]
  return <Badge className={config.className}>{config.label}</Badge>
}

const getSetorBadge = (setor: string) => {
  const setorConfig = {
    recepcao: { label: "Recepção", className: "bg-blue-100 text-blue-800" },
    coordenacao: { label: "Coordenação", className: "bg-purple-100 text-purple-800" },
    financeiro: { label: "Financeiro", className: "bg-green-100 text-green-800" },
    geral: { label: "Geral", className: "bg-gray-100 text-gray-800" },
  }

  const config = setorConfig[setor as keyof typeof setorConfig]
  return <Badge className={config.className}>{config.label}</Badge>
}

export default function Tarefas() {
  const [searchTerm, setSearchTerm] = useState("")
  const [funcionarioFilter, setFuncionarioFilter] = useState("todos")
  const [novaTarefa, setNovaTarefa] = useState({
    titulo: "",
    descricao: "",
    setor: "",
    funcionario: "",
    dataVencimento: "",
    prioridade: "media",
  })

  const handleNovaTarefa = () => {
    console.log("Nova tarefa:", novaTarefa)
    setNovaTarefa({
      titulo: "",
      descricao: "",
      setor: "",
      funcionario: "",
      dataVencimento: "",
      prioridade: "media",
    })
  }

  const tarefasFiltradas = tarefas.filter((tarefa) => {
    const matchFuncionario = funcionarioFilter === "todos" || tarefa.funcionario === funcionarioFilter
    const matchSearch =
      tarefa.titulo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      tarefa.descricao.toLowerCase().includes(searchTerm.toLowerCase())
    return matchFuncionario && matchSearch
  })

  const tarefasPorStatus = colunas.reduce(
    (acc, coluna) => {
      acc[coluna.id] = tarefasFiltradas.filter((tarefa) => tarefa.status === coluna.id)
      return acc
    },
    {} as Record<string, typeof tarefas>,
  )

  const getFuncionarioNome = (funcionarioId: string) => {
    const funcionario = funcionarios.find((f) => f.id === funcionarioId)
    return funcionario?.nome || "Não atribuído"
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-primary-dark-blue">Sistema de Tarefas</h2>
          <p className="text-muted-foreground">Gerencie tarefas em formato de funil por funcionário</p>
        </div>

        <Dialog>
          <DialogTrigger asChild>
            <Button className="w-full sm:w-auto">
              <Plus className="mr-2 h-4 w-4" />
              Nova Tarefa
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Criar Nova Tarefa</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="titulo">Título da Tarefa</Label>
                <Input
                  id="titulo"
                  value={novaTarefa.titulo}
                  onChange={(e) => setNovaTarefa({ ...novaTarefa, titulo: e.target.value })}
                  placeholder="Digite o título da tarefa"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="descricao">Descrição</Label>
                <Textarea
                  id="descricao"
                  value={novaTarefa.descricao}
                  onChange={(e) => setNovaTarefa({ ...novaTarefa, descricao: e.target.value })}
                  placeholder="Descreva a tarefa detalhadamente"
                  rows={3}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="setor">Setor</Label>
                  <Select
                    value={novaTarefa.setor}
                    onValueChange={(value) => setNovaTarefa({ ...novaTarefa, setor: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o setor" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="recepcao">Recepção</SelectItem>
                      <SelectItem value="coordenacao">Coordenação</SelectItem>
                      <SelectItem value="financeiro">Financeiro</SelectItem>
                      <SelectItem value="geral">Geral</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="funcionario">Funcionário</Label>
                  <Select
                    value={novaTarefa.funcionario}
                    onValueChange={(value) => setNovaTarefa({ ...novaTarefa, funcionario: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o funcionário" />
                    </SelectTrigger>
                    <SelectContent>
                      {funcionarios
                        .filter((f) => f.id !== "todos")
                        .map((funcionario) => (
                          <SelectItem key={funcionario.id} value={funcionario.id}>
                            {funcionario.nome}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="prioridade">Prioridade</Label>
                  <Select
                    value={novaTarefa.prioridade}
                    onValueChange={(value) => setNovaTarefa({ ...novaTarefa, prioridade: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="baixa">Baixa</SelectItem>
                      <SelectItem value="media">Média</SelectItem>
                      <SelectItem value="alta">Alta</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="dataVencimento">Data de Vencimento</Label>
                  <Input
                    id="dataVencimento"
                    type="date"
                    value={novaTarefa.dataVencimento}
                    onChange={(e) => setNovaTarefa({ ...novaTarefa, dataVencimento: e.target.value })}
                  />
                </div>
              </div>
              <Button onClick={handleNovaTarefa} className="w-full">
                Criar Tarefa
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filtros
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="search">Buscar tarefa</Label>
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  id="search"
                  placeholder="Título ou descrição da tarefa..."
                  className="pl-8"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Funcionário</Label>
              <Select value={funcionarioFilter} onValueChange={setFuncionarioFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {funcionarios.map((funcionario) => (
                    <SelectItem key={funcionario.id} value={funcionario.id}>
                      <div className="flex items-center gap-2">
                        {funcionario.id === "todos" ? <Users className="h-4 w-4" /> : <User className="h-4 w-4" />}
                        {funcionario.nome}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {colunas.map((coluna) => {
          const Icon = coluna.icon
          const tarefasColuna = tarefasPorStatus[coluna.id] || []

          return (
            <div key={coluna.id} className={`rounded-lg border-2 ${coluna.cor} min-h-[600px]`}>
              <div className={`p-4 rounded-t-lg ${coluna.corHeader} border-b`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Icon className="h-5 w-5" />
                    <h3 className="font-semibold">{coluna.titulo}</h3>
                  </div>
                  <Badge variant="secondary" className="bg-white/50">
                    {tarefasColuna.length}
                  </Badge>
                </div>
              </div>

              <div className="p-4 space-y-3">
                {tarefasColuna.map((tarefa) => (
                  <Card key={tarefa.id} className="hover:shadow-md transition-shadow cursor-pointer">
                    <CardContent className="p-4">
                      <div className="space-y-3">
                        <div>
                          <h4 className="font-semibold text-sm text-primary-dark-blue line-clamp-2">{tarefa.titulo}</h4>
                          <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{tarefa.descricao}</p>
                        </div>

                        <div className="flex flex-wrap gap-1">
                          {getPrioridadeBadge(tarefa.prioridade)}
                          {getSetorBadge(tarefa.setor)}
                        </div>

                        <div className="space-y-1 text-xs text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <User className="h-3 w-3" />
                            <span>{getFuncionarioNome(tarefa.funcionario)}</span>
                          </div>
                          <div>Vencimento: {new Date(tarefa.dataVencimento).toLocaleDateString("pt-BR")}</div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}

                {tarefasColuna.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    <Icon className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">Nenhuma tarefa {coluna.titulo.toLowerCase()}</p>
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
