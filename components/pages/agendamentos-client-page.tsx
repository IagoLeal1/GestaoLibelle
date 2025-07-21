"use client"

import { useState, useEffect, useCallback } from "react"
import { useSearchParams } from 'next/navigation'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Search, Filter, MoreHorizontal, Sun, Sunset, Moon, AlertCircle } from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { getAppointmentsByDate, Appointment, AppointmentFormData, AppointmentStatus, updateAppointment, deleteAppointment } from "@/services/appointmentService"
import { getProfessionals, Professional } from "@/services/professionalService"
import { getPatients, Patient } from "@/services/patientService"
import { EditAppointmentModal } from "@/components/modals/edit-appointment-modal"

// --- Funções de Ajuda (Helpers) ---
const getStatusBadge = (status: string) => {
  const statusConfig: { [key: string]: { label: string; className: string } } = { agendado: { label: "Agendado", className: "bg-blue-100 text-blue-800" }, finalizado: { label: "Finalizado", className: "bg-green-100 text-green-800" }, nao_compareceu: { label: "Faltou", className: "bg-red-100 text-red-800" }, cancelado: { label: "Cancelado", className: "bg-gray-100 text-gray-800" }, em_atendimento: { label: "Em Atendimento", className: "bg-orange-100 text-orange-800 animate-pulse" } };
  const config = statusConfig[status] || { label: status, className: 'bg-gray-100' };
  return <Badge variant="outline" className={`font-semibold ${config.className}`}>{config.label}</Badge>;
};
const getStatusSecundarioBadge = (statusSecundario: string) => {
  if (!statusSecundario) return null;
  const statusConfig: { [key: string]: { label: string; className: string } } = { confirmado: { label: "Confirmado", className: "text-green-800" }, pendente_confirmacao: { label: "Pendente", className: "text-orange-800 animate-pulse" }, pago: { label: "Pago", className: "text-green-800" }, sem_justificativa: { label: "S/ Justificativa", className: "text-red-800" }, reagendado: { label: "Reagendado", className: "text-blue-800" }, em_sala: { label: "Em Sala", className: "text-orange-800" } };
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

export function AgendamentosClientPage() {
  const searchParams = useSearchParams();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [professionals, setProfessionals] = useState<Professional[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("todos");
  const [professionalFilter, setProfessionalFilter] = useState("todos");
  const [periodoAtivo, setPeriodoAtivo] = useState("todos");
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [appointmentsData, professionalsData, patientsData] = await Promise.all([ 
        getAppointmentsByDate(selectedDate), 
        getProfessionals(),
        getPatients()
      ]);
      setAppointments(appointmentsData);
      setProfessionals(professionalsData);
      setPatients(patientsData);
    } catch (err) {
      setError("Falha ao carregar dados.");
    } finally {
      setLoading(false);
    }
  }, [selectedDate]);

  useEffect(() => {
    fetchData();
  }, [fetchData, searchParams]);

  const handleOpenEditModal = (appointment: Appointment) => {
    setSelectedAppointment(appointment);
    setIsEditModalOpen(true);
  };
  const handleUpdateAppointment = async (formData: AppointmentFormData & { status: AppointmentStatus }) => {
    if (!selectedAppointment) return;
    const result = await updateAppointment(selectedAppointment.id, formData);
    if (result.success) {
      alert("Agendamento atualizado!");
      setIsEditModalOpen(false);
      fetchData();
    } else {
      alert(result.error);
    }
  };
  const handleDeleteAppointment = async () => {
    if (!selectedAppointment) return;
    const result = await deleteAppointment(selectedAppointment.id);
    if (result.success) {
      alert("Agendamento excluído!");
      setIsEditModalOpen(false);
      fetchData();
    } else {
      alert(result.error);
    }
  };

  const appointmentsFiltrados = appointments.filter((appointment) => {
    const matchesSearch = (appointment.patientName || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "todos" || appointment.status === statusFilter;
    const matchesProfessional = professionalFilter === "todos" || appointment.professionalId === professionalFilter;
    return !!(matchesSearch && matchesStatus && matchesProfessional);
  });
  const appointmentsPorPeriodo = {
    manha: appointmentsFiltrados.filter(a => getPeriodoFromDate(a.start.toDate()) === 'manha'),
    tarde: appointmentsFiltrados.filter(a => getPeriodoFromDate(a.start.toDate()) === 'tarde'),
    noite: appointmentsFiltrados.filter(a => getPeriodoFromDate(a.start.toDate()) === 'noite'),
  };
  
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

  const TabelaDeAgendamentos = ({ agendamentos }: { agendamentos: Appointment[] }) => (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader><TableRow><TableHead>Paciente</TableHead><TableHead>Profissional</TableHead><TableHead>Hora</TableHead><TableHead>Sala</TableHead><TableHead>Status</TableHead><TableHead className="text-right">Ações</TableHead></TableRow></TableHeader>
        <TableBody>
          {agendamentos.length > 0 ? agendamentos.map((appointment) => (
            <TableRow key={appointment.id} className="cursor-pointer hover:bg-gray-50" onClick={() => handleOpenEditModal(appointment)}>
              <TableCell className="font-medium">{appointment.patientName}</TableCell>
              <TableCell>{appointment.professionalName}</TableCell>
              <TableCell>{appointment.start.toDate().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</TableCell>
              <TableCell><Badge variant="outline">{appointment.sala}</Badge></TableCell>
              <TableCell>{getStatusBadge(appointment.status)}</TableCell>
              <TableCell className="text-right"><Button variant="ghost" size="icon"><MoreHorizontal className="h-4 w-4" /></Button></TableCell>
            </TableRow>
          )) : <TableRow><TableCell colSpan={6} className="text-center h-24">Nenhum agendamento encontrado.</TableCell></TableRow>}
        </TableBody>
      </Table>
    </div>
  );

  if (loading) return <p className="text-center p-8">Carregando agendamentos...</p>;
  if (error) return <div className="text-center p-8 bg-red-50 text-red-700 rounded-lg"><AlertCircle className="mx-auto h-8 w-8 mb-2" /><h3 className="font-bold">Ocorreu um Erro</h3><p>{error}</p></div>;

  return (
    <>
      <div className="space-y-6">
        <BlocoDeEstatisticas agendamentos={appointments} />
        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2"><Filter className="h-5 w-5" />Filtros</CardTitle></CardHeader>
          <CardContent>
              <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
                  <div className="space-y-2"><Label htmlFor="search">Buscar</Label><div className="relative"><Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" /><Input id="search" placeholder="Nome do paciente..." className="pl-8" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} /></div></div>
                  <div className="space-y-2"><Label htmlFor="date">Data</Label><Input id="date" type="date" value={selectedDate} onChange={e => setSelectedDate(e.target.value)} /></div>
                  <div className="space-y-2"><Label htmlFor="professional">Profissional</Label><Select value={professionalFilter} onValueChange={setProfessionalFilter}><SelectTrigger><SelectValue placeholder="Todos" /></SelectTrigger><SelectContent><SelectItem value="todos">Todos</SelectItem>{professionals.map(pro => <SelectItem key={pro.id} value={pro.id}>{pro.fullName}</SelectItem>)}</SelectContent></Select></div>
                  <div className="space-y-2"><Label htmlFor="status">Status</Label><Select value={statusFilter} onValueChange={setStatusFilter}><SelectTrigger><SelectValue placeholder="Todos" /></SelectTrigger><SelectContent><SelectItem value="todos">Todos</SelectItem><SelectItem value="agendado">Agendado</SelectItem><SelectItem value="em_atendimento">Em Atendimento</SelectItem><SelectItem value="finalizado">Finalizado</SelectItem><SelectItem value="nao_compareceu">Não compareceu</SelectItem><SelectItem value="cancelado">Cancelado</SelectItem></SelectContent></Select></div>
              </div>
          </CardContent>
        </Card>
        <Tabs value={periodoAtivo} onValueChange={setPeriodoAtivo} className="w-full">
          <TabsList className="grid w-full grid-cols-2 lg:grid-cols-4">
              <TabsTrigger value="todos">Todos ({appointmentsFiltrados.length})</TabsTrigger>
              <TabsTrigger value="manha" className="gap-1"><Sun className="h-4 w-4" />Manhã ({appointmentsPorPeriodo.manha.length})</TabsTrigger>
              <TabsTrigger value="tarde" className="gap-1"><Sunset className="h-4 w-4" />Tarde ({appointmentsPorPeriodo.tarde.length})</TabsTrigger>
              <TabsTrigger value="noite" className="gap-1"><Moon className="h-4 w-4" />Noite ({appointmentsPorPeriodo.noite.length})</TabsTrigger>
          </TabsList>
          <TabsContent value="todos" className="mt-4"><Card><CardHeader><CardTitle>Todos os Agendamentos do Dia</CardTitle></CardHeader><CardContent><TabelaDeAgendamentos agendamentos={appointmentsFiltrados} /></CardContent></Card></TabsContent>
          {["manha", "tarde", "noite"].map((periodo) => {
            const dataPeriodo = appointmentsPorPeriodo[periodo as keyof typeof appointmentsPorPeriodo];
            return (
              <TabsContent key={periodo} value={periodo} className="mt-4 space-y-4">
                <BlocoDeEstatisticas agendamentos={dataPeriodo} />
                <Card>
                  <CardHeader><CardTitle className="flex items-center gap-2">{getPeriodoIcon(periodo)} Agendamentos da {getPeriodoLabel(periodo)} ({dataPeriodo.length})</CardTitle></CardHeader>
                  <CardContent><TabelaDeAgendamentos agendamentos={dataPeriodo} /></CardContent>
                </Card>
              </TabsContent>
            )
          })}
        </Tabs>
      </div>

      <EditAppointmentModal 
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        onSave={handleUpdateAppointment}
        onDelete={handleDeleteAppointment}
        appointment={selectedAppointment}
        patients={patients}
        professionals={professionals}
      />
    </>
  )
}