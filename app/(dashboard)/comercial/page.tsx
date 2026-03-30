"use client"

import React, { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Plus, Search, Filter, Trash2, TrendingUp } from "lucide-react"
import Link from "next/link"
import { toast } from "sonner" 

import {
  listenToEventos,
  listenToLeads,
  addEvento,
  deleteLead,
  addLead,
  updateLead,
  type Evento,
  type Lead,
  type TipoFluxo,
  type LeadChecklist
} from "@/services/comercialService" 

// --- FUNÇÕES DE FORMATAÇÃO ---
const formatPhone = (value: string) => {
  if (!value) return ""
  value = value.replace(/\D/g, "")
  value = value.replace(/^(\d{2})(\d)/g, "($1) $2")
  value = value.replace(/(\d)(\d{4})$/, "$1-$2")
  return value.slice(0, 15)
}

const formatDateMask = (value: string): string => {
  if (!value) return ""
  value = value.replace(/\D/g, "")
  value = value.replace(/^(\d{2})(\d)/g, "$1/$2")
  value = value.replace(/^(\d{2})\/(\d{2})(\d)/g, "$1/$2/$3")
  return value.slice(0, 10)
}

const convertMaskToYYYYMMDD = (maskedDate: string): string => {
  if (!maskedDate || maskedDate.length !== 10) return ""
  const [day, month, year] = maskedDate.split('/')
  return `${year}-${month}-${day}`
}

const LABELS_CHECKLIST: Record<keyof LeadChecklist, string> = {
  agendar: "Agendar",
  inserirPlControle: "Inserir PL de Controle",
  enviarGrupoAcolhimento: "Enviar no Grupo",
  avisarProfissional: "Avisar Profissional",
  email: "Email",
  acolher: "Acolher",
  fazerCarta: "Fazer Carta",
  qtdHorasOrcamento: "Qtd. Horas Orçto.",
  avaliar: "Avaliar",
  fazerOrcamento: "Fazer Orçamento",
  confPlano: "Conf. Plano",
  enviarCarta: "Enviar Carta",
  cOrcamento: "C. Orçamento",
  pos: "Pós",
  anamnese: "Anamnese",
  avisarFinNegativa: "Avisar Fin. Negativa",
  qhHorarios: "QH Horários",
  pastaDrive: "Pasta Drive",
  dataInicio: "Data de Início",
  avisarProf: "Avisar Prof.",
  avisarFamilia: "Avisar Família",
  cadastroInthegra: "Cadastro Inthegra",
  contrato: "Contrato",
  brinde: "Brinde",
  termo: "Termo",
  regulamento: "Regulamento"
};

const ETAPAS = [
  { id: "recepcao1", cor: "bg-slate-100", border: "border-slate-200", text: "text-slate-900" },
  { id: "coord_familias", cor: "bg-pink-100", border: "border-pink-200", text: "text-pink-900" },
  { id: "fin", cor: "bg-yellow-100", border: "border-yellow-200", text: "text-yellow-900" },
  { id: "comercial", cor: "bg-orange-100", border: "border-orange-200", text: "text-orange-900" },
  { id: "coord_clinica", cor: "bg-blue-100", border: "border-blue-200", text: "text-blue-900" },
  { id: "recepcao2", cor: "bg-slate-200", border: "border-slate-300", text: "text-slate-900" },
  { id: "gerente_op", cor: "bg-green-100", border: "border-green-200", text: "text-green-900" }
];

const getColumnName = (etapaId: string, fluxo: string) => {
  if (etapaId === "recepcao1" || etapaId === "recepcao2") return "Recepção";
  if (etapaId === "coord_familias") return fluxo === "avaliacao" ? "Profissional" : "Coord. Famílias";
  if (etapaId === "fin") return "Fin.";
  if (etapaId === "comercial") return "Comercial";
  if (etapaId === "coord_clinica") return "Coord. Clínica";
  if (etapaId === "gerente_op") return "Gerente Op.";
  return etapaId;
}

const getChecklistForEtapa = (etapa: string, fluxo: string): (keyof LeadChecklist)[] => {
  switch (etapa) {
    case "recepcao1":
      if (fluxo === "novo_paciente") return ["agendar", "inserirPlControle", "enviarGrupoAcolhimento"];
      if (fluxo === "avaliacao") return ["agendar", "inserirPlControle", "avisarProfissional"];
      if (fluxo === "liminar") return ["email"];
      break;
    case "coord_familias":
      if (fluxo === "novo_paciente") return ["acolher", "fazerCarta", "qtdHorasOrcamento"];
      if (fluxo === "avaliacao") return ["avaliar", "qtdHorasOrcamento"];
      if (fluxo === "liminar") return ["acolher", "fazerCarta"];
      break;
    case "fin":
      if (fluxo === "novo_paciente" || fluxo === "avaliacao") return ["fazerOrcamento"];
      if (fluxo === "liminar") return ["confPlano"];
      break;
    case "comercial":
      if (fluxo === "novo_paciente") return ["enviarCarta", "cOrcamento", "pos", "anamnese"];
      if (fluxo === "liminar") return ["enviarCarta", "pos", "anamnese"];
      if (fluxo === "avaliacao") return ["enviarCarta", "cOrcamento", "pos", "anamnese", "avisarFinNegativa"];
      break;
    case "coord_clinica":
      return ["qhHorarios", "pastaDrive", "dataInicio", "avisarProf"];
    case "recepcao2":
      return ["avisarFamilia", "cadastroInthegra"];
    case "gerente_op":
      if (fluxo === "novo_paciente" || fluxo === "avaliacao") return ["contrato", "brinde", "termo", "regulamento"];
      if (fluxo === "liminar") return ["brinde", "termo", "regulamento"];
      break;
  }
  return [];
}

export default function FunilAquisicao() {
  const [eventos, setEventos] = useState<Evento[]>([])
  const [leads, setLeads] = useState<Lead[]>([])
  
  const [searchTerm, setSearchTerm] = useState("")
  const [showEventoModal, setShowEventoModal] = useState(false)
  const [showLeadModal, setShowLeadModal] = useState(false)
  const [loading, setLoading] = useState(true)
  
  const [activeTab, setActiveTab] = useState<TipoFluxo>("novo_paciente")

  const [novoEvento, setNovoEvento] = useState({ codigo: "", nome: "", data: "" })
  const [novoLead, setNovoLead] = useState({ nome: "", contato: "", eventoOrigem: "nenhum", tipoFluxo: "novo_paciente" as TipoFluxo })

  useEffect(() => {
    setLoading(true)
    const unsubscribeEventos = listenToEventos((data) => setEventos(data))
    const unsubscribeLeads = listenToLeads((data) => {
      setLeads(data)
      setLoading(false)
    })
    return () => {
      unsubscribeEventos()
      unsubscribeLeads()
    }
  }, [])

  const handleAddEvento = async () => {
    if (novoEvento.codigo && novoEvento.nome && novoEvento.data.length === 10) {
      try {
        const eventoData = { ...novoEvento, data: convertMaskToYYYYMMDD(novoEvento.data) }
        await addEvento(eventoData)
        toast.success("Evento adicionado com sucesso!")
        setNovoEvento({ codigo: "", nome: "", data: "" })
        setShowEventoModal(false)
      } catch (error) {
        toast.error("Erro ao adicionar evento.")
      }
    } else {
      toast.warning("Preencha todos os campos do evento (incluindo data completa).")
    }
  }

  const handleAddLead = async () => {
    if (novoLead.nome && novoLead.contato) {
      try {
        const leadData = { ...novoLead, contato: novoLead.contato.replace(/\D/g, "") }
        await addLead(leadData as any)
        toast.success("Paciente adicionado ao funil!")
        setNovoLead({ nome: "", contato: "", eventoOrigem: "nenhum", tipoFluxo: "novo_paciente" })
        setShowLeadModal(false)
      } catch (error) {
        toast.error("Erro ao adicionar paciente.")
      }
    } else {
      toast.warning("Preencha os campos obrigatórios.")
    }
  }

  const handleDeleteLead = async (id: string) => {
    if (window.confirm("Tem certeza que deseja excluir este paciente?")) {
      try {
        await deleteLead(id)
        toast.success("Excluído com sucesso.")
      } catch (error) {
        toast.error("Erro ao excluir.")
      }
    }
  }

  const handleToggleChecklist = (lead: Lead, task: keyof LeadChecklist, checked: boolean) => {
    const updatedChecklist = { ...lead.checklist, [task]: checked };
    updateLead(lead.id, { checklist: updatedChecklist as any }).catch(() => toast.error("Erro ao atualizar tarefa"));
  }

  const handleMoveEtapa = (lead: Lead, novaEtapa: string) => {
    updateLead(lead.id, { etapaAtual: novaEtapa }).catch(() => toast.error("Erro ao mover paciente"));
  }

  const leadsFiltrados = leads.filter(
    (lead) =>
      lead.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
      lead.contato.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  if (loading) {
    return (<div className="flex justify-center items-center h-64"><p className="text-muted-foreground">Carregando dados do funil...</p></div>);
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-primary-dark-blue">Funil Comercial</h2>
          <p className="text-sm text-muted-foreground">Gerenciamento de entrada de pacientes</p>
        </div>
        <Button asChild size="sm" className="w-full sm:w-auto">
          <Link href="/comercial/comercial-relatorios" className="flex items-center">
            <TrendingUp className="mr-2 h-4 w-4" />
            Ver Relatórios
          </Link>
        </Button>
      </div>

      <Card className="rounded-md border-slate-200 shadow-sm border-0">
        <CardContent className="p-6 sm:p-8 min-h-[96px] flex flex-col justify-center bg-slate-50/50 rounded-md">
          <div className="flex flex-col md:flex-row gap-5 justify-between items-center w-full">
            <div className="relative w-full md:max-w-md">
              <Search className="absolute left-3 top-3 h-5 w-5 text-muted-foreground" />
              <Input
                id="search"
                placeholder="Buscar Paciente ou Contato..."
                className="pl-10 h-11 text-sm rounded-lg shadow-sm w-full"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="flex flex-row gap-3 w-full md:w-auto">
              <Dialog open={showEventoModal} onOpenChange={setShowEventoModal}>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm" className="w-full sm:w-auto h-11 px-5 text-sm bg-white shadow-sm hover:bg-slate-100 transition-colors">
                    <Plus className="w-4 h-4 mr-2" />
                    Novo Evento
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Novo Evento de Origem</DialogTitle>
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
                      <Input id="data" type="text" placeholder="DD/MM/AAAA" maxLength={10} value={novoEvento.data} onChange={(e) => setNovoEvento({ ...novoEvento, data: formatDateMask(e.target.value) })} />
                    </div>
                    <Button onClick={handleAddEvento} className="w-full">Salvar Evento</Button>
                  </div>
                </DialogContent>
              </Dialog>

              <Dialog open={showLeadModal} onOpenChange={setShowLeadModal}>
                <DialogTrigger asChild>
                  <Button size="sm" className="w-full sm:w-auto h-11 px-6 text-sm shadow-sm transition-transform active:scale-95">
                    <Plus className="w-4 h-4 mr-2" />
                    Novo Paciente
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Cadastrar Novo Paciente no Funil</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="lead-nome">Nome do Paciente</Label>
                      <Input id="lead-nome" placeholder="Ex: João Silva" value={novoLead.nome} onChange={(e) => setNovoLead({ ...novoLead, nome: e.target.value })} />
                    </div>
                    <div>
                      <Label htmlFor="lead-contato">Contato (Telefone)</Label>
                      <Input id="lead-contato" placeholder="(00) 00000-0000" value={novoLead.contato} onChange={(e) => setNovoLead({ ...novoLead, contato: formatPhone(e.target.value) })} maxLength={15} />
                    </div>
                    <div>
                      <Label htmlFor="lead-fluxo">Tipo de Fluxo</Label>
                      <Select value={novoLead.tipoFluxo} onValueChange={(value: TipoFluxo) => setNovoLead({ ...novoLead, tipoFluxo: value })}>
                        <SelectTrigger id="lead-fluxo">
                          <SelectValue placeholder="Selecione o Fluxo" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="novo_paciente">Novo Paciente</SelectItem>
                          <SelectItem value="avaliacao">Apenas para Avaliação</SelectItem>
                          <SelectItem value="liminar">Liminar</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="lead-evento">Evento de Origem</Label>
                      <Select value={novoLead.eventoOrigem} onValueChange={(value) => setNovoLead({ ...novoLead, eventoOrigem: value })}>
                        <SelectTrigger id="lead-evento">
                          <SelectValue placeholder="Sem Evento" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="nenhum">Nenhum / Direto</SelectItem>
                          {eventos.map((evento) => (
                            <SelectItem key={evento.id} value={evento.codigo}>
                              {evento.codigo} - {evento.nome}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <Button onClick={handleAddLead} className="w-full">Salvar</Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as TipoFluxo)} className="w-full space-y-4">
        <TabsList className="grid w-full grid-cols-3 max-w-2xl mx-auto h-10">
          <TabsTrigger value="novo_paciente" className="text-xs sm:text-sm">Novo Paciente</TabsTrigger>
          <TabsTrigger value="avaliacao" className="text-xs sm:text-sm">Avaliação</TabsTrigger>
          <TabsTrigger value="liminar" className="text-xs sm:text-sm">Liminar</TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="w-full mt-2 focus-visible:outline-none focus-visible:ring-0">
          {/* Quadro Kanban Compacto Horizontal */}
          <div className="flex overflow-x-auto pb-4 custom-scrollbar w-full">
            <div className="flex gap-2 w-full min-w-max">
              {ETAPAS.map((etapa, index) => {
                const leadsNestaEtapa = leadsFiltrados.filter(l => l.etapaAtual === etapa.id && l.tipoFluxo === activeTab);
                const colName = getColumnName(etapa.id, activeTab);
                const checklistsRequired = getChecklistForEtapa(etapa.id, activeTab);
                
                return (
                  <div key={etapa.id} className="flex-1 min-w-[170px] xl:min-w-[200px] animate-in fade-in slide-in-from-bottom-2 duration-300">
                    <Card className={`h-full flex flex-col rounded border shadow-sm transition-colors duration-200 hover:shadow-md ${etapa.cor} ${etapa.border}`}>
                      <CardHeader className="py-2 px-2.5 sticky top-0 z-10 backdrop-blur-sm bg-white/20 border-b border-black/5">
                        <div className="flex items-center justify-between">
                          <CardTitle className={`text-[10px] sm:text-xs uppercase font-extrabold tracking-wide ${etapa.text} line-clamp-1 truncate`}>
                            {colName}
                          </CardTitle>
                          <Badge variant="secondary" className="bg-white/60 font-medium text-[10px] h-5 px-1.5 border-none shadow-none text-slate-700">{leadsNestaEtapa.length}</Badge>
                        </div>
                      </CardHeader>
                      <CardContent className="flex-1 space-y-2.5 p-2 overflow-y-auto max-h-[70vh]">
                        {leadsNestaEtapa.map((lead) => (
                          <Card key={lead.id} className="group hover:-translate-y-[2px] transition-all duration-200 hover:shadow-md bg-white/95 border border-slate-200/60 rounded-sm hover:border-slate-300 animate-in zoom-in-95 duration-200">
                            <CardContent className="p-2.5">
                              <div className="space-y-2">
                                <div className="flex justify-between items-start">
                                    <div className="overflow-hidden">
                                      <h4 className="font-bold text-[11px] leading-tight text-slate-800 line-clamp-2">{lead.nome}</h4>
                                      <p className="text-[10px] text-slate-500 mt-0.5 font-medium">{formatPhone(lead.contato)}</p>
                                    </div>
                                    <Button variant="ghost" size="icon" className="h-5 w-5 -mr-1.5 -mt-0.5 flex-shrink-0" onClick={() => handleDeleteLead(lead.id)}>
                                        <Trash2 className="h-3 w-3 text-red-400 hover:text-red-700" />
                                    </Button>
                                </div>
                                
                                {checklistsRequired.length > 0 && (
                                  <div className="space-y-2 pt-2 border-t border-slate-100">
                                    {checklistsRequired.map(task => (
                                      <div key={task} className="flex items-center space-x-1.5">
                                        <Checkbox
                                          id={`hk-${lead.id}-${task}`}
                                          checked={lead.checklist?.[task] || false}
                                          onCheckedChange={(checked) => handleToggleChecklist(lead, task, checked as boolean)}
                                          className="h-3 w-3 rounded-[2px]"
                                        />
                                        <Label htmlFor={`hk-${lead.id}-${task}`} className="text-[10px] leading-none cursor-pointer font-medium text-slate-600 hover:text-slate-900">
                                          {LABELS_CHECKLIST[task]}
                                        </Label>
                                      </div>
                                    ))}
                                  </div>
                                )}

                                <div className="pt-2 border-t border-slate-100">
                                  <Select 
                                    value={lead.etapaAtual} 
                                    onValueChange={(value) => handleMoveEtapa(lead, value)}
                                  >
                                    <SelectTrigger className="h-6 text-[10px] bg-slate-50 border-slate-200 px-2 rounded-sm">
                                      <SelectValue placeholder="Mover..." />
                                    </SelectTrigger>
                                    <SelectContent>
                                      {ETAPAS.map(e => (
                                        <SelectItem key={e.id} value={e.id} className="text-[10px]">
                                          {getColumnName(e.id, activeTab)}
                                        </SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                        {leadsNestaEtapa.length === 0 && (
                          <div className="text-[10px] text-center p-3 text-slate-400 font-medium italic animate-in fade-in">
                            Vazio
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </div>
                )
              })}
            </div>
          </div>
        </TabsContent>
      </Tabs>
      
      {/* CSS para a scrollbar customizada do Kanban */}
      <style dangerouslySetInnerHTML={{__html: `
        .custom-scrollbar::-webkit-scrollbar {
          height: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: #f1f5f9;
          border-radius: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #cbd5e1;
          border-radius: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #94a3b8;
        }
      `}} />
    </div>
  )
}