"use client"

import {
  Calendar,
  DollarSign,
  FileText,
  Home,
  MessageSquare,
  Stethoscope,
  Users,
  UserCheck,
  CheckCircle,
  UserPlus,
  MessageCircle,
  MapPin,
} from "lucide-react"
import Link from "next/link"
import { usePathname } from "next/navigation"

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
} from "@/components/ui/sidebar"

const items = [
  {
    title: "Dashboard",
    url: "/",
    icon: Home,
  },
  {
    title: "Agendamentos",
    url: "/agendamentos",
    icon: Calendar,
  },
  {
    title: "Pacientes",
    url: "/pacientes",
    icon: Users,
  },
  {
    title: "Profissionais",
    url: "/profissionais",
    icon: UserCheck,
  },
  {
    title: "Financeiro",
    url: "/financeiro",
    icon: DollarSign,
  },
  {
    title: "Relatórios",
    url: "/relatorios",
    icon: FileText,
  },
  {
    title: "Avisos",
    url: "/avisos",
    icon: MessageSquare,
  },
  {
    title: "Tarefas",
    url: "/tarefas",
    icon: CheckCircle,
  },
  {
    title: "Aprovação de Acesso",
    url: "/aprovacao-acesso",
    icon: UserPlus,
  },
  {
    title: "Comunicação",
    url: "/comunicacao",
    icon: MessageCircle,
  },
  {
    title: "Plano Evolutivo",
    url: "/plano-evolutivo",
    icon: FileText,
  },
  {
    title: "Mapeamento de Salas",
    url: "/mapeamento-salas",
    icon: MapPin,
  },
]

export function AppSidebar() {
  const pathname = usePathname()

  return (
    <Sidebar className="border-r">
      <SidebarHeader className="p-6">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary-teal text-white">
            <Stethoscope className="h-4 w-4" />
          </div>
          <div className="grid flex-1 text-left text-sm leading-tight">
            <span className="truncate font-semibold text-primary-dark-blue">ClinicSystem</span>
            <span className="truncate text-xs text-primary-teal">Gestão Clínica</span>
          </div>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Menu Principal</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild isActive={pathname === item.url}>
                    <Link href={item.url}>
                      <item.icon />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  )
}
