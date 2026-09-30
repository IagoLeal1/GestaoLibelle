"use client"
// app/(dashboard)/mensagens/layout.tsx
// Lista de conversas + conversa aberta lado a lado no computador; no celular, uma tela de cada vez,
// ocupando a tela toda. A lista fica montada ao trocar de conversa (não recarrega nem pisca).
import { usePathname } from "next/navigation"
import { ListaDeConversas } from "@/components/mensagens/lista-conversas"

export default function MensagensLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const conversaAberta = pathname !== "/mensagens"

  return (
    <div className="-m-4 flex h-[calc(100dvh-4rem)] overflow-hidden bg-white sm:m-0 sm:h-[calc(100dvh-7rem)] sm:rounded-xl sm:border sm:shadow-sm">
      <aside className={`${conversaAberta ? "hidden lg:flex" : "flex"} w-full flex-col border-r lg:w-[340px]`}>
        <ListaDeConversas />
      </aside>
      <section className={`${conversaAberta ? "flex" : "hidden lg:flex"} min-w-0 flex-1 flex-col bg-[#eef3f6]`}>
        {children}
      </section>
    </div>
  )
}
