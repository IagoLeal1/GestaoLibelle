"use client"

import { useState, useEffect, useCallback, useMemo } from "react";
import { useAuth } from "@/context/AuthContext";
import { useEvolucoes } from "@/context/EvolucoesContext";
import { Calendar, NotebookPen, UserCheck, UserPlus, Users } from "lucide-react";
import { getAppointmentsByDate, Appointment } from "@/services/appointmentService";
import { getRooms, Room } from "@/services/roomService";
import { AdminDashboardStats, getAdminDashboardStats } from "@/services/dashboardService";
import { CommunicationsWidget } from "@/components/dashboard/communications-widget";
import { AgoraEASeguir, AvisoDeAtencao, Numero, useAgora } from "@/components/dashboards/comum";
import { agendaDeHoje, numerosDoDia } from "@/lib/telaInicial";
import { format } from "date-fns";

// A recepção vê quem chega a seguir; o resto do dia fica na agenda
const PROXIMOS = 6;

/** Só para o admin, e só quando há alguém esperando: leva direto à tela de aprovação. */
function PedidosDeAcesso({ quantos }: { quantos: number }) {
  return (
    <AvisoDeAtencao href="/admin/usuarios" icone={UserPlus}>
      {quantos === 1 ? "1 pedido de acesso esperando sua aprovação" : `${quantos} pedidos de acesso esperando sua aprovação`}
    </AvisoDeAtencao>
  );
}

/** Para o admin e a coordenação: as evoluções da equipe que ficaram de dias anteriores. */
function EvolucoesAtrasadas({ quantas }: { quantas: number }) {
  return (
    <AvisoDeAtencao href="/evolucoes" icone={NotebookPen}>
      {quantas === 1 ? "1 evolução atrasada na equipe" : `${quantas} evoluções atrasadas na equipe`}
    </AvisoDeAtencao>
  );
}

export function AdminDashboard() {
  const { firestoreUser } = useAuth();
  // Só o admin aprova pedidos de acesso: para a coordenação e a recepção, nem buscamos
  const ehAdmin = firestoreUser?.profile.role === 'admin';
  const agora = useAgora();
  // As de hoje ainda podem ser escritas no fim do dia: o aviso conta só as dos dias anteriores
  // Sem um número recente no aparelho, pede a agenda da clínica (lida no máximo a cada 15 minutos)
  const { escopo, atrasadas, pedirAgenda } = useEvolucoes();
  useEffect(() => {
    if (escopo === "equipe" && atrasadas === null) pedirAgenda();
  }, [escopo, atrasadas, pedirAgenda]);
  const evolucoesAtrasadas = atrasadas ?? 0;
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [stats, setStats] = useState<AdminDashboardStats>({ activePatients: 0, activeProfessionals: 0, pendingUsers: 0 });
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    setLoading(true);
    // O dia no relógio do aparelho: em UTC, depois das 21h de Brasília já seria amanhã
    const todayString = format(new Date(), 'yyyy-MM-dd');
    const [appointmentsData, roomsData, statsData] = await Promise.all([
        getAppointmentsByDate(todayString),
        getRooms(),
        getAdminDashboardStats({ comAprovacoes: ehAdmin })
    ]);
    setAppointments(appointmentsData);
    setRooms(roomsData);
    setStats(statsData);
    setLoading(false);
  }, [ehAdmin]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const doDia = useMemo(
    () => appointments.map(a => ({ ...a, start: a.start.toDate(), end: a.end?.toDate() })),
    [appointments]
  );
  const agenda = agendaDeHoje(doDia, { agora, salas: rooms, limite: PROXIMOS });
  const numeros = numerosDoDia(doDia);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Dashboard</h2>
        <p className="text-muted-foreground">
          Bem-vindo(a) de volta, {firestoreUser?.displayName}! Aqui está um resumo da clínica hoje.
        </p>
      </div>

      {ehAdmin && stats.pendingUsers > 0 && <PedidosDeAcesso quantos={stats.pendingUsers} />}
      {evolucoesAtrasadas > 0 && <EvolucoesAtrasadas quantas={evolucoesAtrasadas} />}

      <div className="grid grid-cols-3 gap-2 sm:gap-4">
        <Numero titulo="Pacientes ativos" valor={stats.activePatients} icone={Users} carregando={loading} />
        <Numero titulo="Profissionais ativos" valor={stats.activeProfessionals} icone={UserCheck} carregando={loading} />
        <Numero titulo="Atendimentos hoje" valor={numeros.hoje} icone={Calendar} carregando={loading} />
      </div>

      {/* grid-cols-1 prende a coluna na largura da tela no celular */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <AgoraEASeguir
          agenda={agenda}
          hoje={numeros.hoje}
          carregando={loading}
          mostrar="profissional"
          agendaCompleta={{ href: "/agendamentos", rotulo: "Ver a agenda do dia" }}
          vazio="Nenhum atendimento hoje."
        />

        <CommunicationsWidget />
      </div>
    </div>
  )
}
