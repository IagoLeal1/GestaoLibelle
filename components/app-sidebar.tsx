"use client"

import {
  Calendar, DollarSign, FileText, Home, MessageSquare, Users, UserCheck,
  CheckCircle, UserPlus, MessageCircle, MapPin, BadgeDollarSign
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
  { title: "Mapeamento de Salas", url: "/mapeamento-salas", icon: MapPin, roles: ['admin', 'funcionario'] },
  { title: "Pacientes", url: "/pacientes", icon: Users, roles: ['admin', 'profissional', 'funcionario'] },
  { title: "Profissionais", url: "/profissionais", icon: UserCheck, roles: ['admin', 'funcionario'] },
  { title: "Especialidades", url: "/especialidades", icon: BadgeDollarSign, roles: ['admin'] },
  { title: "Financeiro", url: "/financeiro", icon: DollarSign, roles: ['admin'] },
  // { title: "Relatórios", url: "/relatorios", icon: FileText, roles: ['admin', 'funcionario'] },
  // { title: "Avisos", url: "/avisos", icon: MessageSquare, roles: ['admin', 'profissional', 'funcionario', 'familiar'] },
  // { title: "Tarefas", url: "/tarefas", icon: CheckCircle, roles: ['admin', 'profissional', 'funcionario'] },
  { title: "Aprovação de Acesso", url: "/admin/usuarios", icon: UserPlus, roles: ['admin'] },
  { title: "Comunicação", url: "/comunicacao", icon: MessageCircle, roles: ['admin', 'profissional', 'funcionario', 'familiar'] },
  // { title: "Plano Evolutivo", url: "/plano-evolutivo", icon: FileText, roles: ['profissional'] },
]

export function AppSidebar() {
  const pathname = usePathname()
  const { firestoreUser, unreadCount } = useAuth() 

  const accessibleItems = menuItems.filter(item => {
    if (!firestoreUser?.profile) return false;
    return !item.roles || item.roles.includes(firestoreUser.profile.role);
  });

  return (
    <Sidebar className="border-r">
      <SidebarHeader className="p-6 flex justify-center">
        <div className="relative h-16 w-24">
          <Image src="/images/logotipo-azul.png" alt="Casa Libelle" fill className="object-contain" />
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
                    <Link href={item.url} className="flex items-center justify-between w-full">
                      <div className="flex items-center gap-2">
                        <item.icon className="h-4 w-4" />
                        <span>{item.title}</span>
                      </div>
                      {/* --- LÓGICA DA NOTIFICAÇÃO --- */}
                      {item.title === "Comunicação" && unreadCount > 0 && (
                        <span className="h-2 w-2 rounded-full bg-red-500" />
                      )}
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