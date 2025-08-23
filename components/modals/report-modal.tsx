"use client"

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Professional } from "@/services/professionalService";
import { Patient } from "@/services/patientService"; // Adicionando a importação do Patient
import { Download } from "lucide-react";

interface ReportModalProps {
    isOpen: boolean;
    onClose: () => void;
    onGenerate: (professionalId: string | undefined, patientId: string | undefined, startDate: string, endDate: string) => void;
    professionals: Professional[];
    patients: Patient[]; // Adicionando a prop de pacientes
}

export function ReportModal({ isOpen, onClose, onGenerate, professionals, patients }: ReportModalProps) {
    // Estado inicial como undefined para representar "todos"
    const [professionalId, setProfessionalId] = useState<string | undefined>(undefined);
    const [patientId, setPatientId] = useState<string | undefined>(undefined);
    const [startDate, setStartDate] = useState<string>("");
    const [endDate, setEndDate] = useState<string>("");
    const [loading, setLoading] = useState(false);

    const handleGenerateClick = async () => {
        if (!startDate || !endDate) {
            alert("Por favor, selecione o período completo.");
            return;
        }
        setLoading(true);
        // Passa os valores (incluindo undefined) para a função da página principal
        await onGenerate(professionalId, patientId, startDate, endDate);
        setLoading(false);
        onClose();
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Gerar Relatório de Agendamentos</DialogTitle>
                    <DialogDescription>
                        Selecione os filtros desejados para exportar os dados em formato CSV.
                    </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <div className="space-y-2">
                        <Label>Profissional</Label>
                        <Select 
                            onValueChange={(value) => setProfessionalId(value === 'todos' ? undefined : value)} 
                            value={professionalId || 'todos'}
                        >
                            <SelectTrigger><SelectValue placeholder="Todos os Profissionais" /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="todos">Todos os Profissionais</SelectItem>
                                {professionals.map(p => (
                                    <SelectItem key={p.id} value={p.id}>{p.fullName}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="space-y-2">
                        <Label>Paciente</Label>
                        {/* Novo select para pacientes */}
                        <Select 
                            onValueChange={(value) => setPatientId(value === 'todos' ? undefined : value)} 
                            value={patientId || 'todos'}
                        >
                            <SelectTrigger><SelectValue placeholder="Todos os Pacientes" /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="todos">Todos os Pacientes</SelectItem>
                                {patients.map(p => (
                                    <SelectItem key={p.id} value={p.id}>{p.fullName}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label>Data de Início</Label>
                            <Input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} />
                        </div>
                        <div className="space-y-2">
                            <Label>Data de Fim</Label>
                            <Input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} />
                        </div>
                    </div>
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={onClose}>Cancelar</Button>
                    <Button onClick={handleGenerateClick} disabled={loading}>
                        <Download className="mr-2 h-4 w-4" />
                        {loading ? 'Gerando...' : 'Gerar Relatório'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}