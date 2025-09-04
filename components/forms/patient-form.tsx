"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { User, Phone, MapPin } from "lucide-react"

import { createPatient, updatePatient, PatientFormData } from "@/services/patientService"
import { Patient } from "@/services/patientService"

interface PatientFormProps {
  initialData?: Patient | null;
}

// O componente foi totalmente refatorado para usar a estrutura de dados correta
export function PatientForm({ initialData }: PatientFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // 1. Estado inicial com a estrutura aninhada correta para 'responsavel'
  const [formData, setFormData] = useState<Partial<PatientFormData>>({
    fullName: "",
    cpf: "",
    dataNascimento: "",
    responsavel: {
      nome: "",
      cpf: "",
      celular: "",
    },
  });

  // 2. useEffect corrigido para ler e preencher a estrutura aninhada
  useEffect(() => {
    if (initialData) {
      setFormData({
        fullName: initialData.fullName || "",
        dataNascimento: initialData.dataNascimento?.toDate().toISOString().split('T')[0] || "",
        cpf: initialData.cpf || "",
        rg: initialData.rg || "",
        sexo: initialData.sexo || "",
        convenio: initialData.convenio || "",
        
        responsavel: {
          nome: initialData.responsavel?.nome || "",
          cpf: initialData.responsavel?.cpf || "",
          celular: initialData.responsavel?.celular || "",
          email: initialData.responsavel?.email || "",
          profissao: initialData.responsavel?.profissao || "",
          estadoCivil: initialData.responsavel?.estadoCivil || "",
        },

        endereco: initialData.endereco || "",
        numero: initialData.numero || "",
        complemento: initialData.complemento || "",
        bairro: initialData.bairro || "",
        cidade: initialData.cidade || "",
        cep: initialData.cep || "",
        estado: initialData.estado || "",
        observacoes: initialData.observacoes || "",
      });
    }
  }, [initialData]);

  // 3. handleInputChange agora entende campos aninhados
  const handleInputChange = (field: keyof PatientFormData | keyof NonNullable<PatientFormData['responsavel']>, value: string, parentField?: 'responsavel') => {
    if (parentField) {
        setFormData(prev => ({
            ...prev,
            [parentField]: {
                ...(prev[parentField] || {}),
                [field]: value
            }
        }));
    } else {
        setFormData(prev => ({ ...prev, [field]: value }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      let result;
      if (initialData) {
        result = await updatePatient(initialData.id, formData as PatientFormData);
      } else {
        result = await createPatient(formData as PatientFormData);
      }

      if (result.success) {
        alert(`Paciente ${initialData ? 'atualizado' : 'cadastrado'} com sucesso!`);
        router.push('/pacientes');
        router.refresh(); 
      } else {
        setError(result.error || "Ocorreu um erro.");
      }
    } catch (err) {
      setError("Ocorreu um erro inesperado.");
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Dados Pessoais do PACIENTE */}
      <Card>
        <CardHeader><CardTitle className="flex items-center gap-2"><User /> Dados Pessoais do Paciente</CardTitle></CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <div className="space-y-2 md:col-span-2"><Label htmlFor="fullName">Nome Completo *</Label><Input id="fullName" value={formData.fullName || ''} onChange={(e) => handleInputChange("fullName", e.target.value)} required /></div>
            <div className="space-y-2"><Label htmlFor="dataNascimento">Data de Nascimento *</Label><Input id="dataNascimento" type="date" value={formData.dataNascimento || ''} onChange={(e) => handleInputChange("dataNascimento", e.target.value)} required /></div>
            <div className="space-y-2"><Label htmlFor="cpf">CPF *</Label><Input id="cpf" value={formData.cpf || ''} onChange={(e) => handleInputChange("cpf", e.target.value)} required /></div>
            <div className="space-y-2"><Label htmlFor="rg">RG</Label><Input id="rg" value={formData.rg || ''} onChange={(e) => handleInputChange("rg", e.target.value)} /></div>
            <div className="space-y-2"><Label htmlFor="sexo">Sexo</Label><Select value={formData.sexo} onValueChange={(value) => handleInputChange("sexo", value)}><SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger><SelectContent><SelectItem value="masculino">Masculino</SelectItem><SelectItem value="feminino">Feminino</SelectItem><SelectItem value="outro">Outro</SelectItem></SelectContent></Select></div>
            <div className="space-y-2"><Label htmlFor="convenio">Convênio</Label><Input id="convenio" value={formData.convenio || ''} onChange={(e) => handleInputChange("convenio", e.target.value)} /></div>
          </div>
        </CardContent>
      </Card>

      {/* 4. Inputs do responsável atualizados para o formato aninhado */}
      <Card>
        <CardHeader><CardTitle className="flex items-center gap-2"><Phone /> Contato do Responsável</CardTitle></CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <div className="space-y-2 md:col-span-2"><Label htmlFor="responsavelNome">Nome Completo *</Label><Input id="responsavelNome" value={formData.responsavel?.nome || ''} onChange={(e) => handleInputChange("nome", e.target.value, "responsavel")} required /></div>
            <div className="space-y-2"><Label htmlFor="responsavelCpf">CPF</Label><Input id="responsavelCpf" value={formData.responsavel?.cpf || ''} onChange={(e) => handleInputChange("cpf", e.target.value, "responsavel")} /></div>
            <div className="space-y-2"><Label htmlFor="responsavelCelular">Celular *</Label><Input id="responsavelCelular" value={formData.responsavel?.celular || ''} onChange={(e) => handleInputChange("celular", e.target.value, "responsavel")} required /></div>
            <div className="space-y-2"><Label htmlFor="responsavelProfissao">Profissão</Label><Input id="responsavelProfissao" value={formData.responsavel?.profissao || ''} onChange={(e) => handleInputChange("profissao", e.target.value, "responsavel")} /></div>
            <div className="space-y-2"><Label htmlFor="responsavelEmail">E-mail</Label><Input id="responsavelEmail" type="email" value={formData.responsavel?.email || ''} onChange={(e) => handleInputChange("email", e.target.value, "responsavel")} /></div>
            <div className="space-y-2"><Label htmlFor="responsavelEstadoCivil">Estado Civil</Label><Select value={formData.responsavel?.estadoCivil} onValueChange={(value) => handleInputChange("estadoCivil", value, "responsavel")}><SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger><SelectContent><SelectItem value="solteiro">Solteiro(a)</SelectItem><SelectItem value="casado">Casado(a)</SelectItem><SelectItem value="divorciado">Divorciado(a)</SelectItem><SelectItem value="viuvo">Viúvo(a)</SelectItem><SelectItem value="uniao-estavel">União Estável</SelectItem></SelectContent></Select></div>
          </div>
        </CardContent>
      </Card>
      
      {error && <p className="text-sm font-medium text-red-500">{error}</p>}
      <div className="flex justify-end gap-4">
        <Button type="button" variant="outline" onClick={() => router.push('/pacientes')}>Cancelar</Button>
        <Button type="submit" disabled={loading}>{loading ? "Salvando..." : (initialData ? "Salvar Alterações" : "Salvar Paciente")}</Button>
      </div>
    </form>
  )
}