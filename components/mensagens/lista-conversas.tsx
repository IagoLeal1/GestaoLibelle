"use client"
// components/mensagens/lista-conversas.tsx
// Coluna da esquerda das mensagens: busca, filtros e as conversas com as não lidas.
import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Eye, Loader2, MessageCircleOff, Search } from "lucide-react"
import { useContagemDeNaoLidas, useConversas } from "@/hooks/use-conversas"
import { ChatGroup, hasUnread, isLegacyGroup } from "@/services/chatService"
import { getIniciais, quandoCurto } from "@/lib/formatters"
import { CreateChatGroupModal } from "@/components/modals/create-chat-group-modal"

type Filtro = "todas" | "naoLidas" | "minhas" | "supervisao"

export function ListaDeConversas() {
  const { grupos, carregando, erro, uid, coordenacao } = useConversas()
  const contagens = useContagemDeNaoLidas(grupos, uid)
  const pathname = usePathname()
  const [busca, setBusca] = useState("")
  const [filtro, setFiltro] = useState<Filtro>("todas")

  const participa = (g: ChatGroup) => !!uid && g.memberIds.includes(uid)
  const naoLida = (g: ChatGroup) => !!uid && hasUnread(g, uid)

  const filtros: { chave: Filtro; rotulo: string; quantidade?: number }[] = [
    { chave: "todas", rotulo: "Todas" },
    { chave: "naoLidas", rotulo: "Não lidas", quantidade: grupos.filter(naoLida).length },
    ...(coordenacao
      ? [{ chave: "minhas" as Filtro, rotulo: "Minhas" }, { chave: "supervisao" as Filtro, rotulo: "Supervisão" }]
      : []),
  ]

  const visiveis = grupos
    .filter(g =>
      filtro === "naoLidas" ? naoLida(g) : filtro === "minhas" ? participa(g) : filtro === "supervisao" ? !participa(g) : true
    )
    .filter(g => g.pacienteNome.toLowerCase().includes(busca.toLowerCase()))

  return (
    <>
      <div className="space-y-3 border-b p-4">
        <div className="flex items-center justify-between gap-2">
          <h2 className="text-xl font-bold text-[#16375b]">Mensagens</h2>
          {coordenacao && <CreateChatGroupModal />}
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            placeholder="Buscar pelo nome da criança"
            className="w-full rounded-full border bg-slate-50 py-2 pl-9 pr-3 text-sm outline-none focus:border-[#1da7ac]"
          />
        </div>
        <div className="flex flex-wrap gap-1.5">
          {filtros.map(f => (
            <button
              key={f.chave}
              onClick={() => setFiltro(f.chave)}
              className={`rounded-full px-3 py-1 text-sm font-medium ${filtro === f.chave ? "bg-[#16375b] text-white" : "bg-slate-100 text-slate-700 hover:bg-slate-200"}`}
            >
              {f.rotulo}
              {!!f.quantidade && (
                <span className={`ml-1.5 rounded-full px-1.5 text-xs font-bold ${filtro === f.chave ? "bg-white text-[#16375b]" : "bg-[#1da7ac] text-white"}`}>
                  {f.quantidade}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      <ul className="flex-1 overflow-y-auto">
        {carregando ? (
          <li className="flex justify-center p-8"><Loader2 className="h-6 w-6 animate-spin text-slate-300" /></li>
        ) : erro ? (
          <li className="flex flex-col items-center gap-1 p-8 text-center text-slate-500">
            <MessageCircleOff className="mb-1 h-10 w-10 opacity-50" />
            <p>Não foi possível carregar as conversas.</p>
            <p className="text-xs">Recarregue a página ou tente novamente mais tarde.</p>
          </li>
        ) : visiveis.length === 0 ? (
          <li className="p-8 text-center text-sm text-slate-500">
            {grupos.length === 0 ? "Nenhuma conversa ainda." : "Nenhuma conversa neste filtro."}
          </li>
        ) : (
          visiveis.map(grupo => {
            const nova = naoLida(grupo)
            const ativa = pathname === `/mensagens/${grupo.id}`
            const ultima = grupo.lastMessage
            const deQuem = ultima?.senderId === uid ? "Você" : ultima?.senderName?.split(" ")[0]
            return (
              <li key={grupo.id}>
                <Link
                  href={`/mensagens/${grupo.id}`}
                  className={`flex items-center gap-3 border-b px-4 py-3 hover:bg-slate-50 ${ativa ? "bg-[#1da7ac]/10" : ""}`}
                >
                  <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[#16375b] text-base font-semibold text-white">
                    {getIniciais(grupo.pacienteNome)}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <span className={`truncate text-[15px] ${nova ? "font-bold text-slate-900" : "font-semibold text-slate-800"}`}>
                        {grupo.pacienteNome}
                      </span>
                      {ultima?.createdAt && (
                        <span className={`shrink-0 text-xs ${nova ? "font-semibold text-[#1da7ac]" : "text-slate-500"}`}>
                          {quandoCurto(ultima.createdAt.toDate())}
                        </span>
                      )}
                    </div>
                    <div className="mt-0.5 flex items-center justify-between gap-2">
                      <span className={`truncate text-sm ${nova ? "text-slate-800" : "text-slate-500"}`}>
                        {ultima ? `${deQuem}: ${ultima.content}` : <span className="italic">Nenhuma mensagem ainda</span>}
                      </span>
                      {nova && (
                        <span className="flex h-5 min-w-5 shrink-0 items-center justify-center rounded-full bg-[#1da7ac] px-1.5 text-xs font-bold text-white">
                          {contagens[grupo.id] ?? "•"}
                        </span>
                      )}
                    </div>
                    {(coordenacao && !participa(grupo)) || (coordenacao && isLegacyGroup(grupo)) ? (
                      <div className="mt-1 flex flex-wrap gap-1">
                        {!participa(grupo) && (
                          <span className="inline-flex items-center gap-1 rounded bg-slate-100 px-1.5 py-0.5 text-[11px] font-medium text-slate-600">
                            <Eye className="h-3 w-3" /> Supervisão
                          </span>
                        )}
                        {isLegacyGroup(grupo) && (
                          <span className="rounded bg-amber-100 px-1.5 py-0.5 text-[11px] font-medium text-amber-800">Sem criança vinculada</span>
                        )}
                      </div>
                    ) : null}
                  </div>
                </Link>
              </li>
            )
          })
        )}
      </ul>
    </>
  )
}
