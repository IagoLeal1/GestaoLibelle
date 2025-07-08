'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { doc, getDoc, DocumentData } from 'firebase/firestore';
import { auth, db } from '@/lib/firebaseConfig';

// Interface para os dados do nosso perfil de usuário no Firestore
export interface UserProfile {
  role: 'familiar' | 'profissional' | 'funcionario';
  status: 'pendente' | 'aprovado';
  position?: string; // ex: 'Recepção'
  // Adicione outros campos que você precise
}

interface AuthContextType {
  user: User | null; // O usuário do Firebase Auth
  userProfile: UserProfile | null; // Nosso perfil do Firestore
  loading: boolean; // Para sabermos quando a autenticação está carregando
}

// Criamos o contexto com um valor padrão
const AuthContext = createContext<AuthContextType>({
  user: null,
  userProfile: null,
  loading: true,
});

// Este é o componente "Provedor" que vai envolver nosso app
export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // onAuthStateChanged é um "ouvinte" do Firebase que nos diz se o usuário logou ou deslogou
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        // Se o usuário está logado, pegamos seu UID
        setUser(user);
        // E usamos o UID para buscar seu perfil no Firestore
        const userDocRef = doc(db, 'users', user.uid);
        const userDoc = await getDoc(userDocRef);
        if (userDoc.exists()) {
          // Se o perfil existe, salvamos no nosso estado
          setUserProfile(userDoc.data().profile as UserProfile);
        }
      } else {
        // Se o usuário deslogou, limpamos os estados
        setUser(null);
        setUserProfile(null);
      }
      setLoading(false); // Finaliza o carregamento
    });

    // Se o componente for desmontado, paramos de "ouvir" para evitar vazamento de memória
    return () => unsubscribe();
  }, []);

  const value = { user, userProfile, loading };

  return <AuthContext.Provider value={value}>{!loading && children}</AuthContext.Provider>;
};

// Este é o nosso "Hook" customizado para acessar os dados do contexto facilmente
export const useAuth = () => {
  return useContext(AuthContext);
};