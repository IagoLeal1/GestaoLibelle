"use client"

import { useState, useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Check, X, Search, UserPlus, Mail, Phone } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
    getPendingUsers, 
    getProcessedUsers, 
    approveUserAndCreateProfile, 
    rejectUser,
    UserForApproval
} from "@/services/adminService";

// --- Funções de Ajuda (Helpers) ---
const getStatusBadge = (status: string) => {
  const statusConfig: { [key: string]: { label: string; className: string } } = {
    pendente: { label: "Pendente", className: "bg-yellow-100 text-yellow-800" },
    aprovado: { label: "Aprovado", className: "bg-green-100 text-green-800" },
    rejeitado: { label: "Rejeitado", className: "bg-red-100 text-red-800" },
  };
  const config = statusConfig[status] || { label: 'Desconhecido', className: 'bg-gray-100 text-gray-800' };
  return <Badge variant="outline" className={config.className}>{config.label}</Badge>
};

const getTipoBadge = (tipo: string) => {
  const tipoConfig: { [key: string]: { label: string; className: string } } = {
    familiar: { label: "Familiar", className: "bg-blue-100 text-blue-800" },
    profissional: { label: "Profissional", className: "bg-purple-100 text-purple-800" },
    funcionario: { label: "Funcionário", className: "bg-indigo-100 text-indigo-800" },
  };
  const config = tipoConfig[tipo] || { label: 'Desconhecido', className: 'bg-gray-100 text-gray-800' };
  return <Badge variant="outline" className={config.className}>{config.label}</Badge>
};


export function UserApprovalClientPage() {
    const [pendingUsers, setPendingUsers] = useState<UserForApproval[]>([]);
    const [processedUsers, setProcessedUsers] = useState<UserForApproval[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

    const fetchData = async () => {
        const [pending, processed] = await Promise.all([getPendingUsers(), getProcessedUsers()]);
        setPendingUsers(pending);
        setProcessedUsers(processed.sort((a,b) => b.profile.createdAt.seconds - a.profile.createdAt.seconds)); // Ordena por mais recente
    };

    useEffect(() => {
        setLoading(true);
        fetchData().finally(() => setLoading(false));
    }, []);

    const showNotification = (type: 'success' | 'error', message: string) => {
        setNotification({ type, message });
        setTimeout(() => setNotification(null), 4000);
    };

    const handleAprovar = async (user: UserForApproval) => {
        const result = await approveUserAndCreateProfile(user);
        if (result.success) {
            showNotification("success", `Acesso aprovado para ${user.displayName}`);
            fetchData(); // Re-busca os dados para atualizar as duas listas
        } else {
            showNotification("error", result.error || "Falha ao aprovar.");
        }
    };

    const handleRejeitar = async (user: UserForApproval) => {
        if(window.confirm(`Tem certeza que deseja rejeitar o acesso de ${user.displayName}?`)){
            await rejectUser(user.id);
            showNotification("success", `Acesso de ${user.displayName} foi rejeitado.`);
            fetchData();
        }
    };

    const filteredPendingUsers = useMemo(() =>
        pendingUsers.filter(s =>
            s.displayName.toLowerCase().includes(searchTerm.toLowerCase()) ||
            s.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (s.cpf && s.cpf.includes(searchTerm))
    ), [pendingUsers, searchTerm]);

    const filteredProcessedUsers = useMemo(() =>
        processedUsers.filter(s =>
            s.displayName.toLowerCase().includes(searchTerm.toLowerCase()) ||
            s.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (s.cpf && s.cpf.includes(searchTerm))
    ), [processedUsers, searchTerm]);
    
    if(loading) return <p className="text-center p-8">Carregando solicitações...</p>
    
    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <h2 className="text-2xl font-bold tracking-tight text-primary-dark-blue">Aprovação de Acesso</h2>
                <p className="text-muted-foreground">Gerencie solicitações de acesso de novos usuários</p>
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <UserPlus className="h-4 w-4" />
                <span>{pendingUsers.length} solicitações pendentes</span>
              </div>
            </div>

            {notification && (
              <Alert className={notification.type === "success" ? "border-green-300 bg-green-50 text-green-800" : "border-red-300 bg-red-50 text-red-800"}>
                <AlertDescription>{notification.message}</AlertDescription>
              </Alert>
            )}

            <Card>
              <CardContent className="p-4">
                <div className="relative flex-1">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input placeholder="Buscar por nome, email ou CPF..." className="pl-8" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle className="flex items-center gap-2"><UserPlus className="h-5 w-5" /> Solicitações Pendentes ({filteredPendingUsers.length})</CardTitle></CardHeader>
              <CardContent>
                {filteredPendingUsers.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">Nenhuma solicitação pendente</p>
                ) : (
                  <div className="space-y-4">
                    {filteredPendingUsers.map((solicitacao) => (
                      <div key={solicitacao.id} className="border rounded-lg p-4">
                        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                          <div className="flex-1 space-y-2">
                            <div className="flex items-center gap-2"><h3 className="font-semibold">{solicitacao.displayName}</h3>{getTipoBadge(solicitacao.profile.role)}</div>
                            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
                                <div className="flex items-center gap-1"><Mail className="h-3 w-3" />{solicitacao.email}</div>
                                {solicitacao.phone && <div className="flex items-center gap-1"><Phone className="h-3 w-3" />{solicitacao.phone}</div>}
                                {solicitacao.cpf && <span>CPF: {solicitacao.cpf}</span>}
                            </div>
                          </div>
                          <div className="flex gap-2 self-start lg:self-center">
                            <Button size="sm" variant="destructive" onClick={() => handleRejeitar(solicitacao)}><X className="h-4 w-4 mr-1" />Rejeitar</Button>
                            <Button size="sm" onClick={() => handleAprovar(solicitacao)} className="bg-green-600 hover:bg-green-700"><Check className="h-4 w-4 mr-1" />Aprovar</Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle>Histórico de Solicitações ({filteredProcessedUsers.length})</CardTitle></CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {filteredProcessedUsers.map((solicitacao) => (
                    <div key={solicitacao.id} className="border rounded-lg p-4 bg-gray-50/50">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div className="flex-1">
                          <h3 className="font-medium">{solicitacao.displayName}</h3>
                          <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                            <span>{solicitacao.email}</span>
                            {solicitacao.cpf && <><span>•</span><span>CPF: {solicitacao.cpf}</span></>}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {getTipoBadge(solicitacao.profile.role)}
                          {getStatusBadge(solicitacao.profile.status)}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
        </div>
    );
}