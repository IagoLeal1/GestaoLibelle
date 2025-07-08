import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Plus, AlertCircle, Info, CheckCircle } from "lucide-react"

const avisos = [
  {
    id: 1,
    titulo: "Manutenção do Sistema",
    descricao:
      "O sistema passará por manutenção programada no domingo das 02:00 às 06:00. Durante este período, o acesso pode ficar indisponível.",
    data: "2024-01-15",
    tipo: "manutencao",
    prioridade: "alta",
  },
  {
    id: 2,
    titulo: "Nova Funcionalidade: Relatórios Avançados",
    descricao:
      "Agora você pode gerar relatórios personalizados com filtros avançados. Acesse o menu Relatórios para conhecer as novas opções.",
    data: "2024-01-14",
    tipo: "novidade",
    prioridade: "media",
  },
  {
    id: 3,
    titulo: "Lembrete: Backup dos Dados",
    descricao:
      "Não esqueça de realizar o backup semanal dos dados da clínica. O último backup foi realizado em 08/01/2024.",
    data: "2024-01-13",
    tipo: "lembrete",
    prioridade: "media",
  },
  {
    id: 4,
    titulo: "Atualização de Segurança",
    descricao:
      "Uma atualização de segurança foi aplicada ao sistema. Todas as senhas foram mantidas, mas recomendamos a alteração das mesmas.",
    data: "2024-01-12",
    tipo: "seguranca",
    prioridade: "alta",
  },
  {
    id: 5,
    titulo: "Treinamento: Novo Módulo Financeiro",
    descricao:
      "Será realizado um treinamento sobre o novo módulo financeiro na próxima terça-feira às 14:00. Participação recomendada para todos os usuários.",
    data: "2024-01-11",
    tipo: "treinamento",
    prioridade: "baixa",
  },
]

const getTipoIcon = (tipo: string) => {
  const icons = {
    manutencao: AlertCircle,
    novidade: Info,
    lembrete: CheckCircle,
    seguranca: AlertCircle,
    treinamento: Info,
  }
  return icons[tipo as keyof typeof icons] || Info
}

const getTipoColor = (tipo: string) => {
  const colors = {
    manutencao: "bg-secondary-orange/20 text-secondary-orange",
    novidade: "bg-primary-teal/20 text-primary-teal",
    lembrete: "bg-primary-medium-green/20 text-primary-medium-green",
    seguranca: "bg-secondary-red/20 text-secondary-red",
    treinamento: "bg-support-dark-purple/20 text-support-dark-purple",
  }
  return colors[tipo as keyof typeof colors] || "bg-support-light-gray text-support-dark-purple"
}

const getPrioridadeColor = (prioridade: string) => {
  const colors = {
    alta: "bg-secondary-red/20 text-secondary-red",
    media: "bg-secondary-beige/30 text-secondary-orange",
    baixa: "bg-primary-soft-green/20 text-primary-medium-green",
  }
  return colors[prioridade as keyof typeof colors] || "bg-support-light-gray text-support-dark-purple"
}

export default function Avisos() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-primary-dark-blue">Avisos</h2>
          <p className="text-muted-foreground">Comunicados e informações importantes do sistema</p>
        </div>
        <Button className="w-full sm:w-auto">
          <Plus className="mr-2 h-4 w-4" />
          Novo Aviso
        </Button>
      </div>

      <div className="space-y-4">
        {avisos.map((aviso) => {
          const IconComponent = getTipoIcon(aviso.tipo)
          return (
            <Card key={aviso.id} className="hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-start gap-3">
                    <div className="p-2 rounded-lg bg-support-light-gray">
                      <IconComponent className="h-5 w-5 text-primary-teal" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">{aviso.titulo}</CardTitle>
                      <p className="text-sm text-muted-foreground mt-1">
                        {new Date(aviso.data).toLocaleDateString("pt-BR", {
                          day: "2-digit",
                          month: "2-digit",
                          year: "numeric",
                        })}
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Badge className={getTipoColor(aviso.tipo)}>
                      {aviso.tipo.charAt(0).toUpperCase() + aviso.tipo.slice(1)}
                    </Badge>
                    <Badge className={getPrioridadeColor(aviso.prioridade)}>
                      {aviso.prioridade.charAt(0).toUpperCase() + aviso.prioridade.slice(1)}
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-gray-700 leading-relaxed">{aviso.descricao}</p>
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
