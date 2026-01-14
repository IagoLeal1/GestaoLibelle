"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { MultiSelectFilter } from "@/components/ui/multi-select-filter" // Assumindo que você tem esse componente ou similar, senão use checkboxes
import { createChatGroup } from "@/services/chatService"
import { getUsersByRole, UserDetails } from "@/services/communicationService"
import { useAuth } from "@/context/AuthContext"
import { toast } from "sonner"
import { Plus, Loader2 } from "lucide-react"

export function CreateChatGroupModal({ onGroupCreated }: { onGroupCreated?: () => void }) {
    const { firestoreUser } = useAuth();
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    
    const [pacientes, setPacientes] = useState<UserDetails[]>([]);
    const [profissionais, setProfissionais] = useState<UserDetails[]>([]);
    
    const [selectedPacienteId, setSelectedPacienteId] = useState("");
    const [selectedProfissionaisIds, setSelectedProfissionaisIds] = useState<string[]>([]);

    // Carregar listas ao abrir
    useEffect(() => {
        if (open) {
            const loadData = async () => {
                const [famUsers, profUsers] = await Promise.all([
                    getUsersByRole('familiar'),
                    getUsersByRole('profissional')
                ]);
                setPacientes(famUsers);
                setProfissionais(profUsers);
            };
            loadData();
        }
    }, [open]);

    const handleCreate = async () => {
        if (!selectedPacienteId || selectedProfissionaisIds.length === 0) {
            toast.error("Selecione um paciente e pelo menos um terapeuta.");
            return;
        }

        setLoading(true);
        const paciente = pacientes.find(p => p.uid === selectedPacienteId);
        const terapeutasSelecionados = profissionais.filter(p => selectedProfissionaisIds.includes(p.uid));

        if (!paciente || !firestoreUser) return;

        // Formata os dados
        const result = await createChatGroup(
            { uid: paciente.uid, nome: paciente.displayName, responsavelNome: paciente.displayName },
            terapeutasSelecionados.map(t => ({ uid: t.uid, nome: t.displayName })),
            firestoreUser.uid
        );

        setLoading(false);

        if (result.success) {
            toast.success("Grupo criado com sucesso!");
            setOpen(false);
            setSelectedPacienteId("");
            setSelectedProfissionaisIds([]);
            if (onGroupCreated) onGroupCreated();
        } else {
            toast.error("Erro ao criar grupo.");
        }
    };

    // Opções para o MultiSelect (adapte conforme seu componente de UI)
    const profissionalOptions = profissionais.map(p => ({ label: p.displayName, value: p.uid }));

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button className="bg-primary-teal hover:bg-primary-teal/90">
                    <Plus className="mr-2 h-4 w-4" /> Novo Grupo
                </Button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Criar Grupo de Paciente</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-4">
                    <div className="space-y-2">
                        <Label>Paciente (Família)</Label>
                        <Select value={selectedPacienteId} onValueChange={setSelectedPacienteId}>
                            <SelectTrigger>
                                <SelectValue placeholder="Selecione a família/paciente" />
                            </SelectTrigger>
                            <SelectContent>
                                {pacientes.map(p => (
                                    <SelectItem key={p.uid} value={p.uid}>{p.displayName}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-2">
                        <Label>Equipe Terapêutica</Label>
                        {/* Se não tiver o MultiSelectFilter, use um select multiple nativo ou map de checkboxes */}
                        <div className="border rounded-md p-2 max-h-40 overflow-y-auto space-y-2">
                            {profissionais.map(prof => (
                                <div key={prof.uid} className="flex items-center gap-2">
                                    <input 
                                        type="checkbox" 
                                        id={prof.uid}
                                        checked={selectedProfissionaisIds.includes(prof.uid)}
                                        onChange={(e) => {
                                            if(e.target.checked) setSelectedProfissionaisIds([...selectedProfissionaisIds, prof.uid]);
                                            else setSelectedProfissionaisIds(selectedProfissionaisIds.filter(id => id !== prof.uid));
                                        }}
                                        className="rounded border-gray-300"
                                    />
                                    <Label htmlFor={prof.uid} className="cursor-pointer font-normal">{prof.displayName}</Label>
                                </div>
                            ))}
                        </div>
                    </div>

                    <Button onClick={handleCreate} disabled={loading} className="w-full">
                        {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Criar Grupo
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}