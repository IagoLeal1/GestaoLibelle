"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { ArrowLeft, User, Phone, MapPin } from "lucide-react"

// Importamos a função de criar e o tipo do formulário
import { createPatient, PatientFormData } from "@/services/patientService"

export default function NovoPacientePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // O estado que você já tinha, mas agora com o tipo importado
  const [formData, setFormData] = useState<Partial<PatientFormData>>({
    fullName: "", cpf: "", rg: "", dataNascimento: "", sexo: "", telefone: "", celular: "",
    email: "", endereco: "", numero: "", complemento: "", bairro: "", cidade: "", cep: "",
    estado: "", profissao: "", estadoCivil: "", observacoes: "",
  });

  const handleInputChange = (field: keyof PatientFormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    // Validação dos campos obrigatórios
    if (!formData.fullName || !formData.dataNascimento || !formData.cpf || !formData.celular) {
        setError("Nome, Data de Nascimento, CPF e Celular são obrigatórios.");
        setLoading(false);
        return;
    }

    // Chamada para o serviço do Firebase
    const result = await createPatient(formData as PatientFormData);

    setLoading(false);
    if (result.success) {
      alert("Paciente cadastrado com sucesso!");
      router.push('/pacientes');
      router.refresh()
    } else {
      setError(result.error || "Ocorreu um erro desconhecido ao salvar.");
    }
  };

  return (
    // Seu layout original e intacto, mas agora funcional
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/pacientes">
          <Button variant="ghost" size="icon"><ArrowLeft className="h-4 w-4" /></Button>
        </Link>
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-primary-dark-blue">Novo Paciente</h2>
          <p className="text-muted-foreground">Cadastre um novo paciente no sistema</p>
        </div>
      </div>

      {/* A tag <form> agora envolve todos os cards e o botão final */}
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Dados Pessoais */}
        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2"><User className="h-5 w-5" /> Dados Pessoais</CardTitle></CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              <div className="space-y-2 md:col-span-2"><Label htmlFor="fullName">Nome Completo *</Label><Input id="fullName" value={formData.fullName} onChange={(e) => handleInputChange("fullName", e.target.value)} required /></div>
              <div className="space-y-2"><Label htmlFor="dataNascimento">Data de Nascimento *</Label><Input id="dataNascimento" type="date" value={formData.dataNascimento} onChange={(e) => handleInputChange("dataNascimento", e.target.value)} required /></div>
              <div className="space-y-2"><Label htmlFor="cpf">CPF *</Label><Input id="cpf" value={formData.cpf} onChange={(e) => handleInputChange("cpf", e.target.value)} required /></div>
              <div className="space-y-2"><Label htmlFor="rg">RG</Label><Input id="rg" value={formData.rg} onChange={(e) => handleInputChange("rg", e.target.value)} /></div>
              <div className="space-y-2"><Label htmlFor="sexo">Sexo *</Label><Select value={formData.sexo} onValueChange={(value) => handleInputChange("sexo", value)}><SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger><SelectContent><SelectItem value="masculino">Masculino</SelectItem><SelectItem value="feminino">Feminino</SelectItem><SelectItem value="outro">Outro</SelectItem></SelectContent></Select></div>
              <div className="space-y-2"><Label htmlFor="estadoCivil">Estado Civil</Label><Select value={formData.estadoCivil} onValueChange={(value) => handleInputChange("estadoCivil", value)}><SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger><SelectContent><SelectItem value="solteiro">Solteiro(a)</SelectItem><SelectItem value="casado">Casado(a)</SelectItem><SelectItem value="divorciado">Divorciado(a)</SelectItem><SelectItem value="viuvo">Viúvo(a)</SelectItem><SelectItem value="uniao-estavel">União Estável</SelectItem></SelectContent></Select></div>
              <div className="space-y-2"><Label htmlFor="profissao">Profissão</Label><Input id="profissao" value={formData.profissao} onChange={(e) => handleInputChange("profissao", e.target.value)} /></div>
            </div>
          </CardContent>
        </Card>

        {/* Contato */}
        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2"><Phone className="h-5 w-5" /> Informações de Contato</CardTitle></CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              <div className="space-y-2"><Label htmlFor="telefone">Telefone</Label><Input id="telefone" value={formData.telefone} onChange={(e) => handleInputChange("telefone", e.target.value)} /></div>
              <div className="space-y-2"><Label htmlFor="celular">Celular *</Label><Input id="celular" value={formData.celular} onChange={(e) => handleInputChange("celular", e.target.value)} required /></div>
              <div className="space-y-2"><Label htmlFor="email">E-mail</Label><Input id="email" type="email" value={formData.email} onChange={(e) => handleInputChange("email", e.target.value)} /></div>
            </div>
          </CardContent>
        </Card>

        {/* Endereço */}
        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2"><MapPin className="h-5 w-5" /> Endereço</CardTitle></CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <div className="space-y-2"><Label htmlFor="cep">CEP</Label><Input id="cep" value={formData.cep} onChange={(e) => handleInputChange("cep", e.target.value)} /></div>
              <div className="space-y-2 md:col-span-2"><Label htmlFor="endereco">Endereço</Label><Input id="endereco" value={formData.endereco} onChange={(e) => handleInputChange("endereco", e.target.value)} /></div>
              <div className="space-y-2"><Label htmlFor="numero">Número</Label><Input id="numero" value={formData.numero} onChange={(e) => handleInputChange("numero", e.target.value)} /></div>
              <div className="space-y-2"><Label htmlFor="complemento">Complemento</Label><Input id="complemento" value={formData.complemento} onChange={(e) => handleInputChange("complemento", e.target.value)} /></div>
              <div className="space-y-2"><Label htmlFor="bairro">Bairro</Label><Input id="bairro" value={formData.bairro} onChange={(e) => handleInputChange("bairro", e.target.value)} /></div>
              <div className="space-y-2"><Label htmlFor="cidade">Cidade</Label><Input id="cidade" value={formData.cidade} onChange={(e) => handleInputChange("cidade", e.target.value)} /></div>
              <div className="space-y-2"><Label htmlFor="estado">Estado</Label><Select value={formData.estado} onValueChange={(value) => handleInputChange("estado", value)}><SelectTrigger><SelectValue placeholder="UF" /></SelectTrigger><SelectContent><SelectItem value="AC">AC</SelectItem>
                    <SelectItem value="AL">AL</SelectItem>
                    <SelectItem value="AP">AP</SelectItem>
                    <SelectItem value="AM">AM</SelectItem>
                    <SelectItem value="BA">BA</SelectItem>
                    <SelectItem value="CE">CE</SelectItem>
                    <SelectItem value="DF">DF</SelectItem>
                    <SelectItem value="ES">ES</SelectItem>
                    <SelectItem value="GO">GO</SelectItem>
                    <SelectItem value="MA">MA</SelectItem>
                    <SelectItem value="MT">MT</SelectItem>
                    <SelectItem value="MS">MS</SelectItem>
                    <SelectItem value="MG">MG</SelectItem>
                    <SelectItem value="PA">PA</SelectItem>
                    <SelectItem value="PB">PB</SelectItem>
                    <SelectItem value="PR">PR</SelectItem>
                    <SelectItem value="PE">PE</SelectItem>
                    <SelectItem value="PI">PI</SelectItem>
                    <SelectItem value="RJ">RJ</SelectItem>
                    <SelectItem value="RN">RN</SelectItem>
                    <SelectItem value="RS">RS</SelectItem>
                    <SelectItem value="RO">RO</SelectItem>
                    <SelectItem value="RR">RR</SelectItem>
                    <SelectItem value="SC">SC</SelectItem>
                    <SelectItem value="SP">SP</SelectItem>
                    <SelectItem value="SE">SE</SelectItem>
                    <SelectItem value="TO">TO</SelectItem></SelectContent></Select></div>
            </div>
          </CardContent>
        </Card>

        {/* Observações */}
        <Card>
          <CardHeader><CardTitle>Observações Adicionais</CardTitle></CardHeader>
          <CardContent>
            <Textarea id="observacoes" placeholder="Informações adicionais sobre o paciente..." value={formData.observacoes} onChange={(e) => handleInputChange("observacoes", e.target.value)} rows={4} />
          </CardContent>
        </Card>

        {/* Botões de Ação */}
        <div className="flex justify-end gap-4">
          <Link href="/pacientes" passHref><Button type="button" variant="outline">Cancelar</Button></Link>
          <Button type="submit" disabled={loading}>
            {loading ? "Salvando..." : "Salvar Paciente"}
          </Button>
        </div>
      </form>
    </div>
  )
}