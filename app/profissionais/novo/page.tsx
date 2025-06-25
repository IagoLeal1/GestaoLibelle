"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { ArrowLeft, UserCheck, Phone, MapPin, Briefcase, DollarSign } from "lucide-react"
import Link from "next/link"

export default function NovoProfissional() {
  const [formData, setFormData] = useState({
    nome: "",
    cpf: "",
    rg: "",
    dataNascimento: "",
    sexo: "",
    telefone: "",
    celular: "",
    email: "",
    endereco: "",
    numero: "",
    complemento: "",
    bairro: "",
    cidade: "",
    cep: "",
    estado: "",
    especialidade: "",
    crm: "",
    crf: "",
    percentualRepasse: "",
    valorConsulta: "",
    diasAtendimento: [],
    horarioInicio: "",
    horarioFim: "",
    observacoes: "",
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    console.log("Dados do profissional:", formData)
    // Aqui você implementaria a lógica para salvar o profissional
  }

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const handleDiasChange = (dia: string, checked: boolean) => {
    setFormData((prev) => ({
      ...prev,
      diasAtendimento: checked ? [...prev.diasAtendimento, dia] : prev.diasAtendimento.filter((d) => d !== dia),
    }))
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/profissionais">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-primary-dark-blue">Novo Profissional</h2>
          <p className="text-muted-foreground">Cadastre um novo profissional no sistema</p>
        </div>
      </div>

      <div className="grid gap-6">
        {/* Dados Pessoais */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UserCheck className="h-5 w-5" />
              Dados Pessoais
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="nome">Nome Completo *</Label>
                  <Input
                    id="nome"
                    value={formData.nome}
                    onChange={(e) => handleInputChange("nome", e.target.value)}
                    placeholder="Nome completo do profissional"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="dataNascimento">Data de Nascimento *</Label>
                  <Input
                    id="dataNascimento"
                    type="date"
                    value={formData.dataNascimento}
                    onChange={(e) => handleInputChange("dataNascimento", e.target.value)}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="cpf">CPF *</Label>
                  <Input
                    id="cpf"
                    value={formData.cpf}
                    onChange={(e) => handleInputChange("cpf", e.target.value)}
                    placeholder="000.000.000-00"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="rg">RG</Label>
                  <Input
                    id="rg"
                    value={formData.rg}
                    onChange={(e) => handleInputChange("rg", e.target.value)}
                    placeholder="00.000.000-0"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="sexo">Sexo *</Label>
                  <Select value={formData.sexo} onValueChange={(value) => handleInputChange("sexo", value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="masculino">Masculino</SelectItem>
                      <SelectItem value="feminino">Feminino</SelectItem>
                      <SelectItem value="outro">Outro</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Contato */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Phone className="h-5 w-5" />
              Informações de Contato
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor="telefone">Telefone</Label>
                <Input
                  id="telefone"
                  value={formData.telefone}
                  onChange={(e) => handleInputChange("telefone", e.target.value)}
                  placeholder="(00) 0000-0000"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="celular">Celular *</Label>
                <Input
                  id="celular"
                  value={formData.celular}
                  onChange={(e) => handleInputChange("celular", e.target.value)}
                  placeholder="(00) 00000-0000"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">E-mail *</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleInputChange("email", e.target.value)}
                  placeholder="email@exemplo.com"
                  required
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Dados Profissionais */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Briefcase className="h-5 w-5" />
              Dados Profissionais
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor="especialidade">Especialidade *</Label>
                <Select
                  value={formData.especialidade}
                  onValueChange={(value) => handleInputChange("especialidade", value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione a especialidade" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="clinico-geral">Clínico Geral</SelectItem>
                    <SelectItem value="cardiologia">Cardiologia</SelectItem>
                    <SelectItem value="dermatologia">Dermatologia</SelectItem>
                    <SelectItem value="ginecologia">Ginecologia</SelectItem>
                    <SelectItem value="neurologia">Neurologia</SelectItem>
                    <SelectItem value="ortopedia">Ortopedia</SelectItem>
                    <SelectItem value="pediatria">Pediatria</SelectItem>
                    <SelectItem value="psicologia">Psicologia</SelectItem>
                    <SelectItem value="psiquiatria">Psiquiatria</SelectItem>
                    <SelectItem value="urologia">Urologia</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="crm">CRM</Label>
                <Input
                  id="crm"
                  value={formData.crm}
                  onChange={(e) => handleInputChange("crm", e.target.value)}
                  placeholder="000000/UF"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="crf">CRF/Outros</Label>
                <Input
                  id="crf"
                  value={formData.crf}
                  onChange={(e) => handleInputChange("crf", e.target.value)}
                  placeholder="Número do registro"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Configurações Financeiras */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5" />
              Configurações Financeiras
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="percentualRepasse">Percentual de Repasse (%)</Label>
                <Input
                  id="percentualRepasse"
                  type="number"
                  min="0"
                  max="100"
                  value={formData.percentualRepasse}
                  onChange={(e) => handleInputChange("percentualRepasse", e.target.value)}
                  placeholder="60"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="valorConsulta">Valor da Consulta (R$)</Label>
                <Input
                  id="valorConsulta"
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.valorConsulta}
                  onChange={(e) => handleInputChange("valorConsulta", e.target.value)}
                  placeholder="150.00"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Horários de Atendimento */}
        <Card>
          <CardHeader>
            <CardTitle>Horários de Atendimento</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <Label>Dias da Semana</Label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mt-2">
                  {[
                    { value: "segunda", label: "Segunda-feira" },
                    { value: "terca", label: "Terça-feira" },
                    { value: "quarta", label: "Quarta-feira" },
                    { value: "quinta", label: "Quinta-feira" },
                    { value: "sexta", label: "Sexta-feira" },
                    { value: "sabado", label: "Sábado" },
                    { value: "domingo", label: "Domingo" },
                  ].map((dia) => (
                    <div key={dia.value} className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id={dia.value}
                        checked={formData.diasAtendimento.includes(dia.value)}
                        onChange={(e) => handleDiasChange(dia.value, e.target.checked)}
                        className="rounded border-gray-300"
                      />
                      <Label htmlFor={dia.value} className="text-sm">
                        {dia.label}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="horarioInicio">Horário de Início</Label>
                  <Input
                    id="horarioInicio"
                    type="time"
                    value={formData.horarioInicio}
                    onChange={(e) => handleInputChange("horarioInicio", e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="horarioFim">Horário de Fim</Label>
                  <Input
                    id="horarioFim"
                    type="time"
                    value={formData.horarioFim}
                    onChange={(e) => handleInputChange("horarioFim", e.target.value)}
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Endereço */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5" />
              Endereço
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <div className="space-y-2">
                <Label htmlFor="cep">CEP</Label>
                <Input
                  id="cep"
                  value={formData.cep}
                  onChange={(e) => handleInputChange("cep", e.target.value)}
                  placeholder="00000-000"
                />
              </div>

              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="endereco">Endereço</Label>
                <Input
                  id="endereco"
                  value={formData.endereco}
                  onChange={(e) => handleInputChange("endereco", e.target.value)}
                  placeholder="Rua, Avenida, etc."
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="numero">Número</Label>
                <Input
                  id="numero"
                  value={formData.numero}
                  onChange={(e) => handleInputChange("numero", e.target.value)}
                  placeholder="123"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="complemento">Complemento</Label>
                <Input
                  id="complemento"
                  value={formData.complemento}
                  onChange={(e) => handleInputChange("complemento", e.target.value)}
                  placeholder="Apto, Sala, etc."
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="bairro">Bairro</Label>
                <Input
                  id="bairro"
                  value={formData.bairro}
                  onChange={(e) => handleInputChange("bairro", e.target.value)}
                  placeholder="Nome do bairro"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="cidade">Cidade</Label>
                <Input
                  id="cidade"
                  value={formData.cidade}
                  onChange={(e) => handleInputChange("cidade", e.target.value)}
                  placeholder="Nome da cidade"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="estado">Estado</Label>
                <Select value={formData.estado} onValueChange={(value) => handleInputChange("estado", value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="UF" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="SP">SP</SelectItem>
                    <SelectItem value="RJ">RJ</SelectItem>
                    <SelectItem value="MG">MG</SelectItem>
                    <SelectItem value="RS">RS</SelectItem>
                    <SelectItem value="PR">PR</SelectItem>
                    <SelectItem value="SC">SC</SelectItem>
                    <SelectItem value="BA">BA</SelectItem>
                    <SelectItem value="GO">GO</SelectItem>
                    <SelectItem value="PE">PE</SelectItem>
                    <SelectItem value="CE">CE</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Observações */}
        <Card>
          <CardHeader>
            <CardTitle>Observações Adicionais</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Label htmlFor="observacoes">Observações</Label>
              <Textarea
                id="observacoes"
                placeholder="Informações adicionais sobre o profissional..."
                value={formData.observacoes}
                onChange={(e) => handleInputChange("observacoes", e.target.value)}
                rows={4}
              />
            </div>
          </CardContent>
        </Card>

        {/* Botões de Ação */}
        <div className="flex gap-4">
          <Button type="submit" className="flex-1">
            Salvar Profissional
          </Button>
          <Link href="/profissionais">
            <Button type="button" variant="outline" className="flex-1">
              Cancelar
            </Button>
          </Link>
        </div>
      </div>
    </div>
  )
}
