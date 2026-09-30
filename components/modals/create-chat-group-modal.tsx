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
import { alternarPessoa, SeletorDePessoas } from "@/components/mensagens/seletor-de-pessoas"

// Novo grupo de conversa de um paciente: a família vinculada e os terapeutas que atendem a criança já vêm marcados
export function CreateChatGroupModal() {
    const { firestoreUser } = useAuth()
    const router = useRouter()
    const [open, setOpen] = useState(false)
    const [paciente, setPaciente] = useState<Patient | null>(null)
    const [pessoas, setPessoas] = useState<ChatMember[]>([])
    const [selecionados, setSelecionados] = useState<Set<string>>(new Set())
    const [sugeridos, setSugeridos] = useState<Set<string>>(new Set())
    const [familiaSugerida, setFamiliaSugerida] = useState<string[]>([])
    const [carregando, setCarregando] = useState(false)
    const [salvando, setSalvando] = useState(false)

    useEffect(() => {
        if (!open) return
        getApprovedPeople().then(setPessoas)
    }, [open])

    // Só entra no grupo quem tem cadastro aprovado. Quem cria entra sempre, por isso fica fora da lista.
    const outrasPessoas = pessoas.filter(p => p.uid !== firestoreUser?.uid)
    const escolhidos = outrasPessoas.filter(p => selecionados.has(p.uid))
    // A conta ligada à criança pode não existir ainda ou estar esperando aprovação
    const semFamilia = pessoas.length > 0 && !pessoas.some(p => familiaSugerida.includes(p.uid))

    const reiniciar = () => {
        setPaciente(null)
        setSelecionados(new Set())
        setSugeridos(new Set())
        setFamiliaSugerida([])
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
            setFamiliaSugerida(sugestao.familia)
        } catch (error) {
            console.error("Erro ao sugerir participantes:", error)
        } finally {
            setCarregando(false)
        }
    }

    const criar = async () => {
        if (!paciente || !firestoreUser) return
        setSalvando(true)
        const resultado = await createPatientChatGroup({
            paciente: { id: paciente.id, nome: paciente.fullName },
            membros: escolhidos,
            criadoPor: { uid: firestoreUser.uid, nome: firestoreUser.displayName, papel: firestoreUser.profile.role },
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
                                A família de {paciente.fullName.split(" ")[0]} ainda não tem acesso ao sistema (ou aguarda aprovação). Você pode criar o grupo agora e adicioná-la depois.
                            </p>
                        )}
                        <SeletorDePessoas pessoas={outrasPessoas} selecionados={selecionados} onAlternar={(uid) => setSelecionados(atual => alternarPessoa(atual, uid))} sugeridos={sugeridos} />
                        <p className="text-xs text-slate-500">Você também entra no grupo.</p>
                        <div className="flex gap-2">
                            <Button variant="outline" onClick={reiniciar} className="flex-1">Trocar criança</Button>
                            <Button onClick={criar} disabled={salvando} className="flex-1 bg-[#1da7ac] hover:bg-[#1da7ac]/90">
                                {salvando && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Criar grupo ({escolhidos.length + 1} pessoas)
                            </Button>
                        </div>
                    </div>
                )}
            </DialogContent>
        </Dialog>
    )
}
