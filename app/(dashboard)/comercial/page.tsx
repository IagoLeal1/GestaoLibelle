"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Plus, Search, Filter, CheckCircle, TrendingUp } from "lucide-react"
import Link from "next/link"

interface Evento {
  id: string
  codigo: string
  nome: string
  data: string
  status: "pendente" | "sucesso" | "falha"
}

interface Lead {
  id: string
  nome: string
  contato: string
  eventoOrigem: string
  status: "pendente" | "sucesso" | "falha"
  acolhimentoRealizado: boolean
  dataAcolhimento: string
  orcamentoEnviado: boolean
  qhEnviado: boolean
  anamnesesRealizada: boolean
  contratoAssinado: boolean
}

export default function FunilAquisicao() {
  const [eventos, setEventos] = useState<Evento[]>([
    { id: "1", codigo: "SVI-001", nome: "Parceria Escola São Vicente", data: "2024-01-15", status: "sucesso" },
  ])

  const [leads, setLeads] = useState<Lead[]>([
    {
      id: "1",
      nome: "João Silva",
      contato: "11999999999",
      eventoOrigem: "SVI-001",
      status: "sucesso",
      acolhimentoRealizado: true,
      dataAcolhimento: "2024-01-16",
      orcamentoEnviado: true,
      qhEnviado: true,
      anamnesesRealizada: true,
      contratoAssinado: false,
    },
  ])

  const [searchTerm, setSearchTerm] = useState("")
  const [showEventoModal, setShowEventoModal] = useState(false)
  const [showLeadModal, setShowLeadModal] = useState(false)
  const [novoEvento, setNovoEvento] = useState({ codigo: "", nome: "", data: "" })
  const [novoLead, setNovoLead] = useState({ nome: "", contato: "", eventoOrigem: "" })

  const handleAddEvento = () => {
    if (novoEvento.codigo && novoEvento.nome && novoEvento.data) {
      setEventos([...eventos, { id: Date.now().toString(), ...novoEvento, status: "pendente" }])
      setNovoEvento({ codigo: "", nome: "", data: "" })
      setShowEventoModal(false)
    }
  }

  const handleAddLead = () => {
    if (novoLead.nome && novoLead.contato && novoLead.eventoOrigem) {
      setLeads([
        ...leads,
        {
          id: Date.now().toString(),
          ...novoLead,
          status: "pendente",
          acolhimentoRealizado: false,
          dataAcolhimento: "",
          orcamentoEnviado: false,
          qhEnviado: false,
          anamnesesRealizada: false,
          contratoAssinado: false,
        },
      ])
      setNovoLead({ nome: "", contato: "", eventoOrigem: "" })
      setShowLeadModal(false)
    }
  }

  const updateEventoStatus = (id: string, status: "pendente" | "sucesso" | "falha") => {
    setEventos(eventos.map((e) => (e.id === id ? { ...e, status } : e)))
  }

  const updateLeadStatus = (id: string, status: "pendente" | "sucesso" | "falha") => {
    setLeads(leads.map((l) => (l.id === id ? { ...l, status } : l)))
  }

  const updateLeadAcolhimento = (id: string, acolhimentoRealizado: boolean) => {
    setLeads(
      leads.map((l) =>
        l.id === id ? { ...l, acolhimentoRealizado, status: acolhimentoRealizado ? "sucesso" : l.status } : l,
      ),
    )
  }

  const updateLeadProposta = (id: string, field: "orcamentoEnviado" | "qhEnviado", value: boolean) => {
    const lead = leads.find((l) => l.id === id)
    if (lead) {
      const updated = { ...lead, [field]: value }
      if (updated.orcamentoEnviado && updated.qhEnviado) {
        updated.status = "sucesso"
      }
      setLeads(leads.map((l) => (l.id === id ? updated : l)))
    }
  }

  const updateLeadFechamento = (id: string, field: "anamnesesRealizada" | "contratoAssinado", value: boolean) => {
    const lead = leads.find((l) => l.id === id)
    if (lead) {
      const updated = { ...lead, [field]: value }
      if (updated.anamnesesRealizada && updated.contratoAssinado) {
        updated.status = "sucesso"
      }
      setLeads(leads.map((l) => (l.id === id ? updated : l)))
    }
  }

  const deleteEvento = (id: string) => {
    setEventos(eventos.filter((e) => e.id !== id))
  }

  const deleteLead = (id: string) => {
    setLeads(leads.filter((l) => l.id !== id))
  }

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case "sucesso":
        return "bg-green-100 text-green-800"
      case "falha":
        return "bg-red-100 text-red-800"
      default:
        return "bg-yellow-100 text-yellow-800"
    }
  }

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "sucesso":
        return "Sucesso"
      case "falha":
        return "Falha"
      default:
        return "Pendente"
    }
  }

  const leadsFiltrados = leads.filter(
    (lead) =>
      lead.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
      lead.contato.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  const prospeccaoEventos = eventos
  const leadsQualificados = leadsFiltrados.filter((l) => l.status === "sucesso")
  const leadsAcolhimento = leadsQualificados.filter((l) => !l.acolhimentoRealizado)
  const leadsPropostasAbertas = leadsQualificados.filter(
    (l) => l.acolhimentoRealizado && (!l.orcamentoEnviado || !l.qhEnviado),
  )
  const leadsFechamento = leadsQualificados.filter(
    (l) =>
      l.acolhimentoRealizado && l.orcamentoEnviado && l.qhEnviado && (!l.anamnesesRealizada || !l.contratoAssinado),
  )
  const leadsPosPorVenda = leadsQualificados.filter((l) => l.anamnesesRealizada && l.contratoAssinado)

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-primary-dark-blue">Funil de Aquisição</h2>
          <p className="text-muted-foreground">Gerenciamento de eventos, leads e conversão de pacientes</p>
        </div>
        <Button asChild className="w-full sm:w-auto">
          <Link href="/comercial/comercial-relatorios" className="flex items-center">
            <TrendingUp className="mr-2 h-4 w-4" />
            Ver Relatórios
          </Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filtros e Ações
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="search">Buscar lead</Label>
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  id="search"
                  placeholder="Nome ou contato do lead..."
                  className="pl-8"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
            <div className="space-y-2 flex flex-col justify-end gap-2">
              <Dialog open={showEventoModal} onOpenChange={setShowEventoModal}>
                <DialogTrigger asChild>
                  <Button variant="outline" className="w-full bg-transparent">
                    <Plus className="w-4 h-4 mr-2" />
                    Novo Evento
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Novo Evento de Prospecção</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="codigo">Código do Evento</Label>
                      <Input
                        id="codigo"
                        placeholder="Ex: SVI-002"
                        value={novoEvento.codigo}
                        onChange={(e) => setNovoEvento({ ...novoEvento, codigo: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label htmlFor="nome">Nome do Evento</Label>
                      <Input
                        id="nome"
                        placeholder="Ex: Parceria Escola São Vicente"
                        value={novoEvento.nome}
                        onChange={(e) => setNovoEvento({ ...novoEvento, nome: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label htmlFor="data">Data do Evento</Label>
                      <Input
                        id="data"
                        type="date"
                        value={novoEvento.data}
                        onChange={(e) => setNovoEvento({ ...novoEvento, data: e.target.value })}
                      />
                    </div>
                    <Button onClick={handleAddEvento} className="w-full">
                      Salvar Evento
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="w-full overflow-x-auto">
        <div className="flex gap-3 min-w-max pb-4">
          {/* Coluna 1: Prospecção */}
          <div className="lg:w-72 md:w-64 w-56 flex-shrink-0">
            <Card className="h-full flex flex-col bg-blue-50 border-blue-200">
              <CardHeader className="pb-3 bg-blue-100">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base text-blue-900">Prospecção</CardTitle>
                  <Badge variant="secondary">{prospeccaoEventos.length}</Badge>
                </div>
              </CardHeader>
              <CardContent className="flex-1 space-y-3 pt-4">
                {prospeccaoEventos.map((evento) => (
                  <Card key={evento.id} className="hover:shadow-md transition-shadow cursor-pointer">
                    <CardContent className="p-3">
                      <div className="space-y-2">
                        <div>
                          <h4 className="font-semibold text-sm text-primary-dark-blue">{evento.codigo}</h4>
                          <p className="text-xs text-muted-foreground">{evento.nome}</p>
                          <p className="text-xs text-muted-foreground mt-1">
                            {new Date(evento.data).toLocaleDateString("pt-BR")}
                          </p>
                        </div>
                        <Badge className={getStatusBadgeColor(evento.status)}>{getStatusLabel(evento.status)}</Badge>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </CardContent>
            </Card>
          </div>

          {/* Coluna 2: Lead Qualificado */}
          <div className="lg:w-72 md:w-64 w-56 flex-shrink-0">
            <Card className="h-full flex flex-col bg-teal-50 border-teal-200">
              <CardHeader className="pb-3 bg-teal-100">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base text-teal-900">Lead Qualificado</CardTitle>
                  <Badge variant="secondary">{leadsQualificados.length}</Badge>
                </div>
              </CardHeader>
              <CardContent className="flex-1 space-y-3 pt-4">
                <Dialog open={showLeadModal} onOpenChange={setShowLeadModal}>
                  <DialogTrigger asChild>
                    <Button variant="outline" size="sm" className="w-full bg-transparent">
                      <Plus className="w-4 h-4 mr-2" />
                      Novo Lead
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Novo Lead</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="lead-nome">Nome do Lead</Label>
                        <Input
                          id="lead-nome"
                          placeholder="Ex: João Silva"
                          value={novoLead.nome}
                          onChange={(e) => setNovoLead({ ...novoLead, nome: e.target.value })}
                        />
                      </div>
                      <div>
                        <Label htmlFor="lead-contato">Contato (Telefone/Email)</Label>
                        <Input
                          id="lead-contato"
                          placeholder="Ex: 11999999999"
                          value={novoLead.contato}
                          onChange={(e) => setNovoLead({ ...novoLead, contato: e.target.value })}
                        />
                      </div>
                      <div>
                        <Label htmlFor="lead-evento">Evento de Origem</Label>
                        <Select
                          value={novoLead.eventoOrigem}
                          onValueChange={(value) => setNovoLead({ ...novoLead, eventoOrigem: value })}
                        >
                          <SelectTrigger id="lead-evento">
                            <SelectValue placeholder="Selecione um evento" />
                          </SelectTrigger>
                          <SelectContent>
                            {eventos.map((evento) => (
                              <SelectItem key={evento.id} value={evento.codigo}>
                                {evento.codigo} - {evento.nome}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <Button onClick={handleAddLead} className="w-full">
                        Salvar Lead
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>

                {leadsQualificados.map((lead) => (
                  <Card key={lead.id} className="hover:shadow-md transition-shadow cursor-pointer">
                    <CardContent className="p-3">
                      <div className="space-y-2">
                        <div>
                          <h4 className="font-semibold text-sm text-primary-dark-blue line-clamp-1">{lead.nome}</h4>
                          <p className="text-xs text-muted-foreground">{lead.contato}</p>
                        </div>
                        <Badge className={getStatusBadgeColor(lead.status)}>{getStatusLabel(lead.status)}</Badge>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </CardContent>
            </Card>
          </div>

          {/* Coluna 3: Acolhimento */}
          <div className="lg:w-72 md:w-64 w-56 flex-shrink-0">
            <Card className="h-full flex flex-col bg-green-50 border-green-200">
              <CardHeader className="pb-3 bg-green-100">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base text-green-900">Acolhimento</CardTitle>
                  <Badge variant="secondary">{leadsAcolhimento.length}</Badge>
                </div>
              </CardHeader>
              <CardContent className="flex-1 space-y-3 pt-4">
                {leadsAcolhimento.map((lead) => (
                  <Card key={lead.id} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-3 space-y-3">
                      <h4 className="font-semibold text-sm text-primary-dark-blue">{lead.nome}</h4>
                      <div className="space-y-2">
                        <Label htmlFor={`acolhimento-data-${lead.id}`} className="text-xs">
                          Data do Acolhimento
                        </Label>
                        <Input
                          id={`acolhimento-data-${lead.id}`}
                          type="date"
                          className="h-8 text-xs"
                          value={lead.dataAcolhimento}
                          onChange={(e) =>
                            setLeads(
                              leads.map((l) => (l.id === lead.id ? { ...l, dataAcolhimento: e.target.value } : l)),
                            )
                          }
                        />
                      </div>
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id={`acolhimento-realizado-${lead.id}`}
                          checked={lead.acolhimentoRealizado}
                          onCheckedChange={(checked) => updateLeadAcolhimento(lead.id, checked as boolean)}
                        />
                        <Label htmlFor={`acolhimento-realizado-${lead.id}`} className="text-xs cursor-pointer">
                          Acolhimento Realizado
                        </Label>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </CardContent>
            </Card>
          </div>

          {/* Coluna 4: Envio de Proposta */}
          <div className="lg:w-72 md:w-64 w-56 flex-shrink-0">
            <Card className="h-full flex flex-col bg-yellow-50 border-yellow-200">
              <CardHeader className="pb-3 bg-yellow-100">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base text-yellow-900">Envio de Proposta</CardTitle>
                  <Badge variant="secondary">{leadsPropostasAbertas.length}</Badge>
                </div>
              </CardHeader>
              <CardContent className="flex-1 space-y-3 pt-4">
                {leadsPropostasAbertas.map((lead) => (
                  <Card key={lead.id} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-3 space-y-3">
                      <h4 className="font-semibold text-sm text-primary-dark-blue">{lead.nome}</h4>
                      <div className="space-y-2">
                        <div className="flex items-center space-x-2">
                          <Checkbox
                            id={`orcamento-${lead.id}`}
                            checked={lead.orcamentoEnviado}
                            onCheckedChange={(checked) =>
                              updateLeadProposta(lead.id, "orcamentoEnviado", checked as boolean)
                            }
                          />
                          <Label htmlFor={`orcamento-${lead.id}`} className="text-xs cursor-pointer">
                            Orçamento Enviado
                          </Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Checkbox
                            id={`qh-${lead.id}`}
                            checked={lead.qhEnviado}
                            onCheckedChange={(checked) => updateLeadProposta(lead.id, "qhEnviado", checked as boolean)}
                          />
                          <Label htmlFor={`qh-${lead.id}`} className="text-xs cursor-pointer">
                            QH Enviado
                          </Label>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </CardContent>
            </Card>
          </div>

          {/* Coluna 5: Fechamento */}
          <div className="lg:w-72 md:w-64 w-56 flex-shrink-0">
            <Card className="h-full flex flex-col bg-purple-50 border-purple-200">
              <CardHeader className="pb-3 bg-purple-100">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base text-purple-900">Fechamento</CardTitle>
                  <Badge variant="secondary">{leadsFechamento.length}</Badge>
                </div>
              </CardHeader>
              <CardContent className="flex-1 space-y-3 pt-4">
                {leadsFechamento.map((lead) => (
                  <Card key={lead.id} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-3 space-y-3">
                      <h4 className="font-semibold text-sm text-primary-dark-blue">{lead.nome}</h4>
                      <div className="space-y-2">
                        <div className="flex items-center space-x-2">
                          <Checkbox
                            id={`anamnese-${lead.id}`}
                            checked={lead.anamnesesRealizada}
                            onCheckedChange={(checked) =>
                              updateLeadFechamento(lead.id, "anamnesesRealizada", checked as boolean)
                            }
                          />
                          <Label htmlFor={`anamnese-${lead.id}`} className="text-xs cursor-pointer">
                            Anamnese Realizada
                          </Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Checkbox
                            id={`contrato-${lead.id}`}
                            checked={lead.contratoAssinado}
                            onCheckedChange={(checked) =>
                              updateLeadFechamento(lead.id, "contratoAssinado", checked as boolean)
                            }
                          />
                          <Label htmlFor={`contrato-${lead.id}`} className="text-xs cursor-pointer">
                            Contrato Assinado
                          </Label>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </CardContent>
            </Card>
          </div>

          {/* Coluna 6: Pós Venda */}
          <div className="lg:w-72 md:w-64 w-56 flex-shrink-0">
            <Card className="h-full flex flex-col bg-emerald-50 border-emerald-200">
              <CardHeader className="pb-3 bg-emerald-100">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base text-emerald-900">Pós Venda</CardTitle>
                  <Badge variant="secondary">{leadsPosPorVenda.length}</Badge>
                </div>
              </CardHeader>
              <CardContent className="flex-1 space-y-3 pt-4">
                {leadsPosPorVenda.length > 0 ? (
                  leadsPosPorVenda.map((lead) => (
                    <Card key={lead.id} className="hover:shadow-md transition-shadow bg-white">
                      <CardContent className="p-3">
                        <div className="flex items-center gap-2">
                          <CheckCircle className="w-4 h-4 text-green-600" />
                          <div>
                            <h4 className="font-semibold text-sm text-primary-dark-blue">{lead.nome}</h4>
                            <Badge className="mt-1 text-xs bg-green-100 text-green-800">Finalizado</Badge>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                ) : (
                  <div className="flex items-center justify-center h-32 text-muted-foreground text-xs text-center">
                    Nenhum lead em pós-venda
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
