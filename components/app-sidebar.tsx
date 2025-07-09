"use client"

import {
  Calendar, DollarSign, FileText, Home, MessageSquare, Users, UserCheck,
  CheckCircle, UserPlus, MessageCircle, MapPin
} from "lucide-react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import Image from "next/image"

import { useAuth } from "@/context/AuthContext" 
import {
  Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent,
  SidebarGroupLabel, SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarHeader
} from "@/components/ui/sidebar"

const menuItems = [
  { title: "Dashboard", url: "/", icon: Home, roles: ['admin', 'profissional', 'funcionario', 'familiar'] },
  { title: "Agendamentos", url: "/agendamentos", icon: Calendar, roles: ['admin', 'profissional', 'funcionario'] },
  { title: "Pacientes", url: "/pacientes", icon: Users, roles: ['admin', 'profissional', 'funcionario'] },
  { title: "Profissionais", url: "/profissionais", icon: UserCheck, roles: ['admin', 'funcionario'] },
  // { title: "Financeiro", url: "/financeiro", icon: DollarSign, roles: ['admin', 'funcionario'] },
  // { title: "Relatórios", url: "/relatorios", icon: FileText, roles: ['admin', 'funcionario'] },
  // { title: "Avisos", url: "/avisos", icon: MessageSquare, roles: ['admin', 'profissional', 'funcionario', 'familiar'] },
  // { title: "Tarefas", url: "/tarefas", icon: CheckCircle, roles: ['admin', 'profissional', 'funcionario'] },
  { title: "Aprovação de Acesso", url: "/admin/usuarios", icon: UserPlus, roles: ['admin'] },
  // { title: "Comunicação", url: "/comunicacao", icon: MessageCircle, roles: ['admin', 'profissional', 'funcionario', 'familiar'] },
  // { title: "Plano Evolutivo", url: "/plano-evolutivo", icon: FileText, roles: ['profissional'] },
  // { title: "Mapeamento de Salas", url: "/mapeamento-salas", icon: MapPin, roles: ['admin', 'funcionario'] },
]

export function AppSidebar() {
  const pathname = usePathname()
  const { userProfile } = useAuth()

  const accessibleItems = menuItems.filter(item => 
    !item.roles || item.roles.includes(userProfile?.role || "")
  );

  return (
    // Sem classes de posicionamento aqui! Deixamos o componente original fazer seu trabalho.
    <Sidebar className="border-r">
      <SidebarHeader className="p-6 flex justify-center">
        <div className="relative h-16 w-24">
          <Image src="/images/logotipo-azul.jpg" alt="Casa Libelle" fill className="object-contain" />
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Menu Principal</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {accessibleItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild isActive={pathname === item.url}>
                    <Link href={item.url}>
                      <item.icon className="h-4 w-4" />
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