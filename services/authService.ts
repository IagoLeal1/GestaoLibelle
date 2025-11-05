import { auth, db } from "@/lib/firebaseConfig";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  updateProfile,
  AuthError,
} from "firebase/auth";
import { doc, setDoc, getDoc, Timestamp } from "firebase/firestore";

// Interface para os dados do formulário de cadastro
export interface SignUpFormData {
  displayName: string;
  email: string;
  cpf: string;
  telefone: string;
  tipo: "familiar" | "profissional" | "funcionario" | "";
  vinculo: string;
  observacoes: string;
  especialidade?: string;
  conselho?: string;
  numeroConselho?: string;
}

/**
 * Cadastra um novo usuário.
 * Todos os usuários entram com status 'pendente'.
 * Se for um profissional, armazena os dados específicos no perfil
 * para serem usados posteriormente na etapa de aprovação pelo admin.
 */
export const signUpAndCreateProfile = async (
  formData: SignUpFormData,
  password: string
) => {
  // Validação 1: Tipo de usuário
  if (!formData.tipo) {
    return { success: false, error: "O tipo de usuário não foi selecionado." };
  }

  // 👇 CORREÇÃO 1: Adicionada validação de CPF para profissional
  if (
    formData.tipo === "profissional" &&
    (!formData.cpf || formData.cpf.trim() === "")
  ) {
    return {
      success: false,
      error: "O CPF é obrigatório para o cadastro de profissionais.",
    };
  }

  try {
    // 1. Cria o usuário no Auth
    const userCredential = await createUserWithEmailAndPassword(
      auth,
      formData.email,
      password
    );
    const user = userCredential.user;

    // 2. Define o nome de exibição no Auth
    await updateProfile(user, { displayName: formData.displayName });

    const userDocRef = doc(db, "users", user.uid);

    // 3. Cria o documento do usuário no Firestore
    if (formData.tipo === "profissional") {
      // (Esta parte já estava correta)
      await setDoc(userDocRef, {
        uid: user.uid,
        displayName: formData.displayName,
        email: formData.email,
        profile: {
          role: "profissional",
          status: "pendente",
          cpf: formData.cpf, // <-- Correto
          telefone: formData.telefone, // <-- Correto
          createdAt: Timestamp.now(),
          historyHidden: false,
          professionalData: {
            especialidade: formData.especialidade || "",
            conselho: formData.conselho || "",
            numeroConselho: formData.numeroConselho || "",
          },
        },
      });
    } else {
      // 👇 CORREÇÃO 2: Padronizado para 'familiar' e 'funcionario'
      // 'cpf' e 'telefone' agora estão DENTRO de 'profile' para consistência
      await setDoc(userDocRef, {
        uid: user.uid,
        displayName: formData.displayName,
        email: formData.email,
        profile: {
          role: formData.tipo,
          status: "pendente",
          cpf: formData.cpf || null, // <-- Movido para dentro do profile
          telefone: formData.telefone || null, // <-- Movido e renomeado
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
    let errorMessage = "Ocorreu um erro desconhecido.";
    if (authError.code === "auth/email-already-in-use") {
      errorMessage = "Este e-mail já está cadastrado.";
    } else if (authError.code === "auth/weak-password") {
      errorMessage = "A senha deve ter no mínimo 6 caracteres.";
    }
    console.error("Erro detalhado no signUp:", authError);
    return { success: false, error: errorMessage };
  }
};

/**
 * Autentica um usuário e verifica seu status de aprovação.
 * (Esta função está correta)
 */
export const signInUser = async (email: string, password: string) => {
  try {
    const userCredential = await signInWithEmailAndPassword(
      auth,
      email,
      password
    );
    const user = userCredential.user;
    const userDocRef = doc(db, "users", user.uid);
    const userDoc = await getDoc(userDocRef);

    if (userDoc.exists() && userDoc.data().profile.status === "pendente") {
      await auth.signOut();
      return { success: false, error: "pending_approval" };
    }

    if (!userDoc.exists()) {
      await auth.signOut();
      return { success: false, error: "Perfil de usuário não encontrado." };
    }

    return { success: true, user };
  } catch (error) {
    const authError = error as AuthError;
    let errorMessage = "Email ou senha inválidos.";
    if (
      authError.code === "auth/user-not-found" ||
      authError.code === "auth/wrong-password" ||
      authError.code === "auth/invalid-credential"
    ) {
      errorMessage = "Email ou senha inválidos.";
    }
    return { success: false, error: errorMessage };
  }
};