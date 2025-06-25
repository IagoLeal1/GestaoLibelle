import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Download, DollarSign, TrendingUp, TrendingDown } from "lucide-react"

const repasses = [
  {
    id: 1,
    professional: "Dr. João Silva",
    atendimentos: 15,
    valorTotal: 2250,
    percentual: 60,
    valorRepasse: 1350,
    status: "pendente",
  },
  {
    id: 2,
    professional: "Dra. Ana Costa",
    atendimentos: 12,
    valorTotal: 1800,
    percentual: 65,
    valorRepasse: 1170,
    status: "pendente",
  },
  {
    id: 3,
    professional: "Dr. Carlos Mendes",
    atendimentos: 8,
    valorTotal: 1200,
    percentual: 55,
    valorRepasse: 660,
    status: "pago",
  },
  {
    id: 4,
    professional: "Dra. Lucia Santos",
    atendimentos: 10,
    valorTotal: 1500,
    percentual: 60,
    valorRepasse: 900,
    status: "pendente",
  },
]

export default function Financeiro() {
  const totalCaixa = 18750
  const totalRecebido = 15200
  const totalRepassar = 4080

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-primary-dark-blue">Financeiro</h2>
          <p className="text-muted-foreground">Controle financeiro e repasses dos profissionais</p>
        </div>
        <Button className="w-full sm:w-auto">
          <Download className="mr-2 h-4 w-4" />
          Exportar Planilha (.xlsx)
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Caixa do Mês</CardTitle>
            <div className="p-2 rounded-lg bg-primary-medium-green/20">
              <DollarSign className="h-4 w-4 text-primary-medium-green" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">R$ {totalCaixa.toLocaleString("pt-BR")}</div>
            <p className="text-xs text-primary-medium-green flex items-center mt-1">
              <TrendingUp className="h-3 w-3 mr-1" />
              +12% em relação ao mês anterior
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Total Recebido</CardTitle>
            <div className="p-2 rounded-lg bg-primary-teal/20">
              <TrendingUp className="h-4 w-4 text-primary-teal" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">R$ {totalRecebido.toLocaleString("pt-BR")}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {((totalRecebido / totalCaixa) * 100).toFixed(1)}% do total do caixa
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Total a Repassar</CardTitle>
            <div className="p-2 rounded-lg bg-secondary-orange/20">
              <TrendingDown className="h-4 w-4 text-secondary-orange" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">R$ {totalRepassar.toLocaleString("pt-BR")}</div>
            <p className="text-xs text-muted-foreground mt-1">4 profissionais pendentes</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Repasses por Profissional</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Profissional</TableHead>
                  <TableHead className="text-center">Atendimentos</TableHead>
                  <TableHead className="text-right">Valor Total</TableHead>
                  <TableHead className="text-center">% Repasse</TableHead>
                  <TableHead className="text-right">Valor Repasse</TableHead>
                  <TableHead className="text-center">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {repasses.map((repasse) => (
                  <TableRow key={repasse.id}>
                    <TableCell className="font-medium">{repasse.professional}</TableCell>
                    <TableCell className="text-center">{repasse.atendimentos}</TableCell>
                    <TableCell className="text-right">R$ {repasse.valorTotal.toLocaleString("pt-BR")}</TableCell>
                    <TableCell className="text-center">{repasse.percentual}%</TableCell>
                    <TableCell className="text-right font-medium">
                      R$ {repasse.valorRepasse.toLocaleString("pt-BR")}
                    </TableCell>
                    <TableCell className="text-center">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          repasse.status === "pendente"
                            ? "bg-secondary-orange/20 text-secondary-orange"
                            : "bg-primary-medium-green/20 text-primary-medium-green"
                        }`}
                      >
                        {repasse.status === "pendente" ? "Pendente" : "Pago"}
                      </span>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
