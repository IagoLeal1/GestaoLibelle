"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { BarChart, Bar, FunnelChart, Funnel, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, LabelList } from "recharts"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"
import { toast } from "sonner"

// Importe o service e as interfaces
import {
  listenToEventos,
  listenToLeads,
  type Evento,
  type Lead,
} from "@/services/comercialService" // Ajuste o caminho se necessário

// Interface para os dados calculados do dashboard
interface DashboardData {
  totalLeads: number
  leadsConvertidos: number
  taxaConversao: string
  eventoMaiorConversao: string
  dadosLeadsPorEvento: { evento: string; leads: number }[]
  dadosFunilAbandonos: { name: string; value: number; fill: string }[]
}

export default function FunilRelatorios() {
  const [filtroEvento, setFiltroEvento] = useState("todos")
  
  // Estados para os dados crus do Firebase
  const [eventos, setEventos] = useState<Evento[]>([])
  const [leads, setLeads] = useState<Lead[]>([])
  
  // Estado para os dados calculados do dashboard
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)

  // --- DATA FETCHING (Corrigido) ---
  useEffect(() => {
    setLoading(true)

    // CORREÇÃO AQUI: As funções do service só aceitam 1 argumento (callback)
    // O tratamento de erro já está dentro do service.
    const unsubscribeEventos = listenToEventos((data) => {
      setEventos(data)
    })

    // CORREÇÃO AQUI:
    const unsubscribeLeads = listenToLeads((data) => {
      setLeads(data)
      setLoading(false)
    })

    return () => {
      unsubscribeEventos()
      unsubscribeLeads()
    }
  }, [])

  // --- DATA AGGREGATION (Cálculos) ---
  useEffect(() => {
    // Adicionado um check para evitar cálculos com 'eventos' vazio
    if (loading || !eventos.length) {
       // Define dados zerados se não houver eventos ou estiver carregando
       setDashboardData({
        totalLeads: 0,
        leadsConvertidos: 0,
        taxaConversao: "0.0",
        eventoMaiorConversao: "N/A",
        dadosLeadsPorEvento: [],
        dadosFunilAbandonos: [],
      });
      return
    }

    // 1. Filtrar leads com base no filtro de evento
    const leadsFiltrados = (filtroEvento === "todos")
      ? leads
      : leads.filter(l => l.eventoOrigem === filtroEvento);

    // 2. Calcular KPIs
    const totalLeads = leadsFiltrados.length
    const leadsConvertidos = leadsFiltrados.filter(l => l.anamneseRealizada && l.contratoAssinado).length
    const taxaConversao = totalLeads > 0 ? ((leadsConvertidos / totalLeads) * 100).toFixed(1) : "0.0"

    // 3. Dados para Gráfico de Barras
    const dadosLeadsPorEvento = eventos.map(evento => ({
      evento: evento.codigo,
      leads: leads.filter(l => l.eventoOrigem === evento.codigo).length,
    })).filter(e => e.leads > 0);

    // 4. Evento com Mais Conversões
    const conversaoPorEvento: { [key: string]: number } = {}
    leadsFiltrados.forEach(lead => {
      if (lead.anamneseRealizada && lead.contratoAssinado) {
        if (!conversaoPorEvento[lead.eventoOrigem]) {
          conversaoPorEvento[lead.eventoOrigem] = 0
        }
        conversaoPorEvento[lead.eventoOrigem]++
      }
    })

    const eventoMaiorConversao = Object.entries(conversaoPorEvento).sort((a, b) => b[1] - a[1])[0]?.[0] || "N/A"

    // 5. Dados para Gráfico de Funil
    const etapa_total = leadsFiltrados.length // Todos os leads que entraram
    const etapa_acolhimento = leadsFiltrados.filter(l => l.acolhimentoRealizado).length
    const etapa_proposta = leadsFiltrados.filter(l => l.acolhimentoRealizado && l.orcamentoEnviado && l.qhEnviado).length
    const etapa_fechamento = leadsConvertidos

    const dadosFunilAbandonos = [
      { name: "Lead Qualificado", value: etapa_total, fill: "#0d9488" },
      { name: "Acolhimento", value: etapa_acolhimento, fill: "#10b981" },
      { name: "Envio de Proposta", value: etapa_proposta, fill: "#f59e0b" },
      { name: "Fechamento", value: etapa_fechamento, fill: "#8b5cf6" },
    ]

    // 6. Atualizar o estado do dashboard
    setDashboardData({
      totalLeads,
      leadsConvertidos,
      taxaConversao,
      eventoMaiorConversao,
      dadosLeadsPorEvento,
      dadosFunilAbandonos,
    })

  }, [leads, eventos, filtroEvento, loading]) // Adicionei 'loading' à dependência

  // --- RENDER ---
  if (loading || !dashboardData) {
     return (
        <div className="flex justify-center items-center h-64">
            <p>Carregando relatórios...</p>
        </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-3">
          <Button asChild variant="outline" size="sm">
            <Link href="/comercial">
              <ArrowLeft className="w-4 h-4" />
            </Link>
          </Button>
          <div>
            <h2 className="text-2xl font-bold tracking-tight text-primary-dark-blue">Relatórios de Aquisição</h2>
            <p className="text-muted-foreground">Análise detalhada do funil de conversão</p>
          </div>
        </div>
      </div>

      {/* Filtro de Evento */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <label className="text-sm font-medium text-primary-dark-blue whitespace-nowrap">Filtrar por Evento:</label>
            <Select value={filtroEvento} onValueChange={setFiltroEvento}>
              <SelectTrigger className="w-full sm:w-64">
                <SelectValue placeholder="Selecione um evento" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos os Eventos</SelectItem>
                {eventos.map((evento) => (
                  <SelectItem key={evento.id} value={evento.codigo}>
                    {evento.codigo} - {evento.nome}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* KPI Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total de Leads Gerados</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-primary-dark-blue">{dashboardData.totalLeads}</div>
            <p className="text-xs text-muted-foreground mt-2">Leads no período (filtro atual)</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Taxa de Conversão</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600">{dashboardData.taxaConversao}%</div>
            <p className="text-xs text-muted-foreground mt-2">{dashboardData.leadsConvertidos} leads convertidos</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Evento com Mais Conversões</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-yellow-600">{dashboardData.eventoMaiorConversao}</div>
            <p className="text-xs text-muted-foreground mt-2">(Com base no filtro atual)</p>
          </CardContent>
        </Card>
      </div>

      {/* Gráficos */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Gráfico de Barras - Leads por Evento */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Leads por Evento (Total)</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={dashboardData.dadosLeadsPorEvento}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="evento" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="leads" fill="#0d9488" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Gráfico de Funil - Taxa de Abandono */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Funil de Conversão (Filtro Atual)</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <FunnelChart>
                <Tooltip />
                <Funnel dataKey="value" data={dashboardData.dadosFunilAbandonos} isAnimationActive>
                  <LabelList position="right" fill="#000" stroke="none" dataKey="value" />
                </Funnel>
              </FunnelChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Tabela de Detalhes */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Detalhamento por Etapa (Filtro Atual)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {dashboardData.dadosFunilAbandonos.map((etapa) => {
              const percentualTotal = dashboardData.totalLeads > 0 ? ((etapa.value / dashboardData.totalLeads) * 100).toFixed(1) : "0.0"
              return (
                <div
                  key={etapa.name}
                  className="flex items-center justify-between p-3 rounded-lg border hover:bg-gray-50"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: etapa.fill }} />
                    <div>
                      <p className="font-medium text-sm text-primary-dark-blue">{etapa.name}</p>
                      <p className="text-xs text-muted-foreground">{etapa.value} leads</p>
                    </div>
                  </div>
                  <Badge className="bg-teal-100 text-teal-800">{percentualTotal}% (do total)</Badge>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}