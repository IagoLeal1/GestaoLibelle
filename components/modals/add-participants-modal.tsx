"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { addProfessionalsToGroup } from "@/services/chatService"
import { getUsersByRole, UserDetails } from "@/services/communicationService"
import { toast } from "sonner"
import { UserPlus, Loader2 } from "lucide-react"

interface AddParticipantsModalProps {
    groupId: string;
    existingIds?: string[];
    onAdded?: () => void;
}

export function AddParticipantsModal({ groupId, existingIds = [], onAdded }: AddParticipantsModalProps) {
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [fetching, setFetching] = useState(false);
    
    const [profissionais, setProfissionais] = useState<UserDetails[]>([]);
    const [selectedProfissionaisIds, setSelectedProfissionaisIds] = useState<string[]>([]);

    useEffect(() => {
        if (open) {
            setFetching(true);
            const loadData = async () => {
                const profUsers = await getUsersByRole('profissional');
                // Remove out already existing professionals in the group
                const availableProf = profUsers.filter(p => !existingIds.includes(p.uid));
                setProfissionais(availableProf);
                setFetching(false);
            };
            loadData();
        } else {
            setSelectedProfissionaisIds([]);
        }
    }, [open, existingIds]);

    const handleAdd = async () => {
        if (selectedProfissionaisIds.length === 0) {
            toast.error("Selecione pelo menos um profissional.");
            return;
        }

        setLoading(true);
        const terapeutasSelecionados = profissionais.filter(p => selectedProfissionaisIds.includes(p.uid));

        const result = await addProfessionalsToGroup(
            groupId,
            terapeutasSelecionados.map(t => ({ uid: t.uid, nome: t.displayName }))
        );

        setLoading(false);

        if (result.success) {
            toast.success("Profissionais adicionados com sucesso!");
            setOpen(false);
            setSelectedProfissionaisIds([]);
            if (onAdded) onAdded();
        } else {
            toast.error("Erro ao adicionar profissionais.");
        }
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="outline" size="sm" className="h-8 gap-1.5 text-xs text-primary-teal border-primary-teal/30 hover:bg-primary-teal/10">
                    <UserPlus className="h-4 w-4" /> 
                    <span className="hidden sm:inline">Adicionar</span>
                </Button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Adicionar Profissionais ao Grupo</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-4">
                    <div className="space-y-2">
                        <Label>Selecione a equipe de profissionais</Label>
                        
                        {fetching ? (
                            <div className="flex justify-center p-4"><Loader2 className="animate-spin text-primary-teal" /></div>
                        ) : profissionais.length === 0 ? (
                            <p className="text-sm text-muted-foreground italic">Nenhum novo profissional disponível para adicionar a este grupo.</p>
                        ) : (
                            <div className="border rounded-md p-2 max-h-60 overflow-y-auto space-y-2">
                                {profissionais.map(prof => (
                                    <div key={prof.uid} className="flex items-center gap-2">
                                        <input 
                                            type="checkbox" 
                                            id={`add-prof-${prof.uid}`}
                                            checked={selectedProfissionaisIds.includes(prof.uid)}
                                            onChange={(e) => {
                                                if(e.target.checked) setSelectedProfissionaisIds([...selectedProfissionaisIds, prof.uid]);
                                                else setSelectedProfissionaisIds(selectedProfissionaisIds.filter(id => id !== prof.uid));
                                            }}
                                            className="rounded border-gray-300 text-primary-teal focus:ring-primary-teal"
                                        />
                                        <Label htmlFor={`add-prof-${prof.uid}`} className="cursor-pointer font-normal text-sm">{prof.displayName}</Label>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    <Button 
                        onClick={handleAdd} 
                        disabled={loading || profissionais.length === 0 || selectedProfissionaisIds.length === 0} 
                        className="w-full bg-primary-teal hover:bg-primary-teal/90"
                    >
                        {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Adicionar ao Grupo
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}
