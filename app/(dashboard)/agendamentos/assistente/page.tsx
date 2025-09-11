// app/(dashboard)/agendamentos/assistente/page.tsx
"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Patient, getPatients } from "@/services/patientService";
import { Professional, getProfessionals } from "@/services/professionalService"; // Importar Profissionais
import { getSpecialties, Specialty } from "@/services/specialtyService";
import { ArrowLeft, BrainCircuit, Sparkles } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import { MultiSelectFilter } from "@/components/ui/multi-select-filter"; // Importar o MultiSelect

interface TherapyNeed {
  terapia: string;
  frequencia: number;
}

export default function AssistenteAgendamentoPage() {
    const [patients, setPatients] = useState<Patient[]>([]);
    const [specialties, setSpecialties] = useState<Specialty[]>([]);
    const [professionals, setProfessionals] = useState<Professional[]>([]); // Estado para profissionais
    const [selectedPatientId, setSelectedPatientId] = useState<string>('');
    const [therapyNeeds, setTherapyNeeds] = useState<TherapyNeed[]>([{ terapia: '', frequencia: 1 }]);
    const [loading, setLoading] = useState(false);
    const [aiSuggestion, setAiSuggestion] = useState<string>('');
    
    // Estados para os novos filtros
    const [turnoPreferencial, setTurnoPreferencial] = useState<'manha' | 'tarde' | 'noite' | undefined>(undefined);
    const [profissionaisPreferidos, setProfissionaisPreferidos] = useState<string[]>([]);

    useEffect(() => {
        const loadData = async () => {
            // Agora também buscamos os profissionais para o filtro
            const [patientsData, specialtiesData, professionalsData] = await Promise.all([
                getPatients(), 
                getSpecialties(),
                getProfessionals()
            ]);
            setPatients(patientsData);
            setSpecialties(specialtiesData);
            setProfessionals(professionalsData);
        };
        loadData();
    }, []);

    const handleFindSchedules = async () => {
        if (!selectedPatientId || therapyNeeds.some(n => !n.terapia || n.frequencia < 1)) {
            toast.error("Por favor, selecione um paciente e preencha as terapias necessárias.");
            return;
        }
        setLoading(true);
        setAiSuggestion('');

        try {
            // A página agora envia as necessidades e as preferências do usuário.
            // A API tratará de encontrar os padrões e consultar a IA.
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

    // Opções para o MultiSelect de profissionais
    const professionalOptions = professionals.map(p => ({ value: p.id, label: p.fullName }));

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-4">
                <Link href="/agendamentos"><Button variant="ghost" size="icon"><ArrowLeft/></Button></Link>
                <div>
                    <h2 className="text-2xl font-bold tracking-tight">Planeador de Terapia Contínua</h2>
                    <p className="text-muted-foreground">Deixe a IA encontrar a melhor grade de horários a longo prazo para o seu paciente.</p>
                </div>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>1. Necessidades e Preferências</CardTitle>
                    <CardDescription>Selecione o paciente, as terapias e as preferências para a montagem da grade.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    {/* Seleção do Paciente */}
                    <div className="space-y-2">
                        <Label>Paciente *</Label>
                        <Select value={selectedPatientId} onValueChange={setSelectedPatientId}>
                            <SelectTrigger><SelectValue placeholder="Selecione um paciente..." /></SelectTrigger>
                            <SelectContent>{patients.map(p => <SelectItem key={p.id} value={p.id}>{p.fullName}</SelectItem>)}</SelectContent>
                        </Select>
                    </div>

                    {/* Necessidades de Terapia */}
                    {therapyNeeds.map((need, index) => (
                        <div key={index} className="flex items-end gap-2 p-2 border rounded-md">
                            <div className="flex-1 space-y-2"><Label>Terapia *</Label><Select value={need.terapia} onValueChange={val => handleNeedChange(index, 'terapia', val)}><SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger><SelectContent>{specialties.map(s => <SelectItem key={s.id} value={s.name}>{s.name}</SelectItem>)}</SelectContent></Select></div>
                            <div className="space-y-2"><Label>Sessões/Semana *</Label><Input type="number" min="1" value={need.frequencia} onChange={e => handleNeedChange(index, 'frequencia', parseInt(e.target.value, 10) || 1)} className="w-24 text-center"/></div>
                            <Button type="button" variant="ghost" size="icon" onClick={() => removeNeed(index)} disabled={therapyNeeds.length === 1}>✕</Button>
                        </div>
                    ))}
                    <Button type="button" variant="outline" onClick={addNeed} className="w-full">Adicionar Outra Terapia</Button>
                    
                    {/* Filtros de Preferência */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t">
                        <div className="space-y-2">
                            <Label>Turno de Preferência (Opcional)</Label>
                            <Select value={turnoPreferencial} onValueChange={(v) => setTurnoPreferencial(v as any)}>
                                <SelectTrigger><SelectValue placeholder="Qualquer turno" /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="manha">Manhã (07:00 - 12:00)</SelectItem>
                                    <SelectItem value="tarde">Tarde (12:00 - 18:00)</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                         <div className="space-y-2">
                            <Label>Profissionais de Preferência (Opcional)</Label>
                            <MultiSelectFilter
                                options={professionalOptions}
                                selectedValues={profissionaisPreferidos}
                                onSelectionChange={setProfissionaisPreferidos}
                                placeholder="Todos os profissionais qualificados"
                            />
                        </div>
                    </div>
                </CardContent>
            </Card>

            <div className="text-center">
                <Button onClick={handleFindSchedules} disabled={loading} size="lg">
                    <BrainCircuit className="mr-2 h-5 w-5"/>
                    {loading ? 'Analisando padrões...' : 'Encontrar Plano de Terapia Ideal'}
                </Button>
            </div>

            {aiSuggestion && (
                <Card className="bg-blue-50 border-blue-200">
                    <CardHeader><CardTitle className="flex items-center gap-2 text-blue-800"><Sparkles className="h-5 w-5"/> Plano de Terapia Sugerido</CardTitle></CardHeader>
                    <CardContent>
                        <div className="prose prose-sm max-w-none" dangerouslySetInnerHTML={{ __html: aiSuggestion.replace(/\n/g, '<br />') }} />
                    </CardContent>
                </Card>
            )}
        </div>
    );
}