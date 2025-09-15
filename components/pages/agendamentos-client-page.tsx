"use client"

import { useState, useEffect, useCallback, useMemo } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Search, Filter, MoreHorizontal, Sun, Sunset, Moon, Download, Plus, AlertCircle, ChevronDown, BrainCircuit, Clock, User, Mic, Home, DollarSign } from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuLabel, DropdownMenuSeparator } from "@/components/ui/dropdown-menu"
import { getAppointmentsByDate, getAppointmentsForReport, Appointment, updateAppointment, AppointmentStatus, AppointmentFormData } from "@/services/appointmentService"
import { getProfessionals, Professional } from "@/services/professionalService"
import { getPatients, Patient } from "@/services/patientService"
import { getRooms, Room } from "@/services/roomService"
import { ReportModal } from "@/components/modals/report-modal"
import { EditAppointmentModal } from "@/components/modals/edit-appointment-modal"
import { RenewalNotificationButton } from "@/components/features/RenewalNotificationButton";
import { MultiSelectFilter, MultiSelectOption } from "@/components/ui/multi-select-filter"
import Link from "next/link"
import { format } from "date-fns"
import { toast } from "sonner"
import { Skeleton } from "@/components/ui/skeleton"

// --- Funções de Ajuda (Helpers) ---
const getStatusBadge = (status: string) => {
  const statusConfig: { [key: string]: { label: string; className: string } } = { agendado: { label: "Agendado", className: "bg-blue-100 text-blue-800" }, finalizado: { label: "Finalizado", className: "bg-green-100 text-green-800" }, nao_compareceu: { label: "Faltou", className: "bg-red-100 text-red-800" }, cancelado: { label: "Cancelado", className: "bg-gray-100 text-gray-800" }, em_atendimento: { label: "Em Atendimento", className: "bg-orange-100 text-orange-800 animate-pulse" } };
  const config = statusConfig[status] || { label: status, className: 'bg-gray-100' };
  return <Badge variant="outline" className={`font-semibold ${config.className}`}>{config.label}</Badge>;
};
const getStatusSecundarioBadge = (statusSecundario?: string) => {
  if (!statusSecundario) return null;
  const statusConfig: { [key: string]: { label: string; className: string } } = { confirmado: { label: "Confirmado", className: "text-green-800" }, pendente_confirmacao: { label: "Pendente", className: "text-orange-800" }, pago: { label: "Pago", className: "text-green-800" }, sem_justificativa: { label: "S/ Justificativa", className: "text-red-800" }, reagendado: { label: "Reagendado", className: "text-blue-800" }, em_sala: { label: "Em Sala", className: "text-orange-800" }, fnj_paciente: { label: "FNJ Paciente", className: "text-red-800" }, f_terapeuta: { label: "F Terapeuta", className: "text-red-800" }, fj_paciente: { label: "FJ Paciente", className: "text-yellow-800" }, f_dupla: { label: "F Dupla", className: "text-red-800" }, suspenso_plano: { label: "Suspenso", className: "text-purple-800" } };
  const config = statusConfig[statusSecundario] || { label: statusSecundario, className: 'text-gray-800' };
  return <Badge variant="secondary" className={`text-xs ${config.className}`}>{config.label}</Badge>;
};
const getPeriodoIcon = (periodo: string) => { const Icon = { manha: Sun, tarde: Sunset, noite: Moon }[periodo]; return Icon ? <Icon className="h-5 w-5" /> : null; };
const getPeriodoLabel = (periodo: string) => ({ manha: "Manhã", tarde: "Tarde", noite: "Noite" }[periodo] || "Todos");
const getPeriodoFromDate = (date: Date): 'manha' | 'tarde' | 'noite' => {
  const hora = date.getHours();
  if (hora >= 6 && hora < 12) return 'manha';
  if (hora >= 12 && hora < 18) return 'tarde';
  return 'noite';
};
const getAppointmentStats = (appointments: Appointment[]) => ({
    total: appointments.length,
    agendados: appointments.filter((a) => a.status === "agendado").length,
    finalizados: appointments.filter((a) => a.status === "finalizado").length,
    cancelados: appointments.filter((a) => a.status === "cancelado").length,
    naoCompareceu: appointments.filter((a) => a.status === "nao_compareceu").length,
    emAtendimento: appointments.filter((a) => a.status === "em_atendimento").length,
});
const secondaryStatusOptions = [
    { value: "confirmado", label: "Confirmado" }, { value: "pendente_confirmacao", label: "Pendente" },
    { value: "pago", label: "Pago" }, { value: "sem_justificativa", label: "S/ Justificativa" },
    { value: "reagendado", label: "Reagendado" }, { value: "em_sala", label: "Em Sala" },
    { value: "fnj_paciente", label: "FNJ Paciente" }, { value: "f_terapeuta", label: "F Terapeuta" },
    { value: "fj_paciente", label: "FJ Paciente" }, { value: "f_dupla", label: "F Dupla" },
    { value: "suspenso_plano", label: "Suspenso pelo Plano" }, { value: "nenhum", label: "Nenhum" },
];
const primaryStatusOptions: { value: AppointmentStatus; label: string }[] = [
    { value: "agendado", label: "Agendado" }, { value: "em_atendimento", label: "Em Atendimento" },
    { value: "finalizado", label: "Finalizado" }, { value: "nao_compareceu", label: "Não Compareceu" },
    { value: "cancelado", label: "Cancelado" },
];

export function AgendamentosClientPage() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [professionals, setProfessionals] = useState<Professional[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [isPageLoading, setIsPageLoading] = useState(true);
  const [isTableLoading, setIsTableLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [searchTerm, setSearchTerm] = useState("");
  const [professionalFilter, setProfessionalFilter] = useState<string[]>([]);
  const [statusFilter, setStatusFilter] = useState<string[]>([]);
  const [periodoAtivo, setPeriodoAtivo] = useState("todos");
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  const getRoomNameById = (roomId?: string): string => {
    if (!roomId) return "N/A";
    const room = rooms.find(r => r.id === roomId);
    return room ? room.name : "Sala Excluída";
  };

  const fetchData = useCallback(async (isInitialLoad = false) => {
    if (isInitialLoad) setIsPageLoading(true);
    setIsTableLoading(true);
    setError(null);
    try {
      if (isInitialLoad) {
        const [professionalsData, patientsData, roomsData] = await Promise.all([ 
          getProfessionals('ativo'),
          getPatients('ativo'),
          getRooms()
        ]);
        setProfessionals(professionalsData);
        setPatients(patientsData);
        setRooms(roomsData);
      }
      const appointmentsData = await getAppointmentsByDate(selectedDate);
      setAppointments(appointmentsData);
    } catch (err) {
      setError("Falha ao carregar dados.");
    } finally {
      if (isInitialLoad) setIsPageLoading(false);
      setIsTableLoading(false);
    }
  }, [selectedDate]);

  useEffect(() => {
    fetchData(true);
  }, []);

  useEffect(() => {
    if (!isPageLoading) {
        setIsTableLoading(true);
        setError(null);
        getAppointmentsByDate(selectedDate)
            .then(setAppointments)
            .catch(() => setError("Falha ao carregar agendamentos."))
            .finally(() => setIsTableLoading(false));
    }
  }, [selectedDate, isPageLoading]);

  const handleOpenEditModal = (appointment: Appointment) => {
    setSelectedAppointment(appointment);
    setIsEditModalOpen(true);
  };
  
  const handleUpdateAppointment = async (formData: Partial<AppointmentFormData & { status: AppointmentStatus }>) => {
    if (!selectedAppointment) return;
    const result = await updateAppointment(selectedAppointment.id, formData);
    if (result.success) {
      toast.success("Agendamento atualizado com sucesso!");
      setIsEditModalOpen(false);
      fetchData();
    } else {
      toast.error(result.error || "Falha ao atualizar o agendamento.");
    }
  };
  
  const handleDeleteAppointment = (isBlock: boolean) => {
    toast.success("Operação de exclusão concluída.");
    setIsEditModalOpen(false);
    fetchData();
  };
  
  const handleStatusChange = async (appointmentId: string, newStatus: AppointmentStatus) => {
    const result = await updateAppointment(appointmentId, { status: newStatus });
    if (result.success) {
      toast.success("Status atualizado!");
      setAppointments(prev => prev.map(app => app.id === appointmentId ? { ...app, status: newStatus } : app));
    } else {
      toast.error("Falha ao atualizar o status.");
    }
  };

  const handleStatusSecundarioChange = async (appointmentId: string, newStatus: string) => {
    const statusToSave = newStatus === 'nenhum' ? '' : newStatus;
    const result = await updateAppointment(appointmentId, { statusSecundario: statusToSave });
    if (result.success) {
      toast.success("Status atualizado!");
      setAppointments(prev => prev.map(app => app.id === appointmentId ? { ...app, statusSecundario: statusToSave } : app));
    } else {
      toast.error("Falha ao atualizar o status.");
    }
  };
  
  const handleGenerateReport = async (professionalId: string | undefined, patientId: string | undefined, startDateStr: string, endDateStr: string) => {
    const startDate = new Date(startDateStr);
    const endDate = new Date(endDateStr);
    const appointmentsToExport = await getAppointmentsForReport({ professionalId, patientId, startDate, endDate });
    if (appointmentsToExport.length === 0) {
      alert("Nenhum agendamento encontrado para os filtros selecionados.");
      return;
    }
    const headers = ["Data", "Hora Inicio", "Hora Fim", "Paciente", "Profissional", "Status", "Tipo", "Sala", "Convenio"];
    const csvContent = [
      headers.join(';'),
      ...appointmentsToExport.map(apt => [
        format(apt.start.toDate(), 'dd/MM/yyyy'),
        format(apt.start.toDate(), 'HH:mm'),
        format(apt.end.toDate(), 'HH:mm'),
        `"${apt.patientName}"`,
        `"${apt.professionalName}"`,
        apt.status, apt.tipo, getRoomNameById(apt.sala), apt.convenio || 'N/A'
      ].join(';'))
    ].join('\n');
    const blob = new Blob(["\uFEFF" + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    
    let fileName = 'relatorio_agendamentos';
    if(professionalId) {
        const professional = professionals.find(p => p.id === professionalId);
        fileName = `relatorio_${professional?.fullName.replace(/\s+/g, '_')}`;
    }
    if(patientId) {
        const patient = patients.find(p => p.id === patientId);
        fileName += `_${patient?.fullName.replace(/\s+/g, '_')}`;
    }
    fileName += `_${startDateStr}_a_${endDateStr}.csv`;
    
    link.setAttribute("href", url);
    link.setAttribute("download", fileName);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const appointmentsFiltrados = useMemo(() => appointments.filter((appointment) => {
    const matchesSearch = appointment.patientName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter.length === 0 || statusFilter.includes(appointment.status);
    const matchesProfessional = professionalFilter.length === 0 || professionalFilter.includes(appointment.professionalId);
    return matchesSearch && matchesStatus && matchesProfessional;
  }), [appointments, searchTerm, professionalFilter, statusFilter]);

  const appointmentsPorPeriodo = {
    manha: appointmentsFiltrados.filter(a => getPeriodoFromDate(a.start.toDate()) === 'manha'),
    tarde: appointmentsFiltrados.filter(a => getPeriodoFromDate(a.start.toDate()) === 'tarde'),
    noite: appointmentsFiltrados.filter(a => getPeriodoFromDate(a.start.toDate()) === 'noite'),
  };
  
  const professionalOptions: MultiSelectOption[] = useMemo(() => professionals.map(p => ({ value: p.id, label: p.fullName })), [professionals]);
  const statusOptions: MultiSelectOption[] = primaryStatusOptions.map(s => ({ value: s.value, label: s.label }));

  const BlocoDeEstatisticas = ({ agendamentos }: { agendamentos: Appointment[] }) => {
    const stats = getAppointmentStats(agendamentos);
    return (
      <div className="grid gap-4 grid-cols-2 md:grid-cols-3 lg:grid-cols-6">
          <Card><CardContent className="p-4 text-center"><p className="text-2xl font-bold">{stats.total}</p><p className="text-xs text-muted-foreground">Total</p></CardContent></Card>
          <Card><CardContent className="p-4 text-center"><p className="text-2xl font-bold text-blue-600">{stats.agendados}</p><p className="text-xs text-blue-600">Agendados</p></CardContent></Card>
          <Card><CardContent className="p-4 text-center"><p className="text-2xl font-bold text-orange-500">{stats.emAtendimento}</p><p className="text-xs text-orange-500">Em Atend.</p></CardContent></Card>
          <Card><CardContent className="p-4 text-center"><p className="text-2xl font-bold text-green-600">{stats.finalizados}</p><p className="text-xs text-green-600">Finalizados</p></CardContent></Card>
          <Card><CardContent className="p-4 text-center"><p className="text-2xl font-bold text-purple-600">{stats.cancelados}</p><p className="text-xs text-purple-600">Cancelados</p></CardContent></Card>
          <Card><CardContent className="p-4 text-center"><p className="text-2xl font-bold text-red-600">{stats.naoCompareceu}</p><p className="text-xs text-red-600">Faltas</p></CardContent></Card>
      </div>
    )
  };

  const TabelaDeAgendamentos = ({ agendamentos, loading }: { agendamentos: Appointment[], loading: boolean }) => (
    <>
      {/* Visualização em Tabela para Telas Maiores */}
      <div className="overflow-x-auto hidden md:block">
        <Table>
          <TableHeader><TableRow>
            <TableHead>Período</TableHead><TableHead>Paciente</TableHead><TableHead>Profissional</TableHead>
            <TableHead>Terapia</TableHead>
            <TableHead>Horário</TableHead><TableHead>Sala</TableHead><TableHead>Status</TableHead>
            <TableHead>Status Sec.</TableHead><TableHead className="text-right">Ações</TableHead>
          </TableRow></TableHeader>
          <TableBody>
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell colSpan={9}><Skeleton className="h-5 w-full" /></TableCell>
                </TableRow>
              ))
            ) : agendamentos.length > 0 ? agendamentos.map((appointment) => (
              <TableRow 
                key={appointment.id} 
                onClick={() => handleOpenEditModal(appointment)}
                className="cursor-pointer hover:bg-muted/50"
              >
                <TableCell><div className="flex items-center gap-1 text-xs">{getPeriodoIcon(getPeriodoFromDate(appointment.start.toDate()))} <span>{getPeriodoLabel(getPeriodoFromDate(appointment.start.toDate()))}</span></div></TableCell>
                <TableCell className="font-medium">{appointment.patientName}</TableCell>
                <TableCell>{appointment.professionalName}</TableCell>
                <TableCell className="text-muted-foreground">{appointment.tipo}</TableCell>
                <TableCell>{format(appointment.start.toDate(), 'HH:mm')} - {format(appointment.end.toDate(), 'HH:mm')}</TableCell>
                <TableCell><Badge variant="outline">{getRoomNameById(appointment.sala)}</Badge></TableCell>
                <TableCell onClick={(e) => e.stopPropagation()}>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" className="h-auto p-0 hover:bg-gray-200">
                        {getStatusBadge(appointment.status)}
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent>
                      <DropdownMenuLabel>Alterar Status</DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      {primaryStatusOptions.map(option => (
                        <DropdownMenuItem key={option.value} onSelect={() => handleStatusChange(appointment.id, option.value)}>
                          {option.label}
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
                <TableCell onClick={(e) => e.stopPropagation()}>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" className="h-auto p-0 justify-start font-normal text-xs hover:bg-gray-200">
                        {getStatusSecundarioBadge(appointment.statusSecundario) || <Badge variant="outline">Nenhum</Badge>}
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent>
                      <DropdownMenuLabel>Alterar Status Secundário</DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      {secondaryStatusOptions.map(option => (
                        <DropdownMenuItem key={option.value} onSelect={() => handleStatusSecundarioChange(appointment.id, option.value)}>
                          {option.label}
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
                <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild><Button variant="ghost" size="icon"><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onSelect={(e) => { e.preventDefault(); handleOpenEditModal(appointment); }}>
                        Editar / Detalhes
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            )) : <TableRow><TableCell colSpan={9} className="text-center h-24">Nenhum agendamento encontrado.</TableCell></TableRow>}
          </TableBody>
        </Table>
      </div>

      {/* Visualização em Cards para Mobile */}
      <div className="grid grid-cols-1 gap-4 md:hidden">
        {loading ? (
           Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-40 w-full" />)
        ) : agendamentos.length > 0 ? (
          agendamentos.map(appointment => (
            <Card key={appointment.id} onClick={() => handleOpenEditModal(appointment)} className="cursor-pointer">
                <CardContent className="p-4 space-y-3">
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="font-bold">{appointment.patientName}</p>
                            <p className="text-sm text-muted-foreground">{appointment.professionalName}</p>
                        </div>
                        <div className="flex flex-col items-end gap-1">
                             {getStatusBadge(appointment.status)}
                             {getStatusSecundarioBadge(appointment.statusSecundario)}
                        </div>
                    </div>
                    <div className="text-sm text-muted-foreground space-y-2 pt-3 border-t">
                        <div className="flex items-center gap-2"><Mic className="h-4 w-4"/><span>{appointment.tipo}</span></div>
                        <div className="flex items-center gap-2"><Clock className="h-4 w-4"/><span>{format(appointment.start.toDate(), 'HH:mm')} - {format(appointment.end.toDate(), 'HH:mm')}</span></div>
                        <div className="flex items-center gap-2"><Home className="h-4 w-4"/><span>Sala: {getRoomNameById(appointment.sala)}</span></div>
                        <div className="flex items-center gap-2"><DollarSign className="h-4 w-4"/><span>{appointment.convenio || 'Particular'}</span></div>
                    </div>
                </CardContent>
            </Card>
          ))
        ) : (
          <p className="text-center text-muted-foreground py-8">Nenhum agendamento encontrado.</p>
        )}
      </div>
    </>
  );

  if (isPageLoading) return <p className="text-center p-8">Carregando dados da página...</p>;
  if (error) return <div className="text-center p-8 bg-red-50 text-red-700 rounded-lg"><AlertCircle className="mx-auto h-8 w-8 mb-2" /><h3 className="font-bold">Ocorreu um Erro</h3><p>{error}</p></div>;

  return (
    <>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h2 className="text-2xl font-bold tracking-tight">Agendamentos</h2>
            <p className="text-muted-foreground">Gerencie todos os agendamentos da clínica por período</p>
          </div>
          <div className="flex w-full sm:w-auto gap-2">
            <RenewalNotificationButton />
            <Button className="w-full bg-green-600 hover:bg-green-700" onClick={() => setIsReportModalOpen(true)}>
              <Download className="mr-2 h-4 w-4" /> Exportar Relatório
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                  <Button className="w-full">
                      <Plus className="mr-2 h-4 w-4" /> Novo Agendamento <ChevronDown className="ml-2 h-4 w-4" />
                  </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                  <Link href="/agendamentos/novo" passHref><DropdownMenuItem>Agendamento Único/Sequencial</DropdownMenuItem></Link>
                  <Link href="/agendamentos/grade" passHref><DropdownMenuItem>Agendamento em Grade</DropdownMenuItem></Link>
                  <DropdownMenuSeparator />
                  <Link href="/agendamentos/assistente" passHref>
                    <DropdownMenuItem>
                        <BrainCircuit className="mr-2 h-4 w-4" />
                        Assistente de Agendamento (IA)
                    </DropdownMenuItem>
                  </Link>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
        
        <BlocoDeEstatisticas agendamentos={appointments} />
        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2"><Filter className="h-5 w-5" />Filtros</CardTitle></CardHeader>
          <CardContent>
              <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 md:grid-cols-4 items-end">
                  <div className="space-y-2"><Label>Buscar por Nome do Paciente</Label><div className="relative"><Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" /><Input placeholder="Nome do paciente..." className="pl-8" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} /></div></div>
                  <div className="space-y-2"><Label>Data</Label><Input type="date" value={selectedDate} onChange={e => setSelectedDate(e.target.value)} /></div>
                  <div className="space-y-2"><Label>Profissional(is)</Label><MultiSelectFilter options={professionalOptions} selectedValues={professionalFilter} onSelectionChange={setProfessionalFilter} placeholder="Todos os Profissionais" /></div>
                  <div className="space-y-2"><Label>Status</Label><MultiSelectFilter options={statusOptions} selectedValues={statusFilter} onSelectionChange={setStatusFilter} placeholder="Todos os Status" /></div>
              </div>
          </CardContent>
        </Card>
        
        <Tabs value={periodoAtivo} onValueChange={setPeriodoAtivo} className="w-full">
          {/* AQUI ESTÁ A CORREÇÃO PRINCIPAL */}
          <TabsList className="grid w-full grid-cols-2 sm:grid-cols-4">
              <TabsTrigger value="todos">Todos ({appointmentsFiltrados.length})</TabsTrigger>
              <TabsTrigger value="manha" className="gap-1"><Sun className="h-4 w-4" />Manhã ({appointmentsPorPeriodo.manha.length})</TabsTrigger>
              <TabsTrigger value="tarde" className="gap-1"><Sunset className="h-4 w-4" />Tarde ({appointmentsPorPeriodo.tarde.length})</TabsTrigger>
              <TabsTrigger value="noite" className="gap-1"><Moon className="h-4 w-4" />Noite ({appointmentsPorPeriodo.noite.length})</TabsTrigger>
          </TabsList>
          <TabsContent value="todos" className="mt-4"><Card><CardHeader><CardTitle>Todos os Agendamentos do Dia</CardTitle></CardHeader><CardContent><TabelaDeAgendamentos agendamentos={appointmentsFiltrados} loading={isTableLoading} /></CardContent></Card></TabsContent>
          {["manha", "tarde", "noite"].map((periodo) => {
            const dataPeriodo = appointmentsPorPeriodo[periodo as keyof typeof appointmentsPorPeriodo];
            return (
              <TabsContent key={periodo} value={periodo} className="mt-4 space-y-4">
                <BlocoDeEstatisticas agendamentos={dataPeriodo} />
                <Card>
                  <CardHeader><CardTitle className="flex items-center gap-2">{getPeriodoIcon(periodo)} Agendamentos da {getPeriodoLabel(periodo)} ({dataPeriodo.length})</CardTitle></CardHeader>
                  <CardContent><TabelaDeAgendamentos agendamentos={dataPeriodo} loading={isTableLoading} /></CardContent>
                </Card>
              </TabsContent>
            )
          })}
        </Tabs>
      </div>

      <ReportModal isOpen={isReportModalOpen} onClose={() => setIsReportModalOpen(false)} onGenerate={handleGenerateReport} patients={patients} professionals={professionals} />
      <EditAppointmentModal isOpen={isEditModalOpen} onClose={() => setIsEditModalOpen(false)} onSave={handleUpdateAppointment} onDelete={handleDeleteAppointment} appointment={selectedAppointment} patients={patients} professionals={professionals} />
    </>
  )
}