"use client";

import { useState, useEffect, useMemo } from "react";
import {
  getAllApprovedUsers,
  updateUserRole,
  deleteActiveUser,
  UserForApproval,
} from "@/services/adminService";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Loader2, ShieldAlert, Users as UsersIcon, UserCog, Mail, Phone, ShieldCheck, User as UserDefaultIcon, Trash2, AlertTriangle } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const ROLE_OPTIONS = [
  { value: "familiar", label: "Familiar" },
  { value: "profissional", label: "Profissional" },
  { value: "funcionario", label: "Funcionário" },
  { value: "coordenador", label: "Coordenador" },
  { value: "admin", label: "Admin" },
];

const RoleBadge = ({ role }: { role: string }) => {
  const getBadgeVariant = (roleName: string) => {
    switch (roleName) {
      case 'admin': return 'destructive';
      case 'coordenador': return 'default';
      case 'profissional': return 'secondary';
      case 'funcionario': return 'outline';
      default: return 'outline';
    }
  };

  return (
    <Badge variant={getBadgeVariant(role)} className="capitalize font-medium shadow-sm">
      {role === 'admin' && <ShieldAlert className="w-3 h-3 mr-1" />}
      {role === 'coordenador' && <ShieldCheck className="w-3 h-3 mr-1" />}
      {role}
    </Badge>
  );
};

export default function GerenciarUsuariosPage() {
  const [users, setUsers] = useState<UserForApproval[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [userToDelete, setUserToDelete] = useState<UserForApproval | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    setLoading(true);
    const data = await getAllApprovedUsers();
    setUsers(data);
    setLoading(false);
  };

  const handleRoleChange = async (userId: string, newRole: string) => {
    setUpdatingId(userId);
    const result = await updateUserRole(userId, newRole);

    if (result.success) {
      toast({
        title: "Permissão atualizada",
        description: "O nível de acesso do usuário foi alterado com sucesso.",
      });
      setUsers((prevUsers) =>
        prevUsers.map((user) =>
          user.id === userId
            ? { ...user, profile: { ...user.profile, role: newRole as any } }
            : user
        )
      );
    } else {
      toast({
        title: "Falha na atualização",
        description: result.error || "Não foi possível atualizar a permissão no momento.",
        variant: "destructive",
      });
    }
    setUpdatingId(null);
  };

  const handleDeleteUser = async (userId: string) => {
    setDeletingId(userId);
    const result = await deleteActiveUser(userId);

    if (result.success) {
      toast({
        title: "Usuário Excluído",
        description: "O usuário foi removido do sistema com sucesso.",
      });
      // Remove the user from the local state
      setUsers((prevUsers) => prevUsers.filter((user) => user.id !== userId));
    } else {
      toast({
        title: "Falha na exclusão",
        description: result.error || "Não foi possível excluir o usuário no momento.",
        variant: "destructive",
      });
    }
    setDeletingId(null);
    setUserToDelete(null);
  };

  const usersByRole = useMemo(() => {
    return {
      todos: users,
      admin: users.filter((u) => (u.profile.role as string) === "admin"),
      coordenador: users.filter((u) => (u.profile.role as string) === "coordenador"),
      profissional: users.filter((u) => (u.profile.role as string) === "profissional"),
      funcionario: users.filter((u) => (u.profile.role as string) === "funcionario"),
      familiar: users.filter((u) => (u.profile.role as string) === "familiar"),
    };
  }, [users]);

  const renderUserTable = (userList: UserForApproval[]) => {
    if (userList.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center py-16 text-muted-foreground bg-gray-50/50 rounded-xl border border-dashed border-gray-200">
          <UserCog className="w-12 h-12 mb-4 text-gray-300" />
          <p className="text-lg font-medium text-gray-600">Nenhum usuário encontrado</p>
          <p className="text-sm">Não há usuários registrados nesta categoria no momento.</p>
        </div>
      );
    }

    return (
      <div className="rounded-xl border bg-white shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-gray-50/80 text-gray-600 font-medium border-b">
              <tr>
                <th className="px-6 py-4">Usuário</th>
                <th className="px-6 py-4">Contato</th>
                <th className="px-6 py-4">Status / Role</th>
                <th className="px-6 py-4 text-right">Ação</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {userList.map((user) => (
                <tr
                  key={user.id}
                  className="hover:bg-gray-50/50 transition-colors group"
                >
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 shrink-0 rounded-full bg-blue-50 flex items-center justify-center text-brand-blue border border-blue-100">
                        <UserDefaultIcon className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="font-semibold text-gray-900 group-hover:text-brand-blue transition-colors">
                          {user.displayName}
                        </div>
                        <div className="text-gray-500 text-xs mt-0.5 flex items-center gap-1">
                           <Mail className="w-3 h-3" /> {user.email}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="space-y-1">
                      <div className="text-gray-900 font-medium text-sm flex items-center gap-1.5">
                        <Phone className="w-3.5 h-3.5 text-gray-400" />
                        {user.phone || "Não informado"}
                      </div>
                      {user.cpf && (
                        <div className="text-gray-500 text-xs ml-5">
                          CPF: {user.cpf}
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <RoleBadge role={user.profile.role} />
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-3">
                      {updatingId === user.id && (
                        <Loader2 className="h-4 w-4 animate-spin text-brand-blue" />
                      )}
                      <Select
                        disabled={updatingId === user.id || deletingId === user.id}
                        value={user.profile.role}
                        onValueChange={(value) => handleRoleChange(user.id, value)}
                      >
                        <SelectTrigger className="w-[150px] bg-white transition-all hover:bg-gray-50 focus:ring-brand-blue">
                          <SelectValue placeholder="Selecione" />
                        </SelectTrigger>
                        <SelectContent className="bg-white">
                          {ROLE_OPTIONS.map((option) => (
                            <SelectItem key={option.value} value={option.value} className="cursor-pointer">
                              {option.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      
                      <Button 
                        variant="outline" 
                        size="icon" 
                        className="bg-white text-gray-400 hover:text-red-500 hover:bg-red-50 hover:border-red-200 transition-colors"
                        disabled={deletingId === user.id}
                        onClick={() => setUserToDelete(user)}
                      >
                        {deletingId === user.id ? (
                           <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                           <Trash2 className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  return (
    <div className="max-w-[1400px] w-full mx-auto space-y-8 animate-in fade-in zoom-in-95 duration-300">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <div className="inline-flex items-center justify-center p-2 mb-4 bg-blue-50 rounded-xl text-brand-blue ring-1 ring-inset ring-blue-100">
            <UserCog className="w-6 h-6" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900">
            Controle de Acessos
          </h1>
          <p className="text-muted-foreground mt-2 max-w-2xl">
            Gerencie as permissões e níveis de acesso de todos os usuários cadastrados na plataforma.
          </p>
        </div>
        
        <Button 
          onClick={fetchUsers} 
          variant="outline" 
          disabled={loading}
          className="shadow-sm bg-white hover:bg-gray-50 border-gray-200"
        >
          {loading ? (
             <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Atualizando...</>
          ) : (
             <><UsersIcon className="mr-2 h-4 w-4" /> Recarregar Tabela</>
          )}
        </Button>
      </div>

      <Card className="border-0 shadow-lg shadow-gray-200/50 bg-white/40 backdrop-blur-xl">
        <CardHeader className="pb-4 border-b border-gray-100 bg-white/60 rounded-t-xl">
          <CardTitle className="text-xl flex items-center gap-2">
            <UsersIcon className="w-5 h-5 text-gray-500" />
            Diretório de Usuários Ativos
          </CardTitle>
          <CardDescription>
            Selecione uma categoria abaixo para filtrar a listagem.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-6 bg-white/80 rounded-b-xl">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20">
              <Loader2 className="h-8 w-8 animate-spin text-brand-blue mb-4" />
              <p className="text-gray-500 font-medium">Carregando usuários do sistema...</p>
            </div>
          ) : (
            <Tabs defaultValue="todos" className="w-full">
              <TabsList className="mb-8 w-full justify-start h-auto p-1 bg-gray-100/80 rounded-full flex-wrap gap-1">
                <TabsTrigger value="todos" className="rounded-full px-6 data-[state=active]:shadow-sm">Todos</TabsTrigger>
                <TabsTrigger value="admin" className="rounded-full px-6 data-[state=active]:shadow-sm">Admins</TabsTrigger>
                <TabsTrigger value="coordenador" className="rounded-full px-6 data-[state=active]:shadow-sm">Coordenadores</TabsTrigger>
                <TabsTrigger value="profissional" className="rounded-full px-6 data-[state=active]:shadow-sm">Profissionais</TabsTrigger>
                <TabsTrigger value="funcionario" className="rounded-full px-6 data-[state=active]:shadow-sm">Funcionários</TabsTrigger>
                <TabsTrigger value="familiar" className="rounded-full px-6 data-[state=active]:shadow-sm">Familiares</TabsTrigger>
              </TabsList>

              <div className="mt-4">
                <TabsContent value="todos" className="mt-0 focus-visible:outline-none">
                  {renderUserTable(usersByRole.todos)}
                </TabsContent>
                <TabsContent value="admin" className="mt-0 focus-visible:outline-none">
                  {renderUserTable(usersByRole.admin)}
                </TabsContent>
                <TabsContent value="coordenador" className="mt-0 focus-visible:outline-none">
                  {renderUserTable(usersByRole.coordenador)}
                </TabsContent>
                <TabsContent value="profissional" className="mt-0 focus-visible:outline-none">
                  {renderUserTable(usersByRole.profissional)}
                </TabsContent>
                <TabsContent value="funcionario" className="mt-0 focus-visible:outline-none">
                  {renderUserTable(usersByRole.funcionario)}
                </TabsContent>
                <TabsContent value="familiar" className="mt-0 focus-visible:outline-none">
                  {renderUserTable(usersByRole.familiar)}
                </TabsContent>
              </div>
            </Tabs>
          )}
        </CardContent>
      </Card>

      {/* Singleton AlertDialog for User Deletion */}
      <AlertDialog open={!!userToDelete} onOpenChange={(open) => !open && setUserToDelete(null)}>
        <AlertDialogContent className="shadow-[0_0_80px_rgba(239,68,68,0.15)] border-red-100">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-red-600">
              <AlertTriangle className="w-5 h-5" />
              Excluir Usuário do Sistema
            </AlertDialogTitle>
            <AlertDialogDescription className="text-gray-600 pt-2">
              Tem certeza que deseja remover permanentemente o acesso de <strong className="text-gray-900">{userToDelete?.displayName}</strong>?
              Caso esse usuário precise entrar novamente no futuro, um novo cadastro será necessário. Essa ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="mt-6">
            <AlertDialogCancel className="bg-white" onClick={() => setUserToDelete(null)}>Cancelar</AlertDialogCancel>
            <AlertDialogAction 
              onClick={() => userToDelete && handleDeleteUser(userToDelete.id)}
              className="bg-red-600 hover:bg-red-700 text-white shadow-md shadow-red-600/20"
            >
              Sim, excluir acesso
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
