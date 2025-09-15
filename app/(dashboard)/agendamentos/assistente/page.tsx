// app/(dashboard)/agendamentos/assistente/page.tsx
"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Patient, getPatients } from "@/services/patientService";
import { Professional, getProfessionals } from "@/services/professionalService";
import { getSpecialties, Specialty } from "@/services/specialtyService";
import { ArrowLeft, BrainCircuit, Sparkles, User, HeartPulse, SlidersHorizontal, Trash2 } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import { MultiSelectFilter } from "@/components/ui/multi-select-filter";

interface TherapyNeed {
  terapia: string;
  frequencia: number;
}

export default function AssistenteAgendamentoPage() {
    const [patients, setPatients] = useState<Patient[]>([]);
    const [specialties, setSpecialties] = useState<Specialty[]>([]);
    const [availableSpecialties, setAvailableSpecialties] = useState<Specialty[]>([]);
    const [professionals, setProfessionals] = useState<Professional[]>([]);
    const [selectedPatientId, setSelectedPatientId] = useState<string>('');
    const [therapyNeeds, setTherapyNeeds] = useState<TherapyNeed[]>([{ terapia: '', frequencia: 1 }]);
    const [loading, setLoading] = useState(true);
    const [aiSuggestion, setAiSuggestion] = useState<string>('');

    const [turnoPreferencial, setTurnoPreferencial] = useState<'manha' | 'tarde' | 'noite' | undefined>(undefined);
    const [profissionaisPreferidos, setProfissionaisPreferidos] = useState<string[]>([]);

    // Busca os dados iniciais
    useEffect(() => {
        const loadData = async () => {
            setLoading(true);
            const [patientsData, specialtiesData, professionalsData] = await Promise.all([
                getPatients('ativo'), // <-- CORREÇÃO 1: Busca apenas pacientes ativos
                getSpecialties(),
                getProfessionals('ativo')
            ]);
            setPatients(patientsData);
            setSpecialties(specialtiesData);
            setAvailableSpecialties(specialtiesData); // Inicialmente, todas estão disponíveis
            setProfessionals(professionalsData);
            setLoading(false);
        };
        loadData();
    }, []);

    // CORREÇÃO 2: Lógica para filtrar especialidades ao selecionar um paciente
    const handlePatientChange = (patientId: string) => {
        setSelectedPatientId(patientId);
        const selectedPatient = patients.find(p => p.id === patientId);
        if (!selectedPatient) {
            setAvailableSpecialties(specialties);
            return;
        };

        const patientConvenio = (selectedPatient.convenio || 'particular').toLowerCase();

        const filtered = specialties.filter(spec => {
            const specNameLower = spec.name.toLowerCase();
            if (patientConvenio === 'particular') {
                return !['unimed', 'bradesco', 'amil', 'sulamerica'].some(conv => specNameLower.includes(conv));
            }
            return specNameLower.includes(patientConvenio);
        });

        setAvailableSpecialties(filtered);
        // Reseta a terapia selecionada para evitar inconsistências
        setTherapyNeeds([{ terapia: '', frequencia: 1 }]);
    };


    const handleFindSchedules = async () => {
        if (!selectedPatientId || therapyNeeds.some(n => !n.terapia || n.frequencia < 1)) {
            toast.error("Por favor, selecione um paciente e preencha as terapias necessárias.");
            return;
        }
        setLoading(true);
        setAiSuggestion('');

        try {
            const response = await fetch('/api/schedule-assistant', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    patientNeeds: therapyNeeds,
                    preferences: {
                        turno: turnoPreferencial,
                        profissionaisIds: profissionaisPreferidos
                    }
                }),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || "A IA não conseguiu gerar uma resposta.");
            }

            const data = await response.json();
            setAiSuggestion(data.suggestion);

        } catch (error: any) {
            toast.error(error.message);
        } finally {
            setLoading(false);
        }
    };

    const handleNeedChange = (index: number, field: keyof TherapyNeed, value: string | number) => {
        const newNeeds = [...therapyNeeds];
        (newNeeds[index] as any)[field] = value;
        setTherapyNeeds(newNeeds);
    };
    const addNeed = () => setTherapyNeeds([...therapyNeeds, { terapia: '', frequencia: 1 }]);
    const removeNeed = (index: number) => setTherapyNeeds(therapyNeeds.filter((_, i) => i !== index));

    const professionalOptions = professionals.map(p => ({ value: p.id, label: p.fullName }));

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-4">
                <Link href="/agendamentos"><Button variant="ghost" size="icon"><ArrowLeft/></Button></Link>
                <div>
                    <h2 className="text-2xl font-bold tracking-tight">Assistente de Agendamento Contínuo</h2>
                    <p className="text-muted-foreground">Deixe a IA encontrar a melhor grade de horários a longo prazo para o paciente.</p>
                </div>
            </div>

            {/* --- NOVO LAYOUT EM GRID --- */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">

                {/* Coluna de Entradas do Usuário */}
                <div className="space-y-6">
                    <Card>
                        <CardHeader><CardTitle className="flex items-center gap-2"><User className="text-primary-teal"/>1. Selecione o Paciente</CardTitle></CardHeader>
                        <CardContent>
                            <Select value={selectedPatientId} onValueChange={handlePatientChange} disabled={loading}>
                                <SelectTrigger><SelectValue placeholder="Selecione um paciente..." /></SelectTrigger>
                                <SelectContent>{patients.map(p => <SelectItem key={p.id} value={p.id}>{p.fullName}</SelectItem>)}</SelectContent>
                            </Select>
                        </CardContent>
                    </Card>

                    <Card>
                         <CardHeader><CardTitle className="flex items-center gap-2"><HeartPulse className="text-primary-teal"/>2. Defina as Terapias Necessárias</CardTitle></CardHeader>
                         <CardContent className="space-y-4">
                            {therapyNeeds.map((need, index) => (
                                <div key={index} className="flex items-end gap-2 p-3 border rounded-lg bg-muted/50">
                                    <div className="flex-1 space-y-2"><Label>Terapia *</Label><Select value={need.terapia} onValueChange={val => handleNeedChange(index, 'terapia', val)} disabled={!selectedPatientId}><SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger><SelectContent>{availableSpecialties.map(s => <SelectItem key={s.id} value={s.name}>{s.name}</SelectItem>)}</SelectContent></Select></div>
                                    <div className="space-y-2"><Label>Sessões/Sem.</Label><Input type="number" min="1" value={need.frequencia} onChange={e => handleNeedChange(index, 'frequencia', parseInt(e.target.value, 10) || 1)} className="w-24 text-center"/></div>
                                    <Button type="button" variant="ghost" size="icon" onClick={() => removeNeed(index)} disabled={therapyNeeds.length === 1}><Trash2 className="h-4 w-4 text-red-500"/></Button>
                                </div>
                            ))}
                            <Button type="button" variant="outline" onClick={addNeed} className="w-full">Adicionar Outra Terapia</Button>
                         </CardContent>
                    </Card>

                    <Card>
                        <CardHeader><CardTitle className="flex items-center gap-2"><SlidersHorizontal className="text-primary-teal"/>3. Adicione Preferências (Opcional)</CardTitle></CardHeader>
                        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Turno de Preferência</Label>
                                <Select value={turnoPreferencial} onValueChange={(v) => setTurnoPreferencial(v === 'todos' ? undefined : v as any)}>
                                    <SelectTrigger><SelectValue placeholder="Qualquer Turno" /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="todos">Qualquer Turno</SelectItem>
                                        <SelectItem value="manha">Manhã (07:00 - 12:00)</SelectItem>
                                        <SelectItem value="tarde">Tarde (12:00 - 18:00)</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                             <div className="space-y-2">
                                <Label>Profissionais de Preferência</Label>
                                <MultiSelectFilter
                                    options={professionalOptions}
                                    selectedValues={profissionaisPreferidos}
                                    onSelectionChange={setProfissionaisPreferidos}
                                    placeholder="Todos qualificados"
                                />
                            </div>
                        </CardContent>
                    </Card>

                    <div className="text-center">
                        <Button onClick={handleFindSchedules} disabled={loading} size="lg" className="w-full">
                            <BrainCircuit className="mr-2 h-5 w-5"/>
                            {loading ? 'Analisando padrões...' : 'Encontrar Plano de Terapia Ideal'}
                        </Button>
                    </div>
                </div>

                {/* Coluna de Saída da IA */}
                <div className="sticky top-20">
                     {aiSuggestion && (
                        <Card className="bg-blue-50 border-blue-200">
                            <CardHeader><CardTitle className="flex items-center gap-2 text-blue-800"><Sparkles className="h-5 w-5"/> Plano de Terapia Sugerido</CardTitle></CardHeader>
                            <CardContent>
                                <div className="prose prose-sm max-w-none prose-p:my-2 prose-ul:my-2 prose-li:my-1" dangerouslySetInnerHTML={{ __html: aiSuggestion.replace(/\n/g, '<br />').replace(/\* /g, '• ') }} />
                            </CardContent>
                        </Card>
                    )}
                </div>
            </div>
        </div>
    );
}