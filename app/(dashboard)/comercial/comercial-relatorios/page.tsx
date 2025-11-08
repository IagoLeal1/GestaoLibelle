"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { BarChart, Bar, FunnelChart, Funnel, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"

export default function FunilRelatorios() {
  const [filtroEvento, setFiltroEvento] = useState("todos")

  const eventos = [
    { codigo: "SVI-002", nome: "Parceria Escola São Vicente", leads: 45 },
    { codigo: "ABC-001", nome: "Campanha ABC Saúde", leads: 38 },
    { codigo: "DEF-001", nome: "Programa DEF Bem-estar", leads: 62 },
  ]

  const dadosLeadsPorEvento = [
    { evento: "SVI-002", leads: 45 },
    { evento: "ABC-001", leads: 38 },
    { evento: "DEF-001", leads: 62 },
  ]

  const dadosFunilAbandonos = [
    { name: "Lead Qualificado", value: 145, fill: "#0d9488" },
    { name: "Acolhimento", value: 98, fill: "#10b981" },
    { name: "Envio de Proposta", value: 67, fill: "#f59e0b" },
    { name: "Fechamento", value: 42, fill: "#8b5cf6" },
  ]

  const totalLeads = 145
  const leadsConvertidos = 42
  const taxaConversao = ((leadsConvertidos / totalLeads) * 100).toFixed(1)
  const eventoMaiorConversao = "DEF-001"

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
                  <SelectItem key={evento.codigo} value={evento.codigo}>
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
            <div className="text-3xl font-bold text-primary-dark-blue">{totalLeads}</div>
            <p className="text-xs text-muted-foreground mt-2">Leads qualificados este período</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Taxa de Conversão</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600">{taxaConversao}%</div>
            <p className="text-xs text-muted-foreground mt-2">{leadsConvertidos} leads convertidos</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Evento com Mais Conversões</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-yellow-600">{eventoMaiorConversao}</div>
            <p className="text-xs text-muted-foreground mt-2">Programa DEF Bem-estar</p>
          </CardContent>
        </Card>
      </div>

      {/* Gráficos */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Gráfico de Barras - Leads por Evento */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Leads por Evento</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={dadosLeadsPorEvento}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="evento" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="leads" fill="#0d9488" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Gráfico de Funil - Taxa de Abandono */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Taxa de Abandono por Etapa</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <FunnelChart data={dadosFunilAbandonos}>
                <Tooltip />
                <Funnel dataKey="value" shape="linear">
                  {dadosFunilAbandonos.map((entry, index) => (
                    <div key={index} />
                  ))}
                </Funnel>
              </FunnelChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Tabela de Detalhes */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Detalhamento por Etapa</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {dadosFunilAbandonos.map((etapa) => {
              const percentualAnterior = dadosFunilAbandonos[0]?.value || 100
              const percentual = ((etapa.value / percentualAnterior) * 100).toFixed(1)
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
                  <Badge className="bg-teal-100 text-teal-800">{percentual}%</Badge>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
