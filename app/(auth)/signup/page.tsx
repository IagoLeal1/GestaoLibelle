"use client"

import type React from "react"

import { useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { User, Mail, Phone, FileText, ArrowLeft, CheckCircle } from "lucide-react"

// A importação do serviço continuará funcionando
import { signUpAndCreateProfile } from "@/services/authService"

// Componentes do ShadCN UI
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"

// Tipo atualizado para incluir "funcionario"
type FormData = {
  nome: string
  email: string
  cpf: string
  telefone: string
  tipo: "familiar" | "profissional" | "funcionario" | ""
  vinculo: string
  observacoes: string
  senha: string
  confirmarSenha: string
}

export default function SignUpPage() {
  const [isLoading, setIsLoading] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [formData, setFormData] = useState<FormData>({
    nome: "",
    email: "",
    cpf: "",
    telefone: "",
    tipo: "",
    vinculo: "",
    observacoes: "",
    senha: "",
    confirmarSenha: "",
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    const { senha, confirmarSenha, ...submissionData } = formData

    try {
      if (!submissionData.nome || !submissionData.email || !senha || !confirmarSenha || !submissionData.tipo) {
        throw new Error("Nome, email, senha e tipo de usuário são obrigatórios.")
      }
      if (senha !== confirmarSenha) {
        throw new Error("As senhas não coincidem.")
      }
      if (senha.length < 6) {
        throw new Error("A senha deve ter no mínimo 6 caracteres.")
      }

      const result = await signUpAndCreateProfile(submissionData, senha)

      if (!result.success) {
        throw new Error(result.error || "Falha ao processar a solicitação.")
      }

      setIsSuccess(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro desconhecido.")
    } finally {
      setIsLoading(false)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    let formattedValue = value

    if (name === "cpf") {
      formattedValue = value
        .replace(/\D/g, "")
        .replace(/(\d{3})(\d)/, "$1.$2")
        .replace(/(\d{3})(\d)/, "$1.$2")
        .replace(/(\d{3})(\d{1,2})/, "$1-$2")
        .replace(/(-\d{2})\d+?$/, "$1")
    } else if (name === "telefone") {
      formattedValue = value
        .replace(/\D/g, "")
        .replace(/(\d{2})(\d)/, "($1) $2")
        .replace(/(\d{5})(\d)/, "$1-$2")
        .replace(/(-\d{4})\d+?$/, "$1")
    }

    setFormData((prev) => ({
      ...prev,
      [name]: formattedValue,
    }))
  }

  const handleSelectChange = (name: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))
  }
  
  // Funções de rótulo e placeholder atualizadas
  const getVinculoLabel = () => {
    if (formData.tipo === "familiar") return "Vínculo com o Paciente";
    if (formData.tipo === "profissional") return "Registro Profissional";
    if (formData.tipo === "funcionario") return "Cargo";
    return "Vínculo";
  };

  const getVinculoPlaceholder = () => {
    if (formData.tipo === "familiar") return "Ex: Mãe, Pai, Responsável...";
    if (formData.tipo === "profissional") return "Ex: CRP 12345, CRFa 6789...";
    if (formData.tipo === "funcionario") return "Ex: Recepção, Financeiro, Coordenação...";
    return "Descreva seu vínculo";
  };


  if (isSuccess) {
    // A tela de sucesso não precisa de alterações
    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-teal/10 to-primary-dark-blue/10 p-4">
            <Card className="w-full max-w-md">
                <CardHeader className="text-center space-y-4">
                    <div className="flex justify-center">
                        <div className="h-16 w-16 bg-green-100 rounded-full flex items-center justify-center">
                            <CheckCircle className="h-8 w-8 text-green-600" />
                        </div>
                    </div>
                    <div>
                        <CardTitle className="text-2xl font-bold text-primary-dark-blue">Solicitação Enviada!</CardTitle>
                        <CardDescription>Sua solicitação de acesso foi enviada com sucesso</CardDescription>
                    </div>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="bg-blue-50 p-4 rounded-lg">
                        <h3 className="font-semibold text-primary-dark-blue mb-2">Resumo da Solicitação:</h3>
                        <div className="space-y-1 text-sm text-gray-600">
                            <p><strong>Nome:</strong> {formData.nome}</p>
                            <p><strong>Email:</strong> {formData.email}</p>
                            <p><strong>Tipo:</strong> {formData.tipo.charAt(0).toUpperCase() + formData.tipo.slice(1)}</p>
                        </div>
                    </div>
                    <div className="text-center text-sm text-gray-600">
                        <p>Sua solicitação será analisada pela equipe administrativa. Você receberá um email com o resultado em até 48 horas.</p>
                    </div>
                    <Button asChild className="w-full bg-primary-teal hover:bg-primary-teal/90">
                        <Link href="/login">
                            <ArrowLeft className="mr-2 h-4 w-4" />
                            Voltar ao Login
                        </Link>
                    </Button>
                </CardContent>
            </Card>
        </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-teal/10 to-primary-dark-blue/10 p-4">
      <Card className="w-full max-w-lg">
        <CardHeader className="space-y-4 text-center">
          <div className="flex justify-center">
            <div className="relative h-16 w-24">
              <Image src="/images/logotipo-azul.jpg" alt="Casa Libelle" fill className="object-contain" />
            </div>
          </div>
          <div>
            <CardTitle className="text-2xl font-bold text-primary-dark-blue">Solicitar Acesso</CardTitle>
            <CardDescription>Preencha os dados para solicitar acesso ao sistema</CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-md" role="alert">
                <p>{error}</p>
              </div>
            )}
            <div className="space-y-4">
              <h3 className="font-semibold text-primary-dark-blue border-b pb-2">Dados Pessoais</h3>
              <div className="space-y-2">
                <Label htmlFor="nome">Nome Completo *</Label>
                <div className="relative">
                  <User className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input id="nome" name="nome" type="text" placeholder="Seu nome completo" value={formData.nome} onChange={handleInputChange} className="pl-10" required />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email *</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input id="email" name="email" type="email" placeholder="seu@email.com" value={formData.email} onChange={handleInputChange} className="pl-10" required />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="cpf">CPF *</Label>
                  <Input id="cpf" name="cpf" type="text" placeholder="000.000.000-00" value={formData.cpf} onChange={handleInputChange} maxLength={14} required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="telefone">Telefone *</Label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input id="telefone" name="telefone" type="text" placeholder="(00) 00000-0000" value={formData.telefone} onChange={handleInputChange} className="pl-10" maxLength={15} required />
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="senha">Senha *</Label>
                  <Input id="senha" name="senha" type="password" placeholder="Mínimo 6 caracteres" value={formData.senha} onChange={handleInputChange} required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirmarSenha">Confirmar Senha *</Label>
                  <Input id="confirmarSenha" name="confirmarSenha" type="password" placeholder="Repita a senha" value={formData.confirmarSenha} onChange={handleInputChange} required />
                </div>
              </div>
            </div>
            <div className="space-y-4">
              <h3 className="font-semibold text-primary-dark-blue border-b pb-2">Tipo de Acesso</h3>
              <div className="space-y-2">
                <Label htmlFor="tipo">Tipo de Usuário *</Label>
                <Select value={formData.tipo} onValueChange={(value) => handleSelectChange("tipo", value)}>
                  <SelectTrigger><SelectValue placeholder="Selecione o tipo de usuário" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="familiar">Familiar/Responsável</SelectItem>
                    <SelectItem value="profissional">Profissional/Terapeuta</SelectItem>
                    <SelectItem value="funcionario">Funcionário (Recepção, Financeiro, etc.)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {formData.tipo && (
                <div className="space-y-2">
                  <Label htmlFor="vinculo">{getVinculoLabel()} *</Label>
                  <div className="relative">
                    <FileText className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input id="vinculo" name="vinculo" type="text" placeholder={getVinculoPlaceholder()} value={formData.vinculo} onChange={handleInputChange} className="pl-10" required />
                  </div>
                </div>
              )}
              <div className="space-y-2">
                <Label htmlFor="observacoes">Observações Adicionais</Label>
                <Textarea id="observacoes" name="observacoes" placeholder="Informações adicionais..." value={formData.observacoes} onChange={handleInputChange} rows={3} />
              </div>
            </div>
            <div className="flex flex-col gap-3 pt-4">
              <Button type="submit" className="w-full bg-primary-teal hover:bg-primary-teal/90" disabled={isLoading}>
                {isLoading ? "Enviando Solicitação..." : "Enviar Solicitação"}
              </Button>
              <Button asChild variant="outline" className="w-full bg-transparent">
                <Link href="/login">
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Voltar ao Login
                </Link>
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}