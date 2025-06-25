"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Plus, Search, Filter, MoreHorizontal } from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import Link from "next/link"

const appointments = [
  {
    id: 1,
    patient: "Maria Santos",
    professional: "Dr. João Silva",
    date: "2024-01-15",
    time: "09:00",
    status: "agendado",
  },
  {
    id: 2,
    patient: "Pedro Oliveira",
    professional: "Dra. Ana Costa",
    date: "2024-01-15",
    time: "09:30",
    status: "finalizado",
  },
  {
    id: 3,
    patient: "Carla Mendes",
    professional: "Dr. João Silva",
    date: "2024-01-15",
    time: "10:00",
    status: "nao_compareceu",
  },
  {
    id: 4,
    patient: "José Santos",
    professional: "Dra. Ana Costa",
    date: "2024-01-15",
    time: "10:30",
    status: "cancelado",
  },
  {
    id: 5,
    patient: "Ana Silva",
    professional: "Dr. João Silva",
    date: "2024-01-15",
    time: "11:00",
    status: "agendado",
  },
]

const getStatusBadge = (status: string) => {
  const statusConfig = {
    agendado: {
      label: "Agendado",
      variant: "default" as const,
      className: "bg-primary-light-green/30 text-primary-teal",
    },
    finalizado: {
      label: "Finalizado",
      variant: "default" as const,
      className: "bg-primary-soft-green/30 text-primary-medium-green",
    },
    nao_compareceu: {
      label: "Não compareceu",
      variant: "default" as const,
      className: "bg-secondary-coral/30 text-secondary-red",
    },
    cancelado: {
      label: "Cancelado",
      variant: "default" as const,
      className: "bg-support-light-gray text-support-dark-purple",
    },
  }

  const config = statusConfig[status as keyof typeof statusConfig]
  return (
    <Badge variant={config.variant} className={config.className}>
      {config.label}
    </Badge>
  )
}

export default function Agendamentos() {
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("todos")
  const [professionalFilter, setProfessionalFilter] = useState("todos")

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-primary-dark-blue">Agendamentos</h2>
          <p className="text-muted-foreground">Gerencie todos os agendamentos da clínica</p>
        </div>
        <Button asChild className="w-full sm:w-auto">
          <Link href="agendamentos/novo">
            <Plus className="mr-2 h-4 w-4" />
            Novo Agendamento
          </Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filtros
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-4">
            <div className="space-y-2">
              <Label htmlFor="search">Buscar paciente</Label>
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  id="search"
                  placeholder="Nome do paciente..."
                  className="pl-8"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="date">Data</Label>
              <Input id="date" type="date" defaultValue="2024-01-15" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="professional">Profissional</Label>
              <Select value={professionalFilter} onValueChange={setProfessionalFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos</SelectItem>
                  <SelectItem value="dr-joao">Dr. João Silva</SelectItem>
                  <SelectItem value="dra-ana">Dra. Ana Costa</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos</SelectItem>
                  <SelectItem value="agendado">Agendado</SelectItem>
                  <SelectItem value="finalizado">Finalizado</SelectItem>
                  <SelectItem value="nao_compareceu">Não compareceu</SelectItem>
                  <SelectItem value="cancelado">Cancelado</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Lista de Agendamentos</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Paciente</TableHead>
                  <TableHead>Profissional</TableHead>
                  <TableHead>Data</TableHead>
                  <TableHead>Hora</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {appointments.map((appointment) => (
                  <TableRow key={appointment.id}>
                    <TableCell className="font-medium">{appointment.patient}</TableCell>
                    <TableCell>{appointment.professional}</TableCell>
                    <TableCell>{new Date(appointment.date).toLocaleDateString("pt-BR")}</TableCell>
                    <TableCell>{appointment.time}</TableCell>
                    <TableCell>{getStatusBadge(appointment.status)}</TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem>Editar</DropdownMenuItem>
                          <DropdownMenuItem>Finalizar</DropdownMenuItem>
                          <DropdownMenuItem>Remarcar</DropdownMenuItem>
                          <DropdownMenuItem className="text-red-600">Cancelar</DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
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
