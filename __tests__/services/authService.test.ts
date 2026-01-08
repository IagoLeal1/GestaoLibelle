// __tests__/services/authService.test.ts

import { signUpAndCreateProfile, signInUser } from '@/services/authService';
import { auth } from '@/lib/firebaseConfig';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';

// Simulamos o ficheiro de configuração para substituir o objeto 'auth' real
jest.mock('@/lib/firebaseConfig', () => ({
  ...jest.requireActual('@/lib/firebaseConfig'), // Mantém 'db' real se necessário
  auth: { // Substitui apenas o objeto 'auth'
    signOut: jest.fn().mockResolvedValue(undefined),
  },
}));

// Continuamos a simular as outras funções que usamos
jest.mock('firebase/auth');
jest.mock('firebase/firestore');

// Tipos para os mocks
const mockedCreateUserWithEmailAndPassword = createUserWithEmailAndPassword as jest.Mock;
const mockedSignInWithEmailAndPassword = signInWithEmailAndPassword as jest.Mock;
const mockedSetDoc = setDoc as jest.Mock;
const mockedGetDoc = getDoc as jest.Mock;
const mockedDoc = doc as jest.Mock;
const mockedSignOut = auth.signOut as jest.Mock;

describe('Auth Service', () => {

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('signUpAndCreateProfile', () => {
    // Teste para 'familiar' (continua o mesmo)
    it('should create a user and a firestore profile for a familiar', async () => {
      const mockUser = { uid: 'user-123' };
      mockedCreateUserWithEmailAndPassword.mockResolvedValue({ user: mockUser });
      const formData = { 
        displayName: 'João Responsável', 
        email: 'joao@email.com', 
        cpf: '111.222.333-44', 
        telefone: '(21) 99999-9999', 
        tipo: 'familiar' as const, 
        vinculo: 'Pai do Paciente X', 
        observacoes: '' 
      };
      
      const result = await signUpAndCreateProfile(formData, 'password123');
      
      expect(result.success).toBe(true);
      expect(mockedSetDoc).toHaveBeenCalledWith(
        undefined, // o mock de doc() retorna undefined
        expect.objectContaining({
          profile: expect.objectContaining({ role: 'familiar', status: 'pendente' })
        })
      );
    });

    // --- NOVO TESTE ADICIONADO ---
    // Testa o novo fluxo de cadastro para um profissional
    it('should create a user with pending status and temporary professional data for a professional', async () => {
        const mockUser = { uid: 'professional-123' };
        mockedCreateUserWithEmailAndPassword.mockResolvedValue({ user: mockUser });
        const formData = {
            displayName: 'Dra. Ana',
            email: 'ana.fisio@email.com',
            cpf: '123.456.789-00',
            telefone: '(21) 98888-7777',
            tipo: 'profissional' as const,
            especialidade: 'Fisioterapia',
            conselho: 'CREFITO',
            numeroConselho: '12345',
            vinculo: '',
            observacoes: ''
        };

        const result = await signUpAndCreateProfile(formData, 'password123');

        expect(result.success).toBe(true);
        // Verifica se setDoc foi chamado (e não writeBatch)
        expect(mockedSetDoc).toHaveBeenCalledTimes(1);
        // Verifica se os dados salvos no perfil do usuário estão corretos
        expect(mockedSetDoc).toHaveBeenCalledWith(
            undefined,
            expect.objectContaining({
                profile: expect.objectContaining({
                    role: 'profissional',
                    status: 'pendente',
                    professionalData: { // O ponto mais importante do teste!
                        especialidade: 'Fisioterapia',
                        conselho: 'CREFITO',
                        numeroConselho: '12345'
                    }
                })
            })
        );
    });

    // Teste de erro (continua o mesmo)
    it('should return an error if email is already in use', async () => {
        mockedCreateUserWithEmailAndPassword.mockRejectedValue({ code: 'auth/email-already-in-use' });
        const formData = { displayName: 'Teste', email: 'existente@email.com', tipo: 'funcionario' as const } as any;
        
        const result = await signUpAndCreateProfile(formData, 'password123');
        
        expect(result.success).toBe(false);
        expect(result.error).toBe('Este e-mail já está cadastrado.');
    });
  });

  // A seção de 'signInUser' não precisa de alterações
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
  });
});
// --- NOVO TESTE: FLUXO DA FAMÍLIA (VÍNCULO AUTOMÁTICO) ---
    it('should link a patient to the user if emailCadastro matches', async () => {
        // 1. Simula a criação do usuário (Mãe)
        const mockUser = { uid: 'mae-uid-123' };
        mockedCreateUserWithEmailAndPassword.mockResolvedValue({ user: mockUser });

        // 2. Simula que o Firestore ENCONTROU um paciente com esse email
        const mockPatientDoc = { id: 'paciente-joaozinho-id', data: () => ({ name: 'João' }) };
        
        // Mock do getDocs para retornar o paciente encontrado quando a query for feita
        const { getDocs } = require('firebase/firestore');
        (getDocs as jest.Mock).mockResolvedValue({
            empty: false,
            size: 1,
            docs: [mockPatientDoc],
            forEach: (callback: any) => callback(mockPatientDoc)
        });

        // Mock do updateDoc para verificar se o vínculo foi feito
        const { updateDoc } = require('firebase/firestore');
        
        const formData = {
            displayName: 'Mãe do João',
            email: 'mae.joao@email.com',
            // Dados simplificados que vêm da página nova
            tipo: 'familiar' as const,
            vinculo: 'Mãe',
            cpf: '',
            telefone: '',
            observacoes: ''
        };

        // AÇÃO: Executa o cadastro
        const result = await signUpAndCreateProfile(formData, 'senhaSegura123');

        // VERIFICAÇÕES
        expect(result.success).toBe(true);

        // Verifica se tentou atualizar o paciente
        expect(updateDoc).toHaveBeenCalledWith(
            expect.anything(), // O ref do documento (difícil validar exato por ser mock)
            expect.objectContaining({
                userId: 'mae-uid-123' // <--- O PULO DO GATO: Verificamos se o ID da mãe foi salvo no paciente!
            })
        );
    });