"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Plus, Search, Filter, MoreHorizontal, FileText, Eye, Edit, Download } from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import Link from "next/link"

const planosEvolutivos = [
  {
    id: 1,
    paciente: "Maria Santos Silva",
    profissional: "Dra. Ana Costa",
    data: "2024-01-15",
    diagnosticoFuncional: "Criança com dificuldades na comunicação verbal e interação social...",
    status: "ativo",
    ultimaAtualizacao: "2024-01-15",
  },
  {
    id: 2,
    paciente: "Pedro Oliveira Costa",
    profissional: "Dr. João Silva",
    data: "2024-01-10",
    diagnosticoFuncional: "Paciente apresenta déficits na coordenação motora fina e grossa...",
    status: "ativo",
    ultimaAtualizacao: "2024-01-12",
  },
  {
    id: 3,
    paciente: "Ana Clara Mendes",
    profissional: "Dra. Ana Costa",
    data: "2024-01-08",
    diagnosticoFuncional: "Criança com atraso no desenvolvimento da linguagem expressiva...",
    status: "ativo",
    ultimaAtualizacao: "2024-01-10",
  },
  {
    id: 4,
    paciente: "João Pedro Santos",
    profissional: "Dr. Carlos Mendes",
    data: "2023-12-20",
    diagnosticoFuncional: "Paciente com dificuldades de integração sensorial e autorregulação...",
    status: "encerrado",
    ultimaAtualizacao: "2024-01-05",
  },
  {
    id: 5,
    paciente: "Rafael Silva Costa",
    profissional: "Dra. Lucia Santos",
    data: "2024-01-05",
    diagnosticoFuncional: "Criança com limitações na mobilidade e força muscular...",
    status: "ativo",
    ultimaAtualizacao: "2024-01-08",
  },
  {
    id: 6,
    paciente: "Isabela Rodrigues",
    profissional: "Dr. Fernando Costa",
    data: "2023-12-15",
    diagnosticoFuncional: "Paciente com dificuldades comportamentais e de atenção...",
    status: "ativo",
    ultimaAtualizacao: "2024-01-06",
  },
  {
    id: 7,
    paciente: "Gabriel Almeida",
    profissional: "Dra. Mariana Silva",
    data: "2023-11-30",
    diagnosticoFuncional: "Criança com alterações dermatológicas que afetam autoestima...",
    status: "encerrado",
    ultimaAtualizacao: "2023-12-30",
  },
]

const profissionais = [
  "Dr. João Silva",
  "Dra. Ana Costa",
  "Dr. Carlos Mendes",
  "Dra. Lucia Santos",
  "Dr. Roberto Lima",
  "Dra. Patricia Oliveira",
  "Dr. Fernando Costa",
  "Dra. Mariana Silva",
]

const getStatusBadge = (status: string) => {
  const statusConfig = {
    ativo: {
      label: "Ativo",
      className: "bg-primary-medium-green text-white",
    },
    encerrado: {
      label: "Encerrado",
      className: "bg-support-dark-purple text-white",
    },
    suspenso: {
      label: "Suspenso",
      className: "bg-secondary-orange text-white",
    },
  }

  const config = statusConfig[status as keyof typeof statusConfig]
  return <Badge className={config.className}>{config.label}</Badge>
}

export default function PlanoEvolutivo() {
  const [searchTerm, setSearchTerm] = useState("")
  const [profissionalFilter, setProfissionalFilter] = useState("todos")
  const [dataInicial, setDataInicial] = useState("")
  const [dataFinal, setDataFinal] = useState("")

  const planosFiltrados = planosEvolutivos.filter((plano) => {
    const matchesSearch =
      plano.paciente.toLowerCase().includes(searchTerm.toLowerCase()) ||
      plano.profissional.toLowerCase().includes(searchTerm.toLowerCase()) ||
      plano.diagnosticoFuncional.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesProfissional = profissionalFilter === "todos" || plano.profissional === profissionalFilter

    const matchesData = (!dataInicial || plano.data >= dataInicial) && (!dataFinal || plano.data <= dataFinal)

    return matchesSearch && matchesProfissional && matchesData
  })

  const estatisticas = {
    total: planosEvolutivos.length,
    ativos: planosEvolutivos.filter((p) => p.status === "ativo").length,
    encerrados: planosEvolutivos.filter((p) => p.status === "encerrado").length,
    suspensos: planosEvolutivos.filter((p) => p.status === "suspenso").length,
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-primary-dark-blue">Planos Evolutivos dos Pacientes</h2>
          <p className="text-muted-foreground">Gerencie e acompanhe os planos evolutivos baseados na CIF</p>
        </div>
        <Link href="/plano-evolutivo/novo">
          <Button className="w-full sm:w-auto">
            <Plus className="mr-2 h-4 w-4" />
            Novo Plano Evolutivo
          </Button>
        </Link>
      </div>

      {/* Estatísticas */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <FileText className="h-4 w-4 text-primary-teal" />
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
              <p className="text-2xl font-bold text-support-dark-purple">{estatisticas.encerrados}</p>
              <p className="text-xs text-support-dark-purple font-medium">Encerrados</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-secondary-orange">{estatisticas.suspensos}</p>
              <p className="text-xs text-secondary-orange font-medium">Suspensos</p>
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
              <Label htmlFor="search">Buscar</Label>
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  id="search"
                  placeholder="Paciente ou profissional..."
                  className="pl-8"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="profissional">Profissional</Label>
              <Select value={profissionalFilter} onValueChange={setProfissionalFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos os profissionais</SelectItem>
                  {profissionais.map((prof) => (
                    <SelectItem key={prof} value={prof}>
                      {prof}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="dataInicial">Data Inicial</Label>
              <Input
                id="dataInicial"
                type="date"
                value={dataInicial}
                onChange={(e) => setDataInicial(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="dataFinal">Data Final</Label>
              <Input id="dataFinal" type="date" value={dataFinal} onChange={(e) => setDataFinal(e.target.value)} />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Lista de Planos Evolutivos */}
      <Card>
        <CardHeader>
          <CardTitle>Planos Evolutivos ({planosFiltrados.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="min-w-[150px]">Paciente</TableHead>
                  <TableHead className="min-w-[150px] hidden sm:table-cell">Profissional</TableHead>
                  <TableHead className="min-w-[100px] hidden md:table-cell">Data</TableHead>
                  <TableHead className="min-w-[250px] hidden lg:table-cell">Diagnóstico Funcional</TableHead>
                  <TableHead className="min-w-[80px]">Status</TableHead>
                  <TableHead className="min-w-[100px] hidden xl:table-cell">Última Atualização</TableHead>
                  <TableHead className="text-right min-w-[60px]">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {planosFiltrados.map((plano) => (
                  <TableRow key={plano.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium text-sm">{plano.paciente}</p>
                        <p className="text-xs text-muted-foreground sm:hidden">{plano.profissional}</p>
                      </div>
                    </TableCell>
                    <TableCell className="hidden sm:table-cell text-sm">{plano.profissional}</TableCell>
                    <TableCell className="hidden md:table-cell text-sm">
                      {new Date(plano.data).toLocaleDateString("pt-BR")}
                    </TableCell>
                    <TableCell className="hidden lg:table-cell text-sm">
                      <div className="max-w-xs">
                        <p className="truncate">{plano.diagnosticoFuncional}</p>
                      </div>
                    </TableCell>
                    <TableCell>{getStatusBadge(plano.status)}</TableCell>
                    <TableCell className="hidden xl:table-cell text-sm">
                      {new Date(plano.ultimaAtualizacao).toLocaleDateString("pt-BR")}
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem asChild>
                            <Link href={`/plano-evolutivo/${plano.id}`}>
                              <Eye className="mr-2 h-4 w-4" />
                              Visualizar
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <Edit className="mr-2 h-4 w-4" />
                            Editar
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <Download className="mr-2 h-4 w-4" />
                            Baixar
                          </DropdownMenuItem>
                          <DropdownMenuItem className="text-red-600">Arquivar</DropdownMenuItem>
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
    </div>
  )
}
