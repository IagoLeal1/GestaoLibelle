"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Plus, Search, Filter, CheckCircle, TrendingUp, Trash2 } from "lucide-react"
import Link from "next/link"
import { toast } from "sonner" 

import {
  listenToEventos,
  listenToLeads,
  addEvento,
  updateEvento,
  deleteEvento,
  addLead,
  updateLead,
  deleteLead,
  type Evento,
  type Lead,
} from "@/services/comercialService" // Ajuste o caminho se necessário

// --- FUNÇÕES DE FORMATAÇÃO ---

const formatPhone = (value: string) => {
  if (!value) return ""
  value = value.replace(/\D/g, "")
  value = value.replace(/^(\d{2})(\d)/g, "($1) $2")
  value = value.replace(/(\d)(\d{4})$/, "$1-$2")
  return value.slice(0, 15)
}

// --- MUDANÇA AQUI: NOVAS FUNÇÕES DE DATA ---

/**
 * Aplica a máscara DD/MM/AAAA enquanto o usuário digita.
 */
const formatDateMask = (value: string): string => {
  if (!value) return ""
  value = value.replace(/\D/g, "") // Remove tudo que não é dígito
  value = value.replace(/^(\d{2})(\d)/g, "$1/$2") // Adiciona / após o dia
  value = value.replace(/^(\d{2})\/(\d{2})(\d)/g, "$1/$2/$3") // Adiciona / após o mês
  return value.slice(0, 10) // Limita a 10 caracteres (DD/MM/AAAA)
}

/**
 * Converte a máscara DD/MM/AAAA para o formato YYYY-MM-DD para salvar no banco.
 */
const convertMaskToYYYYMMDD = (maskedDate: string): string => {
  if (!maskedDate || maskedDate.length !== 10) return "" // Só converte se estiver completa
  const [day, month, year] = maskedDate.split('/')
  return `${year}-${month}-${day}`
}

/**
 * Converte dados do Firebase (Timestamp ou YYYY-MM-DD) para DD/MM/AAAA para exibição.
 */
const formatDateForInput = (dateField: any): string => {
  if (!dateField) return ""

  let dateStr = "";

  // Case 1: É um Timestamp do Firebase
  if (typeof dateField.toDate === 'function') {
    dateStr = dateField.toDate().toISOString().split('T')[0]; // Converte para YYYY-MM-DD
  }
  // Case 2: É uma string (provavelmente já YYYY-MM-DD)
  else if (String(dateField).includes('-')) {
    dateStr = String(dateField).split('T')[0]; // Limpa
  }
  // Case 3: É uma string DD/MM/AAAA (que o usuário está digitando)
  else if (String(dateField).includes('/')) {
    return String(dateField); // Retorna a própria máscara
  }

  // Se temos um YYYY-MM-DD, converte para DD/MM/AAAA
  if (dateStr && /^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
    const [year, month, day] = dateStr.split('-');
    return `${day}/${month}/${year}`;
  }

  return String(dateField); // Retorna o que quer que seja se não bater
}

export default function FunilAquisicao() {
  // --- STATES ---
  const [eventos, setEventos] = useState<Evento[]>([])
  const [leads, setLeads] = useState<Lead[]>([])
  
  // Estados de UI
  const [searchTerm, setSearchTerm] = useState("")
  const [showEventoModal, setShowEventoModal] = useState(false)
  const [showLeadModal, setShowLeadModal] = useState(false)
  const [loading, setLoading] = useState(true)
  
  // Estados de formulário
  // --- MUDANÇA AQUI: O estado local agora guarda a máscara DD/MM/AAAA ---
  const [novoEvento, setNovoEvento] = useState({ codigo: "", nome: "", data: "" })
  const [novoLead, setNovoLead] = useState({ nome: "", contato: "", eventoOrigem: "" })


  // --- DATA FETCHING (agora com o Service) ---
  useEffect(() => {
    setLoading(true)
    
    // Inicia o listener de Eventos
    const unsubscribeEventos = listenToEventos((data) => {
      setEventos(data)
    })

    // Inicia o listener de Leads
    const unsubscribeLeads = listenToLeads((data) => {
      setLeads(data)
      setLoading(false) // Termina o loading após carregar os leads
    })

    // Função de limpeza
    return () => {
      unsubscribeEventos()
      unsubscribeLeads()
    }
  }, []) // Roda apenas uma vez

  // --- CRUD HANDLERS (agora chamam o Service) ---

  const handleAddEvento = async () => {
    // --- MUDANÇA AQUI: Converte a data antes de salvar ---
    if (novoEvento.codigo && novoEvento.nome && novoEvento.data.length === 10) {
      try {
        const eventoData = {
          ...novoEvento,
          data: convertMaskToYYYYMMDD(novoEvento.data) // Converte DD/MM/AAAA -> YYYY-MM-DD
        }
        await addEvento(eventoData) // Chama o service
        toast.success("Evento adicionado com sucesso!")
        setNovoEvento({ codigo: "", nome: "", data: "" })
        setShowEventoModal(false)
      } catch (error) {
        console.error("Erro ao adicionar evento: ", error)
        toast.error("Erro ao adicionar evento.")
      }
    } else {
      toast.warning("Preencha todos os campos do evento (incluindo data completa).")
    }
  }

  const handleAddLead = async () => {
    if (novoLead.nome && novoLead.contato && novoLead.eventoOrigem) {
      try {
        // Remove a formatação do telefone antes de salvar
        const leadData = {
          ...novoLead,
          contato: novoLead.contato.replace(/\D/g, "") // Salva só os números
        }
        await addLead(leadData) // Chama o service
        toast.success("Lead adicionado com sucesso!")
        setNovoLead({ nome: "", contato: "", eventoOrigem: "" })
        setShowLeadModal(false)
      } catch (error) {
        console.error("Erro ao adicionar lead: ", error)
        toast.error("Erro ao adicionar lead.")
      }
    } else {
      toast.warning("Preencha todos os campos do lead.")
    }
  }

  // Funções de Update genéricas (apenas chamam o service)
  const handleUpdateEvento = async (id: string, data: Partial<Evento>) => {
    try {
      await updateEvento(id, data)
    } catch (error) {
      console.error("Erro ao atualizar evento: ", error)
      toast.error("Erro ao atualizar evento.")
    }
  }

  // --- MUDANÇA AQUI: Criamos um handler de data separado ---
  const handleLeadDateChange = (id: string, maskedDate: string) => {
    // 1. Atualiza a UI imediatamente com a máscara
    setLeads(prevLeads => 
      prevLeads.map(l => l.id === id ? { ...l, dataAcolhimento: maskedDate } : l)
    );

    // 2. Se a data estiver completa, salva no banco no formato YYYY-MM-DD
    if (maskedDate.length === 10) {
      const dataYYYYMMDD = convertMaskToYYYYMMDD(maskedDate);
      handleUpdateLead(id, { dataAcolhimento: dataYYYYMMDD });
    }
  }

  const handleUpdateLead = async (id: string, data: Partial<Lead>) => {
    try {
      await updateLead(id, data) // A lógica de status está no service
    } catch (error) {
      console.error("Erro ao atualizar lead: ", error)
      toast.error("Erro ao atualizar lead.")
    }
  }

  // Funções de Delete
  const handleDeleteEvento = async (id: string) => {
    if (window.confirm("Tem certeza que deseja excluir este evento?")) {
      try {
        await deleteEvento(id)
        toast.success("Evento excluído.")
      } catch (error) {
        toast.error("Erro ao excluir evento.")
      }
    }
  }

  const handleDeleteLead = async (id: string) => {
    if (window.confirm("Tem certeza que deseja excluir este lead?")) {
      try {
        await deleteLead(id)
        toast.success("Lead excluído.")
      } catch (error) {
        toast.error("Erro ao excluir lead.")
      }
    }
  }

  // --- FUNÇÕES AUXILIARES (Design) ---
  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case "sucesso": return "bg-green-100 text-green-800"
      case "falha": return "bg-red-100 text-red-800"
      default: return "bg-yellow-100 text-yellow-800"
    }
  }

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "sucesso": return "Sucesso"
      case "falha": return "Falha"
      default: return "Pendente"
    }
  }

  // --- LÓGICA DE FILTRO E KANBAN ---
  const leadsFiltrados = leads.filter(
    (lead) =>
      lead.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
      lead.contato.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  const prospeccaoEventos = eventos
  const leadsParaQualificar = leadsFiltrados.filter(l => !l.acolhimentoRealizado && l.status === 'pendente');
  const leadsAcolhimento = leadsFiltrados.filter((l) => l.status === "sucesso" && !l.acolhimentoRealizado)
  const leadsPropostasAbertas = leadsFiltrados.filter((l) => l.acolhimentoRealizado && l.status === 'sucesso' && (!l.orcamentoEnviado || !l.qhEnviado))
  const leadsFechamento = leadsFiltrados.filter((l) => l.acolhimentoRealizado && l.orcamentoEnviado && l.qhEnviado && l.status === 'sucesso' && (!l.anamneseRealizada || !l.contratoAssinado))
  const leadsPosPorVenda = leadsFiltrados.filter((l) => l.anamneseRealizada && l.contratoAssinado && l.status === 'sucesso')

  // --- RENDER ---
  if (loading) {
    return (<div className="flex justify-center items-center h-64"><p>Carregando dados do funil...</p></div>);
  }

  return (
    <div className="space-y-6">
      {/* Cabeçalho */}
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

      {/* Filtros e Ações */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filtros e Ações
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            {/* Busca */}
            <div className="space-y-2 md:col-span-1">
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
            {/* Botões de Ação */}
            <div className="space-y-2 flex flex-col sm:flex-row justify-end gap-2 md:col-span-2 md:items-end">
              {/* Modal Novo Evento */}
              <Dialog open={showEventoModal} onOpenChange={setShowEventoModal}>
                <DialogTrigger asChild>
                  <Button variant="outline" className="w-full sm:w-auto bg-transparent">
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
                      <Input id="codigo" placeholder="Ex: SVI-002" value={novoEvento.codigo} onChange={(e) => setNovoEvento({ ...novoEvento, codigo: e.target.value })} />
                    </div>
                    <div>
                      <Label htmlFor="nome">Nome do Evento</Label>
                      <Input id="nome" placeholder="Ex: Parceria Escola São Vicente" value={novoEvento.nome} onChange={(e) => setNovoEvento({ ...novoEvento, nome: e.target.value })} />
                    </div>
                    <div>
                      <Label htmlFor="data">Data do Evento (DD/MM/AAAA)</Label>
                      {/* --- MUDANÇA AQUI --- */}
                      <Input 
                        id="data" 
                        type="text" // Alterado para text
                        placeholder="DD/MM/AAAA"
                        maxLength={10}
                        value={novoEvento.data} 
                        onChange={(e) => setNovoEvento({ ...novoEvento, data: formatDateMask(e.target.value) })} 
                      />
                    </div>
                    <Button onClick={handleAddEvento} className="w-full">
                      Salvar Evento
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
              {/* Modal Novo Lead */}
              <Dialog open={showLeadModal} onOpenChange={setShowLeadModal}>
                  <DialogTrigger asChild>
                    <Button size="sm" className="w-full sm:w-auto">
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
                        <Input id="lead-nome" placeholder="Ex: João Silva" value={novoLead.nome} onChange={(e) => setNovoLead({ ...novoLead, nome: e.target.value })} />
                      </div>
                      <div>
                        <Label htmlFor="lead-contato">Contato (Telefone)</Label>
                        <Input 
                          id="lead-contato" 
                          placeholder="(00) 00000-0000" 
                          value={novoLead.contato} 
                          onChange={(e) => setNovoLead({ ...novoLead, contato: formatPhone(e.target.value) })} 
                          maxLength={15}
                        />
                      </div>
                      <div>
                        <Label htmlFor="lead-evento">Evento de Origem</Label>
                        <Select value={novoLead.eventoOrigem} onValueChange={(value) => setNovoLead({ ...novoLead, eventoOrigem: value })}>
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
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Kanban Board */}
      <div className="w-full lg:overflow-x-auto">
        <div className="flex flex-col lg:flex-row lg:gap-3 lg:min-w-max lg:pb-4 space-y-4 lg:space-y-0">
          
          {/* Coluna 1: Prospecção */}
          <div className="w-full lg:w-72 flex-shrink-0">
            <Card className="h-full flex flex-col bg-blue-50 border-blue-200">
              <CardHeader className="pb-3 bg-blue-100">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base text-blue-900">Prospecção</CardTitle>
                  <Badge variant="secondary">{prospeccaoEventos.length}</Badge>
                </div>
              </CardHeader>
              <CardContent className="flex-1 space-y-3 pt-4">
                {prospeccaoEventos.map((evento) => (
                  <Card key={evento.id} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-3">
                      <div className="space-y-2">
                        <div className="flex justify-between items-start">
                            <div>
                                <h4 className="font-semibold text-sm text-primary-dark-blue">{evento.codigo}</h4>
                                <p className="text-xs text-muted-foreground">{evento.nome}</p>
                            </div>
                            <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => handleDeleteEvento(evento.id)}>
                                <Trash2 className="h-4 w-4 text-red-500" />
                            </Button>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                          {/* --- MUDANÇA AQUI --- */}
                          Data: {formatDateForInput(evento.data) || 'N/A'}
                        </p>
                        <Select 
                          value={evento.status} 
                          onValueChange={(value) => handleUpdateEvento(evento.id, { status: value as "pendente" | "sucesso" | "falha" })}
                        >
                          <SelectTrigger className={`h-8 text-xs ${getStatusBadgeColor(evento.status)}`}>
                            <SelectValue placeholder="Status" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="pendente">Pendente</SelectItem>
                            <SelectItem value="sucesso">Sucesso</SelectItem>
                            <SelectItem value="falha">Falha</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </CardContent>
            </Card>
          </div>

          {/* Coluna 2: Lead Qualificado */}
          <div className="w-full lg:w-72 flex-shrink-0">
            <Card className="h-full flex flex-col bg-teal-50 border-teal-200">
              <CardHeader className="pb-3 bg-teal-100">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base text-teal-900">Lead Qualificado</CardTitle>
                  <Badge variant="secondary">{leadsParaQualificar.length}</Badge>
                </div>
              </CardHeader>
              <CardContent className="flex-1 space-y-3 pt-4">
                {leadsParaQualificar.map((lead) => (
                  <Card key={lead.id} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-3">
                      <div className="space-y-2">
                        <div className="flex justify-between items-start">
                            <h4 className="font-semibold text-sm text-primary-dark-blue line-clamp-1">{lead.nome}</h4>
                             <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => handleDeleteLead(lead.id)}>
                                <Trash2 className="h-4 w-4 text-red-500" />
                            </Button>
                        </div>
                        <p className="text-xs text-muted-foreground">{formatPhone(lead.contato)}</p>
                        <p className="text-xs text-muted-foreground">Origem: {lead.eventoOrigem}</p>
                         <Select 
                          value={lead.status} 
                          onValueChange={(value) => handleUpdateLead(lead.id, { status: value as "pendente" | "sucesso" | "falha" })}
                        >
                          <SelectTrigger className={`h-8 text-xs ${getStatusBadgeColor(lead.status)}`}>
                            <SelectValue placeholder="Status" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="pendente">Pendente</SelectItem>
                            <SelectItem value="sucesso">Avançar (Sucesso)</SelectItem>
                            <SelectItem value="falha">Perdido (Falha)</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </CardContent>
            </Card>
          </div>

          {/* Coluna 3: Acolhimento */}
          <div className="w-full lg:w-72 flex-shrink-0">
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
                          Data do Acolhimento (DD/MM/AAAA)
                        </Label>
                        {/* --- MUDANÇA AQUI (Este era o bug!) --- */}
                        <Input
                          id={`acolhimento-data-${lead.id}`}
                          type="text" // Alterado para text
                          placeholder="DD/MM/AAAA"
                          maxLength={10}
                          className="h-8 text-xs"
                          value={formatDateForInput(lead.dataAcolhimento)}
                          onChange={(e) => handleLeadDateChange(lead.id, formatDateMask(e.target.value))}
                        />
                      </div>
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id={`acolhimento-realizado-${lead.id}`}
                          checked={lead.acolhimentoRealizado}
                          onCheckedChange={(checked) =>
                            handleUpdateLead(lead.id, { acolhimentoRealizado: checked as boolean })
                          }
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
          <div className="w-full lg:w-72 flex-shrink-0">
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
                              handleUpdateLead(lead.id, { orcamentoEnviado: checked as boolean })
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
                            onCheckedChange={(checked) => handleUpdateLead(lead.id, { qhEnviado: checked as boolean })}
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
          <div className="w-full lg:w-72 flex-shrink-0">
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
                            checked={lead.anamneseRealizada}
                            onCheckedChange={(checked) =>
                              handleUpdateLead(lead.id, { anamneseRealizada: checked as boolean })
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
                              handleUpdateLead(lead.id, { contratoAssinado: checked as boolean })
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
          <div className="w-full lg:w-72 flex-shrink-0">
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