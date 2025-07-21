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
import { Plus, MessageSquare, Users, CheckCircle, Send, Trash2 } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";

// --- Componente Principal ---
export function CommunicationsClientPage() {
    const { firestoreUser } = useAuth();
    const [allComms, setAllComms] = useState<Communication[]>([]);
    const [userCounts, setUserCounts] = useState({ profissional: 0, familiar: 0, funcionario: 0 });
    const [loading, setLoading] = useState(true);

    const fetchData = useCallback(async () => {
        if (firestoreUser?.profile.role) {
            setLoading(true);
            const [commsData, profCount, famCount, funcCount] = await Promise.all([
                getCommunications(firestoreUser.profile.role),
                countUsersByRole('profissional'),
                countUsersByRole('familiar'),
                countUsersByRole('funcionario')
            ]);
            setAllComms(commsData);
            setUserCounts({ profissional: profCount, familiar: famCount, funcionario: funcCount });
            setLoading(false);
        }
    }, [firestoreUser]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const handleMarkAsRead = async (commId: string) => {
        if (!firestoreUser) return;
        const result = await markCommunicationAsRead(commId, firestoreUser.uid);
        if (result.success) {
            setAllComms(prev => prev.map(c => c.id === commId ? { ...c, readBy: { ...c.readBy, [firestoreUser.uid]: new Date() as any } } : c));
        }
    };

    const handleDelete = async (commId: string) => {
        if (window.confirm("Tem certeza que deseja excluir este comunicado? Esta ação não pode ser desfeita.")) {
            const result = await deleteCommunication(commId);
            if (result.success) {
                setAllComms(prev => prev.filter(c => c.id !== commId));
                alert("Comunicado excluído com sucesso.");
            } else {
                alert(result.error);
            }
        }
    };

    const getProgressColor = (leituras: number, total: number) => {
        const percentage = total > 0 ? (leituras / total) * 100 : 0;
        if (percentage >= 80) return "bg-primary-medium-green";
        if (percentage >= 50) return "bg-secondary-orange";
        return "bg-secondary-red";
    };

    const avisosInternos = allComms.filter(c => c.targetRole === 'profissional' || c.targetRole === 'funcionario');
    const comunicadosFamiliares = allComms.filter(c => c.targetRole === 'familiar');
    const totalInternos = userCounts.profissional + userCounts.funcionario;
    const totalFamiliares = userCounts.familiar;

    const CommunicationCard = ({ comm, totalDestinatarios }: { comm: Communication, totalDestinatarios: number }) => {
        const readCount = Object.keys(comm.readBy).length;
        const hasRead = firestoreUser && Object.keys(comm.readBy).includes(firestoreUser.uid);
        const canManage = firestoreUser?.profile.role === 'admin' || firestoreUser?.profile.role === 'funcionario';

        return (
            <Card key={comm.id}>
                <CardHeader>
                    <div className="flex justify-between items-start gap-2">
                        <div>
                            <CardTitle className="text-lg">{comm.title}</CardTitle>
                            <p className="text-sm text-muted-foreground mt-1">Por: {comm.authorName} em {comm.createdAt.toDate().toLocaleDateString("pt-BR")}</p>
                        </div>
                        <div className="flex items-center gap-2">
                            {canManage && <Badge>{readCount}/{totalDestinatarios} leram</Badge>}
                            {canManage && (
                                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleDelete(comm.id)}>
                                    <Trash2 className="h-4 w-4 text-red-500" />
                                </Button>
                            )}
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    <p className="text-gray-700 mb-4 whitespace-pre-wrap">{comm.message}</p>
                    {canManage && (
                        <div className="flex items-center gap-2">
                            <div className="flex-1 bg-gray-200 rounded-full h-2"><div className={`h-2 rounded-full ${getProgressColor(readCount, totalDestinatarios)}`} style={{ width: `${totalDestinatarios > 0 ? (readCount / totalDestinatarios) * 100 : 0}%` }}></div></div>
                            <span className="text-xs text-muted-foreground">{Math.round(totalDestinatarios > 0 ? (readCount / totalDestinatarios) * 100 : 0)}%</span>
                        </div>
                    )}
                    {!canManage && (
                        <div className="mt-4 pt-4 border-t">
                            <Button onClick={() => handleMarkAsRead(comm.id)} disabled={!!hasRead} variant={hasRead ? 'secondary' : 'default'}>
                                <CheckCircle className="mr-2 h-4 w-4" />
                                {hasRead ? "Leitura Confirmada" : "Confirmar Leitura"}
                            </Button>
                        </div>
                    )}
                </CardContent>
            </Card>
        );
    };

    if (loading) return <p className="text-center p-8">Carregando comunicados...</p>;

    return (
        <Tabs defaultValue="internos" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="internos" className="flex items-center gap-2"><MessageSquare className="h-4 w-4" />Avisos Internos</TabsTrigger>
                <TabsTrigger value="familiares" className="flex items-center gap-2"><Users className="h-4 w-4" />Comunicados Familiares</TabsTrigger>
            </TabsList>
            <TabsContent value="internos" className="space-y-4 pt-4">
                {avisosInternos.length > 0 ? 
                    avisosInternos.map((aviso) => <CommunicationCard key={aviso.id} comm={aviso} totalDestinatarios={totalInternos} />) :
                    <p className="text-center text-muted-foreground py-8">Nenhum aviso interno no momento.</p>
                }
            </TabsContent>
            <TabsContent value="familiares" className="space-y-4 pt-4">
                {comunicadosFamiliares.length > 0 ?
                    comunicadosFamiliares.map((comunicado) => <CommunicationCard key={comunicado.id} comm={comunicado} totalDestinatarios={totalFamiliares} />) :
                    <p className="text-center text-muted-foreground py-8">Nenhum comunicado para familiares no momento.</p>
                }
            </TabsContent>
        </Tabs>
    );
}

// Sub-componente para o Modal de Criação (AGORA COMPLETO)
CommunicationsClientPage.CreateCommunicationModal = function CreateCommunicationModal() {
    const { firestoreUser } = useAuth();
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
            alert("Título e conteúdo são obrigatórios.");
            return;
        }
        setLoading(true);
        const result = await createCommunication(formData, firestoreUser);
        setLoading(false);
        if (result.success) {
            alert("Comunicado enviado!");
            setOpen(false);
            // A atualização da lista acontecerá automaticamente na página principal
        } else {
            alert(result.error);
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
                                <SelectItem value="profissional">Aviso Interno (Profissionais)</SelectItem>
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
