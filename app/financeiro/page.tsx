"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import {
  Plus,
  Download,
  Search,
  Filter,
  MoreHorizontal,
  DollarSign,
  TrendingUp,
  TrendingDown,
  Wallet,
} from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"

const movimentacoes = [
  {
    id: 1,
    tipo: "receita",
    categoria: "Mensalidades",
    descricao: "Mensalidade - Maria Santos",
    profissional: null,
    valor: 150.0,
    data: "2024-01-15",
  },
  {
    id: 2,
    tipo: "despesa",
    categoria: "Repasses",
    descricao: "Repasse Dr. João Silva",
    profissional: "Dr. João Silva",
    valor: 900.0,
    data: "2024-01-15",
  },
  {
    id: 3,
    tipo: "receita",
    categoria: "Mensalidades",
    descricao: "Mensalidade - Pedro Oliveira",
    profissional: null,
    valor: 120.0,
    data: "2024-01-14",
  },
  {
    id: 4,
    tipo: "despesa",
    categoria: "Repasses",
    descricao: "Repasse Dra. Ana Costa",
    profissional: "Dra. Ana Costa",
    valor: 780.0,
    data: "2024-01-14",
  },
  {
    id: 5,
    tipo: "despesa",
    categoria: "Obras",
    descricao: "Reforma sala 102",
    profissional: null,
    valor: 2500.0,
    data: "2024-01-13",
  },
  {
    id: 6,
    tipo: "receita",
    categoria: "Mensalidades",
    descricao: "Mensalidade - Ana Clara",
    profissional: null,
    valor: 140.0,
    data: "2024-01-12",
  },
  {
    id: 7,
    tipo: "despesa",
    categoria: "Compras",
    descricao: "Material de escritório",
    profissional: null,
    valor: 350.0,
    data: "2024-01-12",
  },
  {
    id: 8,
    tipo: "despesa",
    categoria: "Outros",
    descricao: "Conta de luz",
    profissional: null,
    valor: 480.0,
    data: "2024-01-11",
  },
  {
    id: 9,
    tipo: "receita",
    categoria: "Mensalidades",
    descricao: "Mensalidade - João Pedro",
    profissional: null,
    valor: 130.0,
    data: "2024-01-10",
  },
  {
    id: 10,
    tipo: "despesa",
    categoria: "Repasses",
    descricao: "Repasse Dr. Carlos Mendes",
    profissional: "Dr. Carlos Mendes",
    valor: 770.0,
    data: "2024-01-10",
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

const getTipoBadge = (tipo: string) => {
  const tipoConfig = {
    receita: {
      label: "Receita",
      className: "bg-primary-medium-green text-white",
      icon: TrendingUp,
    },
    despesa: {
      label: "Despesa",
      className: "bg-secondary-red text-white",
      icon: TrendingDown,
    },
  }

  const config = tipoConfig[tipo as keyof typeof tipoConfig]
  const IconComponent = config.icon
  return (
    <Badge className={`${config.className} flex items-center gap-1`}>
      <IconComponent className="h-3 w-3" />
      {config.label}
    </Badge>
  )
}

const getCategoriaBadge = (categoria: string) => {
  const categoriaConfig = {
    Repasses: "bg-blue-100 text-blue-800",
    Mensalidades: "bg-green-100 text-green-800",
    Obras: "bg-orange-100 text-orange-800",
    Compras: "bg-purple-100 text-purple-800",
    Outros: "bg-gray-100 text-gray-800",
  }

  const className = categoriaConfig[categoria as keyof typeof categoriaConfig] || "bg-gray-100 text-gray-800"
  return (
    <Badge variant="outline" className={className}>
      {categoria}
    </Badge>
  )
}

export default function Financeiro() {
  const [searchTerm, setSearchTerm] = useState("")
  const [categoriaFilter, setCategoriaFilter] = useState("todos")
  const [dataInicial, setDataInicial] = useState("2024-01-01")
  const [dataFinal, setDataFinal] = useState("2024-01-31")
  const [modalAberto, setModalAberto] = useState(false)
  const [novaMovimentacao, setNovaMovimentacao] = useState({
    tipo: "",
    categoria: "",
    descricao: "",
    profissional: "",
    valor: "",
    data: "",
  })

  const handleSalvarMovimentacao = () => {
    console.log("Nova movimentação:", novaMovimentacao)
    setNovaMovimentacao({
      tipo: "",
      categoria: "",
      descricao: "",
      profissional: "",
      valor: "",
      data: "",
    })
    setModalAberto(false)
  }

  const movimentacoesFiltradas = movimentacoes.filter((mov) => {
    const matchesSearch =
      mov.descricao.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (mov.profissional && mov.profissional.toLowerCase().includes(searchTerm.toLowerCase()))
    const matchesCategoria = categoriaFilter === "todos" || mov.categoria === categoriaFilter
    const matchesData = mov.data >= dataInicial && mov.data <= dataFinal

    return matchesSearch && matchesCategoria && matchesData
  })

  // Cálculos dos totais
  const totalReceitas = movimentacoesFiltradas
    .filter((mov) => mov.tipo === "receita")
    .reduce((acc, mov) => acc + mov.valor, 0)

  const totalDespesas = movimentacoesFiltradas
    .filter((mov) => mov.tipo === "despesa")
    .reduce((acc, mov) => acc + mov.valor, 0)

  const totalRepasses = movimentacoesFiltradas
    .filter((mov) => mov.categoria === "Repasses")
    .reduce((acc, mov) => acc + mov.valor, 0)

  const totalMensalidades = movimentacoesFiltradas
    .filter((mov) => mov.categoria === "Mensalidades")
    .reduce((acc, mov) => acc + mov.valor, 0)

  const outrasReceitas = totalReceitas - totalMensalidades
  const outrasDespesas = totalDespesas - totalRepasses

  const saldoFinal = totalReceitas - totalDespesas

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-primary-dark-blue">Financeiro da Clínica</h2>
          <p className="text-muted-foreground">Controle completo das movimentações financeiras</p>
        </div>
      </div>

      {/* Resumo Superior */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Total Recebido</CardTitle>
            <div className="p-2 rounded-lg bg-primary-medium-green/20">
              <TrendingUp className="h-4 w-4 text-primary-medium-green" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">R$ {totalReceitas.toLocaleString("pt-BR")}</div>
            <p className="text-xs text-primary-medium-green flex items-center mt-1">
              <TrendingUp className="h-3 w-3 mr-1" />
              Receitas do período
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Total Repasses</CardTitle>
            <div className="p-2 rounded-lg bg-secondary-orange/20">
              <DollarSign className="h-4 w-4 text-secondary-orange" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">R$ {totalRepasses.toLocaleString("pt-BR")}</div>
            <p className="text-xs text-secondary-orange flex items-center mt-1">
              <TrendingDown className="h-3 w-3 mr-1" />
              Repasses aos profissionais
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Total Despesas</CardTitle>
            <div className="p-2 rounded-lg bg-secondary-red/20">
              <TrendingDown className="h-4 w-4 text-secondary-red" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">R$ {totalDespesas.toLocaleString("pt-BR")}</div>
            <p className="text-xs text-secondary-red flex items-center mt-1">
              <TrendingDown className="h-3 w-3 mr-1" />
              Todas as despesas
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Saldo Final</CardTitle>
            <div className={`p-2 rounded-lg ${saldoFinal >= 0 ? "bg-primary-teal/20" : "bg-secondary-red/20"}`}>
              <Wallet className={`h-4 w-4 ${saldoFinal >= 0 ? "text-primary-teal" : "text-secondary-red"}`} />
            </div>
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${saldoFinal >= 0 ? "text-primary-teal" : "text-secondary-red"}`}>
              R$ {saldoFinal.toLocaleString("pt-BR")}
            </div>
            <p
              className={`text-xs flex items-center mt-1 ${saldoFinal >= 0 ? "text-primary-teal" : "text-secondary-red"}`}
            >
              {saldoFinal >= 0 ? <TrendingUp className="h-3 w-3 mr-1" /> : <TrendingDown className="h-3 w-3 mr-1" />}
              {saldoFinal >= 0 ? "Saldo positivo" : "Saldo negativo"}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filtros */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <CardTitle className="flex items-center gap-2">
              <Filter className="h-5 w-5" />
              Filtros
            </CardTitle>
            <div className="flex gap-2">
              <Button variant="outline" className="w-full sm:w-auto bg-transparent">
                <Download className="mr-2 h-4 w-4" />
                Exportar XLSX
              </Button>
              <Dialog open={modalAberto} onOpenChange={setModalAberto}>
                <DialogTrigger asChild>
                  <Button className="w-full sm:w-auto">
                    <Plus className="mr-2 h-4 w-4" />
                    Adicionar Movimentação
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-md">
                  <DialogHeader>
                    <DialogTitle>Nova Movimentação</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="tipo">Tipo</Label>
                      <Select
                        value={novaMovimentacao.tipo}
                        onValueChange={(value) => setNovaMovimentacao({ ...novaMovimentacao, tipo: value })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione o tipo" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="receita">Receita</SelectItem>
                          <SelectItem value="despesa">Despesa</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="categoria">Categoria</Label>
                      <Select
                        value={novaMovimentacao.categoria}
                        onValueChange={(value) => setNovaMovimentacao({ ...novaMovimentacao, categoria: value })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione a categoria" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Repasses">Repasses</SelectItem>
                          <SelectItem value="Mensalidades">Mensalidades</SelectItem>
                          <SelectItem value="Obras">Obras</SelectItem>
                          <SelectItem value="Compras">Compras</SelectItem>
                          <SelectItem value="Outros">Outros</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="descricao">Descrição</Label>
                      <Input
                        id="descricao"
                        value={novaMovimentacao.descricao}
                        onChange={(e) => setNovaMovimentacao({ ...novaMovimentacao, descricao: e.target.value })}
                        placeholder="Descrição da movimentação"
                      />
                    </div>

                    {novaMovimentacao.categoria === "Repasses" && (
                      <div className="space-y-2">
                        <Label htmlFor="profissional">Profissional</Label>
                        <Select
                          value={novaMovimentacao.profissional}
                          onValueChange={(value) => setNovaMovimentacao({ ...novaMovimentacao, profissional: value })}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione o profissional" />
                          </SelectTrigger>
                          <SelectContent>
                            {profissionais.map((prof) => (
                              <SelectItem key={prof} value={prof}>
                                {prof}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    )}

                    <div className="space-y-2">
                      <Label htmlFor="valor">Valor (R$)</Label>
                      <Input
                        id="valor"
                        type="number"
                        step="0.01"
                        value={novaMovimentacao.valor}
                        onChange={(e) => setNovaMovimentacao({ ...novaMovimentacao, valor: e.target.value })}
                        placeholder="0,00"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="data">Data</Label>
                      <Input
                        id="data"
                        type="date"
                        value={novaMovimentacao.data}
                        onChange={(e) => setNovaMovimentacao({ ...novaMovimentacao, data: e.target.value })}
                      />
                    </div>

                    <Button onClick={handleSalvarMovimentacao} className="w-full">
                      Salvar Movimentação
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-5">
            <div className="space-y-2">
              <Label htmlFor="categoria">Categoria</Label>
              <Select value={categoriaFilter} onValueChange={setCategoriaFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todas as categorias</SelectItem>
                  <SelectItem value="Repasses">Repasses</SelectItem>
                  <SelectItem value="Mensalidades">Mensalidades</SelectItem>
                  <SelectItem value="Obras">Obras</SelectItem>
                  <SelectItem value="Compras">Compras</SelectItem>
                  <SelectItem value="Outros">Outros</SelectItem>
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
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="search">Buscar</Label>
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  id="search"
                  placeholder="Nome ou descrição..."
                  className="pl-8"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabela de Movimentações */}
      <Card>
        <CardHeader>
          <CardTitle>Movimentações Financeiras ({movimentacoesFiltradas.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="min-w-[100px]">Tipo</TableHead>
                  <TableHead className="min-w-[120px]">Categoria</TableHead>
                  <TableHead className="min-w-[200px]">Descrição</TableHead>
                  <TableHead className="min-w-[150px] hidden lg:table-cell">Profissional</TableHead>
                  <TableHead className="min-w-[100px] text-right">Valor</TableHead>
                  <TableHead className="min-w-[100px] hidden md:table-cell">Data</TableHead>
                  <TableHead className="text-right min-w-[60px]">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {movimentacoesFiltradas.map((movimentacao) => (
                  <TableRow key={movimentacao.id}>
                    <TableCell>{getTipoBadge(movimentacao.tipo)}</TableCell>
                    <TableCell>{getCategoriaBadge(movimentacao.categoria)}</TableCell>
                    <TableCell className="font-medium">{movimentacao.descricao}</TableCell>
                    <TableCell className="hidden lg:table-cell">{movimentacao.profissional || "-"}</TableCell>
                    <TableCell className="text-right font-medium">
                      <span
                        className={movimentacao.tipo === "receita" ? "text-primary-medium-green" : "text-secondary-red"}
                      >
                        R$ {movimentacao.valor.toLocaleString("pt-BR")}
                      </span>
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      {new Date(movimentacao.data).toLocaleDateString("pt-BR")}
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
                          <DropdownMenuItem className="text-red-600">Excluir</DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {/* Totais do Período */}
          <div className="mt-6 pt-6 border-t">
            <div className="grid gap-4 md:grid-cols-3">
              <Card className="bg-primary-medium-green/10">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-primary-medium-green">Total de Receitas</p>
                      <p className="text-2xl font-bold text-primary-medium-green">
                        R$ {totalReceitas.toLocaleString("pt-BR")}
                      </p>
                    </div>
                    <TrendingUp className="h-8 w-8 text-primary-medium-green" />
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-secondary-red/10">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-secondary-red">Total de Despesas</p>
                      <p className="text-2xl font-bold text-secondary-red">
                        R$ {totalDespesas.toLocaleString("pt-BR")}
                      </p>
                    </div>
                    <TrendingDown className="h-8 w-8 text-secondary-red" />
                  </div>
                </CardContent>
              </Card>

              <Card className={`${saldoFinal >= 0 ? "bg-primary-teal/10" : "bg-secondary-red/10"}`}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p
                        className={`text-sm font-medium ${saldoFinal >= 0 ? "text-primary-teal" : "text-secondary-red"}`}
                      >
                        Saldo do Período
                      </p>
                      <p
                        className={`text-2xl font-bold ${saldoFinal >= 0 ? "text-primary-teal" : "text-secondary-red"}`}
                      >
                        R$ {saldoFinal.toLocaleString("pt-BR")}
                      </p>
                    </div>
                    <Wallet className={`h-8 w-8 ${saldoFinal >= 0 ? "text-primary-teal" : "text-secondary-red"}`} />
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
