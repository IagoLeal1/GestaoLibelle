"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Check, X, Search, UserPlus, Mail, Phone } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"

const solicitacoes = [
  {
    id: 1,
    nome: "Maria Silva Santos",
    email: "maria.silva@email.com",
    cpf: "123.456.789-00",
    telefone: "(11) 99999-8888",
    vinculo: "Mãe da paciente Ana Silva",
    tipo: "familiar",
    dataSolicitacao: "2024-01-15",
    status: "pendente",
  },
  {
    id: 2,
    nome: "Dr. Carlos Mendes",
    email: "carlos.mendes@clinica.com",
    cpf: "987.654.321-00",
    telefone: "(11) 88888-7777",
    vinculo: "Psicólogo - CRP 123456",
    tipo: "terapeuta",
    dataSolicitacao: "2024-01-14",
    status: "pendente",
  },
  {
    id: 3,
    nome: "João Pedro Costa",
    email: "joao.costa@email.com",
    cpf: "456.789.123-00",
    telefone: "(11) 77777-6666",
    vinculo: "Pai do paciente Pedro Costa",
    tipo: "familiar",
    dataSolicitacao: "2024-01-13",
    status: "aprovado",
  },
  {
    id: 4,
    nome: "Dra. Lucia Santos",
    email: "lucia.santos@clinica.com",
    cpf: "321.654.987-00",
    telefone: "(11) 66666-5555",
    vinculo: "Fonoaudióloga - CRFa 98765",
    tipo: "terapeuta",
    dataSolicitacao: "2024-01-12",
    status: "rejeitado",
  },
]

const getStatusBadge = (status: string) => {
  const statusConfig = {
    pendente: { label: "Pendente", className: "bg-secondary-orange/20 text-secondary-orange" },
    aprovado: { label: "Aprovado", className: "bg-primary-medium-green/20 text-primary-medium-green" },
    rejeitado: { label: "Rejeitado", className: "bg-secondary-red/20 text-secondary-red" },
  }

  const config = statusConfig[status as keyof typeof statusConfig]
  return <Badge className={config.className}>{config.label}</Badge>
}

const getTipoBadge = (tipo: string) => {
  const tipoConfig = {
    familiar: { label: "Familiar", className: "bg-blue-100 text-blue-800" },
    terapeuta: { label: "Terapeuta", className: "bg-purple-100 text-purple-800" },
  }

  const config = tipoConfig[tipo as keyof typeof tipoConfig]
  return <Badge className={config.className}>{config.label}</Badge>
}

export default function AprovacaoAcesso() {
  const [searchTerm, setSearchTerm] = useState("")
  const [notification, setNotification] = useState<{ type: string; message: string } | null>(null)

  const handleAprovar = (id: number, nome: string) => {
    console.log(`Aprovando acesso para ${nome}`)
    setNotification({ type: "success", message: `Acesso aprovado para ${nome}` })
    setTimeout(() => setNotification(null), 3000)
  }

  const handleRejeitar = (id: number, nome: string) => {
    console.log(`Rejeitando acesso para ${nome}`)
    setNotification({ type: "error", message: `Acesso rejeitado para ${nome}` })
    setTimeout(() => setNotification(null), 3000)
  }

  const solicitacoesPendentes = solicitacoes.filter((s) => s.status === "pendente")
  const solicitacoesProcessadas = solicitacoes.filter((s) => s.status !== "pendente")

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-primary-dark-blue">Aprovação de Acesso</h2>
          <p className="text-muted-foreground">Gerencie solicitações de acesso de novos usuários</p>
        </div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <UserPlus className="h-4 w-4" />
          <span>{solicitacoesPendentes.length} solicitações pendentes</span>
        </div>
      </div>

      {notification && (
        <Alert className={notification.type === "success" ? "border-green-200" : "border-red-200"}>
          <AlertDescription>{notification.message}</AlertDescription>
        </Alert>
      )}

      {/* Filtro */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por nome, email ou CPF..."
                className="pl-8"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Solicitações Pendentes */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserPlus className="h-5 w-5" />
            Solicitações Pendentes ({solicitacoesPendentes.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {solicitacoesPendentes.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">Nenhuma solicitação pendente</p>
          ) : (
            <div className="space-y-4">
              {solicitacoesPendentes.map((solicitacao) => (
                <div
                  key={solicitacao.id}
                  className="border rounded-lg p-4 bg-support-off-white/50 hover:bg-support-off-white transition-colors"
                >
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-start gap-3">
                        <div className="flex-1">
                          <h3 className="font-semibold text-primary-dark-blue">{solicitacao.nome}</h3>
                          <p className="text-sm text-muted-foreground mt-1">{solicitacao.vinculo}</p>
                          <div className="flex flex-wrap items-center gap-4 mt-2 text-sm text-muted-foreground">
                            <div className="flex items-center gap-1">
                              <Mail className="h-3 w-3" />
                              {solicitacao.email}
                            </div>
                            <div className="flex items-center gap-1">
                              <Phone className="h-3 w-3" />
                              {solicitacao.telefone}
                            </div>
                            <span>CPF: {solicitacao.cpf}</span>
                          </div>
                          <div className="flex items-center gap-2 mt-2">
                            {getTipoBadge(solicitacao.tipo)}
                            <span className="text-xs text-muted-foreground">
                              Solicitado em {new Date(solicitacao.dataSolicitacao).toLocaleDateString("pt-BR")}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        onClick={() => handleAprovar(solicitacao.id, solicitacao.nome)}
                        className="bg-primary-medium-green hover:bg-primary-medium-green/90"
                      >
                        <Check className="h-4 w-4 mr-1" />
                        Aprovar
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => handleRejeitar(solicitacao.id, solicitacao.nome)}
                      >
                        <X className="h-4 w-4 mr-1" />
                        Rejeitar
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Histórico de Solicitações */}
      <Card>
        <CardHeader>
          <CardTitle>Histórico de Solicitações</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {solicitacoesProcessadas.map((solicitacao) => (
              <div key={solicitacao.id} className="border rounded-lg p-4 bg-gray-50">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex-1">
                    <h3 className="font-medium">{solicitacao.nome}</h3>
                    <p className="text-sm text-muted-foreground">{solicitacao.vinculo}</p>
                    <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                      <span>{solicitacao.email}</span>
                      <span>•</span>
                      <span>CPF: {solicitacao.cpf}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {getTipoBadge(solicitacao.tipo)}
                    {getStatusBadge(solicitacao.status)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
