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
  const searchParams = useSearchParams(); // O hook agora está dentro do componente que será "suspenso"

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
            <Image src="/images/logotipo-azul.jpg" alt="Casa Libelle" fill className="object-contain" />
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

          <div className="text-center text-sm text-gray-600">
            Não tem uma conta?{" "}
            <Link href="/signup" className="text-primary-teal hover:underline font-medium">
              Solicitar acesso
            </Link>
          </div>
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
