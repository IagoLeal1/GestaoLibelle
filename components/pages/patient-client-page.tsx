"use client"

import { useState } from "react"
import Link from "next/link"
// Adicione Dispatch e SetStateAction aqui
import { Dispatch, SetStateAction } from "react" 
import { Search, Filter, MoreHorizontal, User, Phone, MapPin, MessageSquareText, NotebookPen } from "lucide-react"
import { Timestamp } from "firebase/firestore"
import { Patient, updatePatientStatus } from "@/services/patientService"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { PatientObservations } from "@/components/patients/patient-observations"
import { useAuth } from "@/context/AuthContext";
import { ehGestao, podeAcessar } from "@/lib/permissoes";

// --- 1. DEFINIÇÃO DA INTERFACE DAS PROPS ---
interface PatientClientPageProps {
  data: Patient[];
  isLoading: boolean;
  onRefresh: () => Promise<void> | void; // Aceita assíncrono ou síncrono
  setPacientes: Dispatch<SetStateAction<Patient[]>>;
}

// --- Funções de Ajuda ---
const getStatusBadge = (status: string) => {
  const statusConfig = {
    ativo: { label: "Ativo", className: "bg-green-100 text-green-800" },
    inativo: { label: "Inativo", className: "bg-red-100 text-red-800" },
    suspenso: { label: "Suspenso", className: "bg-yellow-100 text-yellow-800" },
  };
  const config = statusConfig[status as keyof typeof statusConfig] || { label: 'Desconhecido', className: 'bg-gray-100 text-gray-800' };
  return <Badge variant="outline" className={`font-semibold ${config.className}`}>{config.label}</Badge>
};

const getSexoBadge = (sexo?: string) => {
  if (!sexo) return null;
  const sexoConfig = {
    masculino: "bg-blue-100 text-blue-800",
    feminino: "bg-pink-100 text-pink-800",
    outro: "bg-purple-100 text-purple-800",
  };
  const className = sexoConfig[sexo as keyof typeof sexoConfig] || "bg-gray-100 text-gray-800";
  return <Badge variant="outline" className={className}>{sexo.charAt(0).toUpperCase() + sexo.slice(1)}</Badge>
};

const getConvenioBadge = (convenio?: string) => {
    if (!convenio || convenio.trim() === "") return <Badge variant="secondary">N/A</Badge>;
    const lowerConvenio = convenio.toLowerCase();
    let className = "bg-gray-100 text-gray-800";
    if (lowerConvenio.includes("unimed leste")) className = "bg-green-100 text-green-800";
    else if (lowerConvenio.includes("unimed ferj")) className = "bg-green-200 text-green-900";
    else if (lowerConvenio.includes("unimed")) className = "bg-green-100 text-green-800";
    else if (lowerConvenio.includes("amil")) className = "bg-blue-100 text-blue-800";
    else if (lowerConvenio.includes("bradesco")) className = "bg-red-100 text-red-800";
    else if (lowerConvenio.includes("sulamerica") || lowerConvenio.includes("sul américa")) className = "bg-orange-100 text-orange-800";
    else if (lowerConvenio.includes("particular")) className = "bg-pink-100 text-pink-800";
    return <Badge variant="outline" className={`font-medium ${className}`}>{convenio}</Badge>
}

const MESES = [
  "Janeiro",
  "Fevereiro",
  "Março",
  "Abril",
  "Maio",
  "Junho",
  "Julho",
  "Agosto",
  "Setembro",
  "Outubro",
  "Novembro",
  "Dezembro",
];

const normalizeConvenio = (convenio: string) =>
  convenio.trim().replace(/\s+/g, " ").toLocaleLowerCase("pt-BR");

const getConvenios = (convenio?: string) =>
  (convenio || "").split(",").map((item) => item.trim()).filter(Boolean);

const getDataNascimento = (dataNascimento?: Timestamp) => {
  if (!dataNascimento?.toDate) return null;

  const date = dataNascimento.toDate();
  return Number.isNaN(date.getTime()) ? null : date;
};

const calcularIdade = (dataNascimento?: Timestamp) => {
  const nascimento = getDataNascimento(dataNascimento);
  if (!nascimento) return 0;

  const hoje = new Date();
  let idade = hoje.getFullYear() - nascimento.getUTCFullYear();
  const mes = hoje.getMonth() - nascimento.getUTCMonth();
  if (mes < 0 || (mes === 0 && hoje.getDate() < nascimento.getUTCDate())) {
    idade--;
  }
  return idade;
};

const formatDate = (date?: Timestamp) => {
    const dataNascimento = getDataNascimento(date);
    if (!dataNascimento) return "Não informado";

    // As datas de nascimento são armazenadas à meia-noite UTC. Fixar o fuso
    // evita que a interface exiba o dia anterior no horário de Brasília.
    return dataNascimento.toLocaleDateString("pt-BR", { timeZone: "UTC" });
};

// --- 2. APLICAÇÃO DA INTERFACE NO COMPONENTE ---
export function PatientClientPage({ data: pacientes, isLoading, setPacientes }: PatientClientPageProps) {
  const { firestoreUser } = useAuth();
  const podeEditar = ehGestao(firestoreUser?.profile?.role);
  // As evoluções são dados de saúde: a recepção não lê (lib/permissoes)
  const podeLerEvolucoes = podeAcessar("/evolucoes", firestoreUser?.profile?.role);
  const [searchTerm, setSearchTerm] = useState("");
  const [sexoFilter, setSexoFilter] = useState("todos");
  const [statusFilter, setStatusFilter] = useState("todos");
  const [mesAniversarioFilter, setMesAniversarioFilter] = useState("todos");
  const [convenioFilter, setConvenioFilter] = useState("todos");
  const [pacienteSelecionado, setPacienteSelecionado] = useState<Patient | null>(null);
  const [modalAberto, setModalAberto] = useState(false);

  const abrirDetalhes = (paciente: Patient) => {
    setPacienteSelecionado(paciente);
    setModalAberto(true);
  };

  const handleToggleStatus = async (paciente: Patient) => {
    const newStatus = paciente.status === 'ativo' ? 'inativo' : 'ativo';
    const actionText = newStatus === 'ativo' ? 'ativar' : 'desativar';
    if (window.confirm(`Tem certeza que deseja ${actionText} o paciente ${paciente.fullName}?`)) {
      const result = await updatePatientStatus(paciente.id, newStatus);
      if (result.success) {
        // Atualiza o estado local recebido via prop do Pai
        setPacientes(prev => prev.map(p => p.id === paciente.id ? { ...p, status: newStatus } : p));
      } else {
        alert(`Erro ao ${actionText} o paciente.`);
      }
    }
  };

  const conveniosDisponiveis = Array.from(
    new Map(
      pacientes.flatMap((paciente) => getConvenios(paciente.convenio))
        .map((convenio) => [normalizeConvenio(convenio), convenio])
    ).entries()
  ).sort((a, b) => a[1].localeCompare(b[1], "pt-BR"));

  const temPacienteSemConvenio = pacientes.some((paciente) => getConvenios(paciente.convenio).length === 0);

  // LÓGICA DE FILTRO (Usa a lista 'pacientes' que veio do Pai)
  const pacientesFiltrados = pacientes.filter((paciente) => {
    const search = searchTerm.toLowerCase();
    const dataNascimento = getDataNascimento(paciente.dataNascimento);
    const matchesSearch =
      paciente.fullName.toLowerCase().includes(search) ||
      (paciente.responsavel?.nome?.toLowerCase().includes(search)) || 
      (paciente.cpf && paciente.cpf.includes(searchTerm)); 
    const matchesSexo = sexoFilter === "todos" || paciente.sexo === sexoFilter;
    const matchesStatus = statusFilter === "todos" || paciente.status === statusFilter;
    const matchesMesAniversario = mesAniversarioFilter === "todos" ||
      dataNascimento?.getUTCMonth() === Number(mesAniversarioFilter);
    const conveniosPaciente = getConvenios(paciente.convenio);
    const matchesConvenio = convenioFilter === "todos" ||
      (convenioFilter === "sem-convenio"
        ? conveniosPaciente.length === 0
        : conveniosPaciente.some((convenio) => `convenio:${normalizeConvenio(convenio)}` === convenioFilter));
    return matchesSearch && matchesSexo && matchesStatus && matchesMesAniversario && matchesConvenio;
  }).sort((a, b) => {
    if (mesAniversarioFilter === "todos") return 0;

    const dataA = getDataNascimento(a.dataNascimento);
    const dataB = getDataNascimento(b.dataNascimento);
    if (!dataA) return 1;
    if (!dataB) return -1;

    return dataA.getUTCDate() - dataB.getUTCDate() ||
      a.fullName.localeCompare(b.fullName, "pt-BR");
  });

  const mesAniversarioReferencia = mesAniversarioFilter === "todos"
    ? new Date().getMonth()
    : Number(mesAniversarioFilter);

  const estatisticas = {
    total: pacientes.length,
    ativos: pacientes.filter((p) => p.status === "ativo").length,
    inativos: pacientes.filter((p) => p.status === "inativo").length,
    aniversariantes: pacientes.filter((p) =>
      getDataNascimento(p.dataNascimento)?.getUTCMonth() === mesAniversarioReferencia
    ).length,
  };
  
  if (isLoading) return <div className="text-center p-8">Carregando pacientes...</div>

  return (
    <>
      <div className="space-y-6">
        {/* Cards de Estatística */}
        <div className="grid gap-4 md:grid-cols-4">
            <Card><CardContent className="p-4"><div className="text-center"><p className="text-2xl font-bold">{estatisticas.total}</p><p className="text-xs font-medium text-muted-foreground">Total</p></div></CardContent></Card>
            <Card><CardContent className="p-4"><div className="text-center"><p className="text-2xl font-bold text-green-600">{estatisticas.ativos}</p><p className="text-xs font-medium text-green-600">Ativos</p></div></CardContent></Card>
            <Card><CardContent className="p-4"><div className="text-center"><p className="text-2xl font-bold text-red-600">{estatisticas.inativos}</p><p className="text-xs font-medium text-red-600">Inativos</p></div></CardContent></Card>
            <Card><CardContent className="p-4"><div className="text-center"><p className="text-2xl font-bold text-orange-600">{estatisticas.aniversariantes}</p><p className="text-xs font-medium text-orange-600">Aniversariantes em {MESES[mesAniversarioReferencia]}</p></div></CardContent></Card>
        </div>
        
        {/* Card de Filtros */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Filter className="h-5 w-5" /> Filtros</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
              <div className="space-y-2">
                <Label htmlFor="search">Buscar paciente</Label>
                <div className="relative"><Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" /><Input id="search" placeholder="Nome, CPF ou responsável..." className="pl-8" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} /></div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="sexo">Sexo</Label>
                <Select value={sexoFilter} onValueChange={setSexoFilter}><SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger><SelectContent><SelectItem value="todos">Todos</SelectItem><SelectItem value="masculino">Masculino</SelectItem><SelectItem value="feminino">Feminino</SelectItem><SelectItem value="outro">Outro</SelectItem></SelectContent></Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <Select value={statusFilter} onValueChange={setStatusFilter}><SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger><SelectContent><SelectItem value="todos">Todos</SelectItem><SelectItem value="ativo">Ativo</SelectItem><SelectItem value="inativo">Inativo</SelectItem><SelectItem value="suspenso">Suspenso</SelectItem></SelectContent></Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="mes-aniversario">Mês de aniversário</Label>
                <Select value={mesAniversarioFilter} onValueChange={setMesAniversarioFilter}>
                  <SelectTrigger id="mes-aniversario"><SelectValue placeholder="Selecione..." /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todos">Todos os meses</SelectItem>
                    {MESES.map((mes, index) => (
                      <SelectItem key={mes} value={String(index)}>{mes}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="convenio-filter">Convênio</Label>
                <Select value={convenioFilter} onValueChange={setConvenioFilter}>
                  <SelectTrigger id="convenio-filter"><SelectValue placeholder="Selecione..." /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todos">Todos os convênios</SelectItem>
                    {conveniosDisponiveis.map(([value, label]) => (
                      <SelectItem key={value} value={`convenio:${value}`}>{label}</SelectItem>
                    ))}
                    {temPacienteSemConvenio && <SelectItem value="sem-convenio">Sem convênio</SelectItem>}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tabela de Pacientes */}
        <Card>
          <CardHeader><CardTitle>Lista de Pacientes ({pacientesFiltrados.length})</CardTitle></CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader><TableRow>
                    <TableHead>Nome</TableHead>
                    <TableHead className="hidden sm:table-cell">Data de nascimento</TableHead>
                    <TableHead className="hidden lg:table-cell">Responsável</TableHead>
                    <TableHead className="hidden md:table-cell">Convênio</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                </TableRow></TableHeader>
                <TableBody>
                  {pacientesFiltrados.length > 0 ? pacientesFiltrados.map((paciente) => (
                    <TableRow key={paciente.id}>
                      <TableCell className="font-medium">{paciente.fullName}</TableCell>
                      <TableCell className="hidden sm:table-cell">{formatDate(paciente.dataNascimento)}</TableCell>
                      <TableCell className="hidden lg:table-cell">{paciente.responsavel?.nome}</TableCell>
                      <TableCell className="hidden md:table-cell">{getConvenioBadge(paciente.convenio)}</TableCell>
                      <TableCell>{getStatusBadge(paciente.status)}</TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild><Button variant="ghost" className="h-8 w-8 p-0"><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => abrirDetalhes(paciente)}>Ver Detalhes</DropdownMenuItem>
                            {/* Editar e ativar/desativar são da gestão; o terapeuta só consulta */}
                            {podeEditar && (
                              <>
                                <Link href={`/pacientes/editar/${paciente.id}`} passHref><DropdownMenuItem>Editar</DropdownMenuItem></Link>
                                <DropdownMenuItem className={paciente.status === 'ativo' ? "text-red-600 focus:bg-red-50 focus:text-red-700" : "text-green-600 focus:bg-green-50 focus:text-green-700"} onClick={() => handleToggleStatus(paciente)}>
                                  {paciente.status === 'ativo' ? 'Desativar' : 'Ativar'}
                                </DropdownMenuItem>
                              </>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  )) : <TableRow><TableCell colSpan={6} className="text-center">Nenhum paciente encontrado.</TableCell></TableRow>}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Modal de Detalhes do Paciente (Mantido aqui pois é específico do item da lista) */}
      <Dialog open={modalAberto} onOpenChange={setModalAberto}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader><DialogTitle className="flex items-center gap-2"><User /> Detalhes do Paciente</DialogTitle></DialogHeader>
            {pacienteSelecionado && (
              <div className="space-y-6 py-4">
                <Card>
                    <CardHeader><CardTitle>Informações Pessoais</CardTitle></CardHeader>
                    <CardContent><div className="grid gap-4 md:grid-cols-3">
                        <div className="md:col-span-2"><Label className="text-sm font-medium text-gray-500">Nome Completo</Label><p>{pacienteSelecionado.fullName}</p></div>
                        <div><Label className="text-sm font-medium text-gray-500">Convênio</Label><div className="mt-1">{getConvenioBadge(pacienteSelecionado.convenio)}</div></div>
                        <div><Label className="text-sm font-medium text-gray-500">Data de Nascimento</Label><p>{formatDate(pacienteSelecionado.dataNascimento)} ({calcularIdade(pacienteSelecionado.dataNascimento)} anos)</p></div>
                        <div><Label className="text-sm font-medium text-gray-500">Sexo</Label><div className="mt-1">{getSexoBadge(pacienteSelecionado.sexo)}</div></div>
                        <div><Label className="text-sm font-medium text-gray-500">CPF</Label><p>{pacienteSelecionado.cpf}</p></div>
                        <div><Label className="text-sm font-medium text-gray-500">Status</Label><div className="mt-1">{getStatusBadge(pacienteSelecionado.status)}</div></div>
                        <div><Label className="text-sm font-medium text-gray-500">Data de Início</Label><p>{formatDate(pacienteSelecionado.dataInicio)}</p></div>
                        <div><Label className="text-sm font-medium text-gray-500">Data de Término</Label><p>{formatDate(pacienteSelecionado.dataTermino)}</p></div>
                    </div></CardContent>
                </Card>
                <Card>
                    <CardHeader><CardTitle className="flex items-center gap-2"><Phone /> Contato do Responsável</CardTitle></CardHeader>
                    <CardContent><div className="grid gap-4 md:grid-cols-3">
                        <div className="md:col-span-2"><Label className="text-sm font-medium text-gray-500">Nome</Label><p>{pacienteSelecionado.responsavel?.nome || "Não informado"}</p></div>
                        <div><Label className="text-sm font-medium text-gray-500">CPF do Responsável</Label><p>{pacienteSelecionado.responsavel?.cpf || "Não informado"}</p></div>
                        <div><Label className="text-sm font-medium text-gray-500">Celular</Label><p>{pacienteSelecionado.responsavel?.celular || "Não informado"}</p></div>
                        <div><Label className="text-sm font-medium text-gray-500">Email</Label><p>{pacienteSelecionado.responsavel?.email || "Não informado"}</p></div>
                    </div></CardContent>
                </Card>
                <Card>
                    <CardHeader><CardTitle className="flex items-center gap-2"><MapPin /> Endereço</CardTitle></CardHeader>
                    <CardContent><div className="grid gap-4 md:grid-cols-2">
                        <div><Label className="text-sm font-medium text-gray-500">Logradouro</Label><p>{`${pacienteSelecionado.endereco || 'Não informado'}, ${pacienteSelecionado.numero || 'S/N'}`}</p></div>
                        <div><Label className="text-sm font-medium text-gray-500">Bairro</Label><p>{pacienteSelecionado.bairro || "Não informado"}</p></div>
                        <div><Label className="text-sm font-medium text-gray-500">Cidade / Estado</Label><p>{`${pacienteSelecionado.cidade || 'Não informado'} - ${pacienteSelecionado.estado || 'N/A'}`}</p></div>
                        <div><Label className="text-sm font-medium text-gray-500">CEP</Label><p>{pacienteSelecionado.cep || "Não informado"}</p></div>
                    </div></CardContent>
                </Card>
                {podeLerEvolucoes && (
                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0">
                      <CardTitle className="flex items-center gap-2"><NotebookPen /> Prontuário</CardTitle>
                      <Button asChild variant="outline" size="sm">
                        <Link href={`/prontuario/${encodeURIComponent(pacienteSelecionado.id)}`}>Abrir prontuário</Link>
                      </Button>
                    </CardHeader>
                  </Card>
                )}
                <Card>
                    <CardHeader><CardTitle className="flex items-center gap-2"><MessageSquareText /> Observações Adicionais</CardTitle></CardHeader>
                    <CardContent>
                      <PatientObservations patientId={pacienteSelecionado.id} legacyObservation={pacienteSelecionado.observacoes} />
                    </CardContent>
                </Card>
              </div>
            )}
          </DialogContent>
      </Dialog>
    </>
  )
}
