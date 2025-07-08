import { db } from '@/lib/firebaseConfig';
import { collection, doc, getDocs, query, updateDoc, where, deleteDoc } from 'firebase/firestore';

// Função para buscar todos os usuários com status 'pendente'
export const getPendingUsers = async () => {
  const usersRef = collection(db, 'users');
  const q = query(usersRef, where('profile.status', '==', 'pendente'));
  
  const querySnapshot = await getDocs(q);
  const pendingUsers = querySnapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  }));

  return pendingUsers;
};

// Função para aprovar um usuário
export const approveUser = async (userId: string) => {
  const userDocRef = doc(db, 'users', userId);
  await updateDoc(userDocRef, {
    'profile.status': 'aprovado'
  });
};

// Função para rejeitar (e excluir) um usuário
// ATENÇÃO: A exclusão do usuário no Firebase Auth é uma operação sensível
// e idealmente deveria ser feita por uma Cloud Function.
// Por enquanto, vamos apenas deletar o perfil do Firestore.
export const rejectUser = async (userId: string) => {
  const userDocRef = doc(db, 'users', userId);
  await deleteDoc(userDocRef);
  // Futuramente, adicionar chamada a uma Cloud Function para deletar do Auth:
  // const deleteUserFunction = httpsCallable(functions, 'deleteUser');
  // await deleteUserFunction({ uid: userId });
};