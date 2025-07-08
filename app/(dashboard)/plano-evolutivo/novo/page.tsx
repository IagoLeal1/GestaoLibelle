"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { ArrowLeft, User, FileText, Brain, Users, Activity, Globe, Target, Save, X, Eye } from "lucide-react"
import Link from "next/link"

const pacientes = [
  { id: 1, nome: "Maria Santos Silva", idade: 8 },
  { id: 2, nome: "Pedro Oliveira Costa", idade: 11 },
  { id: 3, nome: "Ana Clara Mendes", idade: 6 },
  { id: 4, nome: "João Pedro Santos", idade: 9 },
  { id: 5, nome: "Rafael Silva Costa", idade: 10 },
  { id: 6, nome: "Isabela Rodrigues", idade: 8 },
  { id: 7, nome: "Gabriel Almeida", idade: 10 },
]

const profissionais = [
  "Dr. João Silva",
  "Dra. Ana Costa",
  "Dr. Carlos Mendes",
  "Dra. Lucia Santos",
  "Dr. Roberto Lima",
  "Dra. Patricia Oliveira",
  "Dr. Fernando Costa",
  "Dra. Mariana Silva",
]

const funcoesCorpo = [
  { codigo: "b110", descricao: "Funções da consciência" },
  { codigo: "b117", descricao: "Funções intelectuais" },
  { codigo: "b122", descricao: "Funções psicossociais globais" },
  { codigo: "b130", descricao: "Funções da energia e dos impulsos" },
  { codigo: "b134", descricao: "Funções do sono" },
  { codigo: "b140", descricao: "Funções da atenção" },
  { codigo: "b144", descricao: "Funções da memória" },
  { codigo: "b147", descricao: "Funções psicomotoras" },
  { codigo: "b152", descricao: "Funções emocionais" },
  { codigo: "b156", descricao: "Funções da percepção" },
  { codigo: "b167", descricao: "Funções mentais da linguagem" },
  { codigo: "b172", descricao: "Funções de cálculo" },
]

const estruturasCorporais = [
  { codigo: "s110", descricao: "Estrutura do cérebro" },
  { codigo: "s120", descricao: "Medula espinhal e estruturas relacionadas" },
  { codigo: "s230", descricao: "Estruturas ao redor do olho" },
  { codigo: "s240", descricao: "Estrutura do ouvido externo" },
  { codigo: "s250", descricao: "Estrutura do ouvido médio" },
  { codigo: "s260", descricao: "Estrutura do ouvido interno" },
  { codigo: "s320", descricao: "Estrutura da boca" },
  { codigo: "s330", descricao: "Estrutura da faringe" },
  { codigo: "s710", descricao: "Estrutura da região da cabeça e do pescoço" },
  { codigo: "s720", descricao: "Estrutura da região do ombro" },
  { codigo: "s730", descricao: "Estrutura do membro superior" },
  { codigo: "s750", descricao: "Estrutura do membro inferior" },
]

const atividadesParticipacao = [
  { codigo: "d110", descricao: "Observar" },
  { codigo: "d115", descricao: "Ouvir" },
  { codigo: "d130", descricao: "Imitar" },
  { codigo: "d135", descricao: "Ensaiar" },
  { codigo: "d140", descricao: "Aprender a ler" },
  { codigo: "d145", descricao: "Aprender a escrever" },
  { codigo: "d150", descricao: "Aprender a calcular" },
  { codigo: "d155", descricao: "Adquirir habilidades" },
  { codigo: "d160", descricao: "Concentrar a atenção" },
  { codigo: "d163", descricao: "Pensar" },
  { codigo: "d166", descricao: "Ler" },
  { codigo: "d170", descricao: "Escrever" },
  { codigo: "d172", descricao: "Calcular" },
  { codigo: "d175", descricao: "Resolver problemas" },
  { codigo: "d177", descricao: "Tomar decisões" },
  { codigo: "d210", descricao: "Realizar uma única tarefa" },
  { codigo: "d220", descricao: "Realizar tarefas múltiplas" },
  { codigo: "d230", descricao: "Realizar a rotina diária" },
  { codigo: "d240", descricao: "Lidar com o estresse" },
  { codigo: "d310", descricao: "Comunicar-se - receber - mensagens faladas" },
  { codigo: "d315", descricao: "Comunicar-se - receber - mensagens não verbais" },
  { codigo: "d320", descricao: "Comunicar-se - receber - mensagens em linguagem de sinais" },
  { codigo: "d325", descricao: "Comunicar-se - receber - mensagens escritas" },
  { codigo: "d330", descricao: "Falar" },
  { codigo: "d335", descricao: "Produzir mensagens não verbais" },
  { codigo: "d350", descricao: "Conversação" },
  { codigo: "d360", descricao: "Utilização de dispositivos e técnicas de comunicação" },
  { codigo: "d410", descricao: "Mudar a posição básica do corpo" },
  { codigo: "d415", descricao: "Manter a posição do corpo" },
  { codigo: "d420", descricao: "Transferir a própria posição" },
  { codigo: "d430", descricao: "Levantar e carregar objetos" },
  { codigo: "d440", descricao: "Uso fino da mão" },
  { codigo: "d445", descricao: "Uso da mão e do braço" },
  { codigo: "d450", descricao: "Andar" },
  { codigo: "d455", descricao: "Deslocar-se" },
  { codigo: "d460", descricao: "Deslocar-se por diferentes locais" },
  { codigo: "d470", descricao: "Utilização de transporte" },
  { codigo: "d510", descricao: "Lavar-se" },
  { codigo: "d520", descricao: "Cuidar de partes do corpo" },
  { codigo: "d530", descricao: "Cuidados relacionados aos processos de excreção" },
  { codigo: "d540", descricao: "Vestir-se" },
  { codigo: "d550", descricao: "Comer" },
  { codigo: "d560", descricao: "Beber" },
  { codigo: "d570", descricao: "Cuidar da própria saúde" },
]

const fatoresAmbientais = [
  { codigo: "e110", descricao: "Produtos ou substâncias para consumo pessoal" },
  { codigo: "e115", descricao: "Produtos e tecnologias para uso pessoal na vida diária" },
  { codigo: "e120", descricao: "Produtos e tecnologias para mobilidade e transporte pessoal" },
  { codigo: "e125", descricao: "Produtos e tecnologias para comunicação" },
  { codigo: "e130", descricao: "Produtos e tecnologias para educação" },
  { codigo: "e135", descricao: "Produtos e tecnologias para o trabalho" },
  { codigo: "e140", descricao: "Produtos e tecnologias para cultura, recreação e esporte" },
  { codigo: "e150", descricao: "Produtos e tecnologias usados em projeto, arquitetura e construção" },
  { codigo: "e310", descricao: "Família imediata" },
  { codigo: "e315", descricao: "Família ampliada" },
  { codigo: "e320", descricao: "Amigos" },
  { codigo: "e325", descricao: "Conhecidos, companheiros, colegas, vizinhos e membros da comunidade" },
  { codigo: "e330", descricao: "Pessoas em posição de autoridade" },
  { codigo: "e340", descricao: "Prestadores de cuidados pessoais e assistentes pessoais" },
  { codigo: "e355", descricao: "Profissionais da saúde" },
  { codigo: "e360", descricao: "Outros profissionais" },
  { codigo: "e410", descricao: "Atitudes individuais de membros da família imediata" },
  { codigo: "e420", descricao: "Atitudes individuais de amigos" },
  { codigo: "e425", descricao: "Atitudes individuais de conhecidos, companheiros, colegas, vizinhos" },
  { codigo: "e430", descricao: "Atitudes individuais de pessoas em posição de autoridade" },
  { codigo: "e440", descricao: "Atitudes individuais de prestadores de cuidados pessoais" },
  { codigo: "e450", descricao: "Atitudes individuais de profissionais da saúde" },
  { codigo: "e460", descricao: "Atitudes sociais" },
  { codigo: "e465", descricao: "Normas, práticas e ideologias sociais" },
]

export default function NovoPlanoEvolutivo() {
  const [formData, setFormData] = useState({
    paciente: "",
    profissional: "",
    dataElaboracao: new Date().toISOString().split("T")[0],
    diagnosticoFuncional: "",
    funcoesCorpo: [] as string[],
    observacoesFuncoes: "",
    estruturasCorporais: [] as string[],
    observacoesEstruturas: "",
    atividadesParticipacao: [] as string[],
    observacoesAtividades: "",
    fatoresFacilitadores: [] as string[],
    fatoresBarreiras: [] as string[],
    observacoesFatores: "",
    objetivos: [{ area: "", objetivo: "", estrategia: "", prazo: "" }],
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    console.log("Dados do plano evolutivo:", formData)
    // Aqui você implementaria a lógica para salvar o plano
  }

  const handleCheckboxChange = (field: string, value: string, checked: boolean) => {
    setFormData((prev) => ({
      ...prev,
      [field]: checked
        ? [...(prev[field as keyof typeof prev] as string[]), value]
        : (prev[field as keyof typeof prev] as string[]).filter((item) => item !== value),
    }))
  }

  const adicionarObjetivo = () => {
    setFormData((prev) => ({
      ...prev,
      objetivos: [...prev.objetivos, { area: "", objetivo: "", estrategia: "", prazo: "" }],
    }))
  }

  const removerObjetivo = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      objetivos: prev.objetivos.filter((_, i) => i !== index),
    }))
  }

  const atualizarObjetivo = (index: number, field: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      objetivos: prev.objetivos.map((obj, i) => (i === index ? { ...obj, [field]: value } : obj)),
    }))
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/plano-evolutivo">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-primary-dark-blue">Novo Plano Evolutivo</h2>
          <p className="text-muted-foreground">
            Elabore um plano evolutivo baseado na Classificação Internacional de Funcionalidade (CIF)
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Dados do Paciente */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Dados do Paciente
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor="paciente">Paciente *</Label>
                <Select
                  value={formData.paciente}
                  onValueChange={(value) => setFormData((prev) => ({ ...prev, paciente: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o paciente" />
                  </SelectTrigger>
                  <SelectContent>
                    {pacientes.map((paciente) => (
                      <SelectItem key={paciente.id} value={paciente.nome}>
                        {paciente.nome} - {paciente.idade} anos
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="profissional">Profissional Responsável *</Label>
                <Select
                  value={formData.profissional}
                  onValueChange={(value) => setFormData((prev) => ({ ...prev, profissional: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o profissional" />
                  </SelectTrigger>
                  <SelectContent>
                    {profissionais.map((prof) => (
                      <SelectItem key={prof} value={prof}>
                        {prof}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="dataElaboracao">Data de Elaboração *</Label>
                <Input
                  id="dataElaboracao"
                  type="date"
                  value={formData.dataElaboracao}
                  onChange={(e) => setFormData((prev) => ({ ...prev, dataElaboracao: e.target.value }))}
                  required
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Diagnóstico Funcional */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Diagnóstico Funcional
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Label htmlFor="diagnosticoFuncional">Descrição da Funcionalidade Geral do Paciente *</Label>
              <Textarea
                id="diagnosticoFuncional"
                placeholder="Descreva a funcionalidade geral do paciente, incluindo principais limitações e capacidades..."
                value={formData.diagnosticoFuncional}
                onChange={(e) => setFormData((prev) => ({ ...prev, diagnosticoFuncional: e.target.value }))}
                rows={4}
                required
              />
            </div>
          </CardContent>
        </Card>

        {/* Funções do Corpo */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Brain className="h-5 w-5" />
              Funções do Corpo (Códigos bXXX)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                {funcoesCorpo.map((funcao) => (
                  <div key={funcao.codigo} className="flex items-start space-x-2">
                    <Checkbox
                      id={funcao.codigo}
                      checked={formData.funcoesCorpo.includes(funcao.codigo)}
                      onCheckedChange={(checked) =>
                        handleCheckboxChange("funcoesCorpo", funcao.codigo, checked as boolean)
                      }
                    />
                    <Label htmlFor={funcao.codigo} className="text-sm leading-5">
                      <span className="font-medium">{funcao.codigo}</span> - {funcao.descricao}
                    </Label>
                  </div>
                ))}
              </div>
              <div className="space-y-2">
                <Label htmlFor="observacoesFuncoes">Observações sobre Funções do Corpo</Label>
                <Textarea
                  id="observacoesFuncoes"
                  placeholder="Observações específicas sobre as funções do corpo selecionadas..."
                  value={formData.observacoesFuncoes}
                  onChange={(e) => setFormData((prev) => ({ ...prev, observacoesFuncoes: e.target.value }))}
                  rows={3}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Estruturas Corporais */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Estruturas Corporais (Códigos sXXX)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                {estruturasCorporais.map((estrutura) => (
                  <div key={estrutura.codigo} className="flex items-start space-x-2">
                    <Checkbox
                      id={estrutura.codigo}
                      checked={formData.estruturasCorporais.includes(estrutura.codigo)}
                      onCheckedChange={(checked) =>
                        handleCheckboxChange("estruturasCorporais", estrutura.codigo, checked as boolean)
                      }
                    />
                    <Label htmlFor={estrutura.codigo} className="text-sm leading-5">
                      <span className="font-medium">{estrutura.codigo}</span> - {estrutura.descricao}
                    </Label>
                  </div>
                ))}
              </div>
              <div className="space-y-2">
                <Label htmlFor="observacoesEstruturas">Observações sobre Estruturas Corporais</Label>
                <Textarea
                  id="observacoesEstruturas"
                  placeholder="Observações específicas sobre as estruturas corporais selecionadas..."
                  value={formData.observacoesEstruturas}
                  onChange={(e) => setFormData((prev) => ({ ...prev, observacoesEstruturas: e.target.value }))}
                  rows={3}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Atividades e Participação */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Atividades e Participação (Códigos dXXX)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid gap-3 md:grid-cols-1 lg:grid-cols-2">
                {atividadesParticipacao.map((atividade) => (
                  <div key={atividade.codigo} className="flex items-start space-x-2">
                    <Checkbox
                      id={atividade.codigo}
                      checked={formData.atividadesParticipacao.includes(atividade.codigo)}
                      onCheckedChange={(checked) =>
                        handleCheckboxChange("atividadesParticipacao", atividade.codigo, checked as boolean)
                      }
                    />
                    <Label htmlFor={atividade.codigo} className="text-sm leading-5">
                      <span className="font-medium">{atividade.codigo}</span> - {atividade.descricao}
                    </Label>
                  </div>
                ))}
              </div>
              <div className="space-y-2">
                <Label htmlFor="observacoesAtividades">Observações sobre Atividades e Participação</Label>
                <Textarea
                  id="observacoesAtividades"
                  placeholder="Descrição específica das dificuldades e capacidades nas atividades selecionadas..."
                  value={formData.observacoesAtividades}
                  onChange={(e) => setFormData((prev) => ({ ...prev, observacoesAtividades: e.target.value }))}
                  rows={3}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Fatores Ambientais */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Globe className="h-5 w-5" />
              Fatores Ambientais (Códigos eXXX)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              <div>
                <h4 className="font-medium text-primary-medium-green mb-3">Facilitadores (Fatores Positivos)</h4>
                <div className="grid gap-3 md:grid-cols-1 lg:grid-cols-2">
                  {fatoresAmbientais.map((fator) => (
                    <div key={`facilitador-${fator.codigo}`} className="flex items-start space-x-2">
                      <Checkbox
                        id={`facilitador-${fator.codigo}`}
                        checked={formData.fatoresFacilitadores.includes(fator.codigo)}
                        onCheckedChange={(checked) =>
                          handleCheckboxChange("fatoresFacilitadores", fator.codigo, checked as boolean)
                        }
                      />
                      <Label htmlFor={`facilitador-${fator.codigo}`} className="text-sm leading-5">
                        <span className="font-medium">{fator.codigo}</span> - {fator.descricao}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <h4 className="font-medium text-secondary-red mb-3">Barreiras (Fatores Negativos)</h4>
                <div className="grid gap-3 md:grid-cols-1 lg:grid-cols-2">
                  {fatoresAmbientais.map((fator) => (
                    <div key={`barreira-${fator.codigo}`} className="flex items-start space-x-2">
                      <Checkbox
                        id={`barreira-${fator.codigo}`}
                        checked={formData.fatoresBarreiras.includes(fator.codigo)}
                        onCheckedChange={(checked) =>
                          handleCheckboxChange("fatoresBarreiras", fator.codigo, checked as boolean)
                        }
                      />
                      <Label htmlFor={`barreira-${fator.codigo}`} className="text-sm leading-5">
                        <span className="font-medium">{fator.codigo}</span> - {fator.descricao}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="observacoesFatores">Observações sobre Fatores Ambientais</Label>
                <Textarea
                  id="observacoesFatores"
                  placeholder="Descrição do impacto dos fatores ambientais facilitadores e barreiras..."
                  value={formData.observacoesFatores}
                  onChange={(e) => setFormData((prev) => ({ ...prev, observacoesFatores: e.target.value }))}
                  rows={3}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Objetivos Terapêuticos */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5" />
              Objetivos Terapêuticos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {formData.objetivos.map((objetivo, index) => (
                <div key={index} className="p-4 border rounded-lg space-y-4">
                  <div className="flex justify-between items-center">
                    <h4 className="font-medium">Objetivo {index + 1}</h4>
                    {formData.objetivos.length > 1 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removerObjetivo(index)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor={`area-${index}`}>Área</Label>
                      <Input
                        id={`area-${index}`}
                        placeholder="Ex: Comunicação, Mobilidade, Cognição..."
                        value={objetivo.area}
                        onChange={(e) => atualizarObjetivo(index, "area", e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor={`prazo-${index}`}>Prazo</Label>
                      <Input
                        id={`prazo-${index}`}
                        placeholder="Ex: 3 meses, 6 meses..."
                        value={objetivo.prazo}
                        onChange={(e) => atualizarObjetivo(index, "prazo", e.target.value)}
                      />
                    </div>
                    <div className="space-y-2 md:col-span-2">
                      <Label htmlFor={`objetivo-${index}`}>Objetivo</Label>
                      <Textarea
                        id={`objetivo-${index}`}
                        placeholder="Descreva o objetivo específico a ser alcançado..."
                        value={objetivo.objetivo}
                        onChange={(e) => atualizarObjetivo(index, "objetivo", e.target.value)}
                        rows={2}
                      />
                    </div>
                    <div className="space-y-2 md:col-span-2">
                      <Label htmlFor={`estrategia-${index}`}>Estratégia</Label>
                      <Textarea
                        id={`estrategia-${index}`}
                        placeholder="Descreva as estratégias e métodos para alcançar este objetivo..."
                        value={objetivo.estrategia}
                        onChange={(e) => atualizarObjetivo(index, "estrategia", e.target.value)}
                        rows={2}
                      />
                    </div>
                  </div>
                </div>
              ))}
              <Button type="button" variant="outline" onClick={adicionarObjetivo} className="w-full bg-transparent">
                <Target className="mr-2 h-4 w-4" />
                Adicionar Objetivo
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Botões de Ação */}
        <div className="flex gap-4 pt-4">
          <Button type="submit" className="flex-1">
            <Save className="mr-2 h-4 w-4" />
            Salvar Plano
          </Button>
          <Button type="button" variant="outline" className="flex-1 bg-transparent">
            <Eye className="mr-2 h-4 w-4" />
            Pré-visualizar
          </Button>
          <Link href="/plano-evolutivo">
            <Button type="button" variant="outline" className="flex-1 bg-transparent">
              <X className="mr-2 h-4 w-4" />
              Cancelar
            </Button>
          </Link>
        </div>
      </form>
    </div>
  )
}
