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
    Timestamp,
    collection,
    query,
    where,
    getDocs,
    writeBatch
} from "firebase/firestore";

// Interface atualizada para incluir os campos de profissional que vêm do formulário
export interface SignUpFormData {
  displayName: string;
  email: string;
  cpf: string;
  telefone: string;
  tipo: 'familiar' | 'profissional' | 'funcionario' | '';
  vinculo: string;
  observacoes: string;
  // Campos específicos de profissional
  especialidade?: string;
  conselho?: string;
  numeroConselho?: string;
}

/**
 * Cadastra um novo usuário, garantindo que o perfil no Firestore seja criado com todos os campos necessários.
 */
export const signUpAndCreateProfile = async (formData: SignUpFormData, password:string) => {
  // Validações
  if (!formData.tipo) {
    return { success: false, error: "O tipo de usuário não foi selecionado." };
  }
  if (formData.tipo === 'profissional' && (!formData.cpf || formData.cpf.trim() === '')) {
    return { success: false, error: "O CPF é obrigatório para o cadastro de profissionais." };
  }

  try {
    const userCredential = await createUserWithEmailAndPassword(auth, formData.email, password);
    const user = userCredential.user;
    await updateProfile(user, { displayName: formData.displayName });

    if (formData.tipo === 'profissional') {
        const batch = writeBatch(db);
        const professionalsRef = collection(db, "professionals");
        const q = query(professionalsRef, where("cpf", "==", formData.cpf));
        const professionalSnapshot = await getDocs(q);

        let professionalId: string;

        if (!professionalSnapshot.empty) {
            const existingProfessionalDoc = professionalSnapshot.docs[0];
            professionalId = existingProfessionalDoc.id;
            const professionalDocRef = doc(db, "professionals", professionalId);

            batch.update(professionalDocRef, { 
                userId: user.uid,
                fullName: formData.displayName,
                email: formData.email,
                cpf: formData.cpf,
                celular: formData.telefone,
                especialidade: formData.especialidade || "",
                conselho: formData.conselho || "",
                numeroConselho: formData.numeroConselho || "",
            });
        } else {
            const newProfessionalRef = doc(professionalsRef);
            professionalId = newProfessionalRef.id;
            batch.set(newProfessionalRef, {
                userId: user.uid,
                fullName: formData.displayName,
                email: formData.email,
                cpf: formData.cpf,
                celular: formData.telefone,
                telefone: '',
                especialidade: formData.especialidade || "",
                conselho: formData.conselho || "",
                numeroConselho: formData.numeroConselho || "",
                status: 'ativo',
                diasAtendimento: [],
                horarioInicio: '',
                horarioFim: '',
                dataContratacao: Timestamp.now(),
                financeiro: { percentualRepasse: 0, valorConsulta: 0 }
            });
        }

        // Cria o documento do usuário na coleção 'users'
        const userDocRef = doc(db, "users", user.uid);
        batch.set(userDocRef, {
            uid: user.uid,
            displayName: formData.displayName,
            email: formData.email,
            profile: {
                role: 'profissional',
                status: 'pendente',
                cpf: formData.cpf,
                telefone: formData.telefone,
                professionalId: professionalId,
                createdAt: Timestamp.now(),
                historyHidden: false // <-- PONTO CRÍTICO DA CORREÇÃO
            }
        });
        
        await batch.commit();

    } else {
        // Lógica para outros tipos de perfil
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
                historyHidden: false, // <-- E AQUI TAMBÉM
            },
        });
    }

    return { success: true };
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