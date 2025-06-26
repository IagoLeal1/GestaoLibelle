"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Stethoscope, Mail, Lock, Eye, EyeOff } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"

export default function Login() {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  })
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError("")

    try {
      // Simulação de autenticação
      console.log("Dados de login:", formData)

      // Aqui você implementaria a lógica de autenticação com Firebase
      // const userCredential = await signInWithEmailAndPassword(auth, formData.email, formData.password)

      // Simulação de diferentes perfis de usuário
      const userProfile = getUserProfile(formData.email)
      redirectByProfile(userProfile)
    } catch (err) {
      setError("Email ou senha incorretos. Tente novamente.")
    } finally {
      setIsLoading(false)
    }
  }

  const getUserProfile = (email: string) => {
    // Simulação de perfis baseado no email
    if (email.includes("admin")) return "admin"
    if (email.includes("coordenador")) return "coordenador"
    if (email.includes("terapeuta")) return "terapeuta"
    if (email.includes("financeiro")) return "financeiro"
    if (email.includes("recepcao")) return "recepcao"
    return "terapeuta" // perfil padrão
  }

  const redirectByProfile = (profile: string) => {
    const redirects = {
      admin: "/",
      coordenador: "/",
      terapeuta: "/agendamentos",
      financeiro: "/financeiro",
      recepcao: "/agendamentos",
    }

    const destination = redirects[profile as keyof typeof redirects] || "/"
    console.log(`Redirecionando ${profile} para ${destination}`)
    // window.location.href = destination
  }

  return (
    <div className="min-h-screen bg-support-light-gray flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <Card className="shadow-lg">
          <CardHeader className="text-center pb-2">
            <div className="flex justify-center mb-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary-teal text-white">
                <Stethoscope className="h-6 w-6" />
              </div>
            </div>
            <CardTitle className="text-2xl font-bold text-primary-dark-blue">ClinicSystem</CardTitle>
            <p className="text-muted-foreground">Faça login para acessar o sistema</p>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <Alert className="border-red-200">
                  <AlertDescription className="text-red-600">{error}</AlertDescription>
                </Alert>
              )}

              <div className="space-y-2">
                <Label htmlFor="email">E-mail</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="seu@email.com"
                    className="pl-10"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Senha</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Sua senha"
                    className="pl-10 pr-10"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    required
                  />
                  <button
                    type="button"
                    className="absolute right-3 top-2.5 text-muted-foreground hover:text-primary-teal"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? "Entrando..." : "Entrar"}
              </Button>
            </form>

            <div className="mt-6 pt-6 border-t">
              <div className="text-center">
                <p className="text-sm text-muted-foreground mb-3">Perfis de teste:</p>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="p-2 bg-support-off-white rounded">
                    <strong>Admin:</strong>
                    <br />
                    admin@clinica.com
                  </div>
                  <div className="p-2 bg-support-off-white rounded">
                    <strong>Coordenador:</strong>
                    <br />
                    coordenador@clinica.com
                  </div>
                  <div className="p-2 bg-support-off-white rounded">
                    <strong>Terapeuta:</strong>
                    <br />
                    terapeuta@clinica.com
                  </div>
                  <div className="p-2 bg-support-off-white rounded">
                    <strong>Financeiro:</strong>
                    <br />
                    financeiro@clinica.com
                  </div>
                </div>
                <p className="text-xs text-muted-foreground mt-2">Senha: 123456</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
