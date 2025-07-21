"use client"

import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { getCommunications, Communication, countUsersByRole } from "@/services/communicationService";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MessageSquare } from "lucide-react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

// Função de ajuda para o badge de tipo
const getTypeBadge = (role: string) => {
    const isInternal = role === 'profissional' || role === 'funcionario';
    return (
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
            isInternal
            ? "bg-blue-100 text-blue-800"
            : "bg-green-100 text-green-800"
        }`}>
            {isInternal ? "Interno" : "Familiar"}
        </span>
    );
};

export function CommunicationsWidget() {
    const { firestoreUser } = useAuth();
    const [comms, setComms] = useState<Communication[]>([]);
    const [userCounts, setUserCounts] = useState({ profissional: 0, familiar: 0, funcionario: 0 });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (firestoreUser?.profile.role) {
            Promise.all([
                getCommunications(firestoreUser.profile.role),
                countUsersByRole('profissional'),
                countUsersByRole('familiar'),
                countUsersByRole('funcionario')
            ]).then(([commsData, profCount, famCount, funcCount]) => {
                setComms(commsData);
                setUserCounts({ profissional: profCount, familiar: famCount, funcionario: funcCount });
            }).finally(() => setLoading(false));
        }
    }, [firestoreUser]);
    
    if (loading) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle>Avisos Recentes</CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-sm text-muted-foreground">Carregando avisos...</p>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle>Avisos Recentes</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="space-y-4">
                    {comms.length === 0 ? (
                        <p className="text-sm text-muted-foreground">Nenhum aviso recente.</p>
                    ) : (
                        comms.slice(0, 3).map(aviso => {
                            const hasRead = Object.keys(aviso.readBy).includes(firestoreUser?.uid || '');
                            const readCount = Object.keys(aviso.readBy).length;
                            const total = aviso.targetRole === 'familiar' 
                                ? userCounts.familiar 
                                : userCounts.profissional + userCounts.funcionario;
                            
                            // Define a cor da borda se o aviso for importante e não lido
                            const borderColor = aviso.isImportant && !hasRead ? 'border-yellow-500' : 'border-transparent';

                            return (
                                <div key={aviso.id} className={`p-3 rounded-lg bg-gray-50 border-l-4 ${borderColor}`}>
                                    <div className="flex items-start justify-between">
                                        <div className="flex-1">
                                            <h4 className="text-sm font-medium text-gray-900 mb-1">{aviso.title}</h4>
                                            <p className="text-xs text-gray-600 mb-2 line-clamp-2">{aviso.message}</p>
                                            <div className="flex items-center gap-2 text-xs text-gray-500">
                                                <span>{aviso.authorName}</span>
                                                <span>•</span>
                                                <span>{format(aviso.createdAt.toDate(), "dd/MM/yyyy", { locale: ptBR })}</span>
                                            </div>
                                        </div>
                                        <div className="ml-3 flex flex-col items-end gap-1">
                                            {getTypeBadge(aviso.targetRole)}
                                            <span className="text-xs text-gray-500">
                                                {readCount}/{total} leram
                                            </span>
                                        </div>
                                    </div>
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
