"use client"

import React, { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import Image from "next/image"
import { CheckCircle, ArrowLeft, AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { signUpAndCreateProfile } from "@/services/authService"

export default function FamilySignUpPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Formulário Simplificado: Só o essencial
  const [formData, setFormData] = useState({
    displayName: "", 
    email: "", 
    password: "", 
    confirmPassword: ""
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    if (formData.password !== formData.confirmPassword) {
      setError("As senhas não coincidem.");
      setIsLoading(false);
      return;
    }

    if (formData.password.length < 6) {
        setError("A senha deve ter no mínimo 6 caracteres.");
        setIsLoading(false);
        return;
    }

    // AQUI ESTÁ O TRUQUE:
    // Montamos o objeto completo que o serviço espera, mas com dados padrão
    const submissionData = {
      displayName: formData.displayName,
      email: formData.email,
      tipo: "familiar" as const, // Forçamos o tipo
      vinculo: "Responsável",    // Forçamos o vínculo padrão
      
      // Enviamos vazio pois seu serviço aceita null para familiares
      cpf: "", 
      telefone: "", 
      observacoes: "",
      especialidade: "", 
      conselho: "", 
      numeroConselho: ""
    };

    // Chamamos o MESMO serviço, então a mágica do vínculo vai acontecer aqui também!
    const result = await signUpAndCreateProfile(submissionData, formData.password);
    
    setIsLoading(false);
    if (result && result.success) {
      setIsSuccess(true);
    } else {
      setError(result?.error || "Ocorreu um erro no cadastro.");
    }
  };

  if (isSuccess) {
    return (
        <div className="min-h-screen flex items-center justify-center p-4 bg-gray-50">
            <Card className="w-full max-w-md text-center">
                <CardHeader className="space-y-4">
                    <div className="mx-auto h-16 w-16 bg-green-100 rounded-full flex items-center justify-center">
                        <CheckCircle className="h-8 w-8 text-green-600" />
                    </div>
                    <CardTitle className="text-2xl font-bold">Conta Criada!</CardTitle>
                    <CardDescription>
                        Seus dados foram vinculados com sucesso.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <p className="text-sm text-muted-foreground">
                        Você já pode acessar o painel da família.
                    </p>
                    <Button asChild className="w-full">
                        <Link href="/login">Ir para o Login</Link>
                    </Button>
                </CardContent>
            </Card>
        </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
            {/* Se tiver a logo, fica legal manter */}
            <div className="flex justify-center mb-4">
               <Image src="/images/logotipo-azul.png" alt="Logo" width={100} height={50} className="object-contain" />
            </div>
            <CardTitle className="text-2xl">Acesso Familiar</CardTitle>
            <CardDescription>
                Crie sua conta para acompanhar o paciente.
                <br/>
                <span className="text-xs text-blue-600 font-bold">Use o mesmo e-mail informado na clínica.</span>
            </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
                <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Erro</AlertTitle>
                    <AlertDescription>{error}</AlertDescription>
                </Alert>
            )}
            
            <div className="space-y-2">
                <Label htmlFor="displayName">Nome Completo</Label>
                <Input id="displayName" name="displayName" value={formData.displayName} onChange={handleInputChange} required />
            </div>

            <div className="space-y-2">
                <Label htmlFor="email">Seu E-mail</Label>
                <Input id="email" name="email" type="email" placeholder="exemplo@email.com" value={formData.email} onChange={handleInputChange} required />
            </div>

            <div className="space-y-2">
                <Label htmlFor="password">Senha</Label>
                <Input id="password" name="password" type="password" value={formData.password} onChange={handleInputChange} required />
            </div>

            <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirmar Senha</Label>
                <Input id="confirmPassword" name="confirmPassword" type="password" value={formData.confirmPassword} onChange={handleInputChange} required />
            </div>

            <Button type="submit" className="w-full mt-4" disabled={isLoading}>
                {isLoading ? "Criando conta..." : "Criar Acesso"}
            </Button>
            
            <div className="text-center text-sm text-muted-foreground mt-4">
                Já tem conta? <Link href="/login" className="text-primary hover:underline">Fazer Login</Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}