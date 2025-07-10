import { auth, db } from "@/lib/firebaseConfig";
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  AuthError 
} from "firebase/auth";
import { doc, setDoc, getDoc, Timestamp } from "firebase/firestore";

// Interface simplificada, sem os campos específicos de profissional
export interface SignUpFormData {
  displayName: string;
  email: string;
  cpf: string;
  telefone: string;
  tipo: 'familiar' | 'profissional' | 'funcionario' | '';
  vinculo: string;
  observacoes: string;
}

/**
 * Cadastra um novo usuário no Firebase Auth e cria seu perfil básico no Firestore.
 */
export const signUpAndCreateProfile = async (formData: SignUpFormData, password: string) => {
  if (!formData.tipo) {
    return { success: false, error: "O tipo de usuário não foi selecionado." };
  }

  try {
    const userCredential = await createUserWithEmailAndPassword(auth, formData.email, password);
    const user = userCredential.user;

    // O objeto de perfil agora é simples e igual para todos no momento do cadastro
    await setDoc(doc(db, 'users', user.uid), {
      uid: user.uid,
      displayName: formData.displayName,
      email: formData.email,
      cpf: formData.cpf,
      phone: formData.telefone,
      profile: {
        role: formData.tipo,
        status: 'pendente',
        vinculo: formData.vinculo || "",
        observations: formData.observacoes || "",
        createdAt: Timestamp.now(),
      },
    });

    return { success: true, user };
  } catch (error) {
    const authError = error as AuthError;
    let errorMessage = 'Ocorreu um erro desconhecido.';
    if (authError.code === 'auth/email-already-in-use') {
      errorMessage = 'Este e-mail já está cadastrado.';
    } else if (authError.code === 'auth/weak-password') {
      errorMessage = 'A senha deve ter no mínimo 6 caracteres.';
    }
    return { success: false, error: errorMessage };
  }
};

/**
 * Autentica um usuário e verifica seu status de aprovação.
 */
export const signInUser = async (email: string, password: string) => {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;
    const userDocRef = doc(db, 'users', user.uid);
    const userDoc = await getDoc(userDocRef);

    if (userDoc.exists() && userDoc.data().profile.status === 'pendente') {
      await auth.signOut(); 
      return { success: false, error: 'pending_approval' };
    }
    if (!userDoc.exists()) {
      await auth.signOut();
      return { success: false, error: 'Perfil de usuário não encontrado.' };
    }
    return { success: true, user };
  } catch (error) {
    const authError = error as AuthError;
    let errorMessage = "Email ou senha inválidos.";
    if (authError.code === 'auth/user-not-found' || authError.code === 'auth/wrong-password' || authError.code === 'auth/invalid-credential') {
      errorMessage = "Email ou senha inválidos.";
    }
    return { success: false, error: errorMessage };
  }
};