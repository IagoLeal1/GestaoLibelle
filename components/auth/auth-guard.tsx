'use client';

import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const { user, firestoreUser, loading } = useAuth();
  const router = useRouter();

  // --- O ESPIÃO FINAL E DEFINITIVO ---
  console.log("%c--- Checagem do AuthGuard ---", "color: blue; font-weight: bold;");
  console.log("Estado de Loading:", loading);
  console.log("Usuário do Auth Existe?", !!user);
  console.log("Perfil do Firestore Existe?", !!firestoreUser);
  if (firestoreUser) {
    console.log("Status do Perfil:", firestoreUser.profile?.status);
    console.log("Condição Final (deve ser true):", (!!user && firestoreUser?.profile?.status === 'aprovado'));
  }
  console.log("----------------------------");
  // --- FIM DO ESPIÃO ---

  useEffect(() => {
    // Apenas redireciona quando o carregamento inicial terminar
    if (!loading) {
      // Se não tem usuário ou o perfil não foi aprovado, volta pro login
      if (!user || !firestoreUser || firestoreUser.profile.status !== 'aprovado') {
        
        // Exceção: se o status for pendente, vai para a página de espera
        if (firestoreUser?.profile?.status === 'pendente') {
          router.push('/aguardando-aprovacao');
        } else {
          router.push('/login');
        }
      }
    }
  }, [user, firestoreUser, loading, router]);


  // Se a verificação inicial ainda não terminou, ou se o usuário não está logado, 
  // ou se não tem perfil, ou se o perfil não está aprovado, MOSTRA O LOADER.
  // Isso previne que o conteúdo seja renderizado antes da hora.
  if (loading || !user || !firestoreUser || firestoreUser.profile.status !== 'aprovado') {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <p>Verificando acesso...</p>
      </div>
    );
  }

  // Se passou por TODAS as verificações acima, o usuário está 100% autorizado.
  // Então, renderizamos a aplicação.
  return <>{children}</>;
}