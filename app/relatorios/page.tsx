import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { FileText } from "lucide-react"

export default function Relatorios() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-gray-900">Relatórios</h2>
          <p className="text-muted-foreground">Gere relatórios detalhados sobre a clínica</p>
        </div>
        <Button className="w-full sm:w-auto">
          <FileText className="mr-2 h-4 w-4" />
          Gerar Relatório
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Relatórios Disponíveis</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Funcionalidade em desenvolvimento...</p>
        </CardContent>
      </Card>
    </div>
  )
}
