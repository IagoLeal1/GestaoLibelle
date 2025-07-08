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

// <<< PASSO 1: DEFINIMOS AS PROPRIEDADES QUE O COMPONENTE PODE RECEBER
interface PatientFormProps {
  initialData?: Patient | null;
}

// <<< PASSO 2: O COMPONENTE AGORA "ENTENDE" E RECEBE A PROP 'initialData'
export function PatientForm({ initialData }: PatientFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [formData, setFormData] = useState<PatientFormData>({
    fullName: "", cpf: "", rg: "", dataNascimento: "", sexo: "", telefone: "", celular: "",
    email: "", endereco: "", numero: "", complemento: "", bairro: "", cidade: "", cep: "",
    estado: "", profissao: "", estadoCivil: "", observacoes: "",
  });

  // <<< PASSO 3: ESTE useEffect USA 'initialData' PARA PREENCHER O FORMULÁRIO
  // Use este useEffect completo
  useEffect(() => {
    if (initialData) {
      setFormData({
        fullName: initialData.fullName || "",
        dataNascimento: initialData.dataNascimento?.toDate().toISOString().split('T')[0] || "",
        cpf: initialData.cpf || "",
        rg: initialData.rg || "",
        sexo: initialData.sexo || "",
        telefone: initialData.telefone || "",
        celular: initialData.celular || "",
        email: initialData.email || "",
        endereco: initialData.endereco || "",
        numero: initialData.numero || "",
        complemento: initialData.complemento || "",
        bairro: initialData.bairro || "",
        cidade: initialData.cidade || "",
        cep: initialData.cep || "",
        estado: initialData.estado || "",
        profissao: initialData.profissao || "",
        estadoCivil: initialData.estadoCivil || "",
        observacoes: initialData.observacoes || "",
      });
    }
  }, [initialData]);


  const handleInputChange = (field: keyof PatientFormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      let result;
      // Se temos initialData, estamos editando. Senão, estamos criando.
      if (initialData) {
        result = await updatePatient(initialData.id, formData);
      } else {
        result = await createPatient(formData);
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
    // O JSX completo do formulário continua aqui...
    <form onSubmit={handleSubmit} className="space-y-6">
      <Card>
        <CardHeader><CardTitle className="flex items-center gap-2"><User /> Dados Pessoais</CardTitle></CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <div className="space-y-2 md:col-span-2"><Label htmlFor="fullName">Nome Completo *</Label><Input id="fullName" value={formData.fullName} onChange={(e) => handleInputChange("fullName", e.target.value)} required /></div>
            <div className="space-y-2"><Label htmlFor="dataNascimento">Data de Nascimento *</Label><Input id="dataNascimento" type="date" value={formData.dataNascimento} onChange={(e) => handleInputChange("dataNascimento", e.target.value)} required /></div>
            {/* ... etc ... */}
          </div>
        </CardContent>
      </Card>
      
      {/* ... outros cards do formulário ... */}

      {error && <p className="text-sm font-medium text-red-500">{error}</p>}
      <div className="flex justify-end gap-4">
        <Button type="button" variant="outline" onClick={() => router.push('/pacientes')}>Cancelar</Button>
        <Button type="submit" disabled={loading}>{loading ? "Salvando..." : (initialData ? "Salvar Alterações" : "Salvar Paciente")}</Button>
      </div>
    </form>
  )
}