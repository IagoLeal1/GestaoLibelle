"use client"

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { useForm, Controller } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { getProfessionalById, updateProfessional, createProfessional, ProfessionalFormData, Professional } from "@/services/professionalService";

const DIAS_SEMANA = [
  { id: 'segunda', label: 'Seg' }, { id: 'terca', label: 'Ter' },
  { id: 'quarta', label: 'Qua' }, { id: 'quinta', label: 'Qui' },
  { id: 'sexta', label: 'Sex' }, { id: 'sabado', label: 'Sáb' },
  { id: 'domingo', label: 'Dom' },
];

// O formulário não recebe props, ele busca seus próprios dados
export function ProfessionalForm() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string | undefined;

  const { register, handleSubmit, control, reset, formState: { errors } } = useForm<ProfessionalFormData>();
  const [loading, setLoading] = useState(!!id);
  const [serverError, setServerError] = useState<string | null>(null);
  const [isEditMode, setIsEditMode] = useState(!!id);

  useEffect(() => {
    if (id) {
      // --- ESPIONANDO O PROCESSO ---
      console.log("DEBUG 1: ID do profissional encontrado na URL:", id);

      const fetchProfessional = async () => {
        setLoading(true);
        const professional = await getProfessionalById(id);

        console.log("DEBUG 2: Dados recebidos do Firebase:", professional);

        if (professional) {
          // Os dados do Firebase (com Timestamp) são convertidos para o formato do formulário (com string de data)
          const formDataToSet = {
            ...professional,
            percentualRepasse: professional.financeiro?.percentualRepasse || 0,
            valorConsulta: professional.financeiro?.valorConsulta || 0,
            // A data de contratação não está no formulário, então não precisamos formatá-la aqui
          };
          
          console.log("DEBUG 3: Dados que serão preenchidos no formulário:", formDataToSet);
          
          reset(formDataToSet); // Preenche o formulário com os dados
        } else {
          console.error("DEBUG 4: Profissional não encontrado para o ID:", id);
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
    
    let result;
    if (isEditMode && id) {
      result = await updateProfessional(id, data);
    } else {
      result = await createProfessional(data);
    }

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
        <CardContent className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="space-y-2"><Label htmlFor="conselho">Conselho (Ex: CRP)</Label><Input id="conselho" {...register("conselho")} /></div>
          <div className="space-y-2"><Label htmlFor="numeroConselho">Nº do Conselho</Label><Input id="numeroConselho" {...register("numeroConselho")} /></div>
          <div className="space-y-2"><Label htmlFor="percentualRepasse">Repasse (%)</Label><Input id="percentualRepasse" type="number" {...register("percentualRepasse", { valueAsNumber: true })} /></div>
          <div className="space-y-2"><Label htmlFor="valorConsulta">Valor Consulta (R$)</Label><Input id="valorConsulta" type="number" step="0.01" {...register("valorConsulta", { valueAsNumber: true })} /></div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader><CardTitle>Dias e Horários de Atendimento</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label className="mb-2 block">Dias da Semana</Label>
            <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-4">
              <Controller
                name="diasAtendimento"
                control={control}
                render={({ field }) => (
                  <>
                    {DIAS_SEMANA.map(dia => (
                      <div key={dia.id} className="flex items-center space-x-2">
                        <Checkbox
                          id={dia.id}
                          checked={field.value?.includes(dia.id)}
                          onCheckedChange={(checked) => {
                            const currentValue = field.value || [];
                            return checked
                              ? field.onChange([...currentValue, dia.id])
                              : field.onChange(currentValue.filter(value => value !== dia.id));
                          }}
                        />
                        <Label htmlFor={dia.id} className="font-normal">{dia.label}</Label>
                      </div>
                    ))}
                  </>
                )}
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4 pt-4">
            <div className="space-y-2"><Label htmlFor="horarioInicio">Horário de Início</Label><Input id="horarioInicio" type="time" {...register("horarioInicio")} /></div>
            <div className="space-y-2"><Label htmlFor="horarioFim">Horário de Fim</Label><Input id="horarioFim" type="time" {...register("horarioFim")} /></div>
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