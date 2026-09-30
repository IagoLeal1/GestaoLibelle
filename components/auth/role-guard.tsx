"use client";
// components/auth/role-guard.tsx
// Quem digitar o endereço de uma tela que não é do seu papel volta para o início.
// O AuthGuard já garantiu que o cadastro está aprovado; aqui só entra o papel.
import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { podeAcessar } from "@/lib/permissoes";

export function RoleGuard({ children }: { children: React.ReactNode }) {
  const { firestoreUser } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  const permitido = !firestoreUser || podeAcessar(pathname, firestoreUser.profile.role);

  useEffect(() => {
    if (!permitido) router.replace("/");
  }, [permitido, router]);

  // Não mostra a tela enquanto volta para o início
  return permitido ? <>{children}</> : null;
}
