import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Plus } from "lucide-react"
import Link from "next/link"

export default function Profissionais() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-gray-900">Profissionais</h2>
          <p className="text-muted-foreground">Gerencie o cadastro de profissionais da clínica</p>
        </div>
        <Button asChild className="w-full sm:w-auto">
          <Link href="/profissionais/novo">
            <Plus className="mr-2 h-4 w-4" />
            Novo Profissional
          </Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Lista de Profissionais</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Funcionalidade em desenvolvimento...</p>
        </CardContent>
      </Card>
    </div>
  )
}
