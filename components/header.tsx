"use client"

import { Bell, LogOut, User } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import Link from "next/link"
import { useAuth } from "@/context/AuthContext"
import { auth } from "@/lib/firebaseConfig"
import { useRouter } from "next/navigation"

const getInitials = (name: string | null | undefined = "") => {
  if (!name) return "U";
  const names = name.split(' ');
  if (names.length === 1) return names[0].slice(0, 2).toUpperCase();
  return (names[0][0] + names[names.length - 1][0]).toUpperCase();
};

export function Header() {
  const { firestoreUser } = useAuth();
  const router = useRouter();

  const handleLogout = async () => {
    try {
      await auth.signOut();
      router.push('/login');
    } catch (error) {
      console.error("Erro ao fazer logout:", error);
    }
  };

  return (
    <header className="flex h-16 items-center justify-between border-b bg-support-off-white px-4 md:px-6">
      <div className="flex items-center gap-4">
        <SidebarTrigger />
        <h1 className="text-lg font-semibold hidden md:block">Sistema de Agendamento</h1>
      </div>
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" className="relative">
          <Link href="/comunicacao">
            <Bell className="h-4 w-4" />
            {/* <span className="absolute -top-1 -right-1 h-3 w-3 rounded-full bg-red-500 text-[10px] flex items-center justify-center">3</span> */}
          </Link>
        </Button>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="relative h-9 w-9 rounded-full">
              <Avatar className="h-9 w-9">
                <AvatarImage src={firestoreUser?.photoURL || ""} alt={firestoreUser?.displayName || "Usuário"} />
                <AvatarFallback>{getInitials(firestoreUser?.displayName)}</AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-56" align="end" forceMount>
            <DropdownMenuLabel className="font-normal">
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium leading-none">{firestoreUser?.displayName || "Usuário"}</p>
                <p className="text-xs leading-none text-muted-foreground">{firestoreUser?.email || ""}</p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <Link href="/perfil"><DropdownMenuItem className="cursor-pointer"><User className="mr-2 h-4 w-4" /><span>Perfil</span></DropdownMenuItem></Link>
            <DropdownMenuSeparator />
            <DropdownMenuItem onSelect={handleLogout} className="text-red-500 focus:text-red-600 focus:bg-red-50 cursor-pointer">
              <LogOut className="mr-2 h-4 w-4" />
              <span>Sair</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}