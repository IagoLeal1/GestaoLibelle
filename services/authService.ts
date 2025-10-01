import { auth, db } from "@/lib/firebaseConfig";
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword,
  updateProfile,
  AuthError 
} from "firebase/auth";
import { 
    doc, 
    setDoc, 
    getDoc, 
    Timestamp
} from "firebase/firestore";

// Interface para os dados do formulário de cadastro
export interface SignUpFormData {
  displayName: string;
  email: string;
  cpf: string;
  telefone: string;
  tipo: 'familiar' | 'profissional' | 'funcionario' | '';
  vinculo: string;
  observacoes: string;
  especialidade?: string;
  conselho?: string;
  numeroConselho?: string;
}

/**
 * VERSÃO CORRIGIDA E COMPLETA
 * Cadastra um novo usuário. Se for um profissional, armazena os dados específicos
 * no perfil do usuário para serem usados posteriormente, na etapa de aprovação.
 * Isso evita o erro anterior, simplificando a operação de cadastro.
 */
export const signUpAndCreateProfile = async (formData: SignUpFormData, password: string) => {
  // Validação para garantir que um tipo de usuário foi selecionado
  if (!formData.tipo) {
    return { success: false, error: "O tipo de usuário não foi selecionado." };
  }

  try {
    // 1. Cria o usuário no sistema de autenticação do Firebase (e-mail/senha)
    const userCredential = await createUserWithEmailAndPassword(auth, formData.email, password);
    const user = userCredential.user;
    
    // Define o nome de exibição do usuário
    await updateProfile(user, { displayName: formData.displayName });

    const userDocRef = doc(db, 'users', user.uid);

    // 2. Cria o documento do usuário na coleção 'users' do Firestore
    if (formData.tipo === 'profissional') {
      // Para profissionais, o status inicial é 'pendente'.
      // Guardamos os dados extras (especialidade, etc.) dentro do próprio perfil do usuário.
      // Esses dados serão usados para criar o profissional na coleção 'professionals' APÓS a aprovação.
      await setDoc(userDocRef, {
        uid: user.uid,
        displayName: formData.displayName,
        email: formData.email,
        profile: {
            role: 'profissional',
            status: 'pendente',
            cpf: formData.cpf,
            telefone: formData.telefone,
            createdAt: Timestamp.now(),
            historyHidden: false,
            // Objeto para guardar os dados que só serão usados na aprovação
            professionalData: {
                especialidade: formData.especialidade || "",
                conselho: formData.conselho || "",
                numeroConselho: formData.numeroConselho || ""
            }
        }
      });
    } else {
      // Lógica para outros tipos de perfil (funcionário, familiar), que também entram como pendentes.
      await setDoc(userDocRef, {
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
            historyHidden: false,
        },
      });
    }

    return { success: true };
  } catch (error) {
    const authError = error as AuthError;
    let errorMessage = 'Ocorreu um erro desconhecido.';
    // Melhora as mensagens de erro para o usuário
    if (authError.code === 'auth/email-already-in-use') {
      errorMessage = 'Este e-mail já está cadastrado.';
    } else if (authError.code === 'auth/weak-password') {
      errorMessage = 'A senha deve ter no mínimo 6 caracteres.';
    }
    console.error("Erro detalhado no signUp:", authError); // Log para depuração
    return { success: false, error: errorMessage };
  }
};

/**
 * Autentica um usuário e verifica seu status de aprovação.
 * (Esta função permanece sem alterações)
 */
export const signInUser = async (email: string, password: string) => {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;
    const userDocRef = doc(db, 'users', user.uid);
    const userDoc = await getDoc(userDocRef);

    // Se o usuário existir mas estiver com status pendente, bloqueia o login
    if (userDoc.exists() && userDoc.data().profile.status === 'pendente') {
      await auth.signOut(); 
      return { success: false, error: 'pending_approval' };
    }
    
    // Se o perfil do usuário não for encontrado no Firestore por algum motivo
    if (!userDoc.exists()) {
      await auth.signOut();
      return { success: false, error: 'Perfil de usuário não encontrado.' };
    }

    return { success: true, user };
  } catch (error) {
    const authError = error as AuthError;
    let errorMessage = "Email ou senha inválidos.";
    // Trata erros comuns de login
    if (authError.code === 'auth/user-not-found' || authError.code === 'auth/wrong-password' || authError.code === 'auth/invalid-credential') {
      errorMessage = "Email ou senha inválidos.";
    }
    return { success: false, error: errorMessage };
  }
};