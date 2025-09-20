// __tests__/services/authService.test.ts

import { signUpAndCreateProfile, signInUser } from '@/services/authService';
import { auth } from '@/lib/firebaseConfig'; // Importamos o 'auth' que será substituído pelo mock
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { doc, setDoc, getDoc, writeBatch, collection } from 'firebase/firestore';

// --- CORREÇÃO PRINCIPAL ---
// Simulamos o ficheiro de configuração para substituir o objeto 'auth' real
jest.mock('@/lib/firebaseConfig', () => ({
  ...jest.requireActual('@/lib/firebaseConfig'), // Mantém 'db' e outros exports reais
  auth: { // Substitui apenas o objeto 'auth'
    signOut: jest.fn().mockResolvedValue(undefined), // Fornece um método 'signOut' simulado
  },
}));

// Continuamos a simular as outras funções que usamos diretamente
jest.mock('firebase/auth');
jest.mock('firebase/firestore');

// Tipos para os mocks
const mockedCreateUserWithEmailAndPassword = createUserWithEmailAndPassword as jest.Mock;
const mockedSignInWithEmailAndPassword = signInWithEmailAndPassword as jest.Mock;
const mockedUpdateProfile = updateProfile as jest.Mock;
const mockedSetDoc = setDoc as jest.Mock;
const mockedGetDoc = getDoc as jest.Mock;
const mockedWriteBatch = writeBatch as jest.Mock;
const mockedDoc = doc as jest.Mock;
const mockedSignOut = auth.signOut as jest.Mock; // Agora podemos referenciar o método simulado

const mockBatch = {
  set: jest.fn(),
  update: jest.fn(),
  commit: jest.fn().mockResolvedValue(undefined),
};

describe('Auth Service', () => {

  beforeEach(() => {
    jest.clearAllMocks();
    mockedWriteBatch.mockReturnValue(mockBatch);
  });

  describe('signUpAndCreateProfile', () => {
    it('should create a user and a firestore profile successfully for a familiar', async () => {
      const mockUser = { uid: 'user-123' };
      mockedCreateUserWithEmailAndPassword.mockResolvedValue({ user: mockUser });
      const formData = { displayName: 'João Responsável', email: 'joao@email.com', cpf: '111.222.333-44', telefone: '(21) 99999-9999', tipo: 'familiar' as const, vinculo: 'Pai do Paciente X', observacoes: '' };
      const result = await signUpAndCreateProfile(formData, 'password123');
      expect(result.success).toBe(true);
      expect(mockedSetDoc).toHaveBeenCalledWith(undefined, expect.objectContaining({ profile: expect.objectContaining({ status: 'pendente' }) }));
    });

    it('should return an error if email is already in use', async () => {
        mockedCreateUserWithEmailAndPassword.mockRejectedValue({ code: 'auth/email-already-in-use' });
        const formData = { displayName: 'Teste', email: 'existente@email.com', tipo: 'funcionario' as const } as any;
        const result = await signUpAndCreateProfile(formData, 'password123');
        expect(result.success).toBe(false);
        expect(result.error).toBe('Este e-mail já está cadastrado.');
    });
  });

  describe('signInUser', () => {
    it('should sign in an approved user successfully', async () => {
      const mockUser = { uid: 'user-aprovado' };
      mockedSignInWithEmailAndPassword.mockResolvedValue({ user: mockUser });
      mockedGetDoc.mockResolvedValue({
        exists: () => true,
        data: () => ({ profile: { status: 'aprovado' } }),
      });
      const result = await signInUser('aprovado@email.com', 'password');
      expect(result.success).toBe(true);
      expect(result.user).toBe(mockUser);
    });

    it('should return pending_approval error for a pending user', async () => {
        const mockUser = { uid: 'user-pendente' };
        mockedSignInWithEmailAndPassword.mockResolvedValue({ user: mockUser });
        mockedGetDoc.mockResolvedValue({
          exists: () => true,
          data: () => ({ profile: { status: 'pendente' } }),
        });
  
        const result = await signInUser('pendente@email.com', 'password');
  
        expect(result.success).toBe(false);
        expect(result.error).toBe('pending_approval');
        expect(mockedSignOut).toHaveBeenCalled();
    });

    it('should return an error for invalid credentials', async () => {
        mockedSignInWithEmailAndPassword.mockRejectedValue({ code: 'auth/wrong-password' });
        const result = await signInUser('user@email.com', 'wrongpassword');
        expect(result.success).toBe(false);
        expect(result.error).toBe('Email ou senha inválidos.');
    });
  });
});