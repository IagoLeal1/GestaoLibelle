"use client"
// Peças comuns da tela de Avisos: cabeçalho por papel, selos, o pedido de "Estou ciente",
// quem leu, o formulário de aviso e a confirmação de exclusão.
import { useState, type ReactNode } from "react"
import { AlertTriangle, CheckCircle2, Home, Send, ShieldCheck, Stethoscope, Users, type LucideIcon } from "lucide-react"
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Progress } from "@/components/ui/progress"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import { cn } from "@/lib/utils"
import { destinatarios, leitura, PapelDeUsuario, PUBLICOS, PUBLICOS_PARA_ENVIAR, PublicoDoAviso } from "@/lib/avisos"
import { Communication, CommunicationFormData, PessoaDaClinica } from "@/services/communicationService"

const TITULOS: Record<"gestao" | "profissional" | "familiar", { titulo: string; subtitulo: string }> = {
  gestao: { titulo: "Avisos", subtitulo: "Recados da clínica para a equipe e para as famílias." },
  profissional: { titulo: "Avisos", subtitulo: "Recados da coordenação e da clínica para a equipe." },
  familiar: { titulo: "Avisos da clínica", subtitulo: "Recados importantes da Casa Libelle para você." },
}

export function CabecalhoDosAvisos({ papel, acao }: { papel: PapelDeUsuario; acao?: ReactNode }) {
  const { titulo, subtitulo } = TITULOS[papel === "profissional" || papel === "familiar" ? papel : "gestao"]
  return (
    <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">{titulo}</h2>
        <p className="text-muted-foreground">{subtitulo}</p>
      </div>
      {acao}
    </div>
  )
}

/** "hoje, 09:12", "ontem, 18:40", "há 3 dias" ou "28/09". */
export function quando(data: Date, agora = new Date()) {
  const dias = Math.round((new Date(agora.toDateString()).getTime() - new Date(data.toDateString()).getTime()) / 86_400_000)
  const hora = data.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })
  if (dias <= 0) return `hoje, ${hora}`
  if (dias === 1) return `ontem, ${hora}`
  if (dias < 7) return `há ${dias} dias`
  return data.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" })
}

const ICONE_DO_PUBLICO: Record<PublicoDoAviso, LucideIcon> = {
  equipe: Users,
  profissional: Users,
  terapeutas: Stethoscope,
  coordenador: ShieldCheck,
  funcionario: ShieldCheck,
  familiar: Home,
}

export function SeloPublico({ publico }: { publico: PublicoDoAviso }) {
  const Icone = ICONE_DO_PUBLICO[publico] ?? Users
  return (
    <Badge variant="outline" className="gap-1 font-normal text-muted-foreground">
      <Icone className="h-3 w-3" />
      {PUBLICOS[publico]?.nome ?? publico}
    </Badge>
  )
}

export function SeloImportante() {
  return (
    <Badge className="gap-1 border-transparent bg-amber-100 text-amber-800 hover:bg-amber-100">
      <AlertTriangle className="h-3 w-3" />
      Importante
    </Badge>
  )
}

export function SeloNovo() {
  return <Badge className="border-transparent bg-primary-teal text-white hover:bg-primary-teal">Novo</Badge>
}

/** O pedido de confirmação dos avisos importantes, para quem recebe. */
export function PedidoDeCiencia({ onConfirmar, confirmando = false }: { onConfirmar: () => void; confirmando?: boolean }) {
  return (
    <div className="flex flex-col gap-3 rounded-lg border border-amber-200 bg-amber-50 p-3 sm:flex-row sm:items-center sm:justify-between">
      <p className="text-sm text-amber-900">Este aviso é importante. Confirme que você leu.</p>
      <Button size="sm" onClick={onConfirmar} disabled={confirmando} className="shrink-0">
        <CheckCircle2 className="mr-2 h-4 w-4" />
        Estou ciente
      </Button>
    </div>
  )
}

export function JaConfirmou() {
  return (
    <p className="flex items-center gap-2 text-sm font-medium text-green-700">
      <CheckCircle2 className="h-4 w-4" />
      Você confirmou que leu.
    </p>
  )
}

function ListaDePessoas({ titulo, pessoas }: { titulo: string; pessoas: PessoaDaClinica[] }) {
  return (
    <div className="rounded-lg border p-3">
      <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
        {titulo} ({pessoas.length})
      </p>
      {pessoas.length === 0 ? (
        <p className="text-sm text-muted-foreground">Ninguém.</p>
      ) : (
        <ul className="space-y-1 text-sm">
          {pessoas.map((p) => <li key={p.uid} className="truncate">{p.displayName}</li>)}
        </ul>
      )}
    </div>
  )
}

/** Quem leu e quem ainda não leu (só a gestão vê). Quem escreveu não entra na conta. */
export function Leitura({ aviso, pessoas }: { aviso: Communication; pessoas: PessoaDaClinica[] }) {
  const { leram, naoLeram, total } = leitura(aviso, pessoas)
  const porcento = total ? Math.round((leram.length / total) * 100) : 0
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between text-sm">
        <span className="font-medium">
          {leram.length} de {total} {aviso.isImportant ? "confirmaram" : "leram"}
        </span>
        <span className="text-muted-foreground">{porcento}%</span>
      </div>
      <Progress value={porcento} className="h-2" />
      <div className="grid gap-3 sm:grid-cols-2">
        <ListaDePessoas titulo="Ainda não leram" pessoas={naoLeram} />
        <ListaDePessoas titulo="Já leram" pessoas={leram} />
      </div>
    </div>
  )
}

/** Quantas pessoas recebem um aviso para esse público, sem contar quem escreve. */
export const quantosRecebem = (publico: PublicoDoAviso, pessoas: PessoaDaClinica[], autorId: string) =>
  destinatarios({ targetRole: publico, authorId: autorId, readBy: {} }, pessoas).length

/** Formulário do aviso. Para editar, só título e texto: quem recebe não muda depois de enviado. */
export function FormularioDeAviso({
  pessoas, autorId, inicial, soTexto = false, rotuloEnviar, salvando = false, onEnviar, onCancelar,
}: {
  pessoas: PessoaDaClinica[]
  autorId: string
  inicial?: Pick<Communication, "title" | "message">
  soTexto?: boolean
  rotuloEnviar?: string
  salvando?: boolean
  onEnviar: (dados: CommunicationFormData) => void
  onCancelar?: () => void
}) {
  const [publico, setPublico] = useState<PublicoDoAviso>("equipe")
  const [titulo, setTitulo] = useState(inicial?.title ?? "")
  const [texto, setTexto] = useState(inicial?.message ?? "")
  const [importante, setImportante] = useState(false)
  const quantos = quantosRecebem(publico, pessoas, autorId)

  return (
    <div className="space-y-4">
      {!soTexto && (
        <div className="space-y-2">
          <Label>Para quem</Label>
          <div className="grid grid-cols-2 gap-2">
            {PUBLICOS_PARA_ENVIAR.map((p) => {
              const Icone = ICONE_DO_PUBLICO[p]
              const ativo = p === publico
              return (
                <button
                  key={p}
                  type="button"
                  onClick={() => setPublico(p)}
                  aria-pressed={ativo}
                  className={cn(
                    "flex items-start gap-2 rounded-lg border p-3 text-left transition-colors",
                    ativo ? "border-primary bg-primary/5 ring-1 ring-primary" : "hover:bg-muted"
                  )}
                >
                  <Icone className={cn("mt-0.5 h-4 w-4 shrink-0", ativo ? "text-primary" : "text-muted-foreground")} />
                  <span className="min-w-0">
                    <span className="block text-sm font-medium">{PUBLICOS[p].nome}</span>
                    <span className="block text-xs text-muted-foreground">{quantosRecebem(p, pessoas, autorId)} pessoas</span>
                  </span>
                </button>
              )
            })}
          </div>
          <p className="text-xs text-muted-foreground">Vai para {quantos} pessoas: {PUBLICOS[publico].descricao}.</p>
        </div>
      )}

      <div className="space-y-2">
        <Label htmlFor="titulo-do-aviso">Título</Label>
        <Input id="titulo-do-aviso" value={titulo} maxLength={200} onChange={(e) => setTitulo(e.target.value)} placeholder="Ex.: Feriado de 12/10" />
      </div>
      <div className="space-y-2">
        <Label htmlFor="texto-do-aviso">Mensagem</Label>
        <Textarea id="texto-do-aviso" rows={5} value={texto} maxLength={5000} onChange={(e) => setTexto(e.target.value)} placeholder="Escreva o aviso" />
      </div>

      {!soTexto && (
        <div className="flex items-start justify-between gap-3 rounded-lg border p-3">
          <div>
            <Label htmlFor="aviso-importante">Importante</Label>
            <p className="text-xs text-muted-foreground">Fica no topo e pede que cada pessoa confirme que leu.</p>
          </div>
          <Switch id="aviso-importante" checked={importante} onCheckedChange={setImportante} />
        </div>
      )}

      <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        {onCancelar && <Button variant="ghost" onClick={onCancelar} disabled={salvando}>Cancelar</Button>}
        <Button
          disabled={salvando || !titulo.trim() || !texto.trim()}
          onClick={() => onEnviar({ title: titulo.trim(), message: texto.trim(), isImportant: importante, targetRole: publico })}
        >
          <Send className="mr-2 h-4 w-4" />
          {rotuloEnviar ?? `Enviar para ${quantos} pessoas`}
        </Button>
      </div>
    </div>
  )
}

/** Confirmação antes de excluir: o aviso some para todo mundo que recebeu. */
export function ConfirmarExclusao({ aviso, onFechar, onConfirmar }: { aviso: Communication | null; onFechar: () => void; onConfirmar: () => void }) {
  return (
    <AlertDialog open={aviso !== null} onOpenChange={(aberto) => !aberto && onFechar()}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Excluir este aviso?</AlertDialogTitle>
          <AlertDialogDescription>
            “{aviso?.title}” some para todo mundo que recebeu. Não dá para desfazer.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancelar</AlertDialogCancel>
          <AlertDialogAction onClick={onConfirmar} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
            Excluir
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
