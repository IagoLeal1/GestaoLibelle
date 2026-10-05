"use client"
// Avisos da gestão (admin, coordenação e recepção): números no topo, os avisos novos para a
// própria pessoa e, em abas separadas, os avisos da equipe e os das famílias, com a leitura de cada um. O aviso abre numa gaveta lateral, com
// quem leu, editar e excluir; o "Novo aviso" também abre numa gaveta.
import { useCallback, useEffect, useMemo, useState } from "react"
import { Timestamp } from "firebase/firestore"
import { BellRing, Clock, Megaphone, Pencil, Plus, Trash2 } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useAuth } from "@/context/AuthContext"
import { leitura, novoParaMim, PapelDeUsuario, possoMexer, PUBLICOS, separarPorPublico, souDestinatario } from "@/lib/avisos"
import {
  Communication, CommunicationFormData, createCommunication, deleteCommunication, getCommunications,
  getPessoasDaClinica, markCommunicationAsRead, PessoaDaClinica, updateCommunication,
} from "@/services/communicationService"
import {
  CabecalhoDosAvisos, ConfirmarExclusao, FormularioDeAviso, JaConfirmou, Leitura, PedidoDeCiencia,
  quando, quantosRecebem, SeloImportante, SeloPublico,
} from "./comum"

function Numero({ titulo, valor, icone: Icone }: { titulo: string; valor: number; icone: React.ElementType }) {
  return (
    <Card>
      <CardContent className="p-3 sm:p-5">
        <div className="flex items-center justify-between gap-2">
          <p className="text-xs font-medium text-muted-foreground sm:text-sm">{titulo}</p>
          <Icone className="hidden h-4 w-4 text-muted-foreground sm:block" />
        </div>
        <p className="mt-1 text-xl font-bold sm:text-2xl">{valor}</p>
      </CardContent>
    </Card>
  )
}

function Resumo({ aviso, onAbrir }: { aviso: Communication; onAbrir: () => void }) {
  return (
    <button onClick={onAbrir} className="block w-full rounded-lg border bg-card p-4 text-left shadow-sm transition-colors hover:bg-muted/50">
      <span className="flex items-start justify-between gap-2">
        <span className="font-medium">{aviso.title}</span>
        <span className="shrink-0 text-xs text-muted-foreground">{quando(aviso.createdAt.toDate())}</span>
      </span>
      <span className="mt-1 line-clamp-2 text-sm text-muted-foreground">{aviso.message}</span>
      <span className="mt-2 flex flex-wrap items-center gap-1.5">
        {aviso.isImportant && <SeloImportante />}
        <span className="text-xs text-muted-foreground">{aviso.authorName}</span>
      </span>
    </button>
  )
}

/** A lista de avisos de uma aba: tabela no computador e um cartão por aviso no celular. */
function ListaDeAvisos({ avisos, pessoas, mostrarPublico, vazio, onAbrir }: {
  avisos: Communication[]
  pessoas: PessoaDaClinica[]
  mostrarPublico: boolean
  vazio: string
  onAbrir: (aviso: Communication) => void
}) {
  if (avisos.length === 0) {
    return <p className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">{vazio}</p>
  }
  return (
    <>
      <Card className="hidden md:block">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Aviso</TableHead>
              {mostrarPublico && <TableHead>Para</TableHead>}
              <TableHead className="w-48">Leitura</TableHead>
              <TableHead className="w-28">Enviado</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {avisos.map((a) => {
              const { leram, total } = leitura(a, pessoas)
              return (
                <TableRow key={a.id} className="cursor-pointer" onClick={() => onAbrir(a)}>
                  <TableCell>
                    <div className="font-medium">{a.title}</div>
                    <div className="mt-1 flex flex-wrap items-center gap-1.5">
                      {a.isImportant && <SeloImportante />}
                      <span className="text-xs text-muted-foreground">{a.authorName}</span>
                    </div>
                  </TableCell>
                  {mostrarPublico && <TableCell className="text-sm">{PUBLICOS[a.targetRole]?.nome ?? a.targetRole}</TableCell>}
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Progress value={total ? (leram.length / total) * 100 : 0} className="h-2" />
                      <span className="shrink-0 text-xs text-muted-foreground">{leram.length}/{total}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">{quando(a.createdAt.toDate())}</TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      </Card>

      <div className="space-y-2 md:hidden">
        {avisos.map((a) => {
          const { leram, total } = leitura(a, pessoas)
          return (
            <button key={a.id} onClick={() => onAbrir(a)} className="block w-full rounded-lg border bg-card p-4 text-left shadow-sm">
              <span className="flex items-start justify-between gap-2">
                <span className="font-medium">{a.title}</span>
                <span className="shrink-0 text-xs text-muted-foreground">{quando(a.createdAt.toDate())}</span>
              </span>
              {(a.isImportant || mostrarPublico) && (
                <span className="mt-2 flex flex-wrap items-center gap-1.5">
                  {a.isImportant && <SeloImportante />}
                  {mostrarPublico && <SeloPublico publico={a.targetRole} />}
                </span>
              )}
              <span className="mt-3 flex items-center gap-2">
                <Progress value={total ? (leram.length / total) * 100 : 0} className="h-2" />
                <span className="shrink-0 text-xs text-muted-foreground">{leram.length} de {total}</span>
              </span>
            </button>
          )
        })}
      </div>
    </>
  )
}

type Aba = "equipe" | "familias"

export function PainelDeAvisos() {
  const { firestoreUser, fetchUnreadCount } = useAuth()
  const eu = useMemo(
    () => (firestoreUser ? { uid: firestoreUser.uid, papel: firestoreUser.profile.role as PapelDeUsuario } : null),
    [firestoreUser]
  )
  const [avisos, setAvisos] = useState<Communication[] | null>(null)
  const [pessoas, setPessoas] = useState<PessoaDaClinica[]>([])
  const [abertoId, setAbertoId] = useState<string | null>(null)
  const [escrevendo, setEscrevendo] = useState(false)
  const [editando, setEditando] = useState(false)
  const [excluindo, setExcluindo] = useState<Communication | null>(null)
  const [salvando, setSalvando] = useState(false)
  const [aba, setAba] = useState<Aba>("equipe")

  const carregar = useCallback(async () => {
    if (!eu) return
    const [lista, gente] = await Promise.all([getCommunications(eu.papel), getPessoasDaClinica()])
    setAvisos(lista)
    setPessoas(gente)
  }, [eu])

  useEffect(() => { carregar() }, [carregar])

  if (!eu || !firestoreUser) return null

  const todos = avisos ?? []
  const paraMim = todos.filter((a) => novoParaMim(a, eu))
  const { equipe, familias } = separarPorPublico(todos)
  const aberto = todos.find((a) => a.id === abertoId) ?? null

  const atualizarLocal = (id: string, mudanca: Partial<Communication>) =>
    setAvisos((atual) => atual?.map((a) => (a.id === id ? { ...a, ...mudanca } : a)) ?? atual)

  const confirmarLeitura = async (aviso: Communication) => {
    const resultado = await markCommunicationAsRead(aviso.id, eu.uid)
    if (!resultado.success) {
      toast.error(resultado.error ?? "Não foi possível confirmar a leitura.")
      return
    }
    atualizarLocal(aviso.id, { readBy: { ...aviso.readBy, [eu.uid]: Timestamp.now() } })
    fetchUnreadCount()
  }

  const abrir = (aviso: Communication) => {
    setAbertoId(aviso.id)
    setEditando(false)
    // Abrir já conta como lido; o importante espera o "Estou ciente"
    if (!aviso.isImportant && novoParaMim(aviso, eu)) confirmarLeitura(aviso)
  }

  const enviar = async (dados: CommunicationFormData) => {
    setSalvando(true)
    const resultado = await createCommunication(dados, firestoreUser)
    setSalvando(false)
    if (!resultado.success) {
      toast.error(resultado.error ?? "Não foi possível enviar o aviso.")
      return
    }
    toast.success(`Aviso enviado para ${quantosRecebem(dados.targetRole, pessoas, eu.uid)} pessoas.`)
    setEscrevendo(false)
    setAba(dados.targetRole === "familiar" ? "familias" : "equipe")
    await carregar()
  }

  const salvarEdicao = async (aviso: Communication, dados: CommunicationFormData) => {
    setSalvando(true)
    const resultado = await updateCommunication(aviso.id, { title: dados.title, message: dados.message })
    setSalvando(false)
    if (!resultado.success) {
      toast.error(resultado.error ?? "Não foi possível salvar o aviso.")
      return
    }
    atualizarLocal(aviso.id, { title: dados.title, message: dados.message })
    setEditando(false)
    toast.success("Aviso atualizado.")
  }

  const excluir = async (aviso: Communication) => {
    const resultado = await deleteCommunication(aviso.id)
    if (!resultado.success) {
      toast.error(resultado.error ?? "Não foi possível excluir o aviso.")
      return
    }
    setAvisos((atual) => atual?.filter((a) => a.id !== aviso.id) ?? atual)
    setAbertoId(null)
    toast.success("Aviso excluído.")
    fetchUnreadCount()
  }

  return (
    <div className="space-y-6">
      <CabecalhoDosAvisos
        papel={eu.papel}
        acao={
          <Button onClick={() => setEscrevendo(true)} className="w-full sm:w-auto">
            <Plus className="mr-2 h-4 w-4" />
            Novo aviso
          </Button>
        }
      />

      {avisos === null ? (
        <p className="py-8 text-center text-muted-foreground">Carregando avisos...</p>
      ) : (
        <>
          <div className="grid grid-cols-3 gap-2 sm:gap-4">
            <Numero titulo="Avisos no ar" valor={todos.length} icone={Megaphone} />
            <Numero titulo="Esperando leitura" valor={todos.filter((a) => leitura(a, pessoas).naoLeram.length > 0).length} icone={Clock} />
            <Numero titulo="Novos para você" valor={paraMim.length} icone={BellRing} />
          </div>

          {paraMim.length > 0 && (
            <section className="space-y-3">
              <h3 className="font-semibold">Para você</h3>
              <div className="grid gap-3 md:grid-cols-2">
                {paraMim.map((a) => <Resumo key={a.id} aviso={a} onAbrir={() => abrir(a)} />)}
              </div>
            </section>
          )}

          {/* Os avisos da equipe e os das famílias em abas separadas */}
          <Tabs value={aba} onValueChange={(valor) => setAba(valor as Aba)} className="space-y-3">
            <TabsList className="grid w-full grid-cols-2 sm:inline-flex sm:w-auto">
              <TabsTrigger value="equipe">Para a equipe ({equipe.length})</TabsTrigger>
              <TabsTrigger value="familias">Para as famílias ({familias.length})</TabsTrigger>
            </TabsList>
            <TabsContent value="equipe" className="mt-0">
              <ListaDeAvisos avisos={equipe} pessoas={pessoas} mostrarPublico vazio="Nenhum aviso para a equipe ainda." onAbrir={abrir} />
            </TabsContent>
            <TabsContent value="familias" className="mt-0">
              <ListaDeAvisos avisos={familias} pessoas={pessoas} mostrarPublico={false} vazio="Nenhum aviso para as famílias ainda." onAbrir={abrir} />
            </TabsContent>
          </Tabs>
        </>
      )}

      {/* Gaveta: o aviso aberto */}
      <Sheet open={aberto !== null} onOpenChange={(aberta) => !aberta && setAbertoId(null)}>
        <SheetContent className="w-full overflow-y-auto sm:max-w-lg">
          {aberto && (
            <div className="space-y-5">
              <SheetHeader className="space-y-2 text-left">
                <div className="flex flex-wrap gap-1.5">
                  {aberto.isImportant && <SeloImportante />}
                  <SeloPublico publico={aberto.targetRole} />
                </div>
                <SheetTitle className="text-xl leading-tight">{aberto.title}</SheetTitle>
                <p className="text-sm text-muted-foreground">{aberto.authorName} · {quando(aberto.createdAt.toDate())}</p>
              </SheetHeader>
              {editando ? (
                <FormularioDeAviso
                  pessoas={pessoas}
                  autorId={eu.uid}
                  inicial={aberto}
                  soTexto
                  rotuloEnviar="Salvar"
                  salvando={salvando}
                  onCancelar={() => setEditando(false)}
                  onEnviar={(dados) => salvarEdicao(aberto, dados)}
                />
              ) : (
                <>
                  <p className="whitespace-pre-line leading-relaxed">{aberto.message}</p>
                  {aberto.isImportant && novoParaMim(aberto, eu) && <PedidoDeCiencia onConfirmar={() => confirmarLeitura(aberto)} />}
                  {aberto.isImportant && souDestinatario(aberto, eu) && !novoParaMim(aberto, eu) && <JaConfirmou />}
                  <div className="border-t pt-4"><Leitura aviso={aberto} pessoas={pessoas} /></div>
                  {possoMexer(aberto, eu) && (
                    <div className="flex gap-2 border-t pt-4">
                      <Button variant="outline" size="sm" onClick={() => setEditando(true)}>
                        <Pencil className="mr-2 h-4 w-4" />
                        Editar
                      </Button>
                      <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive" onClick={() => setExcluindo(aberto)}>
                        <Trash2 className="mr-2 h-4 w-4" />
                        Excluir
                      </Button>
                    </div>
                  )}
                </>
              )}
            </div>
          )}
        </SheetContent>
      </Sheet>

      {/* Gaveta: novo aviso */}
      <Sheet open={escrevendo} onOpenChange={setEscrevendo}>
        <SheetContent className="w-full overflow-y-auto sm:max-w-lg">
          <SheetHeader className="mb-4 text-left"><SheetTitle>Novo aviso</SheetTitle></SheetHeader>
          {escrevendo && (
            <FormularioDeAviso pessoas={pessoas} autorId={eu.uid} salvando={salvando} onCancelar={() => setEscrevendo(false)} onEnviar={enviar} />
          )}
        </SheetContent>
      </Sheet>

      <ConfirmarExclusao
        aviso={excluindo}
        onFechar={() => setExcluindo(null)}
        onConfirmar={() => { if (excluindo) excluir(excluindo); setExcluindo(null) }}
      />
    </div>
  )
}
