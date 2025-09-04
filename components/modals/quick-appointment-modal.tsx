"use client";

import { useState, useEffect } from "react";
import { format, addMinutes, setHours, setMinutes, setSeconds, setMilliseconds } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Professional } from "@/services/professionalService";
import { Patient } from "@/services/patientService";
import { Specialty } from "@/services/specialtyService";
import { Room } from "@/services/roomService";
import { QuickAppointmentData } from "@/services/appointmentService";
import { toast } from "sonner";
import { DollarSign } from "lucide-react"; // Importar o ícone

interface QuickAppointmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: QuickAppointmentData) => void;
  slotInfo: { date: Date; time: string } | null;
  patient: Patient | null;
  professionals: Professional[];
  specialties: Specialty[];
  rooms: Room[];
}

export function QuickAppointmentModal({ isOpen, onClose, onSave, slotInfo, patient, professionals, specialties, rooms }: QuickAppointmentModalProps) {
    const [professionalId, setProfessionalId] = useState<string>('');
    const [specialty, setSpecialty] = useState<string>('');
    const [valorConsulta, setValorConsulta] = useState<number>(0); // <-- NOVO ESTADO
    const [roomId, setRoomId] = useState<string | undefined>(undefined);
    const [isRecurring, setIsRecurring] = useState(false);
    const [sessions, setSessions] = useState(4);
    const [availableSpecialties, setAvailableSpecialties] = useState<Specialty[]>([]);

    useEffect(() => {
        if (isOpen) {
            setProfessionalId('');
            setSpecialty('');
            setValorConsulta(0); // <-- RESETAR O VALOR
            setRoomId(undefined);
            setIsRecurring(false);
            setSessions(4);

            if (patient) {
                const patientConvenio = (patient.convenio || 'particular').toLowerCase();
                const filtered = specialties.filter(spec => {
                    const specNameLower = spec.name.toLowerCase();
                    if (patientConvenio === 'particular') {
                        return !['unimed', 'bradesco', 'amil', 'sulamerica'].some(conv => specNameLower.includes(conv));
                    }
                    return specNameLower.includes(patientConvenio);
                });
                setAvailableSpecialties(filtered);
            } else {
                setAvailableSpecialties(specialties);
            }
        }
    }, [isOpen, patient, specialties]);

    // Função para atualizar o valor quando a especialidade muda
    const handleSpecialtyChange = (specialtyName: string) => {
        const selectedSpecialty = specialties.find(s => s.name === specialtyName);
        setSpecialty(specialtyName);
        setValorConsulta(selectedSpecialty?.value || 0);
    };

    const handleSaveClick = () => {
        if (!professionalId || !specialty || !slotInfo) {
            toast.error("Profissional e Especialidade são obrigatórios.");
            return;
        }

        const [hour, minute] = slotInfo.time.split(':').map(Number);
        const startDate = setMilliseconds(setSeconds(setMinutes(setHours(slotInfo.date, hour), minute), 0), 0);
        const endDate = addMinutes(startDate, 50);

        const data: QuickAppointmentData = {
            start: startDate,
            end: endDate,
            professionalId,
            specialty,
            valorConsulta, // <-- ENVIAR O VALOR
            roomId,
            isRecurring,
            sessions: isRecurring ? sessions : 1,
        };
        onSave(data);
    };
    
    const title = slotInfo ? `Para ${format(slotInfo.date, "EEEE, dd/MM", { locale: ptBR })} às ${slotInfo.time}` : "Agendamento Rápido";

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Agendamento Rápido</DialogTitle>
                    <DialogDescription>{title}</DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="professional">Profissional *</Label>
                            <Select value={professionalId} onValueChange={setProfessionalId}>
                                <SelectTrigger id="professional"><SelectValue placeholder="Selecione..." /></SelectTrigger>
                                <SelectContent>{professionals.map(p => <SelectItem key={p.id} value={p.id}>{p.fullName}</SelectItem>)}</SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="specialty">Especialidade *</Label>
                            <Select value={specialty} onValueChange={handleSpecialtyChange} disabled={!patient}>
                                <SelectTrigger id="specialty"><SelectValue placeholder={!patient ? "Selecione um paciente" : "Selecione..."} /></SelectTrigger>
                                <SelectContent>{availableSpecialties.map(s => <SelectItem key={s.id} value={s.name}>{s.name}</SelectItem>)}</SelectContent>
                            </Select>
                        </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="room">Sala</Label>
                            <Select value={roomId} onValueChange={(value) => setRoomId(value === "none" ? undefined : value)}>
                                <SelectTrigger id="room"><SelectValue placeholder="Opcional..." /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="none">Nenhuma</SelectItem>
                                    {rooms.map(r => <SelectItem key={r.id} value={r.id}>{r.name}</SelectItem>)}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="valorConsulta">Valor da Consulta (R$)</Label>
                            <div className="relative">
                                <DollarSign className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                                <Input id="valorConsulta" value={valorConsulta.toFixed(2).replace('.', ',')} readOnly className="pl-8" />
                            </div>
                        </div>
                    </div>
                    
                    <div className="space-y-4 rounded-lg border p-4">
                        <div className="flex items-center justify-between">
                            <Label htmlFor="recurring-switch" className="cursor-pointer">Repetir Semanalmente</Label>
                            <Switch id="recurring-switch" checked={isRecurring} onCheckedChange={setIsRecurring} />
                        </div>
                        {isRecurring && (
                            <div className="space-y-2 pt-4 border-t">
                                <Label htmlFor="sessions">Número de Sessões</Label>
                                <Input id="sessions" type="number" value={sessions} onChange={(e) => setSessions(Number(e.target.value))} min={1} />
                            </div>
                        )}
                    </div>
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={onClose}>Cancelar</Button>
                    <Button onClick={handleSaveClick}>Adicionar à Grade</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}