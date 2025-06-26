"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Search, FileText, Plus, Edit, Calendar, User } from "lucide-react"

const pacientes = [
  { id: 1, nome: "Maria Santos", idade: 8, terapeuta: "Dra. Ana Costa" },
  { id: 2, nome: "Pedro Silva", idade: 12, terapeuta: "Dr. João Silva" },
  { id: 3, nome: "Ana Oliveira", idade: 6, terapeuta: "Dra. Ana Costa" },
]

const planosEvolutivos = [
  {
    id: 1,
    pacienteId: 1,
    data: "2024-01-15",
    terapeuta: "Dra. Ana Costa",
    tipo: "Avaliação Inicial",
    conteudo: {
      objetivos: "Desenvolver habilidades de comunicação verbal e não verbal",
      atividades: "Exercícios de articulação, jogos interativos, terapia lúdica",
      progresso: "Paciente demonstra interesse nas atividades propostas",
      observacoes: "Necessário trabalhar paciência e concentração",
      proximosPassos: "Intensificar exercícios de coordenação motora",
    },
  },
  {
    id: 2,
    pacienteId: 1,
    data: "2024-01-10",
    terapeuta: "Dra. Ana Costa",
    tipo: "Evolução Mensal",
    conteudo: {
      objetivos: "Melhorar coordenação motora fina",
      atividades: "Desenho, pinturas, exercícios com massinha",
      progresso: "Evolução significativa na coordenação",
      observacoes: "Paciente mais participativo",
      proximosPassos: "Introduzir atividades mais complexas",
    },
  },
]

export default function PlanoEvolutivo() {
  const [pacienteSelecionado, setPacienteSelecionado] = useState("")
  const [searchTerm, setSearchTerm] = useState("")
  const [novoPlano, setNovoPlano] = useState({
    pacienteId: "",
    tipo: "",
    objetivos: "",
    atividades: "",
    progresso: "",
    observacoes: "",
    proximosPassos: "",
  })

  const handleSalvarPlano = () => {
    console.log("Novo plano evolutivo:", novoPlano)
    setNovoPlano({
      pacienteId: "",
      tipo: "",
      objetivos: "",
      atividades: "",
      progresso: "",
      observacoes: "",
      proximosPassos: "",
    })
  }

  const pacienteFiltrado = pacientes.find((p) => p.id.toString() === pacienteSelecionado)
  const planosDosPaciente = planosEvolutivos.filter((p) => p.pacienteId.toString() === pacienteSelecionado)

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-primary-dark-blue">Plano Evolutivo</h2>
          <p className="text-muted-foreground">Gerencie planos evolutivos dos pacientes</p>
        </div>

        <Dialog>
          <DialogTrigger asChild>
            <Button className="w-full sm:w-auto">
              <Plus className="mr-2 h-4 w-4" />
              Novo Plano
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Criar Novo Plano Evolutivo</DialogTitle>
            </DialogHeader>
            <div className="space-y-6">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="paciente">Paciente</Label>
                  <Select
                    value={novoPlano.pacienteId}
                    onValueChange={(value) => setNovoPlano({ ...novoPlano, pacienteId: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o paciente" />
                    </SelectTrigger>
                    <SelectContent>
                      {pacientes.map((paciente) => (
                        <SelectItem key={paciente.id} value={paciente.id.toString()}>
                          {paciente.nome} - {paciente.idade} anos
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="tipo">Tipo de Plano</Label>
                  <Select value={novoPlano.tipo} onValueChange={(value) => setNovoPlano({ ...novoPlano, tipo: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o tipo" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="avaliacao-inicial">Avaliação Inicial</SelectItem>
                      <SelectItem value="evolucao-mensal">Evolução Mensal</SelectItem>
                      <SelectItem value="reavaliacao">Reavaliação</SelectItem>
                      <SelectItem value="plano-terapeutico">Plano Terapêutico</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="objetivos">Objetivos Terapêuticos</Label>
                  <Textarea
                    id="objetivos"
                    value={novoPlano.objetivos}
                    onChange={(e) => setNovoPlano({ ...novoPlano, objetivos: e.target.value })}
                    placeholder="Descreva os objetivos principais para este período..."
                    rows={3}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="atividades">Atividades Desenvolvidas</Label>
                  <Textarea
                    id="atividades"
                    value={novoPlano.atividades}
                    onChange={(e) => setNovoPlano({ ...novoPlano, atividades: e.target.value })}
                    placeholder="Descreva as atividades realizadas durante as sessões..."
                    rows={3}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="progresso">Progresso Observado</Label>
                  <Textarea
                    id="progresso"
                    value={novoPlano.progresso}
                    onChange={(e) => setNovoPlano({ ...novoPlano, progresso: e.target.value })}
                    placeholder="Descreva o progresso e evolução do paciente..."
                    rows={3}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="observacoes">Observações Clínicas</Label>
                  <Textarea
                    id="observacoes"
                    value={novoPlano.observacoes}
                    onChange={(e) => setNovoPlano({ ...novoPlano, observacoes: e.target.value })}
                    placeholder="Observações importantes sobre comportamento, resposta às intervenções..."
                    rows={3}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="proximosPassos">Próximos Passos</Label>
                  <Textarea
                    id="proximosPassos"
                    value={novoPlano.proximosPassos}
                    onChange={(e) => setNovoPlano({ ...novoPlano, proximosPassos: e.target.value })}
                    placeholder="Planejamento para as próximas sessões e objetivos futuros..."
                    rows={3}
                  />
                </div>
              </div>

              <Button onClick={handleSalvarPlano} className="w-full">
                Salvar Plano Evolutivo
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Seleção de Paciente */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="h-5 w-5" />
            Selecionar Paciente
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <div className="flex-1">
              <Select value={pacienteSelecionado} onValueChange={setPacienteSelecionado}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione um paciente para visualizar o plano evolutivo" />
                </SelectTrigger>
                <SelectContent>
                  {pacientes.map((paciente) => (
                    <SelectItem key={paciente.id} value={paciente.id.toString()}>
                      {paciente.nome} - {paciente.idade} anos - Terapeuta: {paciente.terapeuta}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Planos Evolutivos do Paciente */}
      {pacienteSelecionado && (
        <div className="space-y-4">
          <div className="flex items-center gap-2 p-4 bg-support-off-white rounded-lg">
            <User className="h-5 w-5 text-primary-teal" />
            <div>
              <h3 className="font-semibold text-primary-dark-blue">{pacienteFiltrado?.nome}</h3>
              <p className="text-sm text-muted-foreground">
                {pacienteFiltrado?.idade} anos - Terapeuta: {pacienteFiltrado?.terapeuta}
              </p>
            </div>
          </div>

          {planosDosPaciente.length === 0 ? (
            <Card>
              <CardContent className="text-center py-8">
                <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">Nenhum plano evolutivo encontrado para este paciente</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {planosDosPaciente.map((plano) => (
                <Card key={plano.id}>
                  <CardHeader>
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div>
                        <CardTitle className="flex items-center gap-2">
                          <FileText className="h-5 w-5" />
                          {plano.tipo}
                        </CardTitle>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                          <Calendar className="h-4 w-4" />
                          <span>{new Date(plano.data).toLocaleDateString("pt-BR")}</span>
                          <span>•</span>
                          <span>Por: {plano.terapeuta}</span>
                        </div>
                      </div>
                      <Button variant="outline" size="sm">
                        <Edit className="h-4 w-4 mr-2" />
                        Editar
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <Tabs defaultValue="objetivos" className="w-full">
                      <TabsList className="grid w-full grid-cols-5">
                        <TabsTrigger value="objetivos">Objetivos</TabsTrigger>
                        <TabsTrigger value="atividades">Atividades</TabsTrigger>
                        <TabsTrigger value="progresso">Progresso</TabsTrigger>
                        <TabsTrigger value="observacoes">Observações</TabsTrigger>
                        <TabsTrigger value="proximos">Próximos</TabsTrigger>
                      </TabsList>
                      <TabsContent value="objetivos" className="mt-4">
                        <div className="p-4 bg-support-light-gray rounded-lg">
                          <h4 className="font-medium mb-2">Objetivos Terapêuticos</h4>
                          <p className="text-gray-700">{plano.conteudo.objetivos}</p>
                        </div>
                      </TabsContent>
                      <TabsContent value="atividades" className="mt-4">
                        <div className="p-4 bg-support-light-gray rounded-lg">
                          <h4 className="font-medium mb-2">Atividades Desenvolvidas</h4>
                          <p className="text-gray-700">{plano.conteudo.atividades}</p>
                        </div>
                      </TabsContent>
                      <TabsContent value="progresso" className="mt-4">
                        <div className="p-4 bg-support-light-gray rounded-lg">
                          <h4 className="font-medium mb-2">Progresso Observado</h4>
                          <p className="text-gray-700">{plano.conteudo.progresso}</p>
                        </div>
                      </TabsContent>
                      <TabsContent value="observacoes" className="mt-4">
                        <div className="p-4 bg-support-light-gray rounded-lg">
                          <h4 className="font-medium mb-2">Observações Clínicas</h4>
                          <p className="text-gray-700">{plano.conteudo.observacoes}</p>
                        </div>
                      </TabsContent>
                      <TabsContent value="proximos" className="mt-4">
                        <div className="p-4 bg-support-light-gray rounded-lg">
                          <h4 className="font-medium mb-2">Próximos Passos</h4>
                          <p className="text-gray-700">{plano.conteudo.proximosPassos}</p>
                        </div>
                      </TabsContent>
                    </Tabs>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
