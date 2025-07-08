'use client';

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar, CheckCircle, XCircle, DollarSign, AlertCircle } from "lucide-react"; // Adicionado AlertCircle para erros
import { getUpcomingAppointments, UpcomingAppointment } from "@/services/dashboardService";

export function AdminDashboard() {
  const [upcomingAppointments, setUpcomingAppointments] = useState<UpcomingAppointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchDashboardData = async () => {
      setLoading(true);
      setError(null);
      try {
        // No futuro, você pode buscar os dados dos stats aqui também
        const appointmentsData = await getUpcomingAppointments();
        setUpcomingAppointments(appointmentsData);
      } catch (err) {
        console.error("Erro ao carregar dados do dashboard:", err);
        setError("Não foi possível carregar os dados do dashboard.");
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  // Dados dos cards de estatísticas
  const stats = [
    { title: "Agendamentos Hoje", value: "12", description: "3 nas próximas 2 horas", Icon: Calendar, color: "text-blue-500", bgColor: "bg-blue-100" },
    { title: "Atendimentos Finalizados", value: "8", description: "67% da agenda do dia", Icon: CheckCircle, color: "text-green-500", bgColor: "bg-green-100" },
    { title: "Faltas", value: "2", description: "16% dos agendamentos", Icon: XCircle, color: "text-red-500", bgColor: "bg-red-100" },
    { title: "Repasses Pendentes", value: "R$ 2.450", description: "5 profissionais", Icon: DollarSign, color: "text-orange-500", bgColor: "bg-orange-100" },
  ];

  // Se estiver carregando, mostre uma mensagem
  if (loading) {
    return <div>Carregando dashboard...</div>;
  }
  
  // Se der erro, mostre uma mensagem de erro clara
  if (error) {
    return (
      <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-md">
        <h3 className="font-bold">Erro!</h3>
        <p>{error}</p>
      </div>
    );
  }

  // Se tudo deu certo, renderize o dashboard
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-gray-800">Dashboard do Administrador</h2>
        <p className="text-muted-foreground">Visão geral completa da clínica.</p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.title}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">{stat.title}</CardTitle>
              {/* MUDANÇA IMPORTANTE: Verificamos se o Ícone existe antes de renderizar */}
              {stat.Icon && (
                <div className={`p-2 rounded-lg ${stat.bgColor}`}>
                  <stat.Icon className={`h-4 w-4 ${stat.color}`} />
                </div>
              )}
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900">{stat.value}</div>
              <p className="text-xs text-muted-foreground mt-1">{stat.description}</p>
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
            <div className="space-y-4">
              {upcomingAppointments.length > 0 ? (
                upcomingAppointments.map((appointment) => (
                  <div key={appointment.id} className="flex items-center space-x-4 p-3 rounded-lg bg-gray-50">
                    <div className="text-sm font-medium text-blue-600 min-w-[50px]">{appointment.time}</div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900">{appointment.patient}</p>
                      <p className="text-xs text-gray-500">
                        {appointment.professional} • {appointment.type}
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-sm text-gray-500">Nenhum agendamento para hoje.</p>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Resumo Financeiro</CardTitle>
          </CardHeader>
          <CardContent>
             {/* Conteúdo do resumo financeiro virá aqui */}
             <p className="text-sm text-gray-500">Em breve...</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}