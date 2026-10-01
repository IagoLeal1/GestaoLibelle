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
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, CalendarCheck, CalendarSearch, User, HeartPulse, SlidersHorizontal, Trash2 } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import { auth } from "@/lib/firebaseConfig";
import { MultiSelectFilter } from "@/components/ui/multi-select-filter";
import { PadraoDeHorario, SEMANAS_ANALISADAS, SugestaoDaTerapia } from "@/lib/horariosRecorrentes";

interface TherapyNeed {
  terapia: string;
  frequencia: number;
}

/** Um horário e em quantas das 12 semanas ele está livre (verde quando passa de 70%, como antes). */
function LinhaDeHorario({ opcao, comProfissional = false }: { opcao: PadraoDeHorario; comProfissional?: boolean }) {
    const livres = opcao.semanasLivres;
    return (
        <li className="flex flex-wrap items-center justify-between gap-2 text-sm">
            <span>{comProfissional && `${opcao.profissional.fullName}, `}{opcao.diaSemana}, {opcao.horario}</span>
            <Badge variant="outline" className={livres > SEMANAS_ANALISADAS * 0.7 ? "bg-green-100 text-green-800" : "bg-amber-100 text-amber-800"}>
                {livres === SEMANAS_ANALISADAS ? `livre nas ${SEMANAS_ANALISADAS} semanas` : `livre em ${livres} de ${SEMANAS_ANALISADAS} semanas`}
            </Badge>
        </li>
    );
}

function HorariosDaTerapia({ resultado }: { resultado: SugestaoDaTerapia }) {
    const { terapia, frequencia, sugestao, outrasOpcoes } = resultado;
    const chave = (o: PadraoDeHorario) => `${o.profissional.id}-${o.dia}-${o.horario}`;
    return (
        <div className="space-y-3">
            <h3 className="font-semibold">{terapia} <span className="font-normal text-muted-foreground">· {frequencia}x por semana</span></h3>
            {sugestao ? (
                <div className="space-y-2 rounded-lg border border-blue-200 bg-blue-50 p-3">
                    <p className="text-sm font-medium text-blue-900">Sugestão: {sugestao.profissional.fullName}</p>
                    <ul className="space-y-1">{sugestao.horarios.map((h) => <LinhaDeHorario key={chave(h)} opcao={h} />)}</ul>
                    {sugestao.horarios.length < frequencia && (
                        <p className="text-xs text-amber-800">
                            Só {sugestao.horarios.length === 1 ? "um dia livre" : `${sugestao.horarios.length} dias livres`} com o mesmo profissional. Veja as outras opções.
                        </p>
                    )}
                </div>
            ) : (
                <p className="text-sm text-muted-foreground">
                    Nenhum horário livre. Confira se há profissionais ativos dessa especialidade com dias e horários de atendimento cadastrados.
                </p>
            )}
            {outrasOpcoes.length > 0 && (
                <div className="space-y-1">
                    <p className="text-sm font-medium text-muted-foreground">Outras opções</p>
                    <ul className="space-y-1">{outrasOpcoes.map((o) => <LinhaDeHorario key={chave(o)} opcao={o} comProfissional />)}</ul>
                </div>
            )}
        </div>
    );
}

export default function AssistenteAgendamentoPage() {
    const [patients, setPatients] = useState<Patient[]>([]);
    const [specialties, setSpecialties] = useState<Specialty[]>([]);
    const [availableSpecialties, setAvailableSpecialties] = useState<Specialty[]>([]);
    const [professionals, setProfessionals] = useState<Professional[]>([]);
    const [selectedPatientId, setSelectedPatientId] = useState<string>('');
    const [therapyNeeds, setTherapyNeeds] = useState<TherapyNeed[]>([{ terapia: '', frequencia: 1 }]);
    const [loading, setLoading] = useState(true);
    const [sugestoes, setSugestoes] = useState<SugestaoDaTerapia[] | null>(null);

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
        setSugestoes(null);

        try {
            // O servidor só atende quem manda o login (e confere o papel no cadastro)
            const login = await auth.currentUser?.getIdToken();
            const response = await fetch('/api/schedule-assistant', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${login ?? ''}` },
                body: JSON.stringify({
                    patientId: selectedPatientId,
                    patientNeeds: therapyNeeds,
                    preferences: {
                        turno: turnoPreferencial,
                        profissionaisIds: profissionaisPreferidos
                    }
                }),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || "Não foi possível buscar os horários.");
            }

            const data = await response.json();
            setSugestoes(data.sugestoes);

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
                    <p className="text-muted-foreground">Encontra os horários semanais mais livres para o paciente nas próximas {SEMANAS_ANALISADAS} semanas.</p>
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
                                    <div className="space-y-2"><Label>Sessões/Sem.</Label><Input type="number" min="1" max="5" value={need.frequencia} onChange={e => handleNeedChange(index, 'frequencia', parseInt(e.target.value, 10) || 1)} className="w-24 text-center"/></div>
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
                            <CalendarSearch className="mr-2 h-5 w-5"/>
                            {loading ? 'Procurando horários...' : 'Encontrar horários'}
                        </Button>
                    </div>
                </div>

                {/* Coluna do resultado */}
                <div className="sticky top-20">
                     {sugestoes && (
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2"><CalendarCheck className="h-5 w-5 text-primary-teal"/> Horários sugeridos</CardTitle>
                                <CardDescription>Conta as próximas {SEMANAS_ANALISADAS} semanas da agenda do profissional e do paciente.</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                {sugestoes.map((resultado) => <HorariosDaTerapia key={resultado.terapia} resultado={resultado} />)}
                            </CardContent>
                        </Card>
                    )}
                </div>
            </div>
        </div>
    );
}