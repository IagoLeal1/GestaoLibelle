'use client';

import { useEffect, useState } from 'react';
import { useAuth } from "@/context/AuthContext";
import Link from "next/link";
import { 
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

interface AppointmentDisplay {
  id: string;
  start: Date;
  patientName: string;
  professionalName: string;
  specialty: string;
  status: string;
  room?: string;
}

export function FamilyDashboard() {
  const { user, firestoreUser } = useAuth();
  const [appointments, setAppointments] = useState<AppointmentDisplay[]>([]);
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

        // Adiciona pacientes encontrados pelo Email e FAZ O VÍNCULO SE NECESSÁRIO
        if (!snapEmail.empty) {
            snapEmail.forEach(async (d) => {
                const patientData = d.data();
                // Se achou pelo email mas o userId ainda não está preenchido, preenche agora!
                if (patientData.userId !== user.uid) {
                    console.log(`Auto-vinculando paciente ${d.id} ao usuário ${user.uid}`);
                    try {
                        await updateDoc(doc(db, 'patients', d.id), { userId: user.uid });
                    } catch (err) {
                        console.error("Erro no auto-vínculo:", err);
                    }
                }
                uniquePatients.set(d.id, { id: d.id, ...patientData } as Patient);
            });
        }

        const patientIds = Array.from(uniquePatients.keys());
        const patientNames = Array.from(uniquePatients.values()).map(p => p.fullName);

        setLinkedPatientNames(patientNames);

        // --- 2. BUSCA DE AGENDAMENTOS ---
        if (patientIds.length > 0) {
            const appointmentsRef = collection(db, 'appointments');
            const now = new Date();
            
            // Busca agendamentos pelos IDs dos pacientes encontrados
            let qAppointments = query(
                appointmentsRef, 
                where('patientId', 'in', patientIds),
                where('start', '>=', Timestamp.fromDate(now)),
                orderBy('start', 'asc'),
                limit(5)
            );

            let appSnap = await getDocs(qAppointments);

            // Fallback: Busca por nome se a busca por ID falhar (segurança extra)
            if (appSnap.empty && patientNames.length > 0) {
                const qByName = query(
                    appointmentsRef,
                    where('patientName', 'in', patientNames),
                    where('start', '>=', Timestamp.fromDate(now)),
                    orderBy('start', 'asc'),
                    limit(5)
                );
                appSnap = await getDocs(qByName);
            }
            
            const appList: AppointmentDisplay[] = appSnap.docs.map(doc => {
                const data = doc.data();
                return {
                    id: doc.id,
                    start: data.start ? data.start.toDate() : new Date(), 
                    patientName: data.patientName || 'Paciente',
                    professionalName: data.professionalName || 'Profissional',
                    specialty: data.tipo || 'Terapia', 
                    status: data.status,
                    room: data.sala 
                };
            });

            setAppointments(appList);
        }
      } catch (error) {
        console.error("Erro ao carregar dashboard familiar:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [user]);

  // Formatações
  const formatDate = (date: Date) => {
    if (!date) return "--";
    return new Intl.DateTimeFormat('pt-BR', { weekday: 'short', day: '2-digit', month: 'long' }).format(date);
  };
  const formatTime = (date: Date) => {
    if (!date) return "--:--";
    return new Intl.DateTimeFormat('pt-BR', { hour: '2-digit', minute: '2-digit' }).format(date);
  };

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
                            {appointments.map((app) => (
                                <div key={app.id} className="flex items-start gap-4 p-4 rounded-xl border bg-card hover:bg-accent/50 transition-colors">
                                    {/* Data Box */}
                                    <div className="flex flex-col items-center justify-center bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 rounded-lg p-3 min-w-[80px]">
                                        <span className="text-xs font-semibold uppercase">{formatDate(app.start).split(',')[0]}</span>
                                        <span className="text-2xl font-bold">{app.start.getDate()}</span>
                                        <span className="text-xs">{formatTime(app.start)}</span>
                                    </div>
                                    
                                    {/* Info */}
                                    <div className="flex-1 space-y-1">
                                        <div className="flex justify-between items-start">
                                            <h4 className="font-semibold text-base">{app.specialty}</h4>
                                            <Badge variant={app.status === 'agendado' ? 'default' : 'secondary'} className="capitalize">
                                                {app.status}
                                            </Badge>
                                        </div>
                                        <div className="flex items-center text-sm text-muted-foreground gap-2">
                                            <User className="h-3 w-3" />
                                            <span>{app.professionalName}</span>
                                        </div>
                                        <div className="flex items-center text-sm text-muted-foreground gap-2">
                                            <User className="h-3 w-3" />
                                            <span>Paciente: {app.patientName}</span>
                                        </div>
                                        {app.room && (
                                            <div className="flex items-center text-xs text-blue-600 bg-blue-50 w-fit px-2 py-1 rounded-full mt-1">
                                                <MapPin className="h-3 w-3 mr-1" />
                                                {app.room}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))}
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