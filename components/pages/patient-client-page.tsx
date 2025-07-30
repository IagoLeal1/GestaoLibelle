"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Plus, Search, Filter, MoreHorizontal, User, Phone, Calendar, MapPin } from "lucide-react"
import { Timestamp } from "firebase/firestore"
import { Patient, getPatients, updatePatientStatus } from "@/services/patientService"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"

// --- Funções de Ajuda (Helpers) ---
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

// --- NOVA FUNÇÃO PARA OS CONVÊNIOS ---
const getConvenioBadge = (convenio?: string) => {
    if (!convenio || convenio.trim() === "") return <Badge variant="secondary">N/A</Badge>;

    const lowerConvenio = convenio.toLowerCase();
    let className = "bg-gray-100 text-gray-800"; // Padrão

    if (lowerConvenio.includes("unimed leste")) className = "bg-green-100 text-green-800";
    else if (lowerConvenio.includes("unimed ferj")) className = "bg-green-200 text-green-900";
    else if (lowerConvenio.includes("amil")) className = "bg-blue-100 text-blue-800";
    else if (lowerConvenio.includes("bradesco")) className = "bg-red-100 text-red-800";
    else if (lowerConvenio.includes("sulamerica")) className = "bg-orange-100 text-orange-800";
    else if (lowerConvenio.includes("particular")) className = "bg-pink-100 text-pink-800";

    return <Badge variant="outline" className={`font-medium ${className}`}>{convenio}</Badge>
}

const calcularIdade = (dataNascimento: Timestamp) => {
  if (!dataNascimento?.toDate) return 0;
  const hoje = new Date();
  const nascimento = dataNascimento.toDate();
  let idade = hoje.getFullYear() - nascimento.getFullYear();
  const mes = hoje.getMonth() - nascimento.getMonth();
  if (mes < 0 || (mes === 0 && hoje.getDate() < nascimento.getDate())) {
    idade--;
  }
  return idade;
};

const formatDate = (date: Timestamp | undefined) => {
    if (!date?.toDate) return "Não informado";
    return date.toDate().toLocaleDateString("pt-BR");
};

// --- Componente Principal ---
export function PatientClientPage() {
  const [pacientes, setPacientes] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [sexoFilter, setSexoFilter] = useState("todos");
  const [statusFilter, setStatusFilter] = useState("todos");
  const [pacienteSelecionado, setPacienteSelecionado] = useState<Patient | null>(null);
  const [modalAberto, setModalAberto] = useState(false);

  useEffect(() => {
    const fetchPatients = async () => {
      setLoading(true);
      const patientsFromDB = await getPatients();
      setPacientes(patientsFromDB);
      setLoading(false);
    };
    fetchPatients();
  }, []);

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
        setPacientes(prev => prev.map(p => p.id === paciente.id ? { ...p, status: newStatus } : p));
      } else {
        alert(`Erro ao ${actionText} o paciente.`);
      }
    }
  };

  // --- LÓGICA DE FILTRO CORRIGIDA ---
  const pacientesFiltrados = pacientes.filter((paciente) => {
    const search = searchTerm.toLowerCase();
    const matchesSearch =
      paciente.fullName.toLowerCase().includes(search) ||
      (paciente.responsavel?.nome?.toLowerCase().includes(search)) || // Busca pelo nome do responsável
      (paciente.cpf && paciente.cpf.includes(searchTerm)); // Busca pelo CPF
    const matchesSexo = sexoFilter === "todos" || paciente.sexo === sexoFilter;
    const matchesStatus = statusFilter === "todos" || paciente.status === statusFilter;
    return matchesSearch && matchesSexo && matchesStatus;
  });

  // --- ESTATÍSTICAS CORRIGIDAS ---
  const estatisticas = {
    total: pacientes.length,
    ativos: pacientes.filter((p) => p.status === "ativo").length,
    inativos: pacientes.filter((p) => p.status === "inativo").length,
    mediaIdade: pacientes.length > 0 ? Math.round(pacientes.reduce((acc, p) => acc + calcularIdade(p.dataNascimento), 0) / pacientes.length) : 0,
  };
  
  if (loading) return <div className="text-center p-8">Carregando pacientes...</div>

  return (
    <>
      <div className="space-y-6">
        {/* Bloco de estatísticas e filtros (sem alterações na estrutura) */}
        <div className="grid gap-4 md:grid-cols-4">
            <Card><CardContent className="p-4"><div className="text-center"><p className="text-2xl font-bold">{estatisticas.total}</p><p className="text-xs font-medium text-muted-foreground">Total</p></div></CardContent></Card>
            <Card><CardContent className="p-4"><div className="text-center"><p className="text-2xl font-bold text-green-600">{estatisticas.ativos}</p><p className="text-xs font-medium text-green-600">Ativos</p></div></CardContent></Card>
            <Card><CardContent className="p-4"><div className="text-center"><p className="text-2xl font-bold text-red-600">{estatisticas.inativos}</p><p className="text-xs font-medium text-red-600">Inativos</p></div></CardContent></Card>
            <Card><CardContent className="p-4"><div className="text-center"><p className="text-2xl font-bold text-orange-600">{estatisticas.mediaIdade} anos</p><p className="text-xs font-medium text-orange-600">Idade Média</p></div></CardContent></Card>
        </div>
        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2"><Filter className="h-5 w-5" /> Filtros</CardTitle></CardHeader>
          <CardContent>
            <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
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
            </div>
          </CardContent>
        </Card>

        {/* --- TABELA ATUALIZADA --- */}
        <Card>
          <CardHeader><CardTitle>Lista de Pacientes ({pacientesFiltrados.length})</CardTitle></CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader><TableRow>
                    <TableHead>Nome</TableHead>
                    <TableHead className="hidden sm:table-cell">Idade</TableHead>
                    <TableHead className="hidden lg:table-cell">Responsável</TableHead>
                    <TableHead className="hidden md:table-cell">Convênio</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                </TableRow></TableHeader>
                <TableBody>
                  {pacientesFiltrados.length > 0 ? pacientesFiltrados.map((paciente) => (
                    <TableRow key={paciente.id}>
                      <TableCell className="font-medium">{paciente.fullName}</TableCell>
                      <TableCell className="hidden sm:table-cell">{calcularIdade(paciente.dataNascimento)} anos</TableCell>
                      <TableCell className="hidden lg:table-cell">{paciente.responsavel?.nome}</TableCell>
                      <TableCell className="hidden md:table-cell">{getConvenioBadge(paciente.convenio)}</TableCell>
                      <TableCell>{getStatusBadge(paciente.status)}</TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild><Button variant="ghost" className="h-8 w-8 p-0"><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => abrirDetalhes(paciente)}>Ver Detalhes</DropdownMenuItem>
                            <Link href={`/pacientes/editar/${paciente.id}`} passHref><DropdownMenuItem>Editar</DropdownMenuItem></Link>
                            <DropdownMenuItem className={paciente.status === 'ativo' ? "text-red-600 focus:bg-red-50 focus:text-red-700" : "text-green-600 focus:bg-green-50 focus:text-green-700"} onClick={() => handleToggleStatus(paciente)}>
                              {paciente.status === 'ativo' ? 'Desativar' : 'Ativar'}
                            </DropdownMenuItem>
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

      {/* --- MODAL DE DETALHES COMPLETO --- */}
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
                    </div></CardContent>
                </Card>
                <Card>
                    <CardHeader><CardTitle className="flex items-center gap-2"><Phone /> Contato do Responsável</CardTitle></CardHeader>
                    <CardContent><div className="grid gap-4 md:grid-cols-3">
                        <div className="md:col-span-2"><Label className="text-sm font-medium text-gray-500">Nome</Label><p>{pacienteSelecionado.responsavel?.nome}</p></div>
                        <div><Label className="text-sm font-medium text-gray-500">Celular</Label><p>{pacienteSelecionado.responsavel?.celular}</p></div>
                        <div><Label className="text-sm font-medium text-gray-500">Telefone</Label><p>{pacienteSelecionado.responsavel?.telefone || "Não informado"}</p></div>
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
              </div>
            )}
          </DialogContent>
      </Dialog>
    </>
  )
}