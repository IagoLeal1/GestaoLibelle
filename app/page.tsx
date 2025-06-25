import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Calendar, CheckCircle, XCircle, DollarSign } from "lucide-react"

export default function Dashboard() {
  const stats = [
    {
      title: "Agendamentos Hoje",
      value: "12",
      description: "3 nas próximas 2 horas",
      icon: Calendar,
      color: "text-primary-teal",
      bgColor: "bg-primary-light-green/20",
    },
    {
      title: "Atendimentos Finalizados",
      value: "8",
      description: "67% da agenda do dia",
      icon: CheckCircle,
      color: "text-primary-medium-green",
      bgColor: "bg-primary-soft-green/20",
    },
    {
      title: "Faltas",
      value: "2",
      description: "16% dos agendamentos",
      icon: XCircle,
      color: "text-secondary-red",
      bgColor: "bg-secondary-coral/20",
    },
    {
      title: "Repasses Pendentes",
      value: "R$ 2.450",
      description: "5 profissionais",
      icon: DollarSign,
      color: "text-secondary-orange",
      bgColor: "bg-secondary-beige/20",
    },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-primary-dark-blue">Dashboard</h2>
        <p className="text-muted-foreground">Visão geral dos agendamentos e atividades da clínica</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.title}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">{stat.title}</CardTitle>
              <div className={`p-2 rounded-lg ${stat.bgColor}`}>
                <stat.icon className={`h-4 w-4 ${stat.color}`} />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900">{stat.value}</div>
              <p className="text-xs text-muted-foreground mt-1">{stat.description}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Próximos Agendamentos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[
                { time: "09:00", patient: "Maria Santos", professional: "Dr. João", type: "Consulta" },
                { time: "09:30", patient: "Pedro Silva", professional: "Dra. Ana", type: "Retorno" },
                { time: "10:00", patient: "Carla Oliveira", professional: "Dr. João", type: "Consulta" },
                { time: "10:30", patient: "José Costa", professional: "Dra. Ana", type: "Exame" },
              ].map((appointment, index) => (
                <div key={index} className="flex items-center space-x-4 p-3 rounded-lg bg-support-light-gray">
                  <div className="text-sm font-medium text-primary-teal min-w-[50px]">{appointment.time}</div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">{appointment.patient}</p>
                    <p className="text-xs text-gray-500">
                      {appointment.professional} • {appointment.type}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Resumo Financeiro</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center p-3 rounded-lg bg-primary-soft-green/20">
                <div>
                  <p className="text-sm font-medium text-gray-900">Receita do Mês</p>
                  <p className="text-xs text-gray-500">Janeiro 2024</p>
                </div>
                <p className="text-lg font-bold text-primary-medium-green">R$ 15.750</p>
              </div>
              <div className="flex justify-between items-center p-3 rounded-lg bg-blue-50">
                <div>
                  <p className="text-sm font-medium text-gray-900">Recebido Hoje</p>
                  <p className="text-xs text-gray-500">8 atendimentos</p>
                </div>
                <p className="text-lg font-bold text-blue-600">R$ 1.200</p>
              </div>
              <div className="flex justify-between items-center p-3 rounded-lg bg-orange-50">
                <div>
                  <p className="text-sm font-medium text-gray-900">A Repassar</p>
                  <p className="text-xs text-gray-500">5 profissionais</p>
                </div>
                <p className="text-lg font-bold text-orange-600">R$ 2.450</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
