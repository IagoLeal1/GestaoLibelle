"use client"

import {
  Calendar, DollarSign, FileText, Home, MessageSquare, Users, UserCheck,
  CheckCircle, UserPlus, MessageCircle, MapPin
} from "lucide-react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import Image from "next/image"

// 1. A MUDANÇA ESTÁ AQUI: Importamos o hook de autenticação
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
  { title: "Comunicação", url: "/comunicacao", icon: MessageCircle, roles: ['admin', 'profissional', 'funcionario', 'familiar'] },
  // { title: "Plano Evolutivo", url: "/plano-evolutivo", icon: FileText, roles: ['profissional'] },
  // { title: "Mapeamento de Salas", url: "/mapeamento-salas", icon: MapPin, roles: ['admin', 'funcionario'] },
]

export function AppSidebar() {
  const pathname = usePathname()
  // 2. A MUDANÇA ESTÁ AQUI: Pegamos 'firestoreUser' em vez de 'userProfile'
  const { firestoreUser } = useAuth() 

  // 3. A MUDANÇA ESTÁ AQUI: Filtramos usando 'firestoreUser.profile.role'
  const accessibleItems = menuItems.filter(item => {
    // Se o perfil ainda não carregou, não mostra nada
    if (!firestoreUser?.profile) return false;
    // Se o item não tem roles definidos, mostra para todos. Senão, verifica a permissão.
    return !item.roles || item.roles.includes(firestoreUser.profile.role);
  });

  return (
    // O JSX do seu componente continua o mesmo, sem classes de posicionamento
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
              {/* Agora mapeamos os itens filtrados corretamente */}
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