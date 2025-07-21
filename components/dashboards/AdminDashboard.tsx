"use client"

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/context/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar, CheckCircle, XCircle, Activity } from "lucide-react";
import { getAppointmentsByDate, Appointment } from "@/services/appointmentService";
import { CommunicationsWidget } from "@/components/dashboard/communications-widget";
import { Badge } from "@/components/ui/badge";

// Função de ajuda para os badges de status, para manter o visual consistente
const getStatusBadge = (status: string) => {
  const statusConfig: { [key: string]: { label: string; className: string } } = {
    agendado: { label: "Agendado", className: "bg-blue-100 text-blue-800" },
    finalizado: { label: "Finalizado", className: "bg-green-100 text-green-800" },
    nao_compareceu: { label: "Faltou", className: "bg-red-100 text-red-800" },
    cancelado: { label: "Cancelado", className: "bg-gray-100 text-gray-800" },
    em_atendimento: { label: "Em Atendimento", className: "bg-orange-100 text-orange-800 animate-pulse" },
  };
  const config = statusConfig[status] || { label: status, className: 'bg-gray-100' };
  return <Badge variant="outline" className={`font-semibold ${config.className}`}>{config.label}</Badge>;
};

export function AdminDashboard() {
  const { firestoreUser } = useAuth();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    setLoading(true);
    // CORREÇÃO: Convertemos a data de hoje para o formato de string "YYYY-MM-DD"
    const todayString = new Date().toISOString().split('T')[0];
    const appointmentsData = await getAppointmentsByDate(todayString);
    setAppointments(appointmentsData);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Os cards de estatísticas agora usam os dados reais dos agendamentos do dia
  const stats = [
    { title: "Agendados Hoje", value: appointments.filter(a => a.status === 'agendado').length, description: "Aguardando atendimento", icon: Calendar },
    { title: "Em Atendimento", value: appointments.filter(a => a.status === 'em_atendimento').length, description: "Ocorrendo agora", icon: Activity },
    { title: "Finalizados", value: appointments.filter(a => a.status === 'finalizado').length, description: "Concluídos hoje", icon: CheckCircle },
    { title: "Faltas/Cancelados", value: appointments.filter(a => a.status === 'nao_compareceu' || a.status === 'cancelado').length, description: "Não realizados hoje", icon: XCircle },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Dashboard</h2>
        <p className="text-muted-foreground">
            Bem-vindo(a) de volta, {firestoreUser?.displayName}! Aqui está um resumo da clínica hoje.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat, index) => (
          <Card key={index}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
              <stat.icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
              <p className="text-xs text-muted-foreground">{stat.description}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Próximos Agendamentos</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? <p>Carregando...</p> : (
              <div className="space-y-0">
                {appointments.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-8">Nenhum agendamento para hoje.</p>
                ) : (
                  // Lista de agendamentos com o visual da página de agendamentos
                  appointments.slice(0, 5).map((appointment) => (
                    <div key={appointment.id} className="flex items-center justify-between py-3 border-b last:border-b-0">
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium leading-none truncate">{appointment.patientName}</p>
                            <p className="text-sm text-muted-foreground truncate">{appointment.professionalName}</p>
                        </div>
                        <div className="text-sm text-muted-foreground w-16 text-center">{appointment.start.toDate().toLocaleTimeString('pt-BR', {hour: '2-digit', minute: '2-digit'})}</div>
                        <div className="w-20 text-center"><Badge variant="outline">{appointment.sala}</Badge></div>
                        <div className="w-28 text-right">{getStatusBadge(appointment.status)}</div>
                    </div>
                  ))
                )}
              </div>
            )}
          </CardContent>
        </Card>

        <CommunicationsWidget />
      </div>
    </div>
  )
}