"use client"

import {
  Calendar, DollarSign, FileText, Home, MessageSquare, Users, UserCheck,
  CheckCircle, UserPlus, Megaphone, MapPin, BadgeDollarSign, TrendingUp, MessagesSquare, NotebookPen, CircleHelp
} from "lucide-react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import Image from "next/image"
import { useAuth } from "@/context/AuthContext"
import { useConversas } from "@/hooks/use-conversas"
import { useEvolucoes } from "@/context/EvolucoesContext"
import { PAPEIS_POR_TELA } from "@/lib/permissoes"

import {
  Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent,
  SidebarGroupLabel, SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarHeader, SidebarFooter, useSidebar // <-- IMPORTE O HOOK
} from "@/components/ui/sidebar"

// Os papéis de cada item vêm de lib/permissoes, a mesma lista que trava o endereço digitado
const menuItems = [
  { title: "Dashboard", url: "/", icon: Home, roles: PAPEIS_POR_TELA["/"] },
  { title: "Agendamentos", url: "/agendamentos", icon: Calendar, roles: PAPEIS_POR_TELA["/agendamentos"] },
  { title: "Mapeamento de Salas", url: "/mapeamento-salas", icon: MapPin, roles: PAPEIS_POR_TELA["/mapeamento-salas"] },
  { title: "Pacientes", url: "/pacientes", icon: Users, roles: PAPEIS_POR_TELA["/pacientes"] },
  { title: "Evoluções", url: "/evolucoes", icon: NotebookPen, roles: PAPEIS_POR_TELA["/evolucoes"] },
  { title: "Profissionais", url: "/profissionais", icon: UserCheck, roles: PAPEIS_POR_TELA["/profissionais"] },
  { title: "Especialidades", url: "/especialidades", icon: BadgeDollarSign, roles: PAPEIS_POR_TELA["/especialidades"] },
  { title: "Financeiro", url: "/financeiro", icon: DollarSign, roles: PAPEIS_POR_TELA["/financeiro"] },
  // { title: "Relatórios", url: "/relatorios", icon: FileText, roles: ['admin', 'funcionario'] },
  // { title: "Tarefas", url: "/tarefas", icon: CheckCircle, roles: ['admin', 'profissional', 'funcionario'] },
  { title: "Aprovação de Acesso", url: "/admin/usuarios", icon: UserPlus, roles: PAPEIS_POR_TELA["/admin/usuarios"] },
  { title: "Comercial", url: "/comercial", icon: TrendingUp, roles: PAPEIS_POR_TELA["/comercial"] },
  { title: "Gerenciar Usuários", url: "/admin/gerenciar-usuarios", icon: Users, roles: PAPEIS_POR_TELA["/admin/gerenciar-usuarios"] },
  { title: "Avisos", url: "/comunicacao", icon: Megaphone, roles: PAPEIS_POR_TELA["/comunicacao"] },
  { title: "Mensagens", url: "/mensagens", icon: MessagesSquare, roles: PAPEIS_POR_TELA["/mensagens"] },
  // { title: "Plano Evolutivo", url: "/plano-evolutivo", icon: FileText, roles: ['profissional'] },
]

export function AppSidebar() {
  const pathname = usePathname()
  const { firestoreUser, unreadCount } = useAuth()
  const { setOpenMobile } = useSidebar(); // <-- USE O HOOK AQUI
  // Só as conversas de que a pessoa participa: é o que o número do menu conta
  const { naoLidas: conversasNaoLidas } = useConversas({ incluirSupervisao: false })
  // O terapeuta vê no menu quantas evoluções faltam escrever (a coordenação acompanha na página)
  const { escopo, pendentes } = useEvolucoes()
  const evolucoesParaEscrever = escopo === "terapeuta" ? pendentes.length : 0

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
                  <SidebarMenuButton asChild isActive={pathname === item.url || (item.url !== "/" && pathname.startsWith(`${item.url}/`))}>
                    {/* ADICIONE O onClick AQUI */}
                    <Link href={item.url} className="flex items-center justify-between w-full" onClick={() => setOpenMobile(false)}>
                      <div className="flex items-center gap-2">
                        <item.icon className="h-4 w-4" />
                        <span>{item.title}</span>
                      </div>
                      {/* --- LÓGICA DA NOTIFICAÇÃO --- */}
                      {item.url === "/comunicacao" && unreadCount > 0 && (
                        <span className="h-2 w-2 rounded-full bg-red-500" />
                      )}
                      {item.url === "/evolucoes" && evolucoesParaEscrever > 0 && (
                        <span
                          aria-label={`${evolucoesParaEscrever} evoluções para escrever`}
                          className="flex h-5 min-w-5 items-center justify-center rounded-full bg-amber-700 px-1.5 text-xs font-bold text-white"
                        >
                          {evolucoesParaEscrever}
                        </span>
                      )}
                      {item.title === "Mensagens" && conversasNaoLidas > 0 && (
                        <span
                          aria-label={`${conversasNaoLidas} conversas com mensagens novas`}
                          className="flex h-5 min-w-5 items-center justify-center rounded-full bg-[#1da7ac] px-1.5 text-xs font-bold text-white"
                        >
                          {conversasNaoLidas}
                        </span>
                      )}
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      {/* A Ajuda fica no pé do menu, para todos: os guias de cada papel (lib/ajuda) */}
      {firestoreUser?.profile && (
        <SidebarFooter className="border-t p-3">
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton
                asChild
                isActive={pathname === "/ajuda" || pathname.startsWith("/ajuda/")}
                className="bg-[#e3f4f4] font-semibold text-[#0d5c5f] hover:bg-[#d3eeee] hover:text-[#0d5c5f] data-[active=true]:bg-[#cdeaea] data-[active=true]:text-[#0d5c5f]"
              >
                <Link href="/ajuda" onClick={() => setOpenMobile(false)}>
                  <CircleHelp className="h-4 w-4" />
                  <span>Ajuda: como usar</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarFooter>
      )}
    </Sidebar>
  )
}