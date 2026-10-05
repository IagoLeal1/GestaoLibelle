"use client"
// Os avisos mais recentes no painel inicial. Quem recebe vê primeiro os novos; a gestão vê os
// últimos enviados, com o público de cada um. Quem leu fica na tela de Avisos.
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { ehGestao } from "@/lib/permissoes";
import { novoParaMim, PapelDeUsuario } from "@/lib/avisos";
import { Communication, getCommunications } from "@/services/communicationService";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { quando, SeloImportante, SeloNovo, SeloPublico } from "@/components/avisos/comum";

export function CommunicationsWidget() {
    const { firestoreUser } = useAuth();
    const eu = useMemo(
        () => (firestoreUser ? { uid: firestoreUser.uid, papel: firestoreUser.profile.role as PapelDeUsuario } : null),
        [firestoreUser]
    );
    const [avisos, setAvisos] = useState<Communication[]>([]);
    const [loading, setLoading] = useState(true);
    const gestao = ehGestao(eu?.papel);

    useEffect(() => {
        if (!eu) return;
        getCommunications(eu.papel).then(setAvisos).finally(() => setLoading(false));
    }, [eu]);

    // Quem recebe: os novos primeiro (a lista já vem do mais novo para o mais antigo)
    const lista = !eu ? [] : gestao
        ? avisos.slice(0, 3)
        : [...avisos.filter((a) => novoParaMim(a, eu)), ...avisos.filter((a) => !novoParaMim(a, eu))].slice(0, 3);

    return (
        <Card>
            <CardHeader>
                <CardTitle>Avisos recentes</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="space-y-4">
                    {loading ? (
                        <p className="text-sm text-muted-foreground">Carregando avisos...</p>
                    ) : lista.length === 0 ? (
                        <p className="text-sm text-muted-foreground">Nenhum aviso recente.</p>
                    ) : (
                        lista.map((aviso) => {
                            const novo = !!eu && novoParaMim(aviso, eu);
                            return (
                                <div key={aviso.id} className={cn("rounded-lg border-l-4 bg-muted/40 p-3", novo ? "border-l-primary-teal" : "border-l-transparent")}>
                                    <div className="flex flex-wrap items-center gap-1.5">
                                        {novo && <SeloNovo />}
                                        {aviso.isImportant && <SeloImportante />}
                                        {gestao && <SeloPublico publico={aviso.targetRole} />}
                                    </div>
                                    <h4 className={cn("mt-1 text-sm", novo ? "font-semibold" : "font-medium")}>{aviso.title}</h4>
                                    <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{aviso.message}</p>
                                    <p className="mt-2 text-xs text-muted-foreground">{aviso.authorName} · {quando(aviso.createdAt.toDate())}</p>
                                </div>
                            );
                        })
                    )}
                    <Button asChild size="sm" className="w-full" variant="outline">
                        <Link href="/comunicacao">Ver todos os avisos</Link>
                    </Button>
                </div>
            </CardContent>
        </Card>
    );
}
