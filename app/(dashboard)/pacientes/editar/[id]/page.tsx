"use client"

import { useState, useEffect } from "react"
import { useRouter, useParams } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { ArrowLeft, User, Phone, MapPin, AlertCircle } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { getPatientById, updatePatient, PatientFormData } from "@/services/patientService"

export default function EditPatientPage() {
  const router = useRouter();
  const params = useParams();
  const patientId = params.id as string;

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState<Partial<PatientFormData>>({
      // Inicializa o estado com a estrutura aninhada para evitar erros de tipo
      responsavel: {} 
  });

  // useEffect para buscar e preencher os dados do paciente com a estrutura correta
  useEffect(() => {
    if (!patientId) return;

    const fetchPatientData = async () => {
      setLoading(true);
      const patient = await getPatientById(patientId);
      
      if (patient) {
        // Mapeia os dados do Firestore (com objeto aninhado) para o estado do formulário
        setFormData({
          fullName: patient.fullName,
          dataNascimento: patient.dataNascimento?.toDate().toISOString().split('T')[0] || "",
          cpf: patient.cpf,
          rg: patient.rg,
          sexo: patient.sexo,
          convenio: patient.convenio,
          
          responsavel: {
            nome: patient.responsavel?.nome,
            celular: patient.responsavel?.celular,
            telefone: patient.responsavel?.telefone,
            email: patient.responsavel?.email,
            profissao: patient.responsavel?.profissao,
            estadoCivil: patient.responsavel?.estadoCivil,
          },

          endereco: patient.endereco,
          numero: patient.numero,
          complemento: patient.complemento,
          bairro: patient.bairro,
          cidade: patient.cidade,
          cep: patient.cep,
          estado: patient.estado,
          observacoes: patient.observacoes,
        });
      } else {
        setError("Paciente não encontrado.");
      }
      setLoading(false);
    };

    fetchPatientData();
  }, [patientId]);

  // Handler de input aprimorado que lida com campos aninhados e aplica máscaras
  const handleInputChange = (field: keyof PatientFormData | keyof NonNullable<PatientFormData['responsavel']>, value: string, parentField?: 'responsavel') => {
    let formattedValue = value;
    const phoneFields = ['celular', 'telefone'];
    if (field === 'cpf') {
        formattedValue = value.replace(/\D/g, '').replace(/(\d{3})(\d)/, '$1.$2').replace(/(\d{3})(\d)/, '$1.$2').replace(/(\d{3})(\d{1,2})/, '$1-$2').substring(0, 14);
    } else if (phoneFields.includes(field)) {
        formattedValue = value.replace(/\D/g, '').replace(/^(\d{2})(\d)/g, '($1) $2').replace(/(\d{5})(\d)/, '$1-$2').substring(0, 15);
    } else if (field === 'cep') {
        formattedValue = value.replace(/\D/g, '').replace(/^(\d{5})(\d)/, '$1-$2').substring(0, 9);
    }

    if (parentField) {
        setFormData(prev => ({
            ...prev,
            [parentField]: {
                ...(prev[parentField] || {}),
                [field]: formattedValue
            }
        }));
    } else {
        setFormData(prev => ({ ...prev, [field]: formattedValue }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    if (!formData.fullName || !formData.dataNascimento || !formData.cpf || !formData.responsavel?.celular || !formData.responsavel?.nome) {
        setError("Nome do Paciente, Data de Nascimento, CPF, Nome do Responsável e Celular do Responsável são obrigatórios.");
        setLoading(false);
        return;
    }

    const result = await updatePatient(patientId, formData as PatientFormData);

    setLoading(false);
    if (result.success) {
      alert("Paciente atualizado com sucesso!");
      router.push('/pacientes');
      router.refresh();
    } else {
      setError(result.error || "Ocorreu um erro ao atualizar.");
    }
  };

  if (loading) return <p className="p-4 text-center">Carregando dados do paciente...</p>;
  if (error) return <p className="p-4 text-center text-red-500">{error}</p>

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/pacientes"><Button variant="ghost" size="icon"><ArrowLeft className="h-4 w-4" /></Button></Link>
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Editar Paciente</h2>
          <p className="text-muted-foreground">Altere os dados de {formData.fullName}</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {error && (
            <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Erro na atualização</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
            </Alert>
        )}

        {/* Dados Pessoais do PACIENTE */}
        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2"><User className="h-5 w-5" /> Dados Pessoais do Paciente</CardTitle></CardHeader>
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

        {/* Dados do RESPONSÁVEL */}
        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2"><Phone className="h-5 w-5" /> Contato do Responsável</CardTitle></CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              <div className="space-y-2 md:col-span-2"><Label htmlFor="responsavelNome">Nome Completo do Responsável *</Label><Input id="responsavelNome" value={formData.responsavel?.nome || ''} onChange={(e) => handleInputChange("nome", e.target.value, "responsavel")} required /></div>
              <div className="space-y-2"><Label htmlFor="responsavelTelefone">Telefone</Label><Input id="responsavelTelefone" value={formData.responsavel?.telefone || ''} onChange={(e) => handleInputChange("telefone", e.target.value, "responsavel")} /></div>
              <div className="space-y-2"><Label htmlFor="responsavelCelular">Celular *</Label><Input id="responsavelCelular" value={formData.responsavel?.celular || ''} onChange={(e) => handleInputChange("celular", e.target.value, "responsavel")} required /></div>
              <div className="space-y-2"><Label htmlFor="responsavelProfissao">Profissão</Label><Input id="responsavelProfissao" value={formData.responsavel?.profissao || ''} onChange={(e) => handleInputChange("profissao", e.target.value, "responsavel")} /></div>
              <div className="space-y-2"><Label htmlFor="responsavelEmail">E-mail</Label><Input id="responsavelEmail" type="email" value={formData.responsavel?.email || ''} onChange={(e) => handleInputChange("email", e.target.value, "responsavel")} /></div>
              <div className="space-y-2"><Label htmlFor="responsavelEstadoCivil">Estado Civil</Label><Select value={formData.responsavel?.estadoCivil} onValueChange={(value) => handleInputChange("estadoCivil", value, "responsavel")}><SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger><SelectContent><SelectItem value="solteiro">Solteiro(a)</SelectItem><SelectItem value="casado">Casado(a)</SelectItem><SelectItem value="divorciado">Divorciado(a)</SelectItem><SelectItem value="viuvo">Viúvo(a)</SelectItem><SelectItem value="uniao-estavel">União Estável</SelectItem></SelectContent></Select></div>
            </div>
          </CardContent>
        </Card>

        {/* Endereço */}
        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2"><MapPin className="h-5 w-5" /> Endereço</CardTitle></CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <div className="space-y-2"><Label htmlFor="cep">CEP</Label><Input id="cep" value={formData.cep || ''} onChange={(e) => handleInputChange("cep", e.target.value)} /></div>
              <div className="space-y-2 lg:col-span-2"><Label htmlFor="endereco">Endereço</Label><Input id="endereco" value={formData.endereco || ''} onChange={(e) => handleInputChange("endereco", e.target.value)} /></div>
              <div className="space-y-2"><Label htmlFor="numero">Número</Label><Input id="numero" value={formData.numero || ''} onChange={(e) => handleInputChange("numero", e.target.value)} /></div>
              <div className="space-y-2"><Label htmlFor="complemento">Complemento</Label><Input id="complemento" value={formData.complemento || ''} onChange={(e) => handleInputChange("complemento", e.target.value)} /></div>
              <div className="space-y-2"><Label htmlFor="bairro">Bairro</Label><Input id="bairro" value={formData.bairro || ''} onChange={(e) => handleInputChange("bairro", e.target.value)} /></div>
              <div className="space-y-2"><Label htmlFor="cidade">Cidade</Label><Input id="cidade" value={formData.cidade || ''} onChange={(e) => handleInputChange("cidade", e.target.value)} /></div>
              <div className="space-y-2"><Label htmlFor="estado">Estado</Label><Select value={formData.estado} onValueChange={(value) => handleInputChange("estado", value)}><SelectTrigger><SelectValue placeholder="UF" /></SelectTrigger><SelectContent>
                  <SelectItem value="AC">AC</SelectItem><SelectItem value="AL">AL</SelectItem><SelectItem value="AP">AP</SelectItem>
                  <SelectItem value="AM">AM</SelectItem><SelectItem value="BA">BA</SelectItem><SelectItem value="CE">CE</SelectItem>
                  <SelectItem value="DF">DF</SelectItem><SelectItem value="ES">ES</SelectItem><SelectItem value="GO">GO</SelectItem>
                  <SelectItem value="MA">MA</SelectItem><SelectItem value="MT">MT</SelectItem><SelectItem value="MS">MS</SelectItem>
                  <SelectItem value="MG">MG</SelectItem><SelectItem value="PA">PA</SelectItem><SelectItem value="PB">PB</SelectItem>
                  <SelectItem value="PR">PR</SelectItem><SelectItem value="PE">PE</SelectItem><SelectItem value="PI">PI</SelectItem>
                  <SelectItem value="RJ">RJ</SelectItem><SelectItem value="RN">RN</SelectItem><SelectItem value="RS">RS</SelectItem>
                  <SelectItem value="RO">RO</SelectItem><SelectItem value="RR">RR</SelectItem><SelectItem value="SC">SC</SelectItem>
                  <SelectItem value="SP">SP</SelectItem><SelectItem value="SE">SE</SelectItem><SelectItem value="TO">TO</SelectItem>
              </SelectContent></Select></div>
            </div>
          </CardContent>
        </Card>

        {/* Observações */}
        <Card>
          <CardHeader><CardTitle>Observações Adicionais</CardTitle></CardHeader>
          <CardContent>
            <Textarea id="observacoes" placeholder="Informações adicionais sobre o paciente..." value={formData.observacoes || ''} onChange={(e) => handleInputChange("observacoes", e.target.value)} rows={4} />
          </CardContent>
        </Card>

        {/* Botões de Ação */}
        <div className="flex justify-end gap-4">
          <Button type="button" variant="outline" onClick={() => router.push('/pacientes')}>Cancelar</Button>
          <Button type="submit" disabled={loading}>
            {loading ? "Salvando..." : "Salvar Alterações"}
          </Button>
        </div>
      </form>
    </div>
  );
}