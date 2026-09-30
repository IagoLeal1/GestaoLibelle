// app/(dashboard)/mensagens/page.tsx
// A lista de conversas fica no layout. Aqui é só o espaço da direita no computador,
// antes de escolher uma conversa (no celular, a lista ocupa a tela).
import { MessagesSquare } from "lucide-react"

export default function MensagensPage() {
  return (
    <div className="m-auto max-w-xs space-y-2 p-6 text-center text-slate-500">
      <MessagesSquare className="mx-auto h-12 w-12 opacity-40" />
      <p className="text-lg font-medium text-slate-700">Escolha uma conversa</p>
      <p className="text-sm">As conversas com mensagens novas aparecem com um número ao lado.</p>
    </div>
  )
}
