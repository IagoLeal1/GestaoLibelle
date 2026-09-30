"use client"
// components/mensagens/equipe-da-conversa.tsx
// Quem está na conversa, separado por papel. A coordenação também adiciona, remove
// e liga grupos antigos à criança.
import { useState } from "react"
import { Eye, Link2, Loader2, X } from "lucide-react"
import { toast } from "sonner"
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Button } from "@/components/ui/button"
import { ChatGroup, ChatMember, isLegacyGroup, linkGroupToPatient, removeGroupMember } from "@/services/chatService"
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
  onMudou: () => void
}

export function EquipeDaConversa({ open, onOpenChange, grupo, membros, meuUid, podeGerenciar, onMudou }: Props) {
  const [remover, setRemover] = useState<ChatMember | null>(null)
  const [removendo, setRemovendo] = useState(false)
  const [vinculando, setVinculando] = useState(false)
  const souMembro = grupo.memberIds.includes(meuUid)

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

          {!souMembro && (
            <p className="flex items-center gap-2 rounded-md bg-slate-100 p-3 text-sm text-slate-700">
              <Eye className="h-4 w-4 shrink-0" /> Você acompanha esta conversa como supervisão.
            </p>
          )}

          {podeGerenciar && isLegacyGroup(grupo) && (
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
                      {podeGerenciar && membro.uid !== meuUid && (
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

          {podeGerenciar && <AddParticipantsModal groupId={grupo.id} memberIds={grupo.memberIds} onAdded={onMudou} />}
        </SheetContent>
      </Sheet>

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
