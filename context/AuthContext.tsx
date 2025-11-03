// context/AuthContext.tsx
'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '@/lib/firebaseConfig';
import { getCommunications } from '@/services/communicationService'; // Importando o serviço

export interface FirestoreUser {
  id: string;
  uid: string;
  displayName: string;
  email: string;
  profile: {
    role: 'familiar' | 'profissional' | 'funcionario' | 'admin' | 'coordenador';
    status: 'pendente' | 'aprovado' | 'rejeitado';
    [key: string]: any;
  };
  [key: string]: any;
}

interface AuthContextType {
  user: User | null;
  firestoreUser: FirestoreUser | null;
  loading: boolean;
  unreadCount: number; // <-- NOVO: Estado para contagem
  fetchUnreadCount: () => void; // <-- NOVO: Função para atualizar a contagem
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  firestoreUser: null,
  loading: true,
  unreadCount: 0, // <-- NOVO: Valor inicial
  fetchUnreadCount: () => {}, // <-- NOVO: Função vazia
});

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [firestoreUser, setFirestoreUser] = useState<FirestoreUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0); // <-- NOVO: Estado

  // --- NOVA FUNÇÃO PARA BUSCAR NÃO LIDOS ---
  const fetchUnreadCount = async () => {
    if (auth.currentUser && firestoreUser) {
      const comms = await getCommunications(firestoreUser.profile.role);
      const count = comms.filter(comm => !Object.keys(comm.readBy).includes(auth.currentUser!.uid)).length;
      setUnreadCount(count);
    } else {
      setUnreadCount(0);
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (userAuth) => {
      if (userAuth) {
        setUser(userAuth);
        const userDocRef = doc(db, 'users', userAuth.uid);
        const userDoc = await getDoc(userDocRef);
        
        let fsUser: FirestoreUser | null = null;
        if (userDoc.exists()) {
          const data = userDoc.data();
          fsUser = {
            id: userDoc.id,
            uid: data.uid,
            displayName: data.displayName,
            email: data.email,
            profile: data.profile,
          };
          setFirestoreUser(fsUser);

          // Após ter o perfil, busca os comunicados
          const comms = await getCommunications(fsUser.profile.role);
          const count = comms.filter(comm => !Object.keys(comm.readBy).includes(userAuth.uid)).length;
          setUnreadCount(count);
          
        } else {
          setFirestoreUser(null);
          setUnreadCount(0);
        }
      } else {
        setUser(null);
        setFirestoreUser(null);
        setUnreadCount(0);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const value = { user, firestoreUser, loading, unreadCount, fetchUnreadCount };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  return useContext(AuthContext);
};