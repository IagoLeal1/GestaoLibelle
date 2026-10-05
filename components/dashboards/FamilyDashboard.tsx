'use client';

import { useEffect, useState } from 'react';
import { useAuth } from "@/context/AuthContext";
import Link from "next/link";
import { 
  Baby,
  Calendar, 
  MapPin, 
  ChevronRight,
  User,
  MessagesSquare
} from "lucide-react";

// Componentes UI
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";

// Widgets
import { CommunicationsWidget } from "@/components/dashboard/communications-widget";

// Serviços e Config
import { collection, query, where, getDocs, orderBy, limit, Timestamp, doc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebaseConfig';
import { Patient } from "@/services/patientService"; // Importando a tipagem correta
import { getRooms } from "@/services/roomService";
import { partesDaData, ProximoAtendimento, proximosAtendimentos } from "@/lib/painelDaFamilia";

export function FamilyDashboard() {
  const { user, firestoreUser } = useAuth();
  const [appointments, setAppointments] = useState<ProximoAtendimento[]>([]);
  const [loading, setLoading] = useState(true);
  const [linkedPatientNames, setLinkedPatientNames] = useState<string[]>([]);

  useEffect(() => {
    async function fetchData() {
      if (!user) return;

      setLoading(true);
      try {
        const patientsRef = collection(db, 'patients');
        
        // --- 1. ESTRATÉGIA DE BUSCA HÍBRIDA E AUTO-VÍNCULO ---
        
        // A) Tenta buscar pelo ID já vinculado (Otimizado)
        // Nota: 'userId' é o campo que definimos na interface Patient para guardar o ID do familiar
        const qById = query(patientsRef, where('userId', '==', user.uid));
        
        // B) Tenta buscar pelo E-mail de Cadastro (Fallback para o primeiro acesso)
        // Usamos 'emailCadastro' conforme definido no seu patientService.ts como o email de login
        const qByEmail = query(patientsRef, where('emailCadastro', '==', user.email));

        const [snapId, snapEmail] = await Promise.all([getDocs(qById), getDocs(qByEmail)]);

        const uniquePatients = new Map<string, Patient>();

        // Adiciona pacientes encontrados pelo ID
        snapId.forEach(d => uniquePatients.set(d.id, { id: d.id, ...d.data() } as Patient));

        // Adiciona pacientes encontrados pelo Email e FAZ O VÍNCULO SE NECESSÁRIO.
        // Espera o vínculo terminar antes de buscar os atendimentos: as regras só mostram
        // atendimentos de criança já ligada à família.
        await Promise.all(snapEmail.docs.map(async (d) => {
            const patientData = d.data();
            // Se achou pelo email mas o userId ainda não está preenchido, preenche agora!
            if (patientData.userId !== user.uid) {
                try {
                    await updateDoc(doc(db, 'patients', d.id), { userId: user.uid });
                } catch (err) {
                    console.error("Erro no auto-vínculo:", err);
                    return; // Não ficou ligada: os atendimentos dela não estariam visíveis
                }
            }
            uniquePatients.set(d.id, { id: d.id, ...patientData, userId: user.uid } as Patient);
        }));

        const patientIds = Array.from(uniquePatients.keys());
        const patientNames = Array.from(uniquePatients.values()).map(p => p.fullName);

        setLinkedPatientNames(patientNames);

        // --- 2. BUSCA DE AGENDAMENTOS ---
        if (patientIds.length > 0) {
            const appointmentsRef = collection(db, 'appointments');
            const now = new Date();
            
            // Busca agendamentos pelos IDs dos pacientes encontrados
            const qAppointments = query(
                appointmentsRef, 
                where('patientId', 'in', patientIds),
                where('start', '>=', Timestamp.fromDate(now)),
                orderBy('start', 'asc'),
                limit(15)
            );

            // Só pelos ids das crianças da família: a busca por nome podia trazer outra criança com o mesmo nome
            const [appSnap, salas] = await Promise.all([getDocs(qAppointments), getRooms()]);
            const atendimentos = appSnap.docs.map(doc => {
                const data = doc.data();
                return {
                    id: doc.id,
                    start: data.start ? data.start.toDate() : new Date(),
                    patientName: data.patientName,
                    professionalName: data.professionalName,
                    tipo: data.tipo,
                    status: data.status,
                    sala: data.sala,
                };
            });

            setAppointments(proximosAtendimentos(atendimentos, { salas, criancas: uniquePatients.size }));
        }
      } catch (error) {
        console.error("Erro ao carregar dashboard familiar:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [user]);

  return (
    <div className="space-y-6 p-1">
      {/* 1. Cabeçalho */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-gray-800 dark:text-gray-100">
            Olá, {firestoreUser?.displayName?.split(' ')[0] || 'Responsável'}!
          </h2>
          <p className="text-muted-foreground">
            Acompanhe o desenvolvimento {linkedPatientNames.length > 0 ? `de ${linkedPatientNames.join(', ')}` : 'dos seus filhos'} aqui.
          </p>
        </div>
      </div>

      {/* 2. Grid Principal */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* COLUNA ESQUERDA (2/3): Agenda */}
        <div className="lg:col-span-2 space-y-6">
            <Card className="h-full border-t-4 border-t-blue-500 shadow-sm">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <div>
                        <CardTitle className="text-xl">Próximos Atendimentos</CardTitle>
                        <CardDescription>Agenda confirmada para os próximos dias</CardDescription>
                    </div>
                </CardHeader>
                <CardContent>
                    {loading ? (
                        <div className="space-y-4">
                           <Skeleton className="h-20 w-full rounded-xl" />
                           <Skeleton className="h-20 w-full rounded-xl" />
                        </div>
                    ) : appointments.length > 0 ? (
                        <div className="space-y-4">
                            {appointments.map((app) => {
                                const data = partesDaData(app.start);
                                return (
                                <div key={app.id} className="flex items-start gap-3 rounded-xl border bg-card p-3 transition-colors hover:bg-accent/50 sm:gap-4 sm:p-4">
                                    {/* Data: dia da semana, dia, mês e hora */}
                                    <div className="flex w-16 shrink-0 flex-col items-center rounded-lg bg-blue-50 px-2 py-2 text-blue-700 dark:bg-blue-900/20 dark:text-blue-300">
                                        <span className="text-[11px] font-semibold uppercase">{data.diaDaSemana}</span>
                                        <span className="text-2xl font-bold leading-tight">{data.dia}</span>
                                        <span className="text-[11px] font-semibold uppercase">{data.mes}</span>
                                        <span className="mt-1 text-xs">{data.hora}</span>
                                    </div>

                                    {/* Info: min-w-0 deixa os textos quebrarem em vez de alargar o cartão no celular */}
                                    <div className="min-w-0 flex-1 space-y-1">
                                        <div className="flex flex-wrap items-start justify-between gap-x-2 gap-y-1">
                                            <h4 className="text-base font-semibold">{app.terapia}</h4>
                                            <Badge variant="outline" className={`shrink-0 border-transparent ${app.status.classe}`}>
                                                {app.status.rotulo}
                                            </Badge>
                                        </div>
                                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                            <User className="h-3 w-3 shrink-0" />
                                            <span className="truncate">{app.profissional}</span>
                                        </div>
                                        {app.crianca && (
                                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                                <Baby className="h-3 w-3 shrink-0" />
                                                <span className="truncate">{app.crianca}</span>
                                            </div>
                                        )}
                                        {app.sala && (
                                            <div className="mt-1 flex w-fit items-center rounded-full bg-blue-50 px-2 py-1 text-xs text-blue-600">
                                                <MapPin className="mr-1 h-3 w-3" />
                                                {app.sala}
                                            </div>
                                        )}
                                    </div>
                                </div>
                                );
                            })}
                        </div>
                    ) : (
                        <div className="text-center py-12 text-muted-foreground bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-dashed">
                            <Calendar className="h-10 w-10 mx-auto mb-3 opacity-20" />
                            <p>
                                Nenhum agendamento encontrado
                                {linkedPatientNames.length > 0 ? ` para ${linkedPatientNames[0]}` : ""}.
                            </p>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>

        {/* COLUNA DIREITA (1/3): Widgets */}
        <div className="space-y-6">
            <CommunicationsWidget />

            <Card>
                <CardHeader>
                    <CardTitle className="text-lg">Acesso Rápido</CardTitle>
                </CardHeader>
                <CardContent>
                    <Link href="/mensagens" className="flex items-center p-4 rounded-lg border hover:bg-accent transition-all group shadow-sm">
                        <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 mr-4 group-hover:scale-110 transition-transform">
                            <MessagesSquare className="h-6 w-6" />
                        </div>
                        <div>
                            <p className="font-semibold text-base">Minhas Mensagens</p>
                            <p className="text-sm text-muted-foreground">Falar com a equipe</p>
                        </div>
                        <ChevronRight className="ml-auto h-5 w-5 text-muted-foreground group-hover:text-blue-600" />
                    </Link>
                </CardContent>
            </Card>
        </div>
      </div>
    </div>
  )
}