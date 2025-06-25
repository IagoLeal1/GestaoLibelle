"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { ArrowLeft, Calendar } from "lucide-react"
import Link from "next/link"

export default function NovoAgendamento() {
  const [formData, setFormData] = useState({
    paciente: "",
    profissional: "",
    data: "",
    hora: "",
    tipo: "",
    observacoes: "",
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    console.log("Dados do agendamento:", formData)
    // Aqui você implementaria a lógica para salvar o agendamento
  }

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/agendamentos">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-primary-dark-blue">Novo Agendamento</h2>
          <p className="text-muted-foreground">Cadastre um novo agendamento no sistema</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Informações do Agendamento
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="paciente">Paciente *</Label>
                <Select value={formData.paciente} onValueChange={(value) => handleInputChange("paciente", value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o paciente" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="maria-santos">Maria Santos</SelectItem>
                    <SelectItem value="pedro-oliveira">Pedro Oliveira</SelectItem>
                    <SelectItem value="carla-mendes">Carla Mendes</SelectItem>
                    <SelectItem value="jose-santos">José Santos</SelectItem>
                    <SelectItem value="ana-silva">Ana Silva</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="profissional">Profissional *</Label>
                <Select
                  value={formData.profissional}
                  onValueChange={(value) => handleInputChange("profissional", value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o profissional" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="dr-joao">Dr. João Silva</SelectItem>
                    <SelectItem value="dra-ana">Dra. Ana Costa</SelectItem>
                    <SelectItem value="dr-carlos">Dr. Carlos Mendes</SelectItem>
                    <SelectItem value="dra-lucia">Dra. Lucia Santos</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="data">Data *</Label>
                <Input
                  id="data"
                  type="date"
                  value={formData.data}
                  onChange={(e) => handleInputChange("data", e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="hora">Horário *</Label>
                <Select value={formData.hora} onValueChange={(value) => handleInputChange("hora", value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o horário" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="08:00">08:00</SelectItem>
                    <SelectItem value="08:30">08:30</SelectItem>
                    <SelectItem value="09:00">09:00</SelectItem>
                    <SelectItem value="09:30">09:30</SelectItem>
                    <SelectItem value="10:00">10:00</SelectItem>
                    <SelectItem value="10:30">10:30</SelectItem>
                    <SelectItem value="11:00">11:00</SelectItem>
                    <SelectItem value="11:30">11:30</SelectItem>
                    <SelectItem value="14:00">14:00</SelectItem>
                    <SelectItem value="14:30">14:30</SelectItem>
                    <SelectItem value="15:00">15:00</SelectItem>
                    <SelectItem value="15:30">15:30</SelectItem>
                    <SelectItem value="16:00">16:00</SelectItem>
                    <SelectItem value="16:30">16:30</SelectItem>
                    <SelectItem value="17:00">17:00</SelectItem>
                    <SelectItem value="17:30">17:30</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="tipo">Tipo de Atendimento *</Label>
                <Select value={formData.tipo} onValueChange={(value) => handleInputChange("tipo", value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="consulta">Consulta</SelectItem>
                    <SelectItem value="retorno">Retorno</SelectItem>
                    <SelectItem value="exame">Exame</SelectItem>
                    <SelectItem value="procedimento">Procedimento</SelectItem>
                    <SelectItem value="avaliacao">Avaliação</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="observacoes">Observações</Label>
                <Textarea
                  id="observacoes"
                  placeholder="Observações adicionais sobre o agendamento..."
                  value={formData.observacoes}
                  onChange={(e) => handleInputChange("observacoes", e.target.value)}
                  rows={3}
                />
              </div>
            </div>

            <div className="flex gap-4 pt-4">
              <Button type="submit" className="flex-1">
                Salvar Agendamento
              </Button>
              <Link href="/agendamentos">
                <Button type="button" variant="outline" className="flex-1">
                  Cancelar
                </Button>
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
