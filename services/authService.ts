// /services/authService.ts

import { auth, db } from '@/lib/firebaseConfig';
import { createUserWithEmailAndPassword, AuthError } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { signInWithEmailAndPassword } from 'firebase/auth'; // Adicione este import no topo

// Interface atualizada para corresponder ao novo tipo
interface SignUpFormData {
  nome: string;
  email: string;
  cpf: string;
  telefone: string;
  tipo: "familiar" | "profissional" | "funcionario" | "";
  vinculo: string;
  observacoes: string;
}

export const signUpAndCreateProfile = async (formData: SignUpFormData, password: string) => {
  if (!formData.tipo) {
    return { success: false, error: "O tipo de usuário não foi selecionado." };
  }

  try {
    const userCredential = await createUserWithEmailAndPassword(auth, formData.email, password);
    const user = userCredential.user;

    // Lógica para determinar o que salvar com base no tipo
    let profileSpecificData = {};
    if (formData.tipo === 'profissional') {
      profileSpecificData = { professionalRegistration: formData.vinculo };
    } else if (formData.tipo === 'familiar') {
      profileSpecificData = { patientLink: formData.vinculo };
    } else if (formData.tipo === 'funcionario') {
      // Para 'funcionario', o 'vinculo' representa o cargo/posição
      profileSpecificData = { position: formData.vinculo };
    }

    // Criamos o documento no Firestore
    await setDoc(doc(db, 'users', user.uid), {
      uid: user.uid,
      displayName: formData.nome,
      email: formData.email,
      cpf: formData.cpf,
      phone: formData.telefone,
      profile: {
        role: formData.tipo, // O tipo principal: 'profissional', 'familiar' ou 'funcionario'
        status: 'pendente',
        observations: formData.observacoes,
        createdAt: new Date(),
        ...profileSpecificData // Adiciona os campos específicos do perfil
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
    console.error('Erro no cadastro:', authError.code, authError.message);
    return { success: false, error: errorMessage };
  }
};

export const signInUser = async (email: string, pass: string) => {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, pass);
    return { success: true, user: userCredential.user };
  } catch (error) {
    const authError = error as AuthError;
    let errorMessage = "E-mail ou senha inválidos.";
    // Você pode adicionar mais tratamentos de erro se quiser
    console.error("Erro no login:", authError.code);
    return { success: false, error: errorMessage };
  }
};