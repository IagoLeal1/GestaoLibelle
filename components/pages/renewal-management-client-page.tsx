"use client";

import { useState, useEffect } from "react";
import { 
    Card, 
    CardContent, 
    CardHeader, 
    CardTitle 
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
    Table, 
    TableBody, 
    TableCell, 
    TableHead, 
    TableHeader, 
    TableRow 
} from "@/components/ui/table";
import { 
    Select, 
    SelectContent, 
    SelectItem, 
    SelectTrigger, 
    SelectValue 
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { 
    getRenewableAppointmentsByPatient, 
    renewAppointmentBlock, 
    dismissRenewal,
    Appointment,
    RenewableBlock 
} from "@/services/appointmentService";
import { toast } from "sonner";
import { CheckCircle, XCircle, Clock, Calendar, User, ArrowRight } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { formatSpecialtyName } from "@/lib/formatters";

// Componente de Linha Individual
const RenewalRow = ({ 
    item, 
    onSuccess 
}: { 
    item: Appointment, 
    onSuccess: () => void 
}) => {
    const [sessions, setSessions] = useState("4");
    const [frequency, setFrequency] = useState<"weekly" | "bi-weekly">("weekly");
    const [loading, setLoading] = useState(false);

    const handleRenew = async () => {
        setLoading(true);
        try {
            const numSessions = parseInt(sessions);
            const result = await renewAppointmentBlock(item, numSessions, frequency);
            
            if (result.success) {
                toast.success("Renovado com Sucesso!", {
                    description: `Pacote de ${numSessions} sessões criado para ${item.patientName}.`
                });
                onSuccess();
            } else {
                toast.error("Erro", { description: result.error });
            }
        } catch (error) {
            toast.error("Erro inesperado ao renovar.");
        } finally {
            setLoading(false);
        }
    };

    const handleDismiss = async () => {
        if (!confirm("Isso removerá o aviso de renovação. Tem certeza?")) return;
        setLoading(true);
        const result = await dismissRenewal(item.id);
        if (result.success) {
            toast.success("Renovação dispensada.");
            onSuccess();
        }
        setLoading(false);
    };

    return (
        <TableRow className="hover:bg-muted/40 transition-colors">
            {/* Coluna Paciente e Data */}
            <TableCell className="py-6 pl-6">
                <div className="flex flex-col gap-2">
                    <span className="text-xl font-bold text-foreground tracking-tight">{item.patientName}</span>
                    <div className="flex items-center text-sm font-medium text-muted-foreground bg-muted w-fit px-3 py-1 rounded-md">
                        <Calendar className="h-4 w-4 mr-2" />
                        Última: {format(item.start.toDate(), "dd 'de' MMM", { locale: ptBR })}
                    </div>
                </div>
            </TableCell>
            
            {/* Coluna Detalhes (Profissional/Terapia) */}
            <TableCell>
                <div className="flex flex-col gap-3">
                    <div className="flex items-center gap-3">
                        <div className="p-1.5 bg-blue-100 rounded-full">
                            <User className="h-5 w-5 text-blue-600" />
                        </div>
                        <span className="text-base font-semibold">{item.professionalName}</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-sm font-medium px-3 py-1 border-green-200 text-green-700 bg-green-50">
                            {formatSpecialtyName(item.tipo)}
                        </Badge>
                    </div>
                </div>
            </TableCell>

            {/* Coluna Configuração (Frequência e Sessões) */}
            <TableCell>
                <div className="flex items-center gap-4">
                    <div className="space-y-1.5">
                        <span className="text-xs uppercase text-muted-foreground font-bold tracking-wider">Frequência</span>
                        <Select 
                            value={frequency} 
                            onValueChange={(v: "weekly" | "bi-weekly") => setFrequency(v)}
                            disabled={loading}
                        >
                            <SelectTrigger className="w-[150px] h-12 text-base bg-background shadow-sm">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="weekly" className="text-base py-2">Semanal</SelectItem>
                                <SelectItem value="bi-weekly" className="text-base py-2">Quinzenal</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-1.5">
                         <span className="text-xs uppercase text-muted-foreground font-bold tracking-wider">Sessões</span>
                         <div className="flex items-center gap-2">
                            <Input 
                                type="number" 
                                value={sessions} 
                                onChange={(e) => setSessions(e.target.value)} 
                                className="w-20 h-12 text-center text-lg font-medium shadow-sm"
                                min={1}
                                disabled={loading}
                            />
                        </div>
                    </div>
                </div>
            </TableCell>

            {/* Coluna Ações */}
            <TableCell className="text-right pr-6">
                <div className="flex justify-end items-center gap-4">
                    <Button 
                        size="icon" 
                        variant="ghost" 
                        className="h-12 w-12 text-muted-foreground hover:text-red-600 hover:bg-red-50 rounded-full"
                        onClick={handleDismiss}
                        disabled={loading}
                        title="Dispensar aviso"
                    >
                        <XCircle className="h-6 w-6" />
                    </Button>
                    <Button 
                        size="lg"
                        className="h-12 px-6 bg-green-600 hover:bg-green-700 text-white text-base font-semibold shadow-md transition-all rounded-lg"
                        onClick={handleRenew}
                        disabled={loading}
                    >
                        {loading ? (
                            <span className="animate-pulse">Processando...</span>
                        ) : (
                            <>
                                Renovar <ArrowRight className="ml-2 h-5 w-5" />
                            </>
                        )}
                    </Button>
                </div>
            </TableCell>
        </TableRow>
    );
};

export function RenewalManagementClientPage() {
    const [renewableBlocks, setRenewableBlocks] = useState<RenewableBlock[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchData = async () => {
        setLoading(true);
        try {
            const data = await getRenewableAppointmentsByPatient();
            setRenewableBlocks(data);
        } catch (error) {
            console.error(error);
            toast.error("Erro ao carregar renovações.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const totalRenewals = renewableBlocks.reduce((acc, block) => acc + block.appointments.length, 0);

    if (loading) {
        return <div className="p-12 text-center text-lg text-muted-foreground">Carregando pendências...</div>;
    }

    return (
        <div className="w-full max-w-[95%] mx-auto space-y-8 py-4">
            {/* Card Principal */}
            <Card className="border shadow-md overflow-hidden bg-card">
                <CardHeader className="border-b bg-muted/30 px-8 py-6">
                    <div className="flex items-center justify-between">
                        <CardTitle className="text-2xl font-bold flex items-center gap-3 text-foreground">
                            <Clock className="h-7 w-7 text-orange-500" />
                            Renovações Pendentes
                            {totalRenewals > 0 && (
                                <Badge variant="secondary" className="ml-2 text-base px-3 py-1 bg-orange-100 text-orange-700 border-orange-200">
                                    {totalRenewals} bloco(s) a vencer
                                </Badge>
                            )}
                        </CardTitle>
                    </div>
                </CardHeader>
                
                <CardContent className="p-0">
                    {totalRenewals === 0 ? (
                        <div className="flex flex-col items-center justify-center py-24 text-center">
                            <div className="bg-green-100 p-6 rounded-full mb-6">
                                <CheckCircle className="h-12 w-12 text-green-600" />
                            </div>
                            <h3 className="text-2xl font-bold text-foreground">Tudo certo por aqui!</h3>
                            <p className="text-lg text-muted-foreground max-w-md mt-3">
                                Não há agendamentos precisando de renovação nos próximos 7 dias.
                            </p>
                        </div>
                    ) : (
                        <Table>
                            <TableHeader className="bg-muted/10">
                                <TableRow>
                                    <TableHead className="pl-6 py-4 w-[350px] text-base font-semibold text-foreground">Paciente / Referência</TableHead>
                                    <TableHead className="py-4 text-base font-semibold text-foreground">Detalhes do Atendimento</TableHead>
                                    <TableHead className="py-4 text-base font-semibold text-foreground">Configuração da Renovação</TableHead>
                                    <TableHead className="text-right pr-8 py-4 text-base font-semibold text-foreground">Ações</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {renewableBlocks.map((block) => (
                                    block.appointments.map((app) => (
                                        <RenewalRow 
                                            key={app.id} 
                                            item={app} 
                                            onSuccess={fetchData} 
                                        />
                                    ))
                                ))}
                            </TableBody>
                        </Table>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}