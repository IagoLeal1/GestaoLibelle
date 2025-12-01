// app/(auth)/recuperar-senha/page.tsx
"use client"

import React, { useState } from "react"
import { Mail, ArrowLeft, CheckCircle, AlertCircle } from "lucide-react"
import Link from "next/link"
import Image from "next/image"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { recoverPassword } from "@/services/authService"

export default function RecoverPasswordPage() {
  const [email, setEmail] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)
    setIsSuccess(false)

    const result = await recoverPassword(email)

    setIsLoading(false)

    if (result.success) {
      setIsSuccess(true)
      setEmail("") // Limpa o campo após sucesso
    } else {
      setError(result.error || "Ocorreu um erro ao tentar recuperar a senha.")
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-teal/10 to-primary-dark-blue/10 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-4 text-center">
          <div className="flex justify-center">
            <div className="relative h-16 w-24">
              <Image 
                src="/images/logotipo-azul.png" 
                alt="Casa Libelle" 
                fill 
                className="object-contain" 
              />
            </div>
          </div>
          <div>
            <CardTitle className="text-2xl font-bold text-primary-dark-blue">
              Recuperar Senha
            </CardTitle>
            <CardDescription>
              Digite seu e-mail para receber um link de redefinição.
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          {isSuccess ? (
            <div className="space-y-6 text-center">
              <Alert className="border-green-500 bg-green-50 text-green-700">
                <CheckCircle className="h-4 w-4" />
                <AlertTitle>E-mail enviado!</AlertTitle>
                <AlertDescription>
                  Verifique sua caixa de entrada (e spam) para redefinir sua senha.
                </AlertDescription>
              </Alert>
              
              <Button asChild className="w-full" variant="outline">
                <Link href="/login">
                  <ArrowLeft className="mr-2 h-4 w-4" /> Voltar para o Login
                </Link>
              </Button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>Erro</AlertTitle>
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <div className="space-y-2">
                <Label htmlFor="email">Email cadastrado</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input 
                    id="email" 
                    type="email" 
                    placeholder="seu@email.com" 
                    value={email} 
                    onChange={(e) => setEmail(e.target.value)} 
                    className="pl-10" 
                    required 
                  />
                </div>
              </div>

              <Button 
                type="submit" 
                className="w-full bg-primary-teal hover:bg-primary-teal/90" 
                disabled={isLoading}
              >
                {isLoading ? "Enviando..." : "Enviar link de recuperação"}
              </Button>

              <div className="text-center text-sm">
                <Link 
                  href="/login" 
                  className="text-gray-600 hover:text-primary-teal flex items-center justify-center gap-2"
                >
                  <ArrowLeft className="h-4 w-4" /> Voltar para o login
                </Link>
              </div>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  )
}