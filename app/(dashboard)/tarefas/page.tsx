"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Plus, Search, Filter, CheckCircle, Clock, AlertCircle } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"

const tarefas = [
  {
    id: 1,
    titulo: "Confirmar agendamentos da manhã",
    descricao: "Ligar para todos os pacientes agendados para o período da manhã",
    setor: "recepcao",
    status: "pendente",
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
    criadoPor: "Coordenador Geral",
    dataVencimento: "2024-01-17",
    prioridade: "alta",
  },
]

const getStatusBadge = (status: string) => {
  const statusConfig = {
    pendente: {
      label: "Pendente",
      className: "bg-secondary-orange/20 text-secondary-orange",
      icon: AlertCircle,
    },
    em_andamento: {
      label: "Em Andamento",
      className: "bg-primary-teal/20 text-primary-teal",
      icon: Clock,
    },
    concluida: {
      label: "Concluída",
      className: "bg-primary-medium-green/20 text-primary-medium-green",
      icon: CheckCircle,
    },
  }

  const config = statusConfig[status as keyof typeof statusConfig]
  return (
    <Badge className={`${config.className} flex items-center gap-1`}>
      <config.icon className="h-3 w-3" />
      {config.label}
    </Badge>
  )
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
  const [statusFilter, setStatusFilter] = useState("todos")
  const [setorFilter, setSetorFilter] = useState("todos")
  const [novaTarefa, setNovaTarefa] = useState({
    titulo: "",
    descricao: "",
    setor: "",
    dataVencimento: "",
    prioridade: "media",
  })

  const handleNovaTarefa = () => {
    console.log("Nova tarefa:", novaTarefa)
    // Implementar lógica para criar nova tarefa
    setNovaTarefa({
      titulo: "",
      descricao: "",
      setor: "",
      dataVencimento: "",
      prioridade: "media",
    })
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-primary-dark-blue">Tarefas</h2>
          <p className="text-muted-foreground">Gerencie tarefas por setor e acompanhe o progresso</p>
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
              <Button onClick={handleNovaTarefa} className="w-full">
                Criar Tarefa
              </Button>
            </div>
          </DialogContent>
        </Dialog>
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
          <div className="grid gap-4 md:grid-cols-4">
            <div className="space-y-2">
              <Label htmlFor="search">Buscar tarefa</Label>
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  id="search"
                  placeholder="Título da tarefa..."
                  className="pl-8"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Setor</Label>
              <Select value={setorFilter} onValueChange={setSetorFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos os setores</SelectItem>
                  <SelectItem value="recepcao">Recepção</SelectItem>
                  <SelectItem value="coordenacao">Coordenação</SelectItem>
                  <SelectItem value="financeiro">Financeiro</SelectItem>
                  <SelectItem value="geral">Geral</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Status</Label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos os status</SelectItem>
                  <SelectItem value="pendente">Pendente</SelectItem>
                  <SelectItem value="em_andamento">Em Andamento</SelectItem>
                  <SelectItem value="concluida">Concluída</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Lista de Tarefas */}
      <div className="grid gap-4">
        {tarefas.map((tarefa) => (
          <Card key={tarefa.id} className="hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-start gap-3 mb-3">
                    <div className="flex-1">
                      <h3 className="font-semibold text-lg text-primary-dark-blue">{tarefa.titulo}</h3>
                      <p className="text-muted-foreground mt-1">{tarefa.descricao}</p>
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                    <span>Criado por: {tarefa.criadoPor}</span>
                    <span>•</span>
                    <span>Vencimento: {new Date(tarefa.dataVencimento).toLocaleDateString("pt-BR")}</span>
                  </div>
                </div>
                <div className="flex flex-col gap-2">
                  {getStatusBadge(tarefa.status)}
                  {getSetorBadge(tarefa.setor)}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
