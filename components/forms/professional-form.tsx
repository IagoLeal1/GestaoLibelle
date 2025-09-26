"use client"

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { useForm, Controller, useWatch, useFieldArray } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { getProfessionalById, updateProfessional, createProfessional, ProfessionalFormData } from "@/services/professionalService";
import { Trash2 } from "lucide-react";

const DIAS_SEMANA = [
  { id: 'segunda', label: 'Seg' }, { id: 'terca', label: 'Ter' },
  { id: 'quarta', label: 'Qua' }, { id: 'quinta', label: 'Qui' },
  { id: 'sexta', label: 'Sex' }, { id: 'sabado', label: 'Sáb' },
  { id: 'domingo', label: 'Dom' },
];

export function ProfessionalForm() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string | undefined;

  const { register, handleSubmit, control, reset, formState: { errors } } = useForm<ProfessionalFormData>({
    defaultValues: {
      fullName: '',
      especialidade: '',
      email: '',
      cpf: '',
      celular: '',
      telefone: '',
      conselho: '',
      numeroConselho: '',
      diasAtendimento: [],
      horarioInicio: '08:00',
      horarioFim: '18:00',
      financeiro: {
        tipoPagamento: 'repasse',
        percentualRepasse: 70,
        horarioFixoInicio: '',
        horarioFixoFim: '',
        regrasEspeciais: []
      }
    }
  });
  
  const [loading, setLoading] = useState(!!id);
  const [serverError, setServerError] = useState<string | null>(null);
  const isEditMode = !!id;

  const { fields, append, remove } = useFieldArray({
    control,
    name: "financeiro.regrasEspeciais",
  });

  const tipoPagamento = useWatch({
    control,
    name: "financeiro.tipoPagamento",
    defaultValue: "repasse"
  });

  useEffect(() => {
    if (id) {
      const fetchProfessional = async () => {
        setLoading(true);
        const professional = await getProfessionalById(id);
        if (professional) {
          reset(professional);
        } else {
          setServerError("Profissional não encontrado.");
        }
        setLoading(false);
      };
      fetchProfessional();
    }
  }, [id, reset]);

  const onSubmit = async (data: ProfessionalFormData) => {
    setLoading(true);
    setServerError(null);
    
    if (data.financeiro.percentualRepasse) {
        data.financeiro.percentualRepasse = Number(data.financeiro.percentualRepasse);
    }
    if (data.financeiro.regrasEspeciais) {
      data.financeiro.regrasEspeciais = data.financeiro.regrasEspeciais.map(rule => ({
        ...rule,
        percentual: Number(rule.percentual)
      }));
    }

    const result = isEditMode && id
      ? await updateProfessional(id, data)
      : await createProfessional(data);

    setLoading(false);
    if (result.success) {
      alert(`Profissional ${isEditMode ? 'atualizado' : 'cadastrado'} com sucesso!`);
      router.push('/profissionais');
      router.refresh();
    } else {
      setServerError(result.error || "Ocorreu um erro.");
    }
  };

  if (loading && isEditMode) {
    return <p className="text-center p-8">Carregando dados do profissional...</p>;
  }
  
  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <Card>
        <CardHeader><CardTitle>Informações Pessoais e Contato</CardTitle></CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="space-y-2 lg:col-span-2"><Label htmlFor="fullName">Nome Completo *</Label><Input id="fullName" {...register("fullName", { required: "Nome é obrigatório" })} /><p className="text-xs text-red-500">{errors.fullName?.message}</p></div>
          <div className="space-y-2"><Label htmlFor="especialidade">Especialidade *</Label><Input id="especialidade" {...register("especialidade", { required: true })} /></div>
          <div className="space-y-2"><Label htmlFor="email">Email *</Label><Input id="email" type="email" {...register("email", { required: true })} /></div>
          <div className="space-y-2"><Label htmlFor="cpf">CPF *</Label><Input id="cpf" {...register("cpf", { required: true })} /></div>
          <div className="space-y-2"><Label htmlFor="celular">Celular *</Label><Input id="celular" {...register("celular", { required: true })} /></div>
          <div className="space-y-2"><Label htmlFor="telefone">Telefone</Label><Input id="telefone" {...register("telefone")} /></div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Informações Profissionais e Financeiras</CardTitle></CardHeader>
        <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2"><Label htmlFor="conselho">Conselho (Ex: CRP)</Label><Input id="conselho" {...register("conselho")} /></div>
                <div className="space-y-2"><Label htmlFor="numeroConselho">Nº do Conselho</Label><Input id="numeroConselho" {...register("numeroConselho")} /></div>
            </div>
            
            <div className="border-t pt-4">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <div className="space-y-2">
                        <Label>Tipo de Pagamento</Label>
                        <Controller
                            name="financeiro.tipoPagamento"
                            control={control}
                            defaultValue="repasse"
                            render={({ field }) => (
                                <Select onValueChange={field.onChange} value={field.value}>
                                    <SelectTrigger><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="repasse">Repasse</SelectItem>
                                        <SelectItem value="fixo">Fixo</SelectItem>
                                        <SelectItem value="ambos">Ambos</SelectItem>
                                    </SelectContent>
                                </Select>
                            )}
                        />
                    </div>
                    
                    {(tipoPagamento === 'repasse' || tipoPagamento === 'ambos') && (
                        <div className="space-y-2">
                            <Label>Repasse Padrão (%)</Label>
                            <Input type="number" {...register("financeiro.percentualRepasse")} />
                        </div>
                    )}
                </div>

                {tipoPagamento === 'ambos' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
                        <div className="space-y-2"><Label>Início do Horário Fixo</Label><Input type="time" {...register("financeiro.horarioFixoInicio")} /></div>
                        <div className="space-y-2"><Label>Fim do Horário Fixo</Label><Input type="time" {...register("financeiro.horarioFixoFim")} /></div>
                    </div>
                )}
            </div>

            {(tipoPagamento === 'repasse' || tipoPagamento === 'ambos') && (
              <div className="border-t pt-4">
                <h3 className="text-md font-medium mb-2">Regras Especiais de Repasse</h3>
                <div className="space-y-2">
                  {fields.map((field, index) => (
                    <div key={field.id} className="flex items-end gap-2">
                      <div className="flex-1 space-y-2">
                        <Label>Especialidade</Label>
                        <Input 
                          {...register(`financeiro.regrasEspeciais.${index}.especialidade` as const)}
                          placeholder="Ex: Acompanhante Terapêutico"
                        />
                      </div>
                      <div className="w-32 space-y-2">
                        <Label>Percentual (%)</Label>
                        <Input 
                          type="number"
                          {...register(`financeiro.regrasEspeciais.${index}.percentual` as const)}
                        />
                      </div>
                      <Button type="button" variant="destructive" size="icon" onClick={() => remove(index)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
                <Button 
                  type="button" 
                  variant="outline" 
                  className="mt-4"
                  onClick={() => append({ especialidade: '', percentual: 100 })}>
                  Adicionar Regra
                </Button>
              </div>
            )}
            
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader><CardTitle>Dias e Horários de Atendimento</CardTitle></CardHeader>
        <CardContent>
            <div className="space-y-4">
                <div>
                    <Label>Dias de Atendimento</Label>
                    <div className="flex flex-wrap gap-4 pt-2">
                        {DIAS_SEMANA.map(dia => (
                            <div key={dia.id} className="flex items-center space-x-2">
                                <Controller
                                    name="diasAtendimento"
                                    control={control}
                                    render={({ field }) => (
                                        <Checkbox
                                            id={dia.id}
                                            checked={field.value?.includes(dia.id)}
                                            onCheckedChange={(checked) => {
                                                const currentValues = field.value || [];
                                                if (checked) {
                                                    field.onChange([...currentValues, dia.id]);
                                                } else {
                                                    field.onChange(currentValues.filter(value => value !== dia.id));
                                                }
                                            }}
                                        />
                                    )}
                                />
                                <label htmlFor={dia.id} className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">{dia.label}</label>
                            </div>
                        ))}
                    </div>
                </div>
                <div className="grid grid-cols-2 gap-4 pt-4 border-t">
                    <div className="space-y-2"><Label htmlFor="horarioInicio">Horário de Início</Label><Input id="horarioInicio" type="time" {...register("horarioInicio")} /></div>
                    <div className="space-y-2"><Label htmlFor="horarioFim">Horário de Fim</Label><Input id="horarioFim" type="time" {...register("horarioFim")} /></div>
                </div>
            </div>
        </CardContent>
      </Card>
      
      {serverError && <p className="text-red-500 text-center">{serverError}</p>}
      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={() => router.back()}>Cancelar</Button>
        <Button type="submit" disabled={loading}>{loading ? "Salvando..." : (isEditMode ? "Salvar Alterações" : "Salvar Profissional")}</Button>
      </div>
    </form>
  );
}