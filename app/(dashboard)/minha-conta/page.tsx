'use client';

import { useState } from 'react';
import { useAuth } from "@/context/AuthContext";
import { updateProfile, updatePassword } from "firebase/auth";
import { doc, updateDoc } from "firebase/firestore";
import { auth, db } from '@/lib/firebaseConfig';
import { toast } from "@/components/ui/use-toast";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
// Adicionei Check e X para os ícones de feedback
import { Loader2, Mail, Shield, UserCog, Lock, Check, X } from "lucide-react";
import { cn } from "@/lib/utils"; // Importante para juntar classes condicionalmente

// Tipo para o estado do botão
type ButtonStatus = 'idle' | 'loading' | 'success' | 'error';

export default function MinhaContaPage() {
  const { user, firestoreUser } = useAuth();
  const [activeTab, setActiveTab] = useState("geral");

  // Estados dos Formulários
  const [name, setName] = useState(firestoreUser?.displayName || user?.displayName || '');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Estados Visuais dos Botões (Separados para cada aba)
  const [statusName, setStatusName] = useState<ButtonStatus>('idle');
  const [statusPass, setStatusPass] = useState<ButtonStatus>('idle');

  const getInitials = (name: string) => {
    return name
      ?.match(/(\b\S)?/g)
      ?.join("")
      ?.match(/(^\S|\S$)?/g)
      ?.join("")
      .toUpperCase() || "U";
  };

  // --- LÓGICA DE FEEDBACK ---
  const handleFeedback = (
    setStatus: (s: ButtonStatus) => void, 
    type: 'success' | 'error'
  ) => {
    setStatus(type);
    // Volta ao normal depois de 3 segundos
    setTimeout(() => setStatus('idle'), 3000);
  };

  const handleUpdateName = async () => {
    if (!user || !name.trim()) return;
    
    setStatusName('loading');
    try {
      await updateProfile(user, { displayName: name });
      await updateDoc(doc(db, 'users', user.uid), { displayName: name });
      
      toast({ title: "Perfil atualizado", description: "Seu nome foi alterado com sucesso.", className: "bg-green-500 text-white border-none" });
      handleFeedback(setStatusName, 'success');
      
    } catch (error) {
      console.error(error);
      toast({ title: "Erro", description: "Não foi possível atualizar o perfil.", variant: "destructive" });
      handleFeedback(setStatusName, 'error');
    }
  };

  const handleChangePassword = async () => {
    if (!user) return;
    
    // Validações rápidas
    if (newPassword.length < 6) {
        toast({ title: "Senha curta", description: "Mínimo de 6 caracteres.", variant: "destructive" });
        return;
    }
    if (newPassword !== confirmPassword) {
        toast({ title: "Erro", description: "As senhas não coincidem.", variant: "destructive" });
        return;
    }

    setStatusPass('loading');
    try {
      await updatePassword(user, newPassword);
      
      toast({ title: "Sucesso", description: "Senha alterada.", className: "bg-green-500 text-white border-none" });
      setNewPassword('');
      setConfirmPassword('');
      handleFeedback(setStatusPass, 'success');

    } catch (error: any) {
      console.error(error);
      if (error.code === 'auth/requires-recent-login') {
        toast({ title: "Login necessário", description: "Saia e entre novamente para mudar a senha.", variant: "destructive" });
      } else {
        toast({ title: "Erro", description: "Falha ao mudar senha.", variant: "destructive" });
      }
      handleFeedback(setStatusPass, 'error');
    }
  };

  // --- COMPONENTE DE BOTÃO ANIMADO (Reutilizável na página) ---
  const AnimatedButton = ({ 
    status, 
    onClick, 
    defaultText = "Salvar" 
  }: { 
    status: ButtonStatus, 
    onClick: () => void, 
    defaultText?: string 
  }) => {
    return (
      <Button 
        onClick={onClick} 
        disabled={status === 'loading' || status === 'success'}
        className={cn(
          "transition-all duration-500 min-w-[140px] relative overflow-hidden",
          status === 'success' && "bg-green-600 hover:bg-green-700 text-white border-green-600 ring-2 ring-green-600 ring-offset-2",
          status === 'error' && "bg-red-600 hover:bg-red-700 text-white border-red-600 animate-shake", // animate-shake precisa estar no tailwind ou ser simulado
          status === 'idle' && "bg-primary hover:bg-primary/90"
        )}
      >
        <div className="flex items-center justify-center gap-2">
            {/* Ícone Loading */}
            {status === 'loading' && (
                <Loader2 className="h-4 w-4 animate-spin" />
            )}
            
            {/* Ícone Sucesso (Com animação de escala) */}
            {status === 'success' && (
                <Check className="h-4 w-4 animate-in zoom-in duration-300" />
            )}

            {/* Ícone Erro */}
            {status === 'error' && (
                <X className="h-4 w-4 animate-in zoom-in duration-300" />
            )}

            {/* Texto Condicional */}
            <span className={cn(
                "transition-opacity duration-300",
                status === 'loading' ? "opacity-100" : "opacity-100"
            )}>
                {status === 'idle' && defaultText}
                {status === 'loading' && "Salvando..."}
                {status === 'success' && "Salvo!"}
                {status === 'error' && "Erro"}
            </span>
        </div>
      </Button>
    );
  };

  return (
    <div className="container max-w-5xl py-8 space-y-8">
      
      {/* Cabeçalho */}
      <div>
        <h2 className="text-3xl font-bold tracking-tight text-gray-800 dark:text-gray-100">Minha Conta</h2>
        <p className="text-muted-foreground">
          Gerencie seus dados pessoais e preferências de acesso.
        </p>
      </div>

      <Separator />

      <div className="flex flex-col md:flex-row gap-8">
        
        {/* Menu Lateral */}
        <aside className="md:w-64 flex-shrink-0">
          <Tabs 
            orientation="vertical" 
            value={activeTab} 
            onValueChange={setActiveTab} 
            className="w-full"
          >
            <TabsList className="flex flex-col h-auto bg-transparent p-0 space-y-1 w-full">
              <TabsTrigger 
                value="geral" 
                className="w-full justify-start px-3 py-2 text-sm font-medium transition-all rounded-md data-[state=active]:bg-secondary data-[state=active]:text-foreground hover:bg-muted/50"
              >
                <UserCog className="mr-2 h-4 w-4" />
                Perfil
              </TabsTrigger>
              <TabsTrigger 
                value="seguranca" 
                className="w-full justify-start px-3 py-2 text-sm font-medium transition-all rounded-md data-[state=active]:bg-secondary data-[state=active]:text-foreground hover:bg-muted/50"
              >
                <Shield className="mr-2 h-4 w-4" />
                Segurança
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </aside>

        {/* Conteúdo */}
        <div className="flex-1 space-y-6">
            
            {/* ABA: PERFIL */}
            {activeTab === "geral" && (
              <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                
                {/* Visualização do Usuário */}
                <div className="flex items-center gap-6 p-6 border rounded-xl bg-card text-card-foreground shadow-sm">
                    <Avatar className="h-20 w-20 border-2 border-muted">
                        <AvatarImage src={user?.photoURL || ""} />
                        <AvatarFallback className="text-xl bg-primary/10 text-primary font-bold">
                            {getInitials(name)}
                        </AvatarFallback>
                    </Avatar>
                    <div className="space-y-1">
                        <h3 className="text-xl font-semibold tracking-tight">{name || 'Usuário'}</h3>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Mail className="h-3 w-3" />
                            <span>{user?.email}</span>
                        </div>
                        <div className="pt-2">
                            <Badge variant="outline" className="capitalize px-3">
                                {firestoreUser?.profile?.role || 'Usuário'}
                            </Badge>
                        </div>
                    </div>
                </div>

                {/* Formulário */}
                <Card>
                    <CardHeader>
                        <CardTitle className="text-lg">Dados Básicos</CardTitle>
                        <CardDescription>Informações visíveis no sistema.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid gap-2">
                            <Label htmlFor="displayName">Nome Completo</Label>
                            <Input 
                                id="displayName" 
                                value={name} 
                                onChange={(e) => setName(e.target.value)} 
                                className="max-w-md transition-all focus:ring-2 focus:ring-primary/20"
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="emailDisplay">E-mail de Acesso</Label>
                            <div className="relative max-w-md">
                                <Input id="emailDisplay" value={user?.email || ''} disabled className="pl-9 bg-muted/50 text-muted-foreground" />
                                <Lock className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground/50" />
                            </div>
                            <p className="text-[0.8rem] text-muted-foreground">
                                O e-mail não pode ser alterado.
                            </p>
                        </div>
                    </CardContent>
                    <CardFooter className="border-t bg-muted/10 px-6 py-4">
                        <AnimatedButton 
                            status={statusName} 
                            onClick={handleUpdateName} 
                            defaultText="Salvar Alterações"
                        />
                    </CardFooter>
                </Card>
              </div>
            )}

            {/* ABA: SEGURANÇA */}
            {activeTab === "seguranca" && (
              <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <Card>
                    <CardHeader>
                        <CardTitle className="text-lg">Alterar Senha</CardTitle>
                        <CardDescription>Mantenha sua conta protegida.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-4 max-w-md">
                            <div className="space-y-2">
                                <Label htmlFor="newPassword">Nova Senha</Label>
                                <Input 
                                    id="newPassword" 
                                    type="password" 
                                    value={newPassword}
                                    onChange={(e) => setNewPassword(e.target.value)}
                                    placeholder="••••••••"
                                    className="transition-all focus:ring-2 focus:ring-primary/20"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="confirmPassword">Confirmar Nova Senha</Label>
                                <Input 
                                    id="confirmPassword" 
                                    type="password" 
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    placeholder="••••••••"
                                    className="transition-all focus:ring-2 focus:ring-primary/20"
                                />
                            </div>
                        </div>
                    </CardContent>
                    <CardFooter className="border-t bg-muted/10 px-6 py-4 flex justify-between items-center">
                         <p className="text-xs text-muted-foreground hidden sm:block">Mínimo de 6 caracteres.</p>
                         <AnimatedButton 
                            status={statusPass} 
                            onClick={handleChangePassword} 
                            defaultText="Atualizar Senha"
                        />
                    </CardFooter>
                </Card>
              </div>
            )}
        </div>
      </div>
    </div>
  );
}