"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { AlertCircle, Loader2, Plus } from "lucide-react"
import { toast } from "sonner"
import { useAuth } from "@/context/AuthContext"
import { Patient } from "@/services/patientService"
import { ChatMember, createPatientChatGroup, getApprovedPeople, getPatientTeamSuggestion } from "@/services/chatService"
import { EscolherPaciente } from "@/components/mensagens/escolher-paciente"
import { SeletorDePessoas } from "@/components/mensagens/seletor-de-pessoas"

// Novo grupo de conversa de um paciente: a família vinculada e os terapeutas que atendem a criança já vêm marcados
export function CreateChatGroupModal() {
    const { firestoreUser } = useAuth()
    const router = useRouter()
    const [open, setOpen] = useState(false)
    const [paciente, setPaciente] = useState<Patient | null>(null)
    const [pessoas, setPessoas] = useState<ChatMember[]>([])
    const [selecionados, setSelecionados] = useState<Set<string>>(new Set())
    const [sugeridos, setSugeridos] = useState<Set<string>>(new Set())
    const [semFamilia, setSemFamilia] = useState(false)
    const [carregando, setCarregando] = useState(false)
    const [salvando, setSalvando] = useState(false)

    useEffect(() => {
        if (!open) return
        getApprovedPeople().then(setPessoas)
    }, [open])

    const reiniciar = () => {
        setPaciente(null)
        setSelecionados(new Set())
        setSugeridos(new Set())
        setSemFamilia(false)
    }

    const escolherPaciente = async (escolhido: Patient, grupoExistente?: string) => {
        if (grupoExistente) {
            setOpen(false)
            reiniciar()
            router.push(`/mensagens/${grupoExistente}`)
            return
        }
        setPaciente(escolhido)
        setCarregando(true)
        try {
            const sugestao = await getPatientTeamSuggestion(escolhido.id)
            const marcados = new Set([...sugestao.familia, ...sugestao.terapeutas])
            setSugeridos(marcados)
            setSelecionados(marcados)
            setSemFamilia(sugestao.familia.length === 0)
        } catch (error) {
            console.error("Erro ao sugerir participantes:", error)
        } finally {
            setCarregando(false)
        }
    }

    const alternar = (uid: string) => {
        setSelecionados(atual => {
            const novo = new Set(atual)
            if (novo.has(uid)) novo.delete(uid)
            else novo.add(uid)
            return novo
        })
    }

    const criar = async () => {
        if (!paciente || !firestoreUser) return
        setSalvando(true)
        const resultado = await createPatientChatGroup({
            paciente: { id: paciente.id, nome: paciente.fullName },
            membros: pessoas.filter(p => selecionados.has(p.uid)),
            criadoPor: firestoreUser.uid,
        })
        setSalvando(false)

        if (resultado.success) {
            toast.success(`Grupo de ${paciente.fullName} criado.`)
        } else if (resultado.error === "ja-existe") {
            toast.info(`${paciente.fullName} já tem um grupo. Abrindo a conversa.`)
        } else {
            toast.error("Não foi possível criar o grupo. Tente novamente.")
            return
        }
        setOpen(false)
        reiniciar()
        router.push(`/mensagens/${resultado.id}`)
    }

    return (
        <Dialog open={open} onOpenChange={(aberto) => { setOpen(aberto); if (!aberto) reiniciar() }}>
            <DialogTrigger asChild>
                <Button size="sm" className="bg-[#1da7ac] hover:bg-[#1da7ac]/90">
                    <Plus className="mr-1 h-4 w-4" /> Novo grupo
                </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
                <DialogHeader>
                    <DialogTitle>{paciente ? `Grupo de ${paciente.fullName}` : "Novo grupo de conversa"}</DialogTitle>
                    <DialogDescription>
                        {paciente ? "Confira quem vai participar da conversa." : "Escolha a criança. A família e os terapeutas dela já vêm marcados."}
                    </DialogDescription>
                </DialogHeader>

                {!paciente ? (
                    <EscolherPaciente onEscolher={escolherPaciente} />
                ) : carregando ? (
                    <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-slate-400" /></div>
                ) : (
                    <div className="space-y-3">
                        {semFamilia && (
                            <p className="flex gap-2 rounded-md bg-amber-50 p-3 text-sm text-amber-900">
                                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                                A família de {paciente.fullName.split(" ")[0]} ainda não criou acesso ao sistema. Você pode criar o grupo agora e adicioná-la depois.
                            </p>
                        )}
                        {/* Quem cria o grupo entra nele sempre, por isso não aparece na lista */}
                        <SeletorDePessoas pessoas={pessoas.filter(p => p.uid !== firestoreUser?.uid)} selecionados={selecionados} onAlternar={alternar} sugeridos={sugeridos} />
                        <p className="text-xs text-slate-500">Você também entra no grupo.</p>
                        <div className="flex gap-2">
                            <Button variant="outline" onClick={reiniciar} className="flex-1">Trocar criança</Button>
                            <Button onClick={criar} disabled={salvando} className="flex-1 bg-[#1da7ac] hover:bg-[#1da7ac]/90">
                                {salvando && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Criar grupo ({new Set([...selecionados, firestoreUser?.uid]).size} pessoas)
                            </Button>
                        </div>
                    </div>
                )}
            </DialogContent>
        </Dialog>
    )
}
