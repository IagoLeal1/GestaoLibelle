'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '@/lib/firebaseConfig';

export interface FirestoreUser {
  id: string;
  uid: string;
  displayName: string;
  email: string;
  profile: {
    role: 'familiar' | 'profissional' | 'funcionario' | 'admin';
    status: 'pendente' | 'aprovado' | 'rejeitado';
    [key: string]: any;
  };
  [key: string]: any;
}

interface AuthContextType {
  user: User | null;
  firestoreUser: FirestoreUser | null;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  firestoreUser: null,
  loading: true,
});

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [firestoreUser, setFirestoreUser] = useState<FirestoreUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (userAuth) => {
      console.log("AUTH_CONTEXT: onAuthStateChanged disparado. Usuário Auth:", userAuth?.email);

      if (userAuth) {
        setUser(userAuth);
        const userDocRef = doc(db, 'users', userAuth.uid);
        const userDoc = await getDoc(userDocRef);
        
        if (userDoc.exists()) {
          const data = userDoc.data();
          
          // >>>>> O ESPIÃO ESTÁ AQUI <<<<<
          console.log("AUTH_CONTEXT: Documento encontrado no Firestore. Dados:", data);
          
          const userProfileData: FirestoreUser = {
            id: userDoc.id,
            uid: data.uid,
            displayName: data.displayName,
            email: data.email,
            profile: data.profile,
          };
          
          setFirestoreUser(userProfileData);
        } else {
          console.warn(`AUTH_CONTEXT: Perfil não encontrado no Firestore para o UID: ${userAuth.uid}`);
          setFirestoreUser(null);
        }
      } else {
        setUser(null);
        setFirestoreUser(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const value = { user, firestoreUser, loading };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  return useContext(AuthContext);
};