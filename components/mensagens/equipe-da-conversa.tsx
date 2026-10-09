"use client"
// components/mensagens/equipe-da-conversa.tsx
// Quem está na conversa, separado por papel. A coordenação também adiciona, remove
// e liga grupos antigos à criança. Só o admin arquiva, desarquiva e exclui de vez.
import { useState } from "react"
import { useRouter } from "next/navigation"
import { format } from "date-fns"
import { Archive, ArchiveRestore, Eye, Link2, Loader2, Trash2, X } from "lucide-react"
import { toast } from "sonner"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Button } from "@/components/ui/button"
import {
  arquivarGrupo, ChatGroup, ChatMember, desarquivarGrupo, excluirGrupoDeVez, isLegacyGroup, linkGroupToPatient, removeGroupMember,
} from "@/services/chatService"
import { Patient } from "@/services/patientService"
import { getIniciais } from "@/lib/formatters"
import { AddParticipantsModal } from "@/components/modals/add-participants-modal"
import { EscolherPaciente } from "./escolher-paciente"
import { agruparPorPapel, infoDoPapel } from "./papeis"

interface Props {
  open: boolean
  onOpenChange: (aberto: boolean) => void
  grupo: ChatGroup
  membros: ChatMember[]
  meuUid: string
  podeGerenciar: boolean
  /** Só o admin arquiva, desarquiva e exclui de vez. */
  ehAdmin?: boolean
  meuNome?: string
  onMudou: () => void
}

/** Minúsculas e sem acento: "Théo" e "theo" confirmam do mesmo jeito. */
const comparavel = (texto: string) => texto.normalize("NFD").replace(/[̀-ͯ]/g, "").trim().toLowerCase()

export function EquipeDaConversa({ open, onOpenChange, grupo, membros, meuUid, podeGerenciar, ehAdmin = false, meuNome = "", onMudou }: Props) {
  const router = useRouter()
  const [remover, setRemover] = useState<ChatMember | null>(null)
  const [removendo, setRemovendo] = useState(false)
  const [vinculando, setVinculando] = useState(false)
  const [arquivar, setArquivar] = useState(false)
  const [excluir, setExcluir] = useState(false)
  const [confirmacao, setConfirmacao] = useState("")
  const [trabalhando, setTrabalhando] = useState(false)
  const arquivado = !!grupo.arquivado
  const souMembro = grupo.memberIds.includes(meuUid)
  const gerenciaParticipantes = podeGerenciar && !arquivado
  const primeiroNome = grupo.pacienteNome.split(" ")[0]

  const confirmarArquivar = async () => {
    setTrabalhando(true)
    try {
      await arquivarGrupo(grupo, { nome: meuNome })
      toast.success(`Conversa de ${primeiroNome} arquivada.`)
      setArquivar(false)
      onMudou()
    } catch (error) {
      console.error("Erro ao arquivar a conversa:", error)
      toast.error("Não foi possível arquivar. Tente novamente.")
    } finally {
      setTrabalhando(false)
    }
  }

  const desarquivar = async () => {
    setTrabalhando(true)
    try {
      await desarquivarGrupo(grupo)
      toast.success(`Conversa de ${primeiroNome} de volta para todos.`)
      onMudou()
    } catch (error) {
      console.error("Erro ao desarquivar a conversa:", error)
      toast.error("Não foi possível desarquivar. Tente novamente.")
    } finally {
      setTrabalhando(false)
    }
  }

  const confirmarExcluir = async () => {
    setTrabalhando(true)
    try {
      await excluirGrupoDeVez(grupo.id)
      toast.success(`Conversa de ${primeiroNome} excluída de vez.`)
      setExcluir(false)
      onOpenChange(false)
      router.push("/mensagens")
    } catch (error) {
      console.error("Erro ao excluir a conversa:", error)
      toast.error("Não foi possível excluir tudo. A conversa continua arquivada: tente de novo.")
    } finally {
      setTrabalhando(false)
    }
  }

  const confirmarRemocao = async () => {
    if (!remover) return
    setRemovendo(true)
    try {
      await removeGroupMember(grupo.id, remover.uid)
      toast.success(`${remover.nome} saiu da conversa.`)
      onMudou()
    } catch (error) {
      console.error("Erro ao remover participante:", error)
      toast.error("Não foi possível remover. Tente novamente.")
    } finally {
      setRemovendo(false)
      setRemover(null)
    }
  }

  const vincular = async (paciente: Patient) => {
    try {
      const resultado = await linkGroupToPatient(grupo.id, { id: paciente.id, nome: paciente.fullName })
      if (!resultado.success) {
        // Cada criança tem um grupo só: esta conversa fica como está
        toast.info(`${paciente.fullName} já tem um grupo. Esta conversa continua com o nome do responsável.`)
        return
      }
      toast.success(`Conversa ligada a ${paciente.fullName}.`)
      setVinculando(false)
      onMudou()
    } catch (error) {
      console.error("Erro ao vincular o grupo ao paciente:", error)
      toast.error("Não foi possível vincular. Tente novamente.")
    }
  }

  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent side="right" className="flex w-full flex-col gap-4 overflow-y-auto sm:max-w-sm">
          <SheetHeader>
            <SheetTitle>Equipe de {grupo.pacienteNome.split(" ")[0]}</SheetTitle>
            <SheetDescription>{membros.length} {membros.length === 1 ? "pessoa" : "pessoas"} nesta conversa</SheetDescription>
          </SheetHeader>

          {arquivado && (
            <p className="flex items-start gap-2 rounded-md border border-slate-300 bg-slate-100 p-3 text-sm text-slate-700">
              <Archive className="mt-0.5 h-4 w-4 shrink-0" />
              <span>
                Conversa arquivada{grupo.arquivadoEm ? ` em ${format(grupo.arquivadoEm.toDate(), "dd/MM/yyyy")}` : ""}
                {grupo.arquivadoPor ? ` por ${grupo.arquivadoPor}` : ""}. Ninguém vê nem manda mensagens; abaixo, quem estava nela.
              </span>
            </p>
          )}

          {!souMembro && !arquivado && (
            <p className="flex items-center gap-2 rounded-md bg-slate-100 p-3 text-sm text-slate-700">
              <Eye className="h-4 w-4 shrink-0" /> Você acompanha esta conversa como supervisão.
            </p>
          )}

          {gerenciaParticipantes && isLegacyGroup(grupo) && (
            <div className="space-y-2 rounded-md border border-amber-200 bg-amber-50 p-3">
              <p className="text-sm text-amber-900">
                Este grupo foi criado antes e ainda não está ligado a uma criança. Ele aparece com o nome do responsável.
              </p>
              {vinculando ? (
                <EscolherPaciente onEscolher={vincular} />
              ) : (
                <Button size="sm" variant="outline" onClick={() => setVinculando(true)} className="gap-1.5">
                  <Link2 className="h-4 w-4" /> Vincular à criança
                </Button>
              )}
            </div>
          )}

          <div className="space-y-4">
            {agruparPorPapel(membros).map(secao => (
              <div key={secao.titulo}>
                <p className="mb-1.5 text-xs font-bold uppercase tracking-wide text-slate-500">{secao.titulo}</p>
                <ul className="space-y-1">
                  {secao.pessoas.map(membro => (
                    <li key={membro.uid} className="flex items-center gap-3 rounded-md px-1 py-1.5">
                      <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-bold ${infoDoPapel(membro.papel).cor}`}>
                        {getIniciais(membro.nome)}
                      </span>
                      <span className="min-w-0 flex-1 truncate text-[15px] text-slate-900">
                        {membro.nome}{membro.uid === meuUid && <span className="text-slate-500"> (você)</span>}
                      </span>
                      {gerenciaParticipantes && membro.uid !== meuUid && (
                        <button
                          onClick={() => setRemover(membro)}
                          aria-label={`Remover ${membro.nome} da conversa`}
                          className="rounded-full p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-600"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          {gerenciaParticipantes && <AddParticipantsModal groupId={grupo.id} memberIds={grupo.memberIds} onAdded={onMudou} />}

          {ehAdmin && (
            <div className="mt-auto space-y-2 border-t pt-4">
              {arquivado ? (
                <>
                  <Button variant="outline" className="h-11 w-full gap-2" onClick={desarquivar} disabled={trabalhando}>
                    <ArchiveRestore className="h-4 w-4" /> Desarquivar
                  </Button>
                  <Button
                    variant="outline"
                    className="h-11 w-full gap-2 border-red-200 text-red-700 hover:bg-red-50 hover:text-red-700"
                    onClick={() => { setConfirmacao(""); setExcluir(true) }}
                    disabled={trabalhando}
                  >
                    <Trash2 className="h-4 w-4" /> Excluir de vez
                  </Button>
                </>
              ) : (
                <Button variant="outline" className="h-11 w-full gap-2" onClick={() => setArquivar(true)}>
                  <Archive className="h-4 w-4" /> Arquivar conversa
                </Button>
              )}
            </div>
          )}
        </SheetContent>
      </Sheet>

      <AlertDialog open={arquivar} onOpenChange={(aberto) => !trabalhando && setArquivar(aberto)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Arquivar a conversa de {primeiroNome}?</AlertDialogTitle>
            <AlertDialogDescription>
              Ela some da lista de todos e ninguém manda mais mensagens. As mensagens ficam guardadas: dá para desarquivar quando quiser.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={trabalhando}>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={(e) => { e.preventDefault(); confirmarArquivar() }} disabled={trabalhando}>
              {trabalhando && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Arquivar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={excluir} onOpenChange={(aberto) => !trabalhando && setExcluir(aberto)}>
        <AlertDialogContent className="grid-cols-[minmax(0,1fr)]">
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir de vez a conversa de {primeiroNome}?</AlertDialogTitle>
            <AlertDialogDescription>
              Todas as mensagens são apagadas e <strong>não dá para recuperar</strong>. Se quiser só tirar da lista, deixe arquivada.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="space-y-1.5">
            <Label htmlFor="confirmar-exclusao">Para confirmar, escreva <strong>{primeiroNome}</strong></Label>
            <Input id="confirmar-exclusao" value={confirmacao} onChange={(e) => setConfirmacao(e.target.value)} autoComplete="off" className="h-11" />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={trabalhando}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => { e.preventDefault(); confirmarExcluir() }}
              disabled={trabalhando || comparavel(confirmacao) !== comparavel(primeiroNome)}
              className="bg-red-600 hover:bg-red-700"
            >
              {trabalhando && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Excluir de vez
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={remover !== null} onOpenChange={(aberto) => !aberto && setRemover(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remover {remover?.nome} da conversa?</AlertDialogTitle>
            <AlertDialogDescription>
              A pessoa deixa de ver e de receber as mensagens deste grupo na hora. Você pode adicioná-la de novo depois.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={removendo}>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={confirmarRemocao} disabled={removendo} className="bg-red-600 hover:bg-red-700">
              {removendo && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Remover
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
