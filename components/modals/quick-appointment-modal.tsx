"use client";

import { useState, useEffect, useMemo } from "react";
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
import { QuickAppointmentData, RecurrenceFrequency } from "@/services/appointmentService";
import { toast } from "sonner";
import { DollarSign } from "lucide-react";

interface QuickAppointmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: QuickAppointmentData) => void;
  slotInfo: { date: Date; time: string } | null;
  patient: Patient | null;
  patientOptions?: Patient[];
  onPatientChange?: (patientId: string) => void;
  loadingPatients?: boolean;
  professionals: Professional[];
  specialties: Specialty[];
  rooms: Room[];
  allowedSpecialtyNames?: string[];
  restrictProfessionalsToSpecialty?: boolean;
  saveLabel?: string;
  saving?: boolean;
  maxSessions?: number;
  fixedProfessionalId?: string;
}

export function QuickAppointmentModal({ isOpen, onClose, onSave, slotInfo, patient, patientOptions, onPatientChange, loadingPatients = false, professionals, specialties, rooms, allowedSpecialtyNames, restrictProfessionalsToSpecialty = false, saveLabel = "Adicionar à Grade", saving = false, maxSessions, fixedProfessionalId }: QuickAppointmentModalProps) {
    const [professionalId, setProfessionalId] = useState<string>('');
    const [specialty, setSpecialty] = useState<string>('');
    const [valorConsulta, setValorConsulta] = useState<number>(0);
    const [roomId, setRoomId] = useState<string | undefined>(undefined);
    const [isRecurring, setIsRecurring] = useState(false);
    const [sessions, setSessions] = useState(4);
    // --- NOVO ESTADO PARA FREQUÊNCIA ---
    const [frequency, setFrequency] = useState<RecurrenceFrequency>('weekly');
    const [availableSpecialties, setAvailableSpecialties] = useState<Specialty[]>([]);
    const [convenio, setConvenio] = useState<string>('');
    const [availableConvenios, setAvailableConvenios] = useState<string[]>([]);
    const specialtiesForModal = useMemo(
        () => allowedSpecialtyNames ? specialties.filter(spec => allowedSpecialtyNames.includes(spec.name)) : specialties,
        [specialties, allowedSpecialtyNames]
    );
    const professionalOptions = useMemo(() => {
        if (!restrictProfessionalsToSpecialty) return professionals;
        const relevantNames = specialty ? [specialty] : specialtiesForModal.map(spec => spec.name);
        return professionals.filter(prof => {
            const name = prof.especialidade.trim().toLowerCase();
            return name && relevantNames.some(relevant => relevant.toLowerCase().startsWith(name));
        });
    }, [professionals, restrictProfessionalsToSpecialty, specialtiesForModal, specialty]);

    useEffect(() => {
        if (isOpen) {
            // Resetar o estado ao abrir
            setProfessionalId(fixedProfessionalId ?? '');
            setSpecialty('');
            setValorConsulta(0);
            setRoomId(undefined);
            setIsRecurring(false);
            setSessions(4);
            setFrequency('weekly'); // Reseta para o padrão

            if (patient) {
                const rawConvenio = patient.convenio || '';
                const conveniosList = rawConvenio.split(',').map(c => c.trim()).filter(c => c.length > 0);
                if (!conveniosList.some(c => c.toLowerCase() === 'particular')) {
                    conveniosList.push('Particular');
                }
                setAvailableConvenios(conveniosList);
                const defaultConvenio = conveniosList[0];
                setConvenio(defaultConvenio);

                const convenioLower = defaultConvenio.toLowerCase();
                const filtered = specialtiesForModal.filter(spec => {
                    const specNameLower = spec.name.toLowerCase();
                    if (convenioLower === 'particular') {
                        return !['unimed', 'bradesco', 'amil', 'sulamerica'].some(conv => specNameLower.includes(conv));
                    }
                    return specNameLower.includes(convenioLower);
                });
                setAvailableSpecialties(filtered);
            } else {
                setAvailableConvenios([]);
                setConvenio('');
                setAvailableSpecialties(specialtiesForModal);
            }
        }
    }, [isOpen, patient, specialtiesForModal, fixedProfessionalId]);

    const filterSpecialtiesByConvenio = (conv: string) => {
        const convenioLower = conv.toLowerCase();
        const filtered = specialtiesForModal.filter(spec => {
            const specNameLower = spec.name.toLowerCase();
            if (convenioLower === 'particular') {
                return !['unimed', 'bradesco', 'amil', 'sulamerica'].some(c => specNameLower.includes(c));
            }
            return specNameLower.includes(convenioLower);
        });
        setAvailableSpecialties(filtered);
        
        setSpecialty(prev => {
            if (prev && !filtered.some(s => s.name === prev)) {
                setValorConsulta(0);
                return '';
            }
            return prev;
        });
    };

    const handleSpecialtyChange = (specialtyName: string) => {
        const selectedSpecialty = specialtiesForModal.find(s => s.name === specialtyName);
        setSpecialty(specialtyName);
        setValorConsulta(selectedSpecialty?.value || 0);
        if (restrictProfessionalsToSpecialty && professionalId && !fixedProfessionalId) {
            const professional = professionals.find(p => p.id === professionalId);
            if (!professional || !specialtyName.toLowerCase().startsWith(professional.especialidade.trim().toLowerCase())) {
                setProfessionalId('');
            }
        }
    };

    const handleSaveClick = () => {
        if (patientOptions && !patient) {
            toast.error("Selecione um paciente.");
            return;
        }
        if (!professionalId || !specialty || !slotInfo || !availableSpecialties.some(spec => spec.name === specialty) || !professionalOptions.some(prof => prof.id === professionalId) || (fixedProfessionalId && professionalId !== fixedProfessionalId)) {
            toast.error("Profissional e Especialidade são obrigatórios.");
            return;
        }
        if (maxSessions && isRecurring && (!Number.isInteger(sessions) || sessions < 1 || sessions > maxSessions)) {
            toast.error(`Informe entre 1 e ${maxSessions} sessões.`);
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
            valorConsulta,
            roomId,
            isRecurring,
            sessions: isRecurring ? sessions : 1,
            frequency: isRecurring ? frequency : 'weekly', // Inclui a frequência nos dados
            convenio: convenio,
        };
        onSave(data);
    };
    
    const title = slotInfo ? `Para ${format(slotInfo.date, "EEEE, dd/MM", { locale: ptBR })} às ${slotInfo.time}` : "Agendamento Rápido";

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Agendamento Rápido</DialogTitle>
                    <DialogDescription>{title}</DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                    {patientOptions && onPatientChange && (
                        <div className="space-y-2">
                            <Label htmlFor="quick-patient">Paciente *</Label>
                            <Select value={patient?.id || undefined} onValueChange={onPatientChange} disabled={loadingPatients || saving}>
                                <SelectTrigger id="quick-patient"><SelectValue placeholder={loadingPatients ? "Carregando pacientes..." : "Selecione um paciente"} /></SelectTrigger>
                                <SelectContent>{patientOptions.map(option => <SelectItem key={option.id} value={option.id}>{option.fullName}</SelectItem>)}</SelectContent>
                            </Select>
                            {!loadingPatients && patientOptions.length === 0 && <p className="text-sm text-muted-foreground">Nenhum paciente ativo encontrado.</p>}
                        </div>
                    )}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2"><Label htmlFor="professional">Profissional *</Label><Select value={professionalId} onValueChange={setProfessionalId} disabled={Boolean(fixedProfessionalId)}><SelectTrigger id="professional"><SelectValue placeholder="Selecione..." /></SelectTrigger><SelectContent>{professionalOptions.map(p => <SelectItem key={p.id} value={p.id}>{p.fullName}</SelectItem>)}</SelectContent></Select></div>
                        <div className="space-y-2"><Label>Modalidade / Convênio</Label><Select value={convenio || undefined} onValueChange={(val) => { setConvenio(val); filterSpecialtiesByConvenio(val); }} disabled={!patient}><SelectTrigger><SelectValue placeholder={!patient ? "Selecione um paciente" : "Selecione..."} /></SelectTrigger><SelectContent>{availableConvenios.map((c, idx) => <SelectItem key={idx} value={c}>{c}</SelectItem>)}</SelectContent></Select></div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2"><Label htmlFor="specialty">Especialidade *</Label><Select value={specialty || undefined} onValueChange={handleSpecialtyChange} disabled={!patient || availableSpecialties.length === 0}><SelectTrigger id="specialty"><SelectValue placeholder={!patient ? "Selecione um paciente" : availableSpecialties.length === 0 ? "Sem opção para este convênio" : "Selecione..."} /></SelectTrigger><SelectContent>{availableSpecialties.map(s => <SelectItem key={s.id} value={s.name}>{s.name}</SelectItem>)}</SelectContent></Select></div>
                        <div className="space-y-2"><Label htmlFor="room">Sala</Label><Select value={roomId} onValueChange={(value) => setRoomId(value === "none" ? undefined : value)}><SelectTrigger id="room"><SelectValue placeholder="Opcional..." /></SelectTrigger><SelectContent><SelectItem value="none">Nenhuma</SelectItem>{rooms.map(r => <SelectItem key={r.id} value={r.id}>{r.name}</SelectItem>)}</SelectContent></Select></div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2"><Label htmlFor="valorConsulta">Valor da Consulta (R$)</Label><div className="relative"><DollarSign className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" /><Input id="valorConsulta" type="number" step="0.01" value={valorConsulta} onChange={(e) => setValorConsulta(parseFloat(e.target.value) || 0)} className="pl-8" /></div></div>
                        <div></div>
                    </div>
                    
                    {/* --- BLOCO DE RECORRÊNCIA ATUALIZADO --- */}
                    <div className="space-y-4 rounded-lg border p-4">
                        <div className="flex items-center justify-between"><Label htmlFor="recurring-switch" className="cursor-pointer">Repetir Agendamento</Label><Switch id="recurring-switch" checked={isRecurring} onCheckedChange={setIsRecurring} /></div>
                        {isRecurring && (
                            <div className="grid grid-cols-2 gap-4 pt-4 border-t">
                                <div className="space-y-2">
                                    <Label htmlFor="frequency">Frequência</Label>
                                    <Select value={frequency} onValueChange={(v) => setFrequency(v as RecurrenceFrequency)}>
                                        <SelectTrigger id="frequency"><SelectValue /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="daily">Diariamente</SelectItem>
                                            <SelectItem value="weekly">Semanalmente</SelectItem>
                                            <SelectItem value="bi-weekly">Quinzenalmente</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2"><Label htmlFor="sessions">Nº de Sessões</Label><Input id="sessions" type="number" value={sessions} onChange={(e) => setSessions(Number(e.target.value))} min={1} max={maxSessions} /></div>
                            </div>
                        )}
                    </div>
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={onClose} disabled={saving}>Cancelar</Button>
                    <Button onClick={handleSaveClick} disabled={saving || Boolean(patientOptions && (!patient || loadingPatients))}>{saving ? "Salvando..." : saveLabel}</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
