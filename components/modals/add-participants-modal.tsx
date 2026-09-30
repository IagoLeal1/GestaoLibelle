"use client"

import { useEffect, useState } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Loader2, UserPlus } from "lucide-react"
import { toast } from "sonner"
import { addGroupMembers, ChatMember, getApprovedPeople } from "@/services/chatService"
import { alternarPessoa, SeletorDePessoas } from "@/components/mensagens/seletor-de-pessoas"

interface AddParticipantsModalProps {
    groupId: string
    memberIds: string[]
    onAdded?: () => void
}

// Coloca qualquer pessoa aprovada no grupo: família (inclusive um segundo responsável), terapeutas e equipe
export function AddParticipantsModal({ groupId, memberIds, onAdded }: AddParticipantsModalProps) {
    const [open, setOpen] = useState(false)
    const [pessoas, setPessoas] = useState<ChatMember[] | null>(null)
    const [selecionados, setSelecionados] = useState<Set<string>>(new Set())
    const [salvando, setSalvando] = useState(false)

    // A lista de membros chega como um array novo a cada atualização; a chave em texto evita recarregar à toa
    const chaveDosMembros = memberIds.join(",")
    useEffect(() => {
        if (!open) return
        setSelecionados(new Set())
        const atuais = chaveDosMembros.split(",")
        getApprovedPeople().then(todas => setPessoas(todas.filter(p => !atuais.includes(p.uid))))
    }, [open, chaveDosMembros])

    const adicionar = async () => {
        if (!pessoas || selecionados.size === 0) return
        setSalvando(true)
        try {
            await addGroupMembers(groupId, pessoas.filter(p => selecionados.has(p.uid)))
            toast.success(selecionados.size === 1 ? "Pessoa adicionada à conversa." : `${selecionados.size} pessoas adicionadas à conversa.`)
            setOpen(false)
            onAdded?.()
        } catch (error) {
            console.error("Erro ao adicionar participantes:", error)
            toast.error("Não foi possível adicionar. Tente novamente.")
        } finally {
            setSalvando(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="outline" size="sm" className="w-full gap-1.5 border-[#1da7ac]/40 text-[#1da7ac] hover:bg-[#1da7ac]/10">
                    <UserPlus className="h-4 w-4" /> Adicionar pessoas
                </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
                <DialogHeader>
                    <DialogTitle>Adicionar à conversa</DialogTitle>
                    <DialogDescription>Família, terapeutas ou alguém da equipe da clínica.</DialogDescription>
                </DialogHeader>
                {pessoas === null ? (
                    <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-slate-400" /></div>
                ) : pessoas.length === 0 ? (
                    <p className="py-4 text-center text-sm text-slate-500">Todas as pessoas aprovadas já estão nesta conversa.</p>
                ) : (
                    <div className="space-y-3">
                        <SeletorDePessoas pessoas={pessoas} selecionados={selecionados} onAlternar={(uid) => setSelecionados(atual => alternarPessoa(atual, uid))} />
                        <Button onClick={adicionar} disabled={salvando || selecionados.size === 0} className="w-full bg-[#1da7ac] hover:bg-[#1da7ac]/90">
                            {salvando && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Adicionar {selecionados.size > 0 ? `(${selecionados.size})` : ""}
                        </Button>
                    </div>
                )}
            </DialogContent>
        </Dialog>
    )
}
