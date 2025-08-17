"use client"

import { DialogFooter } from "@/components/ui/dialog"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Textarea } from "@/components/ui/textarea"
import {
  Plus,
  Search,
  Filter,
  Download,
  MoreHorizontal,
  Calendar,
  DollarSign,
  TrendingUp,
  TrendingDown,
  Building2,
  Wallet,
  AlertTriangle,
  Users,
  FileText,
  Bell,
  BarChart3,
  Target,
  Clock,
  CreditCard,
  Calculator,
  Eye,
  UserPlus,
  Building,
  Heart,
  Phone,
  Mail,
  AlertCircle,
  X,
  Save,
  Settings,
  SnowflakeIcon as Crystal,
  Flag,
  Activity,
  LineChart,
  Percent,
  CheckCircle,
  Info,
} from "lucide-react"

const fornecedores = [
  {
    id: 1,
    nome: "Fornecedor Médico Ltda",
    cnpj: "12.345.678/0001-90",
    telefone: "(11) 9999-9999",
    email: "contato@fornecedor.com",
    endereco: "Rua das Flores, 123",
    status: "Ativo",
  },
  {
    id: 2,
    nome: "Equipamentos Hospitalares S.A.",
    cnpj: "98.765.432/0001-10",
    telefone: "(11) 8888-8888",
    email: "vendas@equipamentos.com",
    endereco: "Av. Principal, 456",
    status: "Ativo",
  },
  {
    id: 3,
    nome: "Materiais de Limpeza ME",
    cnpj: "11.222.333/0001-44",
    telefone: "(11) 7777-7777",
    email: "pedidos@limpeza.com",
    endereco: "Rua da Limpeza, 789",
    status: "Inativo",
  },
]

const convenios = [
  {
    id: 1,
    nome: "Unimed",
    cnpj: "12.345.678/0001-90",
    telefone: "(11) 3333-3333",
    email: "atendimento@unimed.com",
    endereco: "Av. Paulista, 1000",
    status: "Ativo",
    valorConsulta: 150,
  },
  {
    id: 2,
    nome: "Bradesco Saúde",
    cnpj: "98.765.432/0001-10",
    telefone: "(11) 4444-4444",
    email: "contato@bradescosaude.com",
    endereco: "Rua Augusta, 2000",
    status: "Ativo",
    valorConsulta: 120,
  },
  {
    id: 3,
    nome: "SulAmérica",
    cnpj: "11.222.333/0001-44",
    telefone: "(11) 5555-5555",
    email: "relacionamento@sulamerica.com",
    endereco: "Av. Faria Lima, 3000",
    status: "Ativo",
    valorConsulta: 180,
  },
]

const pacientesFinanceiro = [
  {
    id: 1,
    nome: "Maria Silva",
    cpf: "123.456.789-00",
    telefone: "(11) 99999-9999",
    email: "maria@email.com",
    endereco: "Rua A, 123",
    status: "Adimplente",
    valorDevido: 0,
  },
  {
    id: 2,
    nome: "João Santos",
    cpf: "987.654.321-00",
    telefone: "(11) 88888-8888",
    email: "joao@email.com",
    endereco: "Rua B, 456",
    status: "Inadimplente",
    valorDevido: 450,
  },
  {
    id: 3,
    nome: "Ana Costa",
    cpf: "456.789.123-00",
    telefone: "(11) 77777-7777",
    email: "ana@email.com",
    endereco: "Rua C, 789",
    status: "Adimplente",
    valorDevido: 0,
  },
]

const fluxoCaixa = {
  janeiro: { previsto: { receitas: 45000, despesas: 35000 }, realizado: { receitas: 42000, despesas: 38000 } },
  fevereiro: { previsto: { receitas: 48000, despesas: 36000 }, realizado: { receitas: 46000, despesas: 34000 } },
  marco: { previsto: { receitas: 50000, despesas: 37000 }, realizado: { receitas: 52000, despesas: 39000 } },
  abril: { previsto: { receitas: 47000, despesas: 35000 }, realizado: { receitas: 44000, despesas: 36000 } },
  maio: { previsto: { receitas: 49000, despesas: 38000 }, realizado: { receitas: 51000, despesas: 37000 } },
  junho: { previsto: { receitas: 52000, despesas: 39000 }, realizado: { receitas: 48000, despesas: 41000 } },
}

const contasVencidas = [
  {
    id: 1,
    cliente: "João Santos",
    valor: 450,
    diasAtraso: 15,
    tipo: "Mensalidade",
    vencimento: "2024-01-15",
    contato: "Enviado WhatsApp",
  },
  {
    id: 2,
    cliente: "Pedro Lima",
    valor: 280,
    diasAtraso: 8,
    tipo: "Consulta",
    vencimento: "2024-01-22",
    contato: "Pendente",
  },
  {
    id: 3,
    cliente: "Carla Souza",
    valor: 350,
    diasAtraso: 30,
    tipo: "Terapia",
    vencimento: "2024-01-01",
    contato: "Ligação feita",
  },
]

const planoContasDespesas = {
  "1": {
    nome: "Despesas Operacionais",
    subcategorias: {
      "1.1": {
        nome: "Pessoal",
        itens: ["1.1.1 - Salários", "1.1.2 - Encargos Sociais", "1.1.3 - Benefícios", "1.1.4 - Repasses Profissionais"],
      },
      "1.2": {
        nome: "Administrativas",
        itens: [
          "1.2.1 - Material de Escritório",
          "1.2.2 - Telefone/Internet",
          "1.2.3 - Correios",
          "1.2.4 - Serviços Contábeis",
        ],
      },
      "1.3": {
        nome: "Infraestrutura",
        itens: ["1.3.1 - Aluguel", "1.3.2 - Energia Elétrica", "1.3.3 - Água", "1.3.4 - Limpeza", "1.3.5 - Segurança"],
      },
    },
  },
  "2": {
    nome: "Despesas com Equipamentos",
    subcategorias: {
      "2.1": {
        nome: "Aquisição",
        itens: ["2.1.1 - Equipamentos Médicos", "2.1.2 - Móveis", "2.1.3 - Informática", "2.1.4 - Veículos"],
      },
      "2.2": {
        nome: "Manutenção",
        itens: ["2.2.1 - Manutenção Equipamentos", "2.2.2 - Manutenção Predial", "2.2.3 - Manutenção Veículos"],
      },
    },
  },
  "3": {
    nome: "Despesas Financeiras",
    subcategorias: {
      "3.1": {
        nome: "Bancárias",
        itens: ["3.1.1 - Tarifas Bancárias", "3.1.2 - IOF", "3.1.3 - Juros", "3.1.4 - Multas"],
      },
    },
  },
}

const planoContasReceitas = {
  "1": {
    nome: "Receitas Operacionais",
    subcategorias: {
      "1.1": {
        nome: "Consultas",
        itens: ["1.1.1 - Consultas Particulares", "1.1.2 - Consultas Convênios", "1.1.3 - Consultas SUS"],
      },
      "1.2": {
        nome: "Terapias",
        itens: ["1.2.1 - Fisioterapia", "1.2.2 - Fonoaudiologia", "1.2.3 - Psicologia", "1.2.4 - Terapia Ocupacional"],
      },
      "1.3": {
        nome: "Mensalidades",
        itens: ["1.3.1 - Mensalidades Regulares", "1.3.2 - Mensalidades Especiais", "1.3.3 - Taxas de Matrícula"],
      },
    },
  },
  "2": {
    nome: "Receitas Extraordinárias",
    subcategorias: {
      "2.1": {
        nome: "Outras Receitas",
        itens: ["2.1.1 - Rendimentos Financeiros", "2.1.2 - Doações", "2.1.3 - Eventos", "2.1.4 - Parcerias"],
      },
    },
  },
}

const centrosCusto = [
  "Recepção",
  "Coordenação",
  "Fisioterapia",
  "Fonoaudiologia",
  "Psicologia",
  "Terapia Ocupacional",
  "Administrativo",
  "Financeiro",
  "Limpeza",
  "Manutenção",
]

const bancosCadastrados = [
  { id: 1, nome: "Banco do Brasil", agencia: "1234-5", conta: "12345-6", tipo: "Conta Corrente" },
  { id: 2, nome: "Caixa Econômica", agencia: "0987", conta: "98765-4", tipo: "Conta Corrente" },
  { id: 3, nome: "Santander", agencia: "4567", conta: "45678-9", tipo: "Conta Poupança" },
]

const movimentacoes = [
  {
    id: 1,
    tipo: "receita",
    categoria: "1.3.1 - Mensalidades Regulares",
    descricao: "Mensalidade - Maria Santos",
    profissional: null,
    valor: 150.0,
    data: "2024-01-15",
    centroCusto: "Recepção",
    banco: "Banco do Brasil",
    contaPaga: false,
    contaRecebida: true,
  },
  {
    id: 2,
    tipo: "despesa",
    categoria: "1.1.4 - Repasses Profissionais",
    descricao: "Repasse Dr. João Silva",
    profissional: "Dr. João Silva",
    valor: 900.0,
    data: "2024-01-15",
    centroCusto: "Fisioterapia",
    banco: "Banco do Brasil",
    contaPaga: true,
    contaRecebida: false,
  },
  {
    id: 3,
    tipo: "receita",
    categoria: "1.1.1 - Consultas Particulares",
    descricao: "Consulta - Pedro Oliveira",
    profissional: null,
    valor: 120.0,
    data: "2024-01-14",
    centroCusto: "Psicologia",
    banco: "Caixa Econômica",
    contaPaga: false,
    contaRecebida: true,
  },
  {
    id: 4,
    tipo: "despesa",
    categoria: "1.3.2 - Energia Elétrica",
    descricao: "Conta de luz - Janeiro",
    profissional: null,
    valor: 480.0,
    data: "2024-01-11",
    centroCusto: "Administrativo",
    banco: "Santander",
    contaPaga: true,
    contaRecebida: false,
  },
  {
    id: 5,
    tipo: "despesa",
    categoria: "2.2.2 - Manutenção Predial",
    descricao: "Reforma sala 102",
    profissional: null,
    valor: 2500.0,
    data: "2024-01-13",
    centroCusto: "Manutenção",
    banco: "Banco do Brasil",
    contaPaga: false,
    contaRecebida: false,
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

const bancos = ["Banco do Brasil", "Caixa Econômica", "Itaú", "Bradesco", "Santander"]

const previsoesFuturas = {
  proximosTrimestres: [
    {
      trimestre: "Q3 2024",
      cenarios: {
        otimista: { receitas: 165000, despesas: 120000, lucro: 45000 },
        realista: { receitas: 150000, despesas: 115000, lucro: 35000 },
        pessimista: { receitas: 135000, despesas: 125000, lucro: 10000 },
      },
    },
    {
      trimestre: "Q4 2024",
      cenarios: {
        otimista: { receitas: 180000, despesas: 125000, lucro: 55000 },
        realista: { receitas: 160000, despesas: 120000, lucro: 40000 },
        pessimista: { receitas: 145000, despesas: 130000, lucro: 15000 },
      },
    },
    {
      trimestre: "Q1 2025",
      cenarios: {
        otimista: { receitas: 195000, despesas: 130000, lucro: 65000 },
        realista: { receitas: 170000, despesas: 125000, lucro: 45000 },
        pessimista: { receitas: 150000, despesas: 135000, lucro: 15000 },
      },
    },
  ],
  metasAnuais: {
    2024: { receita: 600000, despesa: 480000, lucro: 120000 },
    2025: { receita: 720000, despesa: 520000, lucro: 200000 },
  },
  tendencias: {
    crescimentoMensal: 3.5,
    sazonalidade: ["Janeiro: -10%", "Julho: +15%", "Dezembro: +20%"],
    indicadores: {
      margemLucro: 22,
      pontoEquilibrio: 95000,
      retornoInvestimento: 18.5,
    },
  },
}

export default function FinanceiroPage() {
  const [activeTab, setActiveTab] = useState("despesas")
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("todas")
  const [selectedPeriod, setSelectedPeriod] = useState("mes")
  const [selectedCentroCusto, setSelectedCentroCusto] = useState("todos")
  const [selectedBank, setSelectedBank] = useState("todos")
  const [showPlanoContas, setShowPlanoContas] = useState(false)
  const [selectedPlanoItem, setSelectedPlanoItem] = useState("")
  const [showNovaMovimentacao, setShowNovaMovimentacao] = useState(false)
  const [tipoMovimentacao, setTipoMovimentacao] = useState("despesa")

  const [showPrevisoesFuturas, setShowPrevisoesFuturas] = useState(false)
  const [showMetasFinanceiras, setShowMetasFinanceiras] = useState(false)
  const [showTendencias, setShowTendencias] = useState(false)

  const [configAvancada, setConfigAvancada] = useState({
    moedaPadrao: "BRL",
    diasVencimento: 30,
    jurosAtraso: 2.0,
    multaAtraso: 10.0,
    emailNotificacao: true,
    smsNotificacao: false,
    backupAutomatico: true,
    integracaoContabil: false,
  })

  const [showCadastroFornecedor, setShowCadastroFornecedor] = useState(false)
  const [showCadastroConvenio, setShowCadastroConvenio] = useState(false)
  const [showCadastroPaciente, setShowCadastroPaciente] = useState(false)

  const [novoFornecedor, setNovoFornecedor] = useState({
    nome: "",
    cnpj: "",
    telefone: "",
    email: "",
    endereco: "",
    contato: "",
    observacoes: "",
  })

  const [novoConvenio, setNovoConvenio] = useState({
    nome: "",
    valorConsulta: "",
    percentualDesconto: "",
    prazoRepasse: "",
    contato: "",
    telefone: "",
    email: "",
  })

  const [novoPaciente, setNovoPaciente] = useState({
    nome: "",
    cpf: "",
    telefone: "",
    email: "",
    endereco: "",
    convenio: "",
    observacoes: "",
  })

  const handleSalvarFornecedor = () => {
    console.log("Novo fornecedor:", novoFornecedor)
    setNovoFornecedor({
      nome: "",
      cnpj: "",
      telefone: "",
      email: "",
      endereco: "",
      contato: "",
      observacoes: "",
    })
    setShowCadastroFornecedor(false)
  }

  const handleSalvarConvenio = () => {
    console.log("Novo convênio:", novoConvenio)
    setNovoConvenio({
      nome: "",
      valorConsulta: "",
      percentualDesconto: "",
      prazoRepasse: "",
      contato: "",
      telefone: "",
      email: "",
    })
    setShowCadastroConvenio(false)
  }

  const handleSalvarPaciente = () => {
    console.log("Novo paciente:", novoPaciente)
    setNovoPaciente({
      nome: "",
      cpf: "",
      telefone: "",
      email: "",
      endereco: "",
      convenio: "",
      observacoes: "",
    })
    setShowCadastroPaciente(false)
  }

  const [selectedEspecialidade, setSelectedEspecialidade] = useState("todas")
  const [selectedProfissional, setSelectedProfissional] = useState("todos")
  const [showProjecaoFinanceira, setShowProjecaoFinanceira] = useState(false)

  const [configEmpresa, setConfigEmpresa] = useState({
    nome: "Casa Libelle - Terapias Integradas",
    cpfCnpj: "12.345.678/0001-90",
    endereco: "Rua das Flores, 123 - Centro",
    cidade: "São Paulo - SP",
    cep: "01234-567",
    telefone: "(11) 99999-9999",
    email: "contato@casalibelle.com.br",
  })

  const [novaMovimentacao, setNovaMovimentacao] = useState({
    tipo: "",
    categoria: "",
    descricao: "",
    profissional: "",
    valor: "",
    data: "",
    centroCusto: "",
    banco: "",
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
      centroCusto: "",
      banco: "",
    })
    setShowNovaMovimentacao(false)
  }

  const handleSelecionarConta = (conta: string) => {
    setNovaMovimentacao({ ...novaMovimentacao, categoria: conta })
    setShowPlanoContas(false)
  }

  const abrirPlanoContas = (tipo: string) => {
    setTipoMovimentacao(tipo)
    setShowPlanoContas(true)
  }

  const [dateFrom, setDateFrom] = useState("")
  const [dateTo, setDateTo] = useState("")

  const movimentacoesFiltradas = movimentacoes.filter((mov) => {
    const matchesSearch =
      mov.descricao.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (mov.profissional && mov.profissional.toLowerCase().includes(searchTerm.toLowerCase()))
    const matchesCategoria = selectedCategory === "todas" || mov.categoria.includes(selectedCategory)
    const matchesCentroCusto = selectedCentroCusto === "todos" || mov.centroCusto === selectedCentroCusto
    const matchesBanco = selectedBank === "todos" || mov.banco === selectedBank
    const matchesData = mov.data >= dateFrom && mov.data <= dateTo

    return matchesSearch && matchesCategoria && matchesCentroCusto && matchesBanco && matchesData
  })

  const totalReceitas = movimentacoesFiltradas
    .filter((mov) => mov.tipo === "receita")
    .reduce((acc, mov) => acc + mov.valor, 0)

  const totalDespesas = movimentacoesFiltradas
    .filter((mov) => mov.tipo === "despesa")
    .reduce((acc, mov) => acc + mov.valor, 0)

  const saldoFinal = totalReceitas - totalDespesas

  const renderPlanoContas = (plano: any) => {
    return Object.entries(plano).map(([key, categoria]: [string, any]) => (
      <div key={key} className="space-y-2">
        <h4 className="font-semibold text-primary-dark-blue">{categoria.nome}</h4>
        {Object.entries(categoria.subcategorias).map(([subKey, subcategoria]: [string, any]) => (
          <div key={subKey} className="ml-4 space-y-1">
            <h5 className="font-medium text-gray-700">{subcategoria.nome}</h5>
            <div className="ml-4 space-y-1">
              {subcategoria.itens.map((item: string) => (
                <Button
                  key={item}
                  variant="ghost"
                  className="w-full justify-start text-left h-auto p-2 hover:bg-primary-light-green/20"
                  onClick={() => handleSelecionarConta(item)}
                >
                  {item}
                </Button>
              ))}
            </div>
          </div>
        ))}
      </div>
    ))
  }

  const [showModalContaBancaria, setShowModalContaBancaria] = useState(false)
  const [novaContaBancaria, setNovaContaBancaria] = useState({
    nome: "",
    agencia: "",
    conta: "",
    tipo: "Conta Corrente",
    saldo: 0,
  })

  const [showNovaConta, setShowNovaConta] = useState(false)
  const [novaConta, setNovaConta] = useState({
    nome: "",
    tipo: "",
    agencia: "",
    conta: "",
    saldoInicial: "",
  })

  const [bancosCadastradosState, setBancosCadastrados] = useState(bancosCadastrados)

  const handleSalvarConta = () => {
    if (novaConta.nome && novaConta.tipo && novaConta.agencia && novaConta.conta) {
      const novaContaBancaria = {
        id: Date.now().toString(),
        nome: novaConta.nome,
        tipo: novaConta.tipo,
        agencia: novaConta.agencia,
        conta: novaConta.conta,
        saldo: Number.parseFloat(novaConta.saldoInicial) || 0,
      }

      setBancosCadastrados([...bancosCadastradosState, novaContaBancaria])
      setNovaConta({ nome: "", tipo: "", agencia: "", conta: "", saldoInicial: "" })
      setShowNovaConta(false)
    }
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Financeiro</h1>
          <p className="text-gray-600">Gestão completa das finanças da clínica</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => setShowNovaMovimentacao(true)} className="bg-primary-teal hover:bg-primary-teal/90">
            <Plus className="mr-2 h-4 w-4" />
            Nova Movimentação
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="despesas">Despesas</TabsTrigger>
          <TabsTrigger value="receitas">Receitas</TabsTrigger>
          <TabsTrigger value="relatorios">Relatórios</TabsTrigger>
          <TabsTrigger value="configuracoes">Configurações</TabsTrigger>
        </TabsList>

        {/* Aba Despesas */}
        <TabsContent value="despesas" className="space-y-6">
          {/* Resumo Superior */}
          <div className="grid gap-4 md:grid-cols-4">
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
                  Despesas do período
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">Contas Pagas</CardTitle>
                <div className="p-2 rounded-lg bg-primary-medium-green/20">
                  <DollarSign className="h-4 w-4 text-primary-medium-green" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-gray-900">
                  {movimentacoesFiltradas.filter((m) => m.tipo === "despesa" && m.contaPaga).length}
                </div>
                <p className="text-xs text-primary-medium-green flex items-center mt-1">Contas quitadas</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">Contas a Pagar</CardTitle>
                <div className="p-2 rounded-lg bg-secondary-orange/20">
                  <Calendar className="h-4 w-4 text-secondary-orange" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-gray-900">
                  {movimentacoesFiltradas.filter((m) => m.tipo === "despesa" && !m.contaPaga).length}
                </div>
                <p className="text-xs text-secondary-orange flex items-center mt-1">Pendentes de pagamento</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">Centros de Custo</CardTitle>
                <div className="p-2 rounded-lg bg-primary-teal/20">
                  <Building2 className="h-4 w-4 text-primary-teal" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-gray-900">{centrosCusto.length}</div>
                <p className="text-xs text-primary-teal flex items-center mt-1">Setores ativos</p>
              </CardContent>
            </Card>
          </div>

          {/* Filtros e Botões */}
          <Card>
            <CardHeader className="pb-4">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <CardTitle className="flex items-center gap-2 text-lg font-semibold">
                  <Filter className="h-5 w-5 text-primary" />
                  Filtros - Despesas
                </CardTitle>
                <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                  <Button variant="outline" size="sm" className="bg-background hover:bg-accent">
                    <Download className="mr-2 h-4 w-4" />
                    Exportar
                  </Button>
                  <Dialog open={showNovaMovimentacao} onOpenChange={setShowNovaMovimentacao}>
                    <DialogTrigger asChild>
                      <Button size="sm" className="bg-primary hover:bg-primary/90">
                        <Plus className="mr-2 h-4 w-4" />
                        Nova Despesa
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
                      <DialogHeader>
                        <DialogTitle>Nova Despesa</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <Label>Plano de Contas</Label>
                          <div className="flex gap-2">
                            <Input
                              value={novaMovimentacao.categoria}
                              placeholder="Selecione uma conta"
                              readOnly
                              className="flex-1"
                            />
                            <Button type="button" variant="outline" onClick={() => abrirPlanoContas("despesa")}>
                              <Search className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="centroCusto">Centro de Custo</Label>
                          <Select
                            value={novaMovimentacao.centroCusto}
                            onValueChange={(value) => setNovaMovimentacao({ ...novaMovimentacao, centroCusto: value })}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione o centro de custo" />
                            </SelectTrigger>
                            <SelectContent>
                              {centrosCusto.map((centro) => (
                                <SelectItem key={centro} value={centro}>
                                  {centro}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="banco">Banco</Label>
                          <Select
                            value={novaMovimentacao.banco}
                            onValueChange={(value) => setNovaMovimentacao({ ...novaMovimentacao, banco: value })}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione o banco" />
                            </SelectTrigger>
                            <SelectContent>
                              {bancosCadastrados.map((banco) => (
                                <SelectItem key={banco.id} value={banco.nome}>
                                  {banco.nome} - {banco.agencia}/{banco.conta}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="descricao">Descrição</Label>
                          <Textarea
                            id="descricao"
                            value={novaMovimentacao.descricao}
                            onChange={(e) => setNovaMovimentacao({ ...novaMovimentacao, descricao: e.target.value })}
                            placeholder="Descrição detalhada da despesa"
                          />
                        </div>

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
                          Salvar Despesa
                        </Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="space-y-4">
                {/* Linha 1: Filtros principais */}
                <div className="flex flex-col sm:flex-row gap-4">
                  <div className="flex-1 space-y-2">
                    <Label className="text-sm font-medium text-foreground">Centro de Custo</Label>
                    <Select value={selectedCentroCusto} onValueChange={setSelectedCentroCusto}>
                      <SelectTrigger className="h-9">
                        <SelectValue placeholder="Todos os centros" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="todos">Todos os centros</SelectItem>
                        {centrosCusto.map((centro) => (
                          <SelectItem key={centro} value={centro}>
                            {centro}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex-1 space-y-2">
                    <Label className="text-sm font-medium text-foreground">Banco</Label>
                    <Select value={selectedBank} onValueChange={setSelectedBank}>
                      <SelectTrigger className="h-9">
                        <SelectValue placeholder="Todos os bancos" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="todos">Todos os bancos</SelectItem>
                        {bancosCadastradosState.map((banco) => (
                          <SelectItem key={banco.id} value={banco.nome}>
                            {banco.nome}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Linha 2: Período e busca */}
                <div className="flex flex-col lg:flex-row gap-4 items-end">
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-foreground">Período</Label>
                    <div className="flex gap-2">
                      <div className="space-y-1">
                        <Label className="text-xs text-muted-foreground">De:</Label>
                        <Input
                          type="date"
                          value={dateFrom}
                          onChange={(e) => setDateFrom(e.target.value)}
                          className="h-9 w-[130px]"
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs text-muted-foreground">Até:</Label>
                        <Input
                          type="date"
                          value={dateTo}
                          onChange={(e) => setDateTo(e.target.value)}
                          className="h-9 w-[130px]"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="flex-1 space-y-2">
                    <Label className="text-sm font-medium text-foreground">Buscar</Label>
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Descrição ou profissional..."
                        className="pl-9 h-9"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Tabela de Despesas */}
          <Card>
            <CardHeader>
              <CardTitle>Despesas ({movimentacoesFiltradas.filter((m) => m.tipo === "despesa").length})</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Categoria</TableHead>
                      <TableHead>Descrição</TableHead>
                      <TableHead>Centro de Custo</TableHead>
                      <TableHead>Banco</TableHead>
                      <TableHead className="text-right">Valor</TableHead>
                      <TableHead>Data</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {movimentacoesFiltradas
                      .filter((m) => m.tipo === "despesa")
                      .map((movimentacao) => (
                        <TableRow key={movimentacao.id}>
                          <TableCell className="font-medium text-sm">{movimentacao.categoria}</TableCell>
                          <TableCell>{movimentacao.descricao}</TableCell>
                          <TableCell>
                            <Badge variant="outline" className="bg-primary-teal/10 text-primary-teal">
                              {movimentacao.centroCusto}
                            </Badge>
                          </TableCell>
                          <TableCell>{movimentacao.banco}</TableCell>
                          <TableCell className="text-right font-medium text-secondary-red">
                            R$ {movimentacao.valor.toLocaleString("pt-BR")}
                          </TableCell>
                          <TableCell>{new Date(movimentacao.data).toLocaleDateString("pt-BR")}</TableCell>
                          <TableCell>
                            <Badge
                              className={
                                movimentacao.contaPaga
                                  ? "bg-primary-medium-green text-white"
                                  : "bg-secondary-orange text-white"
                              }
                            >
                              {movimentacao.contaPaga ? "Paga" : "Pendente"}
                            </Badge>
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
                                <DropdownMenuItem>Marcar como Paga</DropdownMenuItem>
                                <DropdownMenuItem className="text-red-600">Excluir</DropdownMenuItem>
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

        {/* Aba Receitas */}
        <TabsContent value="receitas" className="space-y-6">
          {/* Resumo Superior */}
          <div className="grid gap-4 md:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">Total Receitas</CardTitle>
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
                <CardTitle className="text-sm font-medium text-gray-600">Contas Recebidas</CardTitle>
                <div className="p-2 rounded-lg bg-primary-medium-green/20">
                  <DollarSign className="h-4 w-4 text-primary-medium-green" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-gray-900">
                  {movimentacoesFiltradas.filter((m) => m.tipo === "receita" && m.contaRecebida).length}
                </div>
                <p className="text-xs text-primary-medium-green flex items-center mt-1">Contas recebidas</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">Contas a Receber</CardTitle>
                <div className="p-2 rounded-lg bg-secondary-orange/20">
                  <Calendar className="h-4 w-4 text-secondary-orange" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-gray-900">
                  {movimentacoesFiltradas.filter((m) => m.tipo === "receita" && !m.contaRecebida).length}
                </div>
                <p className="text-xs text-secondary-orange flex items-center mt-1">Pendentes de recebimento</p>
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
                  {saldoFinal >= 0 ? (
                    <TrendingUp className="h-3 w-3 mr-1" />
                  ) : (
                    <TrendingDown className="h-3 w-3 mr-1" />
                  )}
                  {saldoFinal >= 0 ? "Saldo positivo" : "Saldo negativo"}
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Filtros e Botões para Receitas */}
          <Card>
            <CardHeader className="pb-4">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <CardTitle className="flex items-center gap-2 text-lg font-semibold">
                  <Filter className="h-5 w-5 text-primary" />
                  Filtros - Receitas
                </CardTitle>
                <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                  <Button variant="outline" size="sm" className="bg-background hover:bg-accent">
                    <Download className="mr-2 h-4 w-4" />
                    Exportar
                  </Button>
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button size="sm" className="bg-primary hover:bg-primary/90">
                        <Plus className="mr-2 h-4 w-4" />
                        Nova Receita
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
                      <DialogHeader>
                        <DialogTitle>Nova Receita</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <Label>Plano de Contas</Label>
                          <div className="flex gap-2">
                            <Input placeholder="Selecione uma conta" readOnly className="flex-1" />
                            <Button type="button" variant="outline" onClick={() => abrirPlanoContas("receita")}>
                              <Search className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>

                        <div className="space-y-2">
                          <Label>Centro de Custo</Label>
                          <Select>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione o centro de custo" />
                            </SelectTrigger>
                            <SelectContent>
                              {centrosCusto.map((centro) => (
                                <SelectItem key={centro} value={centro}>
                                  {centro}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="space-y-2">
                          <Label>Banco</Label>
                          <Select>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione o banco" />
                            </SelectTrigger>
                            <SelectContent>
                              {bancosCadastradosState.map((banco) => (
                                <SelectItem key={banco.id} value={banco.nome}>
                                  {banco.nome} - {banco.agencia}/{banco.conta}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="space-y-2">
                          <Label>Descrição</Label>
                          <Textarea placeholder="Descrição detalhada da receita" />
                        </div>

                        <div className="space-y-2">
                          <Label>Valor (R$)</Label>
                          <Input type="number" step="0.01" placeholder="0,00" />
                        </div>

                        <div className="space-y-2">
                          <Label>Data</Label>
                          <Input type="date" />
                        </div>

                        <Button className="w-full">Salvar Receita</Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="space-y-4">
                {/* Linha 1: Filtros principais */}
                <div className="flex flex-col sm:flex-row gap-4">
                  <div className="flex-1 space-y-2">
                    <Label className="text-sm font-medium text-foreground">Centro de Custo</Label>
                    <Select value={selectedCentroCusto} onValueChange={setSelectedCentroCusto}>
                      <SelectTrigger className="h-9">
                        <SelectValue placeholder="Todos os centros" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="todos">Todos os centros</SelectItem>
                        {centrosCusto.map((centro) => (
                          <SelectItem key={centro} value={centro}>
                            {centro}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex-1 space-y-2">
                    <Label className="text-sm font-medium text-foreground">Banco</Label>
                    <Select value={selectedBank} onValueChange={setSelectedBank}>
                      <SelectTrigger className="h-9">
                        <SelectValue placeholder="Todos os bancos" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="todos">Todos os bancos</SelectItem>
                        {bancosCadastradosState.map((banco) => (
                          <SelectItem key={banco.id} value={banco.nome}>
                            {banco.nome}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Linha 2: Período e busca */}
                <div className="flex flex-col lg:flex-row gap-4 items-end">
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-foreground">Período</Label>
                    <div className="flex gap-2">
                      <div className="space-y-1">
                        <Label className="text-xs text-muted-foreground">De:</Label>
                        <Input
                          type="date"
                          value={dateFrom}
                          onChange={(e) => setDateFrom(e.target.value)}
                          className="h-9 w-[130px]"
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs text-muted-foreground">Até:</Label>
                        <Input
                          type="date"
                          value={dateTo}
                          onChange={(e) => setDateTo(e.target.value)}
                          className="h-9 w-[130px]"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="flex-1 space-y-2">
                    <Label className="text-sm font-medium text-foreground">Buscar</Label>
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Descrição..."
                        className="pl-9 h-9"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Tabela de Receitas */}
          <Card>
            <CardHeader>
              <CardTitle>Receitas ({movimentacoesFiltradas.filter((m) => m.tipo === "receita").length})</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Categoria</TableHead>
                      <TableHead>Descrição</TableHead>
                      <TableHead>Centro de Custo</TableHead>
                      <TableHead>Banco</TableHead>
                      <TableHead className="text-right">Valor</TableHead>
                      <TableHead>Data</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {movimentacoesFiltradas
                      .filter((m) => m.tipo === "receita")
                      .map((movimentacao) => (
                        <TableRow key={movimentacao.id}>
                          <TableCell className="font-medium text-sm">{movimentacao.categoria}</TableCell>
                          <TableCell>{movimentacao.descricao}</TableCell>
                          <TableCell>
                            <Badge variant="outline" className="bg-primary-teal/10 text-primary-teal">
                              {movimentacao.centroCusto}
                            </Badge>
                          </TableCell>
                          <TableCell>{movimentacao.banco}</TableCell>
                          <TableCell className="text-right font-medium text-primary-medium-green">
                            R$ {movimentacao.valor.toLocaleString("pt-BR")}
                          </TableCell>
                          <TableCell>{new Date(movimentacao.data).toLocaleDateString("pt-BR")}</TableCell>
                          <TableCell>
                            <Badge
                              className={
                                movimentacao.contaRecebida
                                  ? "bg-primary-medium-green text-white"
                                  : "bg-secondary-orange text-white"
                              }
                            >
                              {movimentacao.contaRecebida ? "Recebida" : "Pendente"}
                            </Badge>
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
                                <DropdownMenuItem>Marcar como Recebida</DropdownMenuItem>
                                <DropdownMenuItem className="text-red-600">Excluir</DropdownMenuItem>
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

        <TabsContent value="relatorios" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Card className="hover:shadow-lg transition-shadow cursor-pointer">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <FileText className="h-5 w-5 text-primary-medium-green" />
                  Contas Pagas
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">
                  Relatório detalhado de todas as contas que foram pagas no período selecionado
                </p>
                <Button className="w-full bg-transparent" variant="outline">
                  <Download className="mr-2 h-4 w-4" />
                  Gerar Relatório
                </Button>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow cursor-pointer">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <FileText className="h-5 w-5 text-primary-teal" />
                  Contas Recebidas
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">
                  Relatório detalhado de todas as contas que foram recebidas no período selecionado
                </p>
                <Button className="w-full bg-transparent" variant="outline">
                  <Download className="mr-2 h-4 w-4" />
                  Gerar Relatório
                </Button>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow cursor-pointer">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Calendar className="h-5 w-5 text-secondary-orange" />
                  Contas a Pagar
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">
                  Relatório de contas pendentes de pagamento com vencimentos e valores
                </p>
                <Button className="w-full bg-transparent" variant="outline">
                  <Download className="mr-2 h-4 w-4" />
                  Gerar Relatório
                </Button>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow cursor-pointer">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Calendar className="h-5 w-5 text-secondary-red" />
                  Contas a Receber
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">
                  Relatório de contas pendentes de recebimento com vencimentos e valores
                </p>
                <Button className="w-full bg-transparent" variant="outline">
                  <Download className="mr-2 h-4 w-4" />
                  Gerar Relatório
                </Button>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow cursor-pointer">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Building2 className="h-5 w-5 text-primary-dark-blue" />
                  Por Centro de Custo
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">
                  Análise financeira detalhada por centro de custo e departamento
                </p>
                <Button className="w-full bg-transparent" variant="outline">
                  <Download className="mr-2 h-4 w-4" />
                  Gerar Relatório
                </Button>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow cursor-pointer">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <CreditCard className="h-5 w-5 text-purple-600" />
                  Por Banco
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">
                  Movimentações financeiras agrupadas por instituição bancária
                </p>
                <Button className="w-full bg-transparent" variant="outline">
                  <Download className="mr-2 h-4 w-4" />
                  Gerar Relatório
                </Button>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow cursor-pointer">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <BarChart3 className="h-5 w-5 text-primary-teal" />
                  Fluxo de Caixa
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">
                  Comparativo entre previsto x realizado com projeções mensais
                </p>
                <Button
                  className="w-full bg-transparent"
                  variant="outline"
                  onClick={() => setShowProjecaoFinanceira(true)}
                >
                  <Eye className="mr-2 h-4 w-4" />
                  Visualizar Fluxo
                </Button>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow cursor-pointer">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Crystal className="h-5 w-5 text-purple-600" />
                  Previsões Futuras
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">
                  Projeções trimestrais com cenários otimista, realista e pessimista
                </p>
                <Button
                  className="w-full bg-transparent"
                  variant="outline"
                  onClick={() => setShowPrevisoesFuturas(true)}
                >
                  <TrendingUp className="mr-2 h-4 w-4" />
                  Ver Previsões
                </Button>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow cursor-pointer">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Target className="h-5 w-5 text-amber-600" />
                  Metas Financeiras
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">
                  Definição e acompanhamento de metas anuais e trimestrais
                </p>
                <Button
                  className="w-full bg-transparent"
                  variant="outline"
                  onClick={() => setShowMetasFinanceiras(true)}
                >
                  <Flag className="mr-2 h-4 w-4" />
                  Gerenciar Metas
                </Button>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow cursor-pointer">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Activity className="h-5 w-5 text-indigo-600" />
                  Análise de Tendências
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">
                  Indicadores de performance e tendências de crescimento
                </p>
                <Button className="w-full bg-transparent" variant="outline" onClick={() => setShowTendencias(true)}>
                  <LineChart className="mr-2 h-4 w-4" />
                  Ver Tendências
                </Button>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow cursor-pointer">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <AlertTriangle className="h-5 w-5 text-secondary-red" />
                  Controle de Inadimplência
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">
                  Relatório de contas em atraso com alertas automáticos
                </p>
                <div className="flex items-center gap-2 mb-4">
                  <Badge variant="destructive">{contasVencidas.length} contas vencidas</Badge>
                </div>
                <Button className="w-full bg-transparent" variant="outline">
                  <Download className="mr-2 h-4 w-4" />
                  Gerar Relatório
                </Button>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow cursor-pointer">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Target className="h-5 w-5 text-primary-medium-green" />
                  Comparativo Mensal
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">Análise comparativa de receitas e despesas por mês</p>
                <Button className="w-full bg-transparent" variant="outline">
                  <BarChart3 className="mr-2 h-4 w-4" />
                  Ver Comparativo
                </Button>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-secondary-red" />
                Controle de Inadimplência
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Card className="border-secondary-red/20">
                    <CardContent className="p-4">
                      <div className="flex items-center gap-2">
                        <AlertCircle className="h-4 w-4 text-secondary-red" />
                        <span className="text-sm font-medium">Contas Vencidas</span>
                      </div>
                      <div className="text-2xl font-bold text-secondary-red mt-2">{contasVencidas.length}</div>
                    </CardContent>
                  </Card>
                  <Card className="border-secondary-orange/20">
                    <CardContent className="p-4">
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-secondary-orange" />
                        <span className="text-sm font-medium">Valor Total</span>
                      </div>
                      <div className="text-2xl font-bold text-secondary-orange mt-2">
                        R$ {contasVencidas.reduce((acc, conta) => acc + conta.valor, 0).toLocaleString("pt-BR")}
                      </div>
                    </CardContent>
                  </Card>
                  <Card className="border-primary-teal/20">
                    <CardContent className="p-4">
                      <div className="flex items-center gap-2">
                        <Bell className="h-4 w-4 text-primary-teal" />
                        <span className="text-sm font-medium">Alertas Enviados</span>
                      </div>
                      <div className="text-2xl font-bold text-primary-teal mt-2">
                        {contasVencidas.filter((c) => c.contato !== "Pendente").length}
                      </div>
                    </CardContent>
                  </Card>
                </div>

                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Cliente</TableHead>
                      <TableHead>Valor</TableHead>
                      <TableHead>Dias em Atraso</TableHead>
                      <TableHead>Tipo</TableHead>
                      <TableHead>Vencimento</TableHead>
                      <TableHead>Status Contato</TableHead>
                      <TableHead className="text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {contasVencidas.map((conta) => (
                      <TableRow key={conta.id}>
                        <TableCell className="font-medium">{conta.cliente}</TableCell>
                        <TableCell>R$ {conta.valor.toLocaleString("pt-BR")}</TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              conta.diasAtraso > 30 ? "destructive" : conta.diasAtraso > 15 ? "secondary" : "outline"
                            }
                          >
                            {conta.diasAtraso} dias
                          </Badge>
                        </TableCell>
                        <TableCell>{conta.tipo}</TableCell>
                        <TableCell>{new Date(conta.vencimento).toLocaleDateString("pt-BR")}</TableCell>
                        <TableCell>
                          <Badge variant={conta.contato === "Pendente" ? "outline" : "default"}>{conta.contato}</Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" className="h-8 w-8 p-0">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem>
                                <Phone className="mr-2 h-4 w-4" />
                                Ligar
                              </DropdownMenuItem>
                              <DropdownMenuItem>
                                <Mail className="mr-2 h-4 w-4" />
                                Enviar Email
                              </DropdownMenuItem>
                              <DropdownMenuItem>
                                <Bell className="mr-2 h-4 w-4" />
                                WhatsApp
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
        </TabsContent>

        <TabsContent value="configuracoes" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Dados da Empresa */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building className="h-5 w-5 text-primary-teal" />
                  Dados da Empresa
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="nome">Nome da Empresa</Label>
                    <Input
                      id="nome"
                      value={configEmpresa.nome}
                      onChange={(e) => setConfigEmpresa({ ...configEmpresa, nome: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="cpfCnpj">CPF/CNPJ</Label>
                    <Input
                      id="cpfCnpj"
                      value={configEmpresa.cpfCnpj}
                      onChange={(e) => setConfigEmpresa({ ...configEmpresa, cpfCnpj: e.target.value })}
                    />
                  </div>
                  <div className="md:col-span-2">
                    <Label htmlFor="endereco">Endereço</Label>
                    <Input
                      id="endereco"
                      value={configEmpresa.endereco}
                      onChange={(e) => setConfigEmpresa({ ...configEmpresa, endereco: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="telefone">Telefone</Label>
                    <Input
                      id="telefone"
                      value={configEmpresa.telefone}
                      onChange={(e) => setConfigEmpresa({ ...configEmpresa, telefone: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="email">E-mail</Label>
                    <Input
                      id="email"
                      value={configEmpresa.email}
                      onChange={(e) => setConfigEmpresa({ ...configEmpresa, email: e.target.value })}
                    />
                  </div>
                </div>
                <Button className="w-full bg-primary-teal hover:bg-primary-teal/90">
                  <Save className="mr-2 h-4 w-4" />
                  Salvar Dados da Empresa
                </Button>
              </CardContent>
            </Card>

            {/* Configurações Avançadas */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="h-5 w-5 text-primary-medium-green" />
                  Configurações Avançadas
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="diasVencimento">Dias para Vencimento</Label>
                    <Input
                      id="diasVencimento"
                      type="number"
                      value={configAvancada.diasVencimento}
                      onChange={(e) =>
                        setConfigAvancada({ ...configAvancada, diasVencimento: Number.parseInt(e.target.value) })
                      }
                    />
                  </div>
                  <div>
                    <Label htmlFor="jurosAtraso">Juros Atraso (%)</Label>
                    <Input
                      id="jurosAtraso"
                      type="number"
                      step="0.1"
                      value={configAvancada.jurosAtraso}
                      onChange={(e) =>
                        setConfigAvancada({ ...configAvancada, jurosAtraso: Number.parseFloat(e.target.value) })
                      }
                    />
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="emailNotif">Notificações por E-mail</Label>
                    <input
                      id="emailNotif"
                      type="checkbox"
                      checked={configAvancada.emailNotificacao}
                      onChange={(e) => setConfigAvancada({ ...configAvancada, emailNotificacao: e.target.checked })}
                      className="rounded"
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label htmlFor="backupAuto">Backup Automático</Label>
                    <input
                      id="backupAuto"
                      type="checkbox"
                      checked={configAvancada.backupAutomatico}
                      onChange={(e) => setConfigAvancada({ ...configAvancada, backupAutomatico: e.target.checked })}
                      className="rounded"
                    />
                  </div>
                </div>
                <Button className="w-full bg-primary-medium-green hover:bg-primary-medium-green/90">
                  <Save className="mr-2 h-4 w-4" />
                  Salvar Configurações
                </Button>
              </CardContent>
            </Card>

            {/* Fornecedores */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building className="h-5 w-5 text-primary-teal" />
                  Fornecedores
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center">
                  <p className="text-sm text-muted-foreground">{fornecedores.length} fornecedores cadastrados</p>
                  <Button
                    size="sm"
                    onClick={() => setShowCadastroFornecedor(true)}
                    className="bg-primary-teal hover:bg-primary-teal/90"
                  >
                    <UserPlus className="mr-2 h-4 w-4" />
                    Novo Fornecedor
                  </Button>
                </div>
                <div className="space-y-2">
                  {fornecedores.slice(0, 3).map((fornecedor) => (
                    <div key={fornecedor.id} className="flex justify-between items-center p-2 border rounded">
                      <div>
                        <p className="font-medium">{fornecedor.nome}</p>
                        <p className="text-sm text-muted-foreground">{fornecedor.cnpj}</p>
                      </div>
                      <Badge variant={fornecedor.status === "Ativo" ? "default" : "secondary"}>
                        {fornecedor.status}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Convênios */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Heart className="h-5 w-5 text-secondary-red" />
                  Convênios
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center">
                  <p className="text-sm text-muted-foreground">{convenios.length} convênios cadastrados</p>
                  <Button
                    size="sm"
                    onClick={() => setShowCadastroConvenio(true)}
                    className="bg-secondary-red hover:bg-secondary-red/90"
                  >
                    <UserPlus className="mr-2 h-4 w-4" />
                    Novo Convênio
                  </Button>
                </div>
                <div className="space-y-2">
                  {convenios.map((convenio) => (
                    <div key={convenio.id} className="flex justify-between items-center p-2 border rounded">
                      <div>
                        <p className="font-medium">{convenio.nome}</p>
                        <p className="text-sm text-muted-foreground">R$ {convenio.valorConsulta}/consulta</p>
                      </div>
                      <Badge variant="default">{convenio.status}</Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Pacientes Financeiro */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5 text-primary-medium-green" />
                  Pacientes Financeiro
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center">
                  <p className="text-sm text-muted-foreground">{pacientesFinanceiro.length} pacientes cadastrados</p>
                  <Button
                    size="sm"
                    onClick={() => setShowCadastroPaciente(true)}
                    className="bg-primary-medium-green hover:bg-primary-medium-green/90"
                  >
                    <UserPlus className="mr-2 h-4 w-4" />
                    Novo Paciente
                  </Button>
                </div>
                <div className="space-y-2">
                  {pacientesFinanceiro.slice(0, 3).map((paciente) => (
                    <div key={paciente.id} className="flex justify-between items-center p-2 border rounded">
                      <div>
                        <p className="font-medium">{paciente.nome}</p>
                        <p className="text-sm text-muted-foreground">{paciente.cpf}</p>
                      </div>
                      <Badge variant={paciente.status === "Ativo" ? "default" : "secondary"}>{paciente.status}</Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Bancos */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="h-5 w-5 text-accent-orange" />
                  Contas Bancárias
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center">
                  <p className="text-sm text-muted-foreground">{bancosCadastradosState.length} contas cadastradas</p>
                  <Dialog open={showNovaConta} onOpenChange={setShowNovaConta}>
                    <DialogTrigger asChild>
                      <Button size="sm" className="bg-accent-orange hover:bg-accent-orange/90">
                        <Plus className="mr-2 h-4 w-4" />
                        Nova Conta
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-md">
                      <DialogHeader>
                        <DialogTitle>Nova Conta Bancária</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <Label htmlFor="nomeBanco">Nome do Banco</Label>
                          <Input
                            id="nomeBanco"
                            value={novaConta.nome}
                            onChange={(e) => setNovaConta({ ...novaConta, nome: e.target.value })}
                            placeholder="Ex: Banco do Brasil"
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="tipoConta">Tipo de Conta</Label>
                          <Select
                            value={novaConta.tipo}
                            onValueChange={(value) => setNovaConta({ ...novaConta, tipo: value })}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione o tipo" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="corrente">Conta Corrente</SelectItem>
                              <SelectItem value="poupanca">Conta Poupança</SelectItem>
                              <SelectItem value="investimento">Conta Investimento</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="agencia">Agência</Label>
                            <Input
                              id="agencia"
                              value={novaConta.agencia}
                              onChange={(e) => setNovaConta({ ...novaConta, agencia: e.target.value })}
                              placeholder="0000"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="conta">Conta</Label>
                            <Input
                              id="conta"
                              value={novaConta.conta}
                              onChange={(e) => setNovaConta({ ...novaConta, conta: e.target.value })}
                              placeholder="00000-0"
                            />
                          </div>
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="saldoInicial">Saldo Inicial (R$)</Label>
                          <Input
                            id="saldoInicial"
                            type="number"
                            step="0.01"
                            value={novaConta.saldoInicial}
                            onChange={(e) => setNovaConta({ ...novaConta, saldoInicial: e.target.value })}
                            placeholder="0,00"
                          />
                        </div>

                        <div className="flex gap-2">
                          <Button variant="outline" onClick={() => setShowNovaConta(false)} className="flex-1">
                            Cancelar
                          </Button>
                          <Button
                            onClick={handleSalvarConta}
                            className="flex-1 bg-accent-orange hover:bg-accent-orange/90"
                          >
                            Salvar
                          </Button>
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
                <div className="space-y-2">
                  {bancosCadastradosState.slice(0, 3).map((banco) => (
                    <div key={banco.id} className="flex justify-between items-center p-2 border rounded">
                      <div>
                        <p className="font-medium">{banco.nome}</p>
                        <p className="text-xs text-muted-foreground">
                          Ag: {banco.agencia} - Conta: {banco.conta}
                        </p>
                      </div>
                      <Badge variant="default">Ativa</Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {showCadastroFornecedor && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Novo Fornecedor</h3>
              <Button variant="ghost" size="sm" onClick={() => setShowCadastroFornecedor(false)}>
                <X className="h-4 w-4" />
              </Button>
            </div>
            <div className="space-y-4">
              <div>
                <Label htmlFor="nomeFornecedor">Nome do Fornecedor</Label>
                <Input
                  id="nomeFornecedor"
                  value={novoFornecedor.nome}
                  onChange={(e) => setNovoFornecedor({ ...novoFornecedor, nome: e.target.value })}
                  placeholder="Digite o nome do fornecedor"
                />
              </div>
              <div>
                <Label htmlFor="cnpjFornecedor">CNPJ</Label>
                <Input
                  id="cnpjFornecedor"
                  value={novoFornecedor.cnpj}
                  onChange={(e) => setNovoFornecedor({ ...novoFornecedor, cnpj: e.target.value })}
                  placeholder="00.000.000/0000-00"
                />
              </div>
              <div>
                <Label htmlFor="telefoneFornecedor">Telefone</Label>
                <Input
                  id="telefoneFornecedor"
                  value={novoFornecedor.telefone}
                  onChange={(e) => setNovoFornecedor({ ...novoFornecedor, telefone: e.target.value })}
                  placeholder="(00) 00000-0000"
                />
              </div>
              <div>
                <Label htmlFor="emailFornecedor">E-mail</Label>
                <Input
                  id="emailFornecedor"
                  type="email"
                  value={novoFornecedor.email}
                  onChange={(e) => setNovoFornecedor({ ...novoFornecedor, email: e.target.value })}
                  placeholder="fornecedor@email.com"
                />
              </div>
              <div>
                <Label htmlFor="enderecoFornecedor">Endereço</Label>
                <Input
                  id="enderecoFornecedor"
                  value={novoFornecedor.endereco}
                  onChange={(e) => setNovoFornecedor({ ...novoFornecedor, endereco: e.target.value })}
                  placeholder="Rua, número, bairro, cidade"
                />
              </div>
              <div>
                <Label htmlFor="contatoFornecedor">Pessoa de Contato</Label>
                <Input
                  id="contatoFornecedor"
                  value={novoFornecedor.contato}
                  onChange={(e) => setNovoFornecedor({ ...novoFornecedor, contato: e.target.value })}
                  placeholder="Nome do responsável"
                />
              </div>
              <div>
                <Label htmlFor="observacoesFornecedor">Observações</Label>
                <textarea
                  id="observacoesFornecedor"
                  value={novoFornecedor.observacoes}
                  onChange={(e) => setNovoFornecedor({ ...novoFornecedor, observacoes: e.target.value })}
                  placeholder="Observações adicionais"
                  className="w-full p-2 border rounded-md resize-none"
                  rows={3}
                />
              </div>
            </div>
            <div className="flex gap-2 mt-6">
              <Button variant="outline" onClick={() => setShowCadastroFornecedor(false)} className="flex-1">
                Cancelar
              </Button>
              <Button onClick={handleSalvarFornecedor} className="flex-1 bg-primary-teal hover:bg-primary-teal/90">
                Salvar Fornecedor
              </Button>
            </div>
          </div>
        </div>
      )}

      {showCadastroConvenio && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Novo Convênio</h3>
              <Button variant="ghost" size="sm" onClick={() => setShowCadastroConvenio(false)}>
                <X className="h-4 w-4" />
              </Button>
            </div>
            <div className="space-y-4">
              <div>
                <Label htmlFor="nomeConvenio">Nome do Convênio</Label>
                <Input
                  id="nomeConvenio"
                  value={novoConvenio.nome}
                  onChange={(e) => setNovoConvenio({ ...novoConvenio, nome: e.target.value })}
                  placeholder="Digite o nome do convênio"
                />
              </div>
              <div>
                <Label htmlFor="valorConsulta">Valor por Consulta</Label>
                <Input
                  id="valorConsulta"
                  type="number"
                  step="0.01"
                  value={novoConvenio.valorConsulta}
                  onChange={(e) => setNovoConvenio({ ...novoConvenio, valorConsulta: e.target.value })}
                  placeholder="0,00"
                />
              </div>
              <div>
                <Label htmlFor="percentualDesconto">Percentual de Desconto (%)</Label>
                <Input
                  id="percentualDesconto"
                  type="number"
                  step="0.1"
                  value={novoConvenio.percentualDesconto}
                  onChange={(e) => setNovoConvenio({ ...novoConvenio, percentualDesconto: e.target.value })}
                  placeholder="0,0"
                />
              </div>
              <div>
                <Label htmlFor="prazoRepasse">Prazo de Repasse (dias)</Label>
                <Input
                  id="prazoRepasse"
                  type="number"
                  value={novoConvenio.prazoRepasse}
                  onChange={(e) => setNovoConvenio({ ...novoConvenio, prazoRepasse: e.target.value })}
                  placeholder="30"
                />
              </div>
              <div>
                <Label htmlFor="contatoConvenio">Pessoa de Contato</Label>
                <Input
                  id="contatoConvenio"
                  value={novoConvenio.contato}
                  onChange={(e) => setNovoConvenio({ ...novoConvenio, contato: e.target.value })}
                  placeholder="Nome do responsável"
                />
              </div>
              <div>
                <Label htmlFor="telefoneConvenio">Telefone</Label>
                <Input
                  id="telefoneConvenio"
                  value={novoConvenio.telefone}
                  onChange={(e) => setNovoConvenio({ ...novoConvenio, telefone: e.target.value })}
                  placeholder="(00) 00000-0000"
                />
              </div>
              <div>
                <Label htmlFor="emailConvenio">E-mail</Label>
                <Input
                  id="emailConvenio"
                  type="email"
                  value={novoConvenio.email}
                  onChange={(e) => setNovoConvenio({ ...novoConvenio, email: e.target.value })}
                  placeholder="convenio@email.com"
                />
              </div>
            </div>
            <div className="flex gap-2 mt-6">
              <Button variant="outline" onClick={() => setShowCadastroConvenio(false)} className="flex-1">
                Cancelar
              </Button>
              <Button onClick={handleSalvarConvenio} className="flex-1 bg-secondary-red hover:bg-secondary-red/90">
                Salvar Convênio
              </Button>
            </div>
          </div>
        </div>
      )}

      {showCadastroPaciente && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Novo Paciente Financeiro</h3>
              <Button variant="ghost" size="sm" onClick={() => setShowCadastroPaciente(false)}>
                <X className="h-4 w-4" />
              </Button>
            </div>
            <div className="space-y-4">
              <div>
                <Label htmlFor="nomePaciente">Nome do Paciente</Label>
                <Input
                  id="nomePaciente"
                  value={novoPaciente.nome}
                  onChange={(e) => setNovoPaciente({ ...novoPaciente, nome: e.target.value })}
                  placeholder="Digite o nome completo"
                />
              </div>
              <div>
                <Label htmlFor="cpfPaciente">CPF</Label>
                <Input
                  id="cpfPaciente"
                  value={novoPaciente.cpf}
                  onChange={(e) => setNovoPaciente({ ...novoPaciente, cpf: e.target.value })}
                  placeholder="000.000.000-00"
                />
              </div>
              <div>
                <Label htmlFor="telefonePaciente">Telefone</Label>
                <Input
                  id="telefonePaciente"
                  value={novoPaciente.telefone}
                  onChange={(e) => setNovoPaciente({ ...novoPaciente, telefone: e.target.value })}
                  placeholder="(00) 00000-0000"
                />
              </div>
              <div>
                <Label htmlFor="emailPaciente">E-mail</Label>
                <Input
                  id="emailPaciente"
                  type="email"
                  value={novoPaciente.email}
                  onChange={(e) => setNovoPaciente({ ...novoPaciente, email: e.target.value })}
                  placeholder="paciente@email.com"
                />
              </div>
              <div>
                <Label htmlFor="enderecoPaciente">Endereço</Label>
                <Input
                  id="enderecoPaciente"
                  value={novoPaciente.endereco}
                  onChange={(e) => setNovoPaciente({ ...novoPaciente, endereco: e.target.value })}
                  placeholder="Rua, número, bairro, cidade"
                />
              </div>
              <div>
                <Label htmlFor="convenioPaciente">Convênio</Label>
                <select
                  id="convenioPaciente"
                  value={novoPaciente.convenio}
                  onChange={(e) => setNovoPaciente({ ...novoPaciente, convenio: e.target.value })}
                  className="w-full p-2 border rounded-md"
                >
                  <option value="">Selecione um convênio</option>
                  <option value="particular">Particular</option>
                  <option value="unimed">Unimed</option>
                  <option value="bradesco">Bradesco Saúde</option>
                  <option value="sulamerica">SulAmérica</option>
                </select>
              </div>
              <div>
                <Label htmlFor="observacoesPaciente">Observações</Label>
                <textarea
                  id="observacoesPaciente"
                  value={novoPaciente.observacoes}
                  onChange={(e) => setNovoPaciente({ ...novoPaciente, observacoes: e.target.value })}
                  placeholder="Observações financeiras"
                  className="w-full p-2 border rounded-md resize-none"
                  rows={3}
                />
              </div>
            </div>
            <div className="flex gap-2 mt-6">
              <Button variant="outline" onClick={() => setShowCadastroPaciente(false)} className="flex-1">
                Cancelar
              </Button>
              <Button
                onClick={handleSalvarPaciente}
                className="flex-1 bg-primary-medium-green hover:bg-primary-medium-green/90"
              >
                Salvar Paciente
              </Button>
            </div>
          </div>
        </div>
      )}

      <Dialog open={showProjecaoFinanceira} onOpenChange={setShowProjecaoFinanceira}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Fluxo de Caixa - Previsto x Realizado</DialogTitle>
          </DialogHeader>
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-primary-teal" />
                    <span className="text-sm font-medium">Receita Prevista</span>
                  </div>
                  <div className="text-2xl font-bold text-primary-teal mt-2">
                    R${" "}
                    {Object.values(fluxoCaixa)
                      .reduce((acc, mes) => acc + mes.previsto.receitas, 0)
                      .toLocaleString("pt-BR")}
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2">
                    <TrendingDown className="h-4 w-4 text-secondary-red" />
                    <span className="text-sm font-medium">Despesa Prevista</span>
                  </div>
                  <div className="text-2xl font-bold text-secondary-red mt-2">
                    R${" "}
                    {Object.values(fluxoCaixa)
                      .reduce((acc, mes) => acc + mes.previsto.despesas, 0)
                      .toLocaleString("pt-BR")}
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2">
                    <Calculator className="h-4 w-4 text-primary-medium-green" />
                    <span className="text-sm font-medium">Saldo Previsto</span>
                  </div>
                  <div className="text-2xl font-bold text-primary-medium-green mt-2">
                    R${" "}
                    {(
                      Object.values(fluxoCaixa).reduce((acc, mes) => acc + mes.previsto.receitas, 0) -
                      Object.values(fluxoCaixa).reduce((acc, mes) => acc + mes.previsto.despesas, 0)
                    ).toLocaleString("pt-BR")}
                  </div>
                </CardContent>
              </Card>
            </div>

            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Mês</TableHead>
                  <TableHead>Receita Prevista</TableHead>
                  <TableHead>Receita Realizada</TableHead>
                  <TableHead>Despesa Prevista</TableHead>
                  <TableHead>Despesa Realizada</TableHead>
                  <TableHead>Saldo Previsto</TableHead>
                  <TableHead>Saldo Realizado</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {Object.entries(fluxoCaixa).map(([mes, dados]) => (
                  <TableRow key={mes}>
                    <TableCell className="font-medium capitalize">{mes}</TableCell>
                    <TableCell>R$ {dados.previsto.receitas.toLocaleString("pt-BR")}</TableCell>
                    <TableCell>R$ {dados.realizado.receitas.toLocaleString("pt-BR")}</TableCell>
                    <TableCell>R$ {dados.previsto.despesas.toLocaleString("pt-BR")}</TableCell>
                    <TableCell>R$ {dados.realizado.despesas.toLocaleString("pt-BR")}</TableCell>
                    <TableCell>
                      R$ {(dados.previsto.receitas - dados.previsto.despesas).toLocaleString("pt-BR")}
                    </TableCell>
                    <TableCell>
                      R$ {(dados.realizado.receitas - dados.realizado.despesas).toLocaleString("pt-BR")}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal Previsões Futuras */}
      <Dialog open={showPrevisoesFuturas} onOpenChange={setShowPrevisoesFuturas}>
        <DialogContent className="max-w-6xl">
          <DialogHeader>
            <DialogTitle>Previsões Futuras - Cenários Trimestrais</DialogTitle>
          </DialogHeader>
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {previsoesFuturas.proximosTrimestres.map((trimestre, index) => (
                <Card key={index}>
                  <CardHeader>
                    <CardTitle className="text-center">{trimestre.trimestre}</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <div className="flex justify-between items-center p-2 bg-green-50 rounded">
                        <span className="text-sm font-medium text-green-700">Otimista</span>
                        <span className="text-sm font-bold text-green-700">
                          R$ {trimestre.cenarios.otimista.lucro.toLocaleString("pt-BR")}
                        </span>
                      </div>
                      <div className="flex justify-between items-center p-2 bg-blue-50 rounded">
                        <span className="text-sm font-medium text-blue-700">Realista</span>
                        <span className="text-sm font-bold text-blue-700">
                          R$ {trimestre.cenarios.realista.lucro.toLocaleString("pt-BR")}
                        </span>
                      </div>
                      <div className="flex justify-between items-center p-2 bg-orange-50 rounded">
                        <span className="text-sm font-medium text-orange-700">Pessimista</span>
                        <span className="text-sm font-bold text-orange-700">
                          R$ {trimestre.cenarios.pessimista.lucro.toLocaleString("pt-BR")}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Trimestre</TableHead>
                  <TableHead>Cenário</TableHead>
                  <TableHead>Receitas</TableHead>
                  <TableHead>Despesas</TableHead>
                  <TableHead>Lucro Projetado</TableHead>
                  <TableHead>Margem %</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {previsoesFuturas.proximosTrimestres.map((trimestre, index) =>
                  Object.entries(trimestre.cenarios).map(([cenario, dados]) => (
                    <TableRow key={`${index}-${cenario}`}>
                      <TableCell className="font-medium">{trimestre.trimestre}</TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            cenario === "otimista" ? "default" : cenario === "realista" ? "secondary" : "destructive"
                          }
                        >
                          {cenario.charAt(0).toUpperCase() + cenario.slice(1)}
                        </Badge>
                      </TableCell>
                      <TableCell>R$ {dados.receitas.toLocaleString("pt-BR")}</TableCell>
                      <TableCell>R$ {dados.despesas.toLocaleString("pt-BR")}</TableCell>
                      <TableCell>R$ {dados.lucro.toLocaleString("pt-BR")}</TableCell>
                      <TableCell>{((dados.lucro / dados.receitas) * 100).toFixed(1)}%</TableCell>
                    </TableRow>
                  )),
                )}
              </TableBody>
            </Table>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal Metas Financeiras */}
      <Dialog open={showMetasFinanceiras} onOpenChange={setShowMetasFinanceiras}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Metas Financeiras Anuais</DialogTitle>
          </DialogHeader>
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {Object.entries(previsoesFuturas.metasAnuais).map(([ano, metas]) => (
                <Card key={ano}>
                  <CardHeader>
                    <CardTitle className="text-center">{ano}</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium">Meta de Receita:</span>
                        <span className="text-lg font-bold text-primary-teal">
                          R$ {metas.receita.toLocaleString("pt-BR")}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium">Meta de Despesa:</span>
                        <span className="text-lg font-bold text-secondary-red">
                          R$ {metas.despesa.toLocaleString("pt-BR")}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium">Meta de Lucro:</span>
                        <span className="text-lg font-bold text-primary-medium-green">
                          R$ {metas.lucro.toLocaleString("pt-BR")}
                        </span>
                      </div>
                      <div className="pt-2 border-t">
                        <div className="flex justify-between items-center">
                          <span className="text-sm font-medium">Margem Alvo:</span>
                          <span className="text-lg font-bold">{((metas.lucro / metas.receita) * 100).toFixed(1)}%</span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Progresso das Metas 2024</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between mb-2">
                      <span className="text-sm font-medium">Receita (65% do ano)</span>
                      <span className="text-sm">R$ 390.000 / R$ 600.000</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div className="bg-primary-teal h-2 rounded-full" style={{ width: "65%" }}></div>
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between mb-2">
                      <span className="text-sm font-medium">Lucro (58% do ano)</span>
                      <span className="text-sm">R$ 69.600 / R$ 120.000</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div className="bg-primary-medium-green h-2 rounded-full" style={{ width: "58%" }}></div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal Análise de Tendências */}
      <Dialog open={showTendencias} onOpenChange={setShowTendencias}>
        <DialogContent className="max-w-5xl">
          <DialogHeader>
            <DialogTitle>Análise de Tendências e Indicadores</DialogTitle>
          </DialogHeader>
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-primary-teal" />
                    <span className="text-sm font-medium">Crescimento Mensal</span>
                  </div>
                  <div className="text-2xl font-bold text-primary-teal mt-2">
                    {previsoesFuturas.tendencias.crescimentoMensal}%
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2">
                    <Percent className="h-4 w-4 text-primary-medium-green" />
                    <span className="text-sm font-medium">Margem de Lucro</span>
                  </div>
                  <div className="text-2xl font-bold text-primary-medium-green mt-2">
                    {previsoesFuturas.tendencias.indicadores.margemLucro}%
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2">
                    <Calculator className="h-4 w-4 text-amber-600" />
                    <span className="text-sm font-medium">ROI</span>
                  </div>
                  <div className="text-2xl font-bold text-amber-600 mt-2">
                    {previsoesFuturas.tendencias.indicadores.retornoInvestimento}%
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Sazonalidade</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {previsoesFuturas.tendencias.sazonalidade.map((item, index) => (
                      <div key={index} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                        <span className="text-sm font-medium">{item.split(":")[0]}</span>
                        <span className="text-sm font-bold">{item.split(":")[1]}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Indicadores Chave</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium">Ponto de Equilíbrio:</span>
                      <span className="text-sm font-bold">
                        R$ {previsoesFuturas.tendencias.indicadores.pontoEquilibrio.toLocaleString("pt-BR")}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium">Margem de Lucro:</span>
                      <span className="text-sm font-bold">{previsoesFuturas.tendencias.indicadores.margemLucro}%</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium">ROI Anual:</span>
                      <span className="text-sm font-bold">
                        {previsoesFuturas.tendencias.indicadores.retornoInvestimento}%
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Recomendações Baseadas em Tendências</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex items-start gap-2 p-3 bg-green-50 rounded">
                    <CheckCircle className="h-4 w-4 text-green-600 mt-0.5" />
                    <span className="text-sm">Crescimento consistente de 3.5% ao mês indica boa saúde financeira</span>
                  </div>
                  <div className="flex items-start gap-2 p-3 bg-blue-50 rounded">
                    <Info className="h-4 w-4 text-blue-600 mt-0.5" />
                    <span className="text-sm">Aproveitar sazonalidade de dezembro para campanhas especiais</span>
                  </div>
                  <div className="flex items-start gap-2 p-3 bg-amber-50 rounded">
                    <AlertTriangle className="h-4 w-4 text-amber-600 mt-0.5" />
                    <span className="text-sm">Monitorar janeiro para possível queda sazonal de 10%</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal Plano de Contas */}
      <Dialog open={showPlanoContas} onOpenChange={setShowPlanoContas}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Plano de Contas - {tipoMovimentacao === "despesa" ? "Despesas" : "Receitas"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {tipoMovimentacao === "despesa"
              ? renderPlanoContas(planoContasDespesas)
              : renderPlanoContas(planoContasReceitas)}
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal Nova Conta Bancária */}
      <Dialog open={showModalContaBancaria} onOpenChange={setShowModalContaBancaria}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5 text-accent-orange" />
              Nova Conta Bancária
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="nomeBanco">Nome do Banco</Label>
                <Input
                  id="nomeBanco"
                  value={novaContaBancaria.nome}
                  onChange={(e) => setNovaContaBancaria({ ...novaContaBancaria, nome: e.target.value })}
                  placeholder="Ex: Banco do Brasil"
                />
              </div>
              <div>
                <Label htmlFor="tipoConta">Tipo de Conta</Label>
                <select
                  id="tipoConta"
                  value={novaContaBancaria.tipo}
                  onChange={(e) => setNovaContaBancaria({ ...novaContaBancaria, tipo: e.target.value })}
                  className="w-full p-2 border rounded-md"
                >
                  <option value="Conta Corrente">Conta Corrente</option>
                  <option value="Conta Poupança">Conta Poupança</option>
                  <option value="Conta Salário">Conta Salário</option>
                </select>
              </div>
              <div>
                <Label htmlFor="agenciaBanco">Agência</Label>
                <Input
                  id="agenciaBanco"
                  value={novaContaBancaria.agencia}
                  onChange={(e) => setNovaContaBancaria({ ...novaContaBancaria, agencia: e.target.value })}
                  placeholder="Ex: 1234-5"
                />
              </div>
              <div>
                <Label htmlFor="contaBanco">Número da Conta</Label>
                <Input
                  id="contaBanco"
                  value={novaContaBancaria.conta}
                  onChange={(e) => setNovaContaBancaria({ ...novaContaBancaria, conta: e.target.value })}
                  placeholder="Ex: 12345-6"
                />
              </div>
              <div className="md:col-span-2">
                <Label htmlFor="saldoInicial">Saldo Inicial (R$)</Label>
                <Input
                  id="saldoInicial"
                  type="number"
                  step="0.01"
                  value={novaContaBancaria.saldo}
                  onChange={(e) =>
                    setNovaContaBancaria({ ...novaContaBancaria, saldo: Number.parseFloat(e.target.value) || 0 })
                  }
                  placeholder="0,00"
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowModalContaBancaria(false)}>
              Cancelar
            </Button>
            <Button
              className="bg-accent-orange hover:bg-accent-orange/90"
              onClick={() => {
                console.log("Nova conta bancária:", novaContaBancaria)
                setShowModalContaBancaria(false)
                setNovaContaBancaria({ nome: "", agencia: "", conta: "", tipo: "Conta Corrente", saldo: 0 })
              }}
            >
              <Save className="mr-2 h-4 w-4" />
              Cadastrar Conta
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
