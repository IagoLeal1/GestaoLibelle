import { Loader2 } from "lucide-react"

// Enquanto a conversa carrega (a lista, no layout, continua na tela)
export default function Loading() {
  return (
    <div className="m-auto">
      <Loader2 className="h-6 w-6 animate-spin text-slate-300" />
    </div>
  )
}
