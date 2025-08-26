// components/modals/communication-details-modal.tsx
"use client";

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Communication, UserDetails, updateCommunication } from "@/services/communicationService";
import { toast } from "sonner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import { CheckCircle, CircleDashed } from "lucide-react";
import { ScrollArea } from "../ui/scroll-area";

interface CommunicationDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  communication: Communication | null;
  targetUsers: UserDetails[];
  onUpdate: () => void; // Para recarregar a lista na página principal
  canManage: boolean;
}

export function CommunicationDetailsModal({ isOpen, onClose, communication, targetUsers, onUpdate, canManage }: CommunicationDetailsModalProps) {
    const [isEditing, setIsEditing] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [formData, setFormData] = useState({ title: '', message: '' });

    useEffect(() => {
        if (communication) {
            setFormData({
                title: communication.title,
                message: communication.message
            });
        }
        setIsEditing(false); // Reseta o modo de edição ao abrir o modal
    }, [communication, isOpen]);

    if (!communication) return null;

    const readUserIds = Object.keys(communication.readBy);
    const readUsers = targetUsers.filter(u => readUserIds.includes(u.uid));
    const unreadUsers = targetUsers.filter(u => !readUserIds.includes(u.uid));

    const handleSaveChanges = async () => {
        setIsLoading(true);
        const result = await updateCommunication(communication.id, formData);
        if (result.success) {
            toast.success("Comunicado atualizado com sucesso!");
            onUpdate(); // Chama a função para recarregar os dados na página principal
            setIsEditing(false);
        } else {
            toast.error(result.error || "Falha ao salvar as alterações.");
        }
        setIsLoading(false);
    }

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-3xl">
                <DialogHeader>
                    <DialogTitle>{isEditing ? "Editar Comunicado" : "Detalhes do Comunicado"}</DialogTitle>
                </DialogHeader>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 py-4 max-h-[70vh] overflow-hidden">
                    {/* Coluna de Edição/Visualização */}
                    <div className="space-y-4 flex flex-col">
                        {isEditing ? (
                            <>
                                <div className="space-y-2">
                                    <Label htmlFor="title">Título</Label>
                                    <Input id="title" value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} />
                                </div>
                                <div className="space-y-2 flex-grow flex flex-col">
                                    <Label htmlFor="message">Mensagem</Label>
                                    <Textarea id="message" value={formData.message} onChange={e => setFormData({...formData, message: e.target.value})} className="flex-grow" />
                                </div>
                            </>
                        ) : (
                            <div className="space-y-4 p-4 bg-muted/50 rounded-lg h-full overflow-y-auto">
                                <h3 className="font-semibold text-lg">{communication.title}</h3>
                                <p className="text-sm whitespace-pre-wrap">{communication.message}</p>
                            </div>
                        )}
                    </div>

                    {/* Coluna de Status de Leitura */}
                    <div className="flex flex-col">
                         <Tabs defaultValue="unread" className="flex-grow flex flex-col">
                            <TabsList className="grid w-full grid-cols-2">
                                <TabsTrigger value="unread">Não Leram ({unreadUsers.length})</TabsTrigger>
                                <TabsTrigger value="read">Leram ({readUsers.length})</TabsTrigger>
                            </TabsList>
                            <ScrollArea className="flex-grow mt-2 border rounded-md">
                                <TabsContent value="unread" className="p-4">
                                    {unreadUsers.length === 0 && <p className="text-sm text-center text-muted-foreground">Todos leram!</p>}
                                    <ul className="space-y-2">
                                        {unreadUsers.map(user => (
                                            <li key={user.uid} className="flex items-center gap-2 text-sm"><CircleDashed className="h-4 w-4 text-muted-foreground" />{user.displayName}</li>
                                        ))}
                                    </ul>
                                </TabsContent>
                                <TabsContent value="read" className="p-4">
                                    {readUsers.length === 0 && <p className="text-sm text-center text-muted-foreground">Ninguém leu ainda.</p>}
                                    <ul className="space-y-2">
                                        {readUsers.map(user => (
                                            <li key={user.uid} className="flex items-center gap-2 text-sm"><CheckCircle className="h-4 w-4 text-green-600" />{user.displayName}</li>
                                        ))}
                                    </ul>
                                </TabsContent>
                            </ScrollArea>
                        </Tabs>
                    </div>
                </div>

                <DialogFooter>
                    {canManage && (
                        isEditing ? (
                            <>
                                <Button variant="ghost" onClick={() => setIsEditing(false)}>Cancelar</Button>
                                <Button onClick={handleSaveChanges} disabled={isLoading}>
                                    {isLoading ? "Salvando..." : "Salvar Alterações"}
                                </Button>
                            </>
                        ) : (
                            <Button variant="outline" onClick={() => setIsEditing(true)}>Editar</Button>
                        )
                    )}
                    <Button onClick={onClose}>Fechar</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}