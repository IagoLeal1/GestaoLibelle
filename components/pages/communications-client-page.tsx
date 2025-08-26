// components/pages/communications-client-page.tsx
"use client"

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/context/AuthContext";
import { 
  Communication, 
  getCommunications, 
  markCommunicationAsRead, 
  createCommunication, 
  countUsersByRole, 
  deleteCommunication,
  getUsersByRole,
  UserDetails,
  CommunicationFormData 
} from "@/services/communicationService";

// Imports de UI e Ícones
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, MessageSquare, Users, CheckCircle, Send, Trash2, AlertCircle } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { CommunicationDetailsModal } from "../modals/communication-details-modal";
import { toast } from "sonner";

// --- Componente Principal ---
export function CommunicationsClientPage() {
    const { firestoreUser, fetchUnreadCount } = useAuth();
    const [allComms, setAllComms] = useState<Communication[]>([]);
    const [allUsers, setAllUsers] = useState<{ profissionais: UserDetails[], familiares: UserDetails[], funcionarios: UserDetails[], admins: UserDetails[] }>({ profissionais: [], familiares: [], funcionarios: [], admins: [] });
    const [loading, setLoading] = useState(true);
    
    const [selectedComm, setSelectedComm] = useState<Communication | null>(null);
    const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);

    const fetchData = useCallback(async () => {
        if (firestoreUser?.profile.role) {
            setLoading(true);
            const [commsData, profUsers, famUsers, funcUsers, adminUsers] = await Promise.all([
                getCommunications(firestoreUser.profile.role),
                getUsersByRole('profissional'),
                getUsersByRole('familiar'),
                getUsersByRole('funcionario'),
                getUsersByRole('admin') 
            ]);
            setAllComms(commsData);
            setAllUsers({ profissionais: profUsers, familiares: famUsers, funcionarios: funcUsers, admins: adminUsers });
            setLoading(false);
            fetchUnreadCount();
        }
    }, [firestoreUser, fetchUnreadCount]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const handleOpenDetails = (comm: Communication) => {
        setSelectedComm(comm);
        setIsDetailsModalOpen(true);
    };

    const getTargetUsersForComm = (comm: Communication | null): UserDetails[] => {
        if (!comm) return [];
        let targets: UserDetails[] = [];
    
        if (comm.targetRole === 'familiar') {
            targets = [...allUsers.familiares];
        } else if (comm.targetRole === 'profissional') {
            targets = [...allUsers.profissionais, ...allUsers.funcionarios];
        }
        
        const allTargets = [...targets, ...allUsers.admins];
        return Array.from(new Map(allTargets.map(item => [item.uid, item])).values());
    };
    
    const avisosInternos = allComms.filter(c => c.targetRole === 'profissional' || c.targetRole === 'funcionario');
    const comunicadosFamiliares = allComms.filter(c => c.targetRole === 'familiar');
    const canManage = firestoreUser?.profile.role === 'admin' || firestoreUser?.profile.role === 'funcionario';

    // Sub-componente para o Card de Comunicação
    const CommunicationCard = ({ comm }: { comm: Communication }) => {
        const targetUsers = getTargetUsersForComm(comm);
        const totalDestinatarios = targetUsers.length;
        const readCount = Object.keys(comm.readBy).length;
        const hasRead = firestoreUser && Object.keys(comm.readBy).includes(firestoreUser.uid);

        const handleCardClick = (e: React.MouseEvent) => {
            if ((e.target as HTMLElement).closest('button')) {
                return;
            }
            handleOpenDetails(comm);
        };

        const handleConfirmReadClick = async (e: React.MouseEvent) => {
            e.stopPropagation();
            if (!firestoreUser) return;
            await markCommunicationAsRead(comm.id, firestoreUser.uid);
            fetchData();
        };

        const getProgressColor = (leituras: number, total: number) => {
            const percentage = total > 0 ? (leituras / total) * 100 : 0;
            if (percentage >= 80) return "bg-primary-medium-green";
            if (percentage >= 50) return "bg-secondary-orange";
            return "bg-secondary-red";
        };

        return (
            <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={handleCardClick}>
                <CardHeader>
                    <div className="flex justify-between items-start gap-2">
                        <div>
                            <CardTitle className="text-lg">{comm.title}</CardTitle>
                            <p className="text-sm text-muted-foreground mt-1">
                                Por: {comm.authorName} em {comm.createdAt.toDate().toLocaleDateString("pt-BR")}
                            </p>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                            {canManage && <Badge>{readCount}/{totalDestinatarios} leram</Badge>}
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="space-y-4">
                    <p className="text-gray-700 line-clamp-2">{comm.message}</p>
                    
                    {/* --- LÓGICA DE EXIBIÇÃO CORRIGIDA --- */}
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                        {/* Botão ou status de leitura sempre aparece */}
                        {!hasRead ? (
                            <Button onClick={handleConfirmReadClick} size="sm">
                                <CheckCircle className="mr-2 h-4 w-4" />
                                Confirmar Leitura
                            </Button>
                        ) : (
                            <div className="text-sm font-semibold flex items-center gap-2 text-green-600">
                                <CheckCircle className="h-4 w-4" />
                                Leitura confirmada
                            </div>
                        )}

                        {/* Barra de progresso aparece APENAS para admins/funcionários */}
                        {canManage && (
                             <div className="flex items-center gap-2 w-full sm:w-1/3">
                                <div className="flex-1 bg-gray-200 rounded-full h-2">
                                    <div 
                                        className={`h-2 rounded-full ${getProgressColor(readCount, totalDestinatarios)}`} 
                                        style={{ width: `${totalDestinatarios > 0 ? (readCount / totalDestinatarios) * 100 : 0}%` }}
                                    ></div>
                                </div>
                                <span className="text-xs text-muted-foreground">
                                    {Math.round(totalDestinatarios > 0 ? (readCount / totalDestinatarios) * 100 : 0)}%
                                </span>
                            </div>
                        )}
                    </div>
                </CardContent>
            </Card>
        );
    };

    if (loading) return <p className="text-center p-8">Carregando comunicados...</p>;

    return (
        <>
            <Tabs defaultValue="internos" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="internos" className="flex items-center gap-2"><MessageSquare className="h-4 w-4" />Avisos Internos ({avisosInternos.length})</TabsTrigger>
                    <TabsTrigger value="familiares" className="flex items-center gap-2"><Users className="h-4 w-4" />Comunicados Familiares ({comunicadosFamiliares.length})</TabsTrigger>
                </TabsList>
                <TabsContent value="internos" className="space-y-4 pt-4">
                    {avisosInternos.length > 0 ? 
                        avisosInternos.map((aviso) => <CommunicationCard key={aviso.id} comm={aviso} />) :
                        <p className="text-center text-muted-foreground py-8">Nenhum aviso interno no momento.</p>
                    }
                </TabsContent>
                <TabsContent value="familiares" className="space-y-4 pt-4">
                    {comunicadosFamiliares.length > 0 ?
                        comunicadosFamiliares.map((comunicado) => <CommunicationCard key={comunicado.id} comm={comunicado} />) :
                        <p className="text-center text-muted-foreground py-8">Nenhum comunicado para familiares no momento.</p>
                    }
                </TabsContent>
            </Tabs>

            <CommunicationDetailsModal
                isOpen={isDetailsModalOpen}
                onClose={() => setIsDetailsModalOpen(false)}
                communication={selectedComm}
                targetUsers={getTargetUsersForComm(selectedComm)}
                onUpdate={fetchData}
                canManage={canManage}
            />
        </>
    );
}

// Sub-componente para o Modal de Criação (sem alterações)
CommunicationsClientPage.CreateCommunicationModal = function CreateCommunicationModal() {
    const { firestoreUser, fetchUnreadCount } = useAuth();
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState<CommunicationFormData>({
        title: "",
        message: "",
        isImportant: false,
        targetRole: "profissional"
    });

    const handleCreate = async () => {
        if (!firestoreUser || !formData.title || !formData.message) {
            toast.error("Título e conteúdo são obrigatórios.");
            return;
        }
        setLoading(true);
        const result = await createCommunication(formData, firestoreUser);
        setLoading(false);
        if (result.success) {
            toast.success("Comunicado enviado!");
            setOpen(false);
            fetchUnreadCount();
        } else {
            toast.error(result.error);
        }
    };
    
    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button className="w-full sm:w-auto"><Plus className="mr-2 h-4 w-4" />Novo Comunicado</Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
                <DialogHeader><DialogTitle>Criar Novo Comunicado</DialogTitle></DialogHeader>
                <div className="space-y-4 py-4">
                    <div className="space-y-2">
                        <Label>Enviar Para</Label>
                        <Select value={formData.targetRole} onValueChange={(v) => setFormData({...formData, targetRole: v as any})}>
                            <SelectTrigger><SelectValue /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="profissional">Aviso Interno (Profissionais/Funcionários)</SelectItem>
                                <SelectItem value="familiar">Comunicado para Familiares</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="titulo">Título</Label>
                        <Input id="titulo" value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} placeholder="Digite o título do comunicado" />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="conteudo">Conteúdo</Label>
                        <Textarea id="conteudo" value={formData.message} onChange={(e) => setFormData({ ...formData, message: e.target.value })} placeholder="Digite o conteúdo do comunicado" rows={6} />
                    </div>
                    <div className="flex items-center space-x-2">
                        <Checkbox 
                            id="isImportant" 
                            checked={formData.isImportant} 
                            onCheckedChange={(checked) => setFormData({...formData, isImportant: !!checked})}
                        />
                        <Label htmlFor="isImportant" className="font-normal">Marcar como importante (destacar no dashboard)</Label>
                    </div>
                    <Button onClick={handleCreate} disabled={loading} className="w-full">
                        <Send className="mr-2 h-4 w-4" />
                        {loading ? "Enviando..." : "Enviar Comunicado"}
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}