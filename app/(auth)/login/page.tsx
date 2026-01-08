"use client"

import React, { useState, useEffect, Suspense } from "react"
import { Eye, EyeOff, Mail, Lock, AlertCircle } from "lucide-react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import Image from "next/image"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { signInUser } from "@/services/authService"

// 1. Criamos um componente interno que contém toda a lógica do formulário
function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [info, setInfo] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  })

  useEffect(() => {
    const status = searchParams.get('status');
    if (status === 'pendente') {
      setInfo("Seu acesso está pendente de aprovação. Por favor, aguarde o contato da administração.");
    }
  }, [searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)
    setInfo(null);

    const result = await signInUser(formData.email, formData.password);

    setIsLoading(false)

    if (result.success) {
      router.push('/')
    } else {
      if (result.error === 'pending_approval') {
        router.push('/login?status=pendente');
      } else {
        setError(result.error || "Ocorreu um erro desconhecido.");
      }
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader className="space-y-4 text-center">
        <div className="flex justify-center">
          <div className="relative h-20 w-32">
            <Image src="/images/logotipo-azul.png" alt="Casa Libelle" fill className="object-contain" />
          </div>
        </div>
        <div>
          <CardTitle className="text-2xl font-bold text-primary-dark-blue">Bem-vindo de volta</CardTitle>
          <CardDescription>Entre com suas credenciais para acessar o sistema</CardDescription>
        </div>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Erro de Autenticação</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          
          {info && (
            <Alert variant="default" className="border-blue-300 bg-blue-50 text-blue-800">
               <AlertCircle className="h-4 w-4" />
              <AlertTitle>Aguardando Aprovação</AlertTitle>
              <AlertDescription>{info}</AlertDescription>
            </Alert>
          )}

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <div className="relative">
              <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input id="email" name="email" type="email" placeholder="seu@email.com" value={formData.email} onChange={handleInputChange} className="pl-10" required />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Senha</Label>
            <div className="relative">
              <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input id="password" name="password" type={showPassword ? "text" : "password"} placeholder="••••••••" value={formData.password} onChange={handleInputChange} className="pl-10 pr-10" required />
              <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-3 text-gray-400 hover:text-gray-600">
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          <div className="flex items-center justify-end text-sm">
            <Link href="/recuperar-senha" className="text-primary-teal hover:underline">
              Esqueceu a senha?
            </Link>
          </div>

          <Button type="submit" className="w-full bg-primary-teal hover:bg-primary-teal/90" disabled={isLoading}>
            {isLoading ? "Entrando..." : "Entrar"}
          </Button>

          {/* --- AQUI COMEÇA A ÁREA DO PRIMEIRO ACESSO --- */}
          <div className="mt-8">
            <div className="relative mb-4">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-gray-200" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-white px-2 text-gray-500">
                  Primeiro Acesso?
                </span>
              </div>
            </div>

            <div className="grid gap-3 text-center">
              {/* Botão em destaque para a Família */}
              <Button type="button" variant="outline" asChild className="w-full border-blue-200 bg-blue-50 hover:bg-blue-100 text-blue-700 font-semibold h-11">
                <Link href="/cadastro-familia">
                  Sou Familiar / Responsável
                </Link>
              </Button>
              
              {/* Link menor para Profissionais */}
              <div className="text-xs text-gray-500 mt-2">
                É Profissional ou Funcionário?{" "}
                <Link href="/signup" className="text-primary-teal hover:underline font-medium">
                  Clique aqui para se cadastrar
                </Link>
              </div>
            </div>
          </div>
          {/* --- FIM DA ÁREA DO PRIMEIRO ACESSO --- */}

        </form>
      </CardContent>
    </Card>
  )
}

// 2. O componente principal da página agora "envelopa" o formulário com o Suspense
export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-teal/10 to-primary-dark-blue/10 p-4">
      <Suspense fallback={<div>Carregando...</div>}>
        <LoginForm />
      </Suspense>
    </div>
  )
}