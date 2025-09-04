"use client"

import { useState, useEffect } from "react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { Professional, getProfessionals, updateProfessionalStatus } from "@/services/professionalService";
import { Timestamp } from "firebase/firestore";

// Imports de UI e Ícones
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Filter, MoreHorizontal, Mail, DollarSign, User, Phone, Search } from "lucide-react";

// --- Funções de Ajuda (Helpers) ---
const getStatusBadge = (status: string) => {
  const statusConfig: { [key: string]: { label: string; className: string } } = {
    ativo: { label: "Ativo", className: "bg-green-100 text-green-800" },
    inativo: { label: "Inativo", className: "bg-red-100 text-red-800" },
    licenca: { label: "Licença", className: "bg-yellow-100 text-yellow-800" },
  };
  const config = statusConfig[status] || { label: 'Desconhecido', className: 'bg-gray-100 text-gray-800' };
  return <Badge variant="outline" className={config.className}>{config.label}</Badge>;
};

const getEspecialidadeBadge = (especialidade: string) => {
  const especialidadeConfig: { [key: string]: string } = {
    Psicologia: "bg-blue-100 text-blue-800", Fonoaudiologia: "bg-green-100 text-green-800",
    "Terapia Ocupacional": "bg-purple-100 text-purple-800", Fisioterapia: "bg-orange-100 text-orange-800",
    Neurologia: "bg-red-100 text-red-800", Pediatria: "bg-pink-100 text-pink-800",
    Dermatologia: "bg-yellow-100 text-yellow-800",
  };
  const className = especialidadeConfig[especialidade] || "bg-gray-100 text-gray-800";
  return <Badge variant="outline" className={className}>{especialidade}</Badge>;
};

const formatDiasAtendimento = (dias: string[] = []) => {
  const diasMap: { [key: string]: string } = {
    segunda: "Seg", terca: "Ter", quarta: "Qua", quinta: "Qui", sexta: "Sex", sabado: "Sáb", domingo: "Dom",
  };
  return dias.map(dia => diasMap[dia] || dia).join(", ");
};

const formatDate = (date: Timestamp | undefined) => {
    if (!date?.toDate) return "N/A";
    return date.toDate().toLocaleDateString("pt-BR");
};

// --- Componente Principal ---
export function ProfessionalsClientPage() {
const { user, firestoreUser: userProfile } = useAuth();
  const [professionals, setProfessionals] = useState<Professional[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [especialidadeFilter, setEspecialidadeFilter] = useState("todos");
  const [statusFilter, setStatusFilter] = useState("todos");
  const [profissionalSelecionado, setProfissionalSelecionado] = useState<Professional | null>(null);
  const [modalAberto, setModalAberto] = useState(false);

  useEffect(() => {
    const fetchProfessionals = async () => {
      setLoading(true);
      const data = await getProfessionals();
      setProfessionals(data);
      setLoading(false);
    };
    fetchProfessionals();
  }, []);

  const abrirDetalhes = (profissional: Professional) => {
    setProfissionalSelecionado(profissional);
    setModalAberto(true);
  };

  const profissionaisFiltrados = professionals.filter((p) => {
    const matchesSearch = p.fullName.toLowerCase().includes(searchTerm.toLowerCase()) || p.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesEspecialidade = especialidadeFilter === "todos" || p.especialidade === especialidadeFilter;
    const matchesStatus = statusFilter === "todos" || p.status === statusFilter;
    return matchesSearch && matchesEspecialidade && matchesStatus;
  });

  const estatisticas = {
    total: professionals.length,
    ativos: professionals.filter((p) => p.status === "ativo").length,
    inativos: professionals.filter((p) => p.status === "inativo").length,
    mediaRepasse: professionals.length > 0 ? Math.round(professionals.reduce((acc, p) => acc + (p.financeiro?.percentualRepasse || 0), 0) / professionals.length) : 0,
  };

  const especialidadesUnicas = [...new Set(professionals.map(p => p.especialidade))];

    const handleToggleStatus = async (professional: Professional) => {
    const newStatus = professional.status === 'ativo' ? 'inativo' : 'ativo';
    const actionText = newStatus === 'ativo' ? 'ativar' : 'desativar';

    if (window.confirm(`Tem certeza que deseja ${actionText} o profissional ${professional.fullName}?`)) {
      const result = await updateProfessionalStatus(professional.id, newStatus);
      
      if (result.success) {
        setProfessionals(prev => 
          prev.map(p => 
            p.id === professional.id ? { ...p, status: newStatus } : p
          )
        );
        alert(`Profissional ${actionText} com sucesso!`);
      } else {
        alert(`Erro ao ${actionText} o profissional.`);
      }
    }
  };


  if (loading) return <div className="text-center p-8">Carregando profissionais...</div>;

  // --- Função de Ajuda para o Modal ---
  const formatTipoPagamento = (tipo?: string) => {
    if (tipo === 'fixo') return 'Fixo';
    if (tipo === 'repasse') return 'Repasse';
    if (tipo === 'ambos') return 'Ambos (Fixo + Repasse)';
    return 'Não definido';
  };

  return (
    <div className="space-y-6">
      {/* Estatísticas */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card><CardContent className="p-4"><div className="text-center"><p className="text-2xl font-bold">{estatisticas.total}</p><p className="text-xs text-muted-foreground font-medium">Total</p></div></CardContent></Card>
        <Card><CardContent className="p-4"><div className="text-center"><p className="text-2xl font-bold text-green-600">{estatisticas.ativos}</p><p className="text-xs font-medium text-green-600">Ativos</p></div></CardContent></Card>
        <Card><CardContent className="p-4"><div className="text-center"><p className="text-2xl font-bold text-red-600">{estatisticas.inativos}</p><p className="text-xs font-medium text-red-600">Inativos</p></div></CardContent></Card>
        <Card><CardContent className="p-4"><div className="text-center"><p className="text-2xl font-bold text-orange-600">{estatisticas.mediaRepasse}%</p><p className="text-xs font-medium text-orange-600">Repasse Médio</p></div></CardContent></Card>
      </div>

      {/* Filtros */}
      <Card>
        <CardHeader><CardTitle className="flex items-center gap-2"><Filter className="h-5 w-5" /> Filtros</CardTitle></CardHeader>
        <CardContent>
          <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
            <div className="space-y-2"><Label htmlFor="search">Buscar profissional</Label><div className="relative"><Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" /><Input id="search" placeholder="Nome ou email..." className="pl-8" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} /></div></div>
            <div className="space-y-2"><Label htmlFor="especialidade">Especialidade</Label><Select value={especialidadeFilter} onValueChange={setEspecialidadeFilter}><SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger><SelectContent><SelectItem value="todos">Todas</SelectItem>{especialidadesUnicas.map(e => <SelectItem key={e} value={e}>{e}</SelectItem>)}</SelectContent></Select></div>
            <div className="space-y-2"><Label htmlFor="status">Status</Label><Select value={statusFilter} onValueChange={setStatusFilter}><SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger><SelectContent><SelectItem value="todos">Todos</SelectItem><SelectItem value="ativo">Ativo</SelectItem><SelectItem value="inativo">Inativo</SelectItem><SelectItem value="licenca">Licença</SelectItem></SelectContent></Select></div>
          </div>
        </CardContent>
      </Card>

      {/* Lista de Profissionais */}
      <Card>
        <CardHeader><CardTitle>Lista de Profissionais ({profissionaisFiltrados.length})</CardTitle></CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader><TableRow><TableHead>Nome</TableHead><TableHead className="hidden sm:table-cell">Especialidade</TableHead><TableHead className="hidden lg:table-cell">Contato</TableHead><TableHead className="hidden xl:table-cell">Dias</TableHead><TableHead>Status</TableHead><TableHead className="text-right">Ações</TableHead></TableRow></TableHeader>
              <TableBody>
                {profissionaisFiltrados.map((profissional) => {
                  const canEdit = userProfile?.role === 'admin' || (userProfile?.role === 'profissional' && user?.uid === profissional.userId);
                  return (
                    <TableRow key={profissional.id}>
                      <TableCell><p className="font-medium text-sm">{profissional.fullName}</p></TableCell>
                      <TableCell className="hidden sm:table-cell">{getEspecialidadeBadge(profissional.especialidade)}</TableCell>
                      <TableCell className="hidden lg:table-cell"><div className="flex items-center gap-1 text-xs"><Mail className="h-3 w-3" />{profissional.email}</div></TableCell>
                      <TableCell className="hidden xl:table-cell text-xs">{formatDiasAtendimento(profissional.diasAtendimento)}</TableCell>
                      <TableCell>{getStatusBadge(profissional.status)}</TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild><Button variant="ghost" className="h-8 w-8 p-0"><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => abrirDetalhes(profissional)}>
                                Ver Detalhes
                            </DropdownMenuItem>

                            <Link href={`/profissionais/editar/${profissional.id}`} passHref>
                                <DropdownMenuItem>Editar</DropdownMenuItem>
                            </Link>

                            <DropdownMenuItem
                                className={profissional.status === 'ativo' ? "text-red-600 focus:text-red-600" : "text-green-600 focus:text-green-600"}
                                onClick={() => handleToggleStatus(profissional)}
                            >
                                {profissional.status === 'ativo' ? 'Desativar' : 'Ativar'}
                            </DropdownMenuItem>

                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* --- MODAL DE DETALHES DO PROFISSIONAL COM SEÇÃO FINANCEIRA CORRIGIDA --- */}
      <Dialog open={modalAberto} onOpenChange={setModalAberto}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle className="flex items-center gap-2"><User className="h-5 w-5" /> Detalhes do Profissional</DialogTitle></DialogHeader>
          {profissionalSelecionado && (
            <div className="space-y-6 py-4">
              <Card>
                <CardHeader><CardTitle>Informações Pessoais</CardTitle></CardHeader>
                <CardContent><div className="grid gap-4 md:grid-cols-2">
                  <div><Label className="text-sm text-gray-500">Nome</Label><p>{profissionalSelecionado.fullName}</p></div>
                  <div><Label className="text-sm text-gray-500">Especialidade</Label><div>{getEspecialidadeBadge(profissionalSelecionado.especialidade)}</div></div>
                  <div><Label className="text-sm text-gray-500">Registro</Label><p>{`${profissionalSelecionado.conselho} ${profissionalSelecionado.numeroConselho}`}</p></div>
                  <div><Label className="text-sm text-gray-500">Status</Label><div>{getStatusBadge(profissionalSelecionado.status)}</div></div>
                  <div><Label className="text-sm text-gray-500">Data de Contratação</Label><p>{formatDate(profissionalSelecionado.dataContratacao)}</p></div>
                </div></CardContent>
              </Card>
              <Card>
                <CardHeader><CardTitle className="flex items-center gap-2"><Phone className="h-5 w-5" /> Contato</CardTitle></CardHeader>
                <CardContent><div className="grid gap-4 md:grid-cols-3">
                  <div><Label className="text-sm text-gray-500">Telefone</Label><p>{profissionalSelecionado.telefone}</p></div>
                  <div><Label className="text-sm text-gray-500">Celular</Label><p>{profissionalSelecionado.celular}</p></div>
                  <div><Label className="text-sm text-gray-500">Email</Label><p>{profissionalSelecionado.email}</p></div>
                </div></CardContent>
              </Card>
              <Card>
                <CardHeader><CardTitle className="flex items-center gap-2"><DollarSign className="h-5 w-5" /> Configurações Financeiras</CardTitle></CardHeader>
                <CardContent><div className="grid gap-4 md:grid-cols-2">
                    <div>
                        <Label className="text-sm text-gray-500">Tipo de Pagamento</Label>
                        <p>{formatTipoPagamento(profissionalSelecionado.financeiro?.tipoPagamento)}</p>
                    </div>
                    {(profissionalSelecionado.financeiro?.tipoPagamento === 'repasse' || profissionalSelecionado.financeiro?.tipoPagamento === 'ambos') && (
                        <div>
                            <Label className="text-sm text-gray-500">Percentual de Repasse</Label>
                            <p>{profissionalSelecionado.financeiro?.percentualRepasse ?? 'N/A'}%</p>
                        </div>
                    )}
                    {profissionalSelecionado.financeiro?.tipoPagamento === 'ambos' && (
                        <>
                            <div>
                                <Label className="text-sm text-gray-500">Início do Horário Fixo</Label>
                                <p>{profissionalSelecionado.financeiro?.horarioFixoInicio || 'N/A'}</p>
                            </div>
                            <div>
                                <Label className="text-sm text-gray-500">Fim do Horário Fixo</Label>
                                <p>{profissionalSelecionado.financeiro?.horarioFixoFim || 'N/A'}</p>
                            </div>
                        </>
                    )}
                </div></CardContent>
              </Card>
              <Card>
                <CardHeader><CardTitle>Horários de Atendimento</CardTitle></CardHeader>
                <CardContent><div className="space-y-4">
                  <div><Label className="text-sm text-gray-500">Dias da Semana</Label><div className="flex flex-wrap gap-2 mt-2">{["segunda", "terca", "quarta", "quinta", "sexta", "sabado", "domingo"].map(dia => <Badge key={dia} variant={profissionalSelecionado.diasAtendimento?.includes(dia) ? "default" : "outline"}>{dia.charAt(0).toUpperCase() + dia.slice(1)}</Badge>)}</div></div>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div><Label className="text-sm text-gray-500">Início</Label><p>{profissionalSelecionado.horarioInicio}</p></div>
                    <div><Label className="text-sm text-gray-500">Fim</Label><p>{profissionalSelecionado.horarioFim}</p></div>
                  </div>
                </div></CardContent>
              </Card>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}