"use client"

import React, { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import Image from "next/image"
import { User, Mail, Phone, FileText, ArrowLeft, CheckCircle, AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Separator } from "@/components/ui/separator"
import { signUpAndCreateProfile, SignUpFormData } from "@/services/authService"

export default function SignUpPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [formData, setFormData] = useState({
    displayName: "", email: "", password_one: "", password_two: "",
    cpf: "", telefone: "", tipo: "" as SignUpFormData['tipo'], vinculo: "", observacoes: "",
    especialidade: "", conselho: "", numeroConselho: "",
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    let formattedValue = value;

    if (name === "telefone") {
      formattedValue = value.replace(/\D/g, '').replace(/^(\d{2})(\d)/g, '($1) $2').replace(/(\d{5})(\d)/, '$1-$2').substring(0, 15);
    }
    if (name === "cpf") {
      formattedValue = value.replace(/\D/g, '').replace(/(\d{3})(\d)/, '$1.$2').replace(/(\d{3})(\d)/, '$1.$2').replace(/(\d{3})(\d{1,2})/, '$1-$2').substring(0, 14);
    }
    setFormData((prev) => ({ ...prev, [name]: formattedValue }));
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData((prev) => ({ ...prev, [name]: value as any }));
  };

  const getVinculoLabel = () => {
    if (formData.tipo === "familiar") return "Vínculo com o Paciente *";
    if (formData.tipo === "profissional") return "Breve Descrição Profissional *";
    if (formData.tipo === "funcionario") return "Cargo *";
    return "Vínculo *";
  };

  const getVinculoPlaceholder = () => {
    if (formData.tipo === "familiar") return "Ex: Mãe de 'Nome do Paciente'";
    if (formData.tipo === "profissional") return "Ex: Psicólogo Cognitivo-Comportamental";
    if (formData.tipo === "funcionario") return "Ex: Recepção, Financeiro...";
    return "Descreva seu vínculo";
  };
  
  const handleSubmit = async (e: React.FormEvent) => {

    e.preventDefault();
    setIsLoading(true);
    setError(null);
    const { password_one, password_two, ...submissionData } = formData;
    if (password_one !== password_two) {
      setError("As senhas não coincidem.");
      setIsLoading(false);
      return;
    }
    if (password_one.length < 6) {
        setError("A senha deve ter no mínimo 6 caracteres.");
        setIsLoading(false);
        return;
    }
    if (!submissionData.tipo) {
      setError("Por favor, selecione um tipo de perfil.");
      setIsLoading(false);
      return;
    }
    const result = await signUpAndCreateProfile(submissionData, password_one);
    setIsLoading(false);
    if (result && result.success) {
      setIsSuccess(true);
    } else {
      setError(result?.error || "Ocorreu um erro no cadastro.");
    }

    // --- ADICIONE O ESPIÃO 1 AQUI ---
    console.log("DEBUG 1 (CLIENTE): Enviando estes dados para o serviço:", submissionData);
    // -------------
  };

  if (isSuccess) {
    return (
        <div className="min-h-screen flex items-center justify-center p-4">
            <Card className="w-full max-w-md text-center">
                <CardHeader className="space-y-4">
                    <div className="mx-auto h-16 w-16 bg-green-100 rounded-full flex items-center justify-center">
                        <CheckCircle className="h-8 w-8 text-green-600" />
                    </div>
                    <CardTitle className="text-2xl font-bold">Solicitação Enviada!</CardTitle>
                    <CardDescription>Sua solicitação de acesso foi enviada com sucesso.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <p className="text-sm text-muted-foreground">Sua solicitação será analisada e você receberá um email de confirmação.</p>
                    <Button asChild className="w-full"><Link href="/login"><ArrowLeft className="mr-2 h-4 w-4" />Voltar ao Login</Link></Button>
                </CardContent>
            </Card>
        </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <Card className="w-full max-w-3xl">
        <CardHeader className="text-center">
            <Image src="/images/logotipo-azul.png" alt="Casa Libelle" width={128} height={64} className="mx-auto object-contain" />
            <CardTitle className="text-2xl pt-4">Solicitar Acesso</CardTitle>
            <CardDescription>Preencha os dados para solicitar seu cadastro no sistema.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-8">
            {error && (<Alert variant="destructive"><AlertCircle className="h-4 w-4" /><AlertTitle>Erro!</AlertTitle><AlertDescription>{error}</AlertDescription></Alert>)}
            
            <div className="space-y-4">
              <h3 className="font-semibold text-lg border-b pb-2">Dados Pessoais e de Acesso</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
                <div className="space-y-2 md:col-span-2"><Label htmlFor="displayName">Nome Completo *</Label><Input id="displayName" name="displayName" value={formData.displayName} onChange={handleInputChange} required /></div>
                <div className="space-y-2"><Label htmlFor="email">Email *</Label><Input id="email" name="email" type="email" value={formData.email} onChange={handleInputChange} required /></div>
                <div className="space-y-2"><Label htmlFor="cpf">CPF *</Label><Input id="cpf" name="cpf" value={formData.cpf} onChange={handleInputChange} placeholder="000.000.000-00" maxLength={14} required /></div>
                <div className="space-y-2"><Label htmlFor="telefone">Telefone / Celular *</Label><Input id="telefone" name="telefone" value={formData.telefone} onChange={handleInputChange} placeholder="(00) 00000-0000" maxLength={15} required /></div>
                <div className="space-y-2"><Label htmlFor="password_one">Senha *</Label><Input id="password_one" name="password_one" type="password" placeholder="Mínimo 6 caracteres" value={formData.password_one} onChange={handleInputChange} required /></div>
                <div className="space-y-2"><Label htmlFor="password_two">Confirmar Senha *</Label><Input id="password_two" name="password_two" type="password" value={formData.password_two} onChange={handleInputChange} required /></div>
              </div>
            </div>
            
            <div className="space-y-4">
              <h3 className="font-semibold text-lg border-b pb-2">Tipo de Perfil</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
                <div className="space-y-2"><Label htmlFor="tipo">Eu sou... *</Label><Select name="tipo" onValueChange={(v) => handleSelectChange("tipo", v)} value={formData.tipo}><SelectTrigger><SelectValue placeholder="Selecione um tipo de perfil" /></SelectTrigger><SelectContent><SelectItem value="familiar">Familiar/Responsável</SelectItem><SelectItem value="profissional">Profissional/Terapeuta</SelectItem><SelectItem value="funcionario">Funcionário</SelectItem></SelectContent></Select></div>
                <div className="space-y-2"><Label htmlFor="vinculo">{getVinculoLabel()}</Label><Input id="vinculo" name="vinculo" placeholder={getVinculoPlaceholder()} value={formData.vinculo} onChange={handleInputChange} required /></div>
              </div>

              {formData.tipo === 'profissional' && (
                <div className="md:col-span-2 pt-4 mt-4 border-t">
                  <h4 className="mb-4 font-medium text-muted-foreground">Informações Profissionais (para Terapeutas)</h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2"><Label htmlFor="especialidade">Especialidade *</Label><Input id="especialidade" name="especialidade" value={formData.especialidade} onChange={handleInputChange} required /></div>
                    <div className="space-y-2"><Label htmlFor="conselho">Conselho (Ex: CRP)</Label><Input id="conselho" name="conselho" value={formData.conselho} onChange={handleInputChange} /></div>
                    <div className="space-y-2"><Label htmlFor="numeroConselho">Nº do Conselho</Label><Input id="numeroConselho" name="numeroConselho" value={formData.numeroConselho} onChange={handleInputChange} /></div>
                  </div>
                </div>
              )}
            </div>

            <Separator/>
            <div className="flex justify-end gap-4">
              <Button type="button" variant="outline" onClick={() => router.push('/login')}>Cancelar</Button>
              <Button type="submit" disabled={isLoading}>{isLoading ? "Enviando..." : "Enviar Solicitação"}</Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}