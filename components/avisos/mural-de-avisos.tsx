"use client"
// Avisos de quem recebe (terapeutas e famílias): o mural, com cada aviso inteiro em uma coluna.
// Entrar no mural já conta como ler; o que era novo continua marcado durante a visita. Os
// importantes ainda não confirmados ficam em "Precisa da sua atenção", com o "Estou ciente".
import { useEffect, useMemo, useState } from "react"
import { Timestamp } from "firebase/firestore"
import { AlertTriangle } from "lucide-react"
import { toast } from "sonner"
import { Card } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import { cn } from "@/lib/utils"
import { useAuth } from "@/context/AuthContext"
import { novoParaMim, PapelDeUsuario } from "@/lib/avisos"
import { Communication, getCommunications, markCommunicationAsRead } from "@/services/communicationService"
import { CabecalhoDosAvisos, JaConfirmou, PedidoDeCiencia, quando, SeloImportante, SeloNovo } from "./comum"

function CartaoDoMural({ aviso, novo, destaque, confirmando, onCiente }: {
  aviso: Communication
  novo: boolean
  destaque: boolean
  confirmando: boolean
  onCiente: () => void
}) {
  return (
    <Card className={cn("space-y-3 p-4 sm:p-5", destaque && "border-amber-300 ring-1 ring-amber-200", novo && !destaque && "border-l-4 border-l-primary-teal")}>
      <div className="space-y-1">
        {(novo || aviso.isImportant) && (
          <div className="flex flex-wrap items-center gap-1.5">
            {novo && <SeloNovo />}
            {aviso.isImportant && <SeloImportante />}
          </div>
        )}
        <h3 className="text-lg font-semibold leading-snug">{aviso.title}</h3>
        <p className="text-sm text-muted-foreground">{aviso.authorName} · {quando(aviso.createdAt.toDate())}</p>
      </div>
      <p className="whitespace-pre-line leading-relaxed">{aviso.message}</p>
      {destaque && <PedidoDeCiencia onConfirmar={onCiente} confirmando={confirmando} />}
      {!destaque && aviso.isImportant && <JaConfirmou />}
    </Card>
  )
}

export function MuralDeAvisos() {
  const { firestoreUser, fetchUnreadCount } = useAuth()
  const eu = useMemo(
    () => (firestoreUser ? { uid: firestoreUser.uid, papel: firestoreUser.profile.role as PapelDeUsuario } : null),
    [firestoreUser]
  )
  const [avisos, setAvisos] = useState<Communication[] | null>(null)
  const [novosAoChegar, setNovosAoChegar] = useState<Set<string>>(new Set())
  const [soNovos, setSoNovos] = useState(false)
  const [confirmando, setConfirmando] = useState<string | null>(null)

  const marcarComoLidos = (ids: string[]) =>
    setAvisos((atual) => atual?.map((a) => (eu && ids.includes(a.id) ? { ...a, readBy: { ...a.readBy, [eu.uid]: Timestamp.now() } } : a)) ?? atual)

  useEffect(() => {
    if (!eu) return
    let ativo = true
    getCommunications(eu.papel).then(async (lista) => {
      if (!ativo) return
      const novos = lista.filter((a) => novoParaMim(a, eu))
      setNovosAoChegar(new Set(novos.map((a) => a.id)))
      setAvisos(lista)

      // Entrar no mural é ler: os avisos comuns contam como lidos; os importantes esperam o "Estou ciente"
      const comuns = novos.filter((a) => !a.isImportant)
      if (comuns.length === 0) return
      const resultados = await Promise.all(comuns.map((a) => markCommunicationAsRead(a.id, eu.uid)))
      if (!ativo) return
      marcarComoLidos(comuns.filter((_, i) => resultados[i].success).map((a) => a.id))
      fetchUnreadCount()
    })
    return () => { ativo = false }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [eu])

  const confirmarLeitura = async (aviso: Communication) => {
    if (!eu) return
    setConfirmando(aviso.id)
    const resultado = await markCommunicationAsRead(aviso.id, eu.uid)
    setConfirmando(null)
    if (!resultado.success) {
      toast.error(resultado.error ?? "Não foi possível confirmar a leitura.")
      return
    }
    marcarComoLidos([aviso.id])
    fetchUnreadCount()
  }

  if (!eu) return null

  const pendentes = (avisos ?? []).filter((a) => a.isImportant && novoParaMim(a, eu))
  const mural = (avisos ?? []).filter((a) => !pendentes.includes(a)).filter((a) => !soNovos || novosAoChegar.has(a.id))

  return (
    <div className="mx-auto max-w-2xl space-y-5">
      <CabecalhoDosAvisos papel={eu.papel} />

      {avisos === null ? (
        <p className="py-8 text-center text-muted-foreground">Carregando avisos...</p>
      ) : (
        <>
          {pendentes.length > 0 && (
            <section className="space-y-3">
              <h3 className="flex items-center gap-2 text-sm font-semibold text-amber-800">
                <AlertTriangle className="h-4 w-4" />
                Precisa da sua atenção
              </h3>
              {pendentes.map((a) => (
                <CartaoDoMural
                  key={a.id}
                  aviso={a}
                  novo={novosAoChegar.has(a.id)}
                  destaque
                  confirmando={confirmando === a.id}
                  onCiente={() => confirmarLeitura(a)}
                />
              ))}
            </section>
          )}

          <section className="space-y-3">
            <div className="flex items-center justify-between gap-3">
              <h3 className="text-sm font-semibold text-muted-foreground">Mais recentes</h3>
              <label className="flex items-center gap-2 text-sm text-muted-foreground">
                <Switch checked={soNovos} onCheckedChange={setSoNovos} />
                Só os novos
              </label>
            </div>
            {mural.map((a) => (
              <CartaoDoMural key={a.id} aviso={a} novo={novosAoChegar.has(a.id)} destaque={false} confirmando={false} onCiente={() => {}} />
            ))}
            {mural.length === 0 && (
              <p className="py-8 text-center text-sm text-muted-foreground">
                {soNovos ? "Nada novo por aqui." : "Nenhum aviso por enquanto."}
              </p>
            )}
          </section>
        </>
      )}
    </div>
  )
}
