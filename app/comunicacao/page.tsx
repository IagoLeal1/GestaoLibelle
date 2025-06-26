"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Plus, MessageSquare, Users, CheckCircle, Send } from "lucide-react"

const avisosInternos = [
  {
    id: 1,
    titulo: "Reunião de Equipe - Sexta-feira",
    conteudo: "Reunião da equipe marcada para sexta-feira às 18h para discussão dos casos complexos.",
    autor: "Coordenador Geral",
    data: "2024-01-16",
    destinatarios: "Todos os profissionais",
    leituras: 5,
    totalDestinatarios: 8,
  },
  {
    id: 2,
    titulo: "Alteração no Protocolo de Atendimento",
    conteudo: "Novo protocolo para atendimentos de primeira consulta. Favor seguir as diretrizes anexadas.",
    autor: "Coordenador Geral",
    data: "2024-01-15",
    destinatarios: "Terapeutas",
    leituras: 3,
    totalDestinatarios: 5,
  },
]

const comunicadosFamiliares = [
  {
    id: 1,
    titulo: "Horário de Funcionamento - Feriados",
    conteudo: "Durante os feriados de carnaval, a clínica funcionará em horário reduzido. Confira os novos horários.",
    data: "2024-01-16",
    leituras: 12,
    totalFamiliares: 25,
  },
  {
    id: 2,
    titulo: "Nova Política de Cancelamentos",
    conteudo: "Implementamos uma nova política para cancelamentos de consultas. Leia as novas regras.",
    data: "2024-01-14",
    leituras: 18,
    totalFamiliares: 25,
  },
]

export default function Comunicacao() {
  const [novoAviso, setNovoAviso] = useState({
    titulo: "",
    conteudo: "",
    tipo: "interno",
    destinatarios: "",
  })

  const handleNovoAviso = () => {
    console.log("Novo aviso:", novoAviso)
    setNovoAviso({
      titulo: "",
      conteudo: "",
      tipo: "interno",
      destinatarios: "",
    })
  }

  const getProgressColor = (leituras: number, total: number) => {
    const percentage = (leituras / total) * 100
    if (percentage >= 80) return "bg-primary-medium-green"
    if (percentage >= 50) return "bg-secondary-orange"
    return "bg-secondary-red"
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-primary-dark-blue">Comunicação</h2>
          <p className="text-muted-foreground">Gerencie avisos internos e comunicados para familiares</p>
        </div>

        <Dialog>
          <DialogTrigger asChild>
            <Button className="w-full sm:w-auto">
              <Plus className="mr-2 h-4 w-4" />
              Novo Comunicado
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Criar Novo Comunicado</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="tipo">Tipo de Comunicado</Label>
                <Select value={novoAviso.tipo} onValueChange={(value) => setNovoAviso({ ...novoAviso, tipo: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="interno">Aviso Interno (Profissionais)</SelectItem>
                    <SelectItem value="familiar">Comunicado para Familiares</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {novoAviso.tipo === "interno" && (
                <div className="space-y-2">
                  <Label htmlFor="destinatarios">Destinatários</Label>
                  <Select
                    value={novoAviso.destinatarios}
                    onValueChange={(value) => setNovoAviso({ ...novoAviso, destinatarios: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione os destinatários" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="todos">Todos os profissionais</SelectItem>
                      <SelectItem value="terapeutas">Apenas terapeutas</SelectItem>
                      <SelectItem value="coordenacao">Coordenação</SelectItem>
                      <SelectItem value="recepcao">Recepção</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="titulo">Título</Label>
                <Input
                  id="titulo"
                  value={novoAviso.titulo}
                  onChange={(e) => setNovoAviso({ ...novoAviso, titulo: e.target.value })}
                  placeholder="Digite o título do comunicado"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="conteudo">Conteúdo</Label>
                <Textarea
                  id="conteudo"
                  value={novoAviso.conteudo}
                  onChange={(e) => setNovoAviso({ ...novoAviso, conteudo: e.target.value })}
                  placeholder="Digite o conteúdo do comunicado"
                  rows={6}
                />
              </div>

              <Button onClick={handleNovoAviso} className="w-full">
                <Send className="mr-2 h-4 w-4" />
                Enviar Comunicado
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Tabs defaultValue="internos" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="internos" className="flex items-center gap-2">
            <MessageSquare className="h-4 w-4" />
            Avisos Internos
          </TabsTrigger>
          <TabsTrigger value="familiares" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Comunicados Familiares
          </TabsTrigger>
        </TabsList>

        <TabsContent value="internos" className="space-y-4">
          {avisosInternos.map((aviso) => (
            <Card key={aviso.id}>
              <CardHeader>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <CardTitle className="text-lg">{aviso.titulo}</CardTitle>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                      <span>Por: {aviso.autor}</span>
                      <span>•</span>
                      <span>{new Date(aviso.data).toLocaleDateString("pt-BR")}</span>
                      <span>•</span>
                      <span>Para: {aviso.destinatarios}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge className="bg-primary-teal/20 text-primary-teal">
                      {aviso.leituras}/{aviso.totalDestinatarios} leram
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-gray-700 mb-4">{aviso.conteudo}</p>
                <div className="flex items-center gap-2">
                  <div className="flex-1 bg-gray-200 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full ${getProgressColor(aviso.leituras, aviso.totalDestinatarios)}`}
                      style={{ width: `${(aviso.leituras / aviso.totalDestinatarios) * 100}%` }}
                    ></div>
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {Math.round((aviso.leituras / aviso.totalDestinatarios) * 100)}%
                  </span>
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="familiares" className="space-y-4">
          {comunicadosFamiliares.map((comunicado) => (
            <Card key={comunicado.id}>
              <CardHeader>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <CardTitle className="text-lg">{comunicado.titulo}</CardTitle>
                    <p className="text-sm text-muted-foreground mt-1">
                      Publicado em {new Date(comunicado.data).toLocaleDateString("pt-BR")}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge className="bg-primary-medium-green/20 text-primary-medium-green">
                      {comunicado.leituras}/{comunicado.totalFamiliares} leram
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-gray-700 mb-4">{comunicado.conteudo}</p>
                <div className="flex items-center gap-2">
                  <div className="flex-1 bg-gray-200 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full ${getProgressColor(
                        comunicado.leituras,
                        comunicado.totalFamiliares,
                      )}`}
                      style={{
                        width: `${(comunicado.leituras / comunicado.totalFamiliares) * 100}%`,
                      }}
                    ></div>
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {Math.round((comunicado.leituras / comunicado.totalFamiliares) * 100)}%
                  </span>
                </div>
                <div className="flex items-center justify-between mt-4 pt-4 border-t">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <CheckCircle className="h-4 w-4 text-primary-medium-green" />
                    <span>{comunicado.leituras} familiares confirmaram leitura</span>
                  </div>
                  <Button variant="outline" size="sm">
                    Ver Detalhes
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>
      </Tabs>
    </div>
  )
}
