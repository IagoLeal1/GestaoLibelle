// __tests__/services/adminService.test.ts

import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  Timestamp,
  where,
  writeBatch,
} from "firebase/firestore";
import { db } from "@/lib/firebaseConfig";
import { approveUser } from "@/services/adminService"; // Importe a função

// Mockar as funções do Firebase
jest.mock("@/lib/firebaseConfig", () => ({
  db: jest.fn(),
}));

jest.mock("firebase/firestore", () => ({
  collection: jest.fn(),
  doc: jest.fn(),
  getDoc: jest.fn(),
  getDocs: jest.fn(),
  query: jest.fn(),
  where: jest.fn(),
  writeBatch: jest.fn(),
  Timestamp: {
    now: jest.fn(() => ({
      seconds: 123456789,
      toDate: () => new Date(),
    })),
  },
}));

// Cast das funções mocadas
const mockCollection = collection as jest.Mock;
const mockDoc = doc as jest.Mock;
const mockGetDoc = getDoc as jest.Mock;
const mockGetDocs = getDocs as jest.Mock;
const mockQuery = query as jest.Mock;
const mockWhere = where as jest.Mock;
const mockWriteBatch = writeBatch as jest.Mock;

describe("adminService: approveUser (com WriteBatch)", () => {
  const mockBatch = {
    set: jest.fn(),
    update: jest.fn(),
    commit: jest.fn().mockResolvedValue(undefined),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockWriteBatch.mockReturnValue(mockBatch);
  });

  it("deve CRIAR um novo profissional se o CPF não for encontrado", async () => {
    const USER_ID = "user-pendente-123";
    const CPF_NOVO = "111.222.333-44";

    // 1. Simular o usuário 'pendente'
    const mockPendingUser = {
      id: USER_ID,
      displayName: "Dr. Teste",
      email: "teste@teste.com",
      profile: {
        role: "profissional",
        status: "pendente",
        cpf: CPF_NOVO,
        telefone: "123456789",
        createdAt: Timestamp.now(),
        historyHidden: false,
        professionalData: {
          especialidade: "Testologia",
          conselho: "TESTE",
          numeroConselho: "12345",
        },
      },
    };

    // 2. Configurar os Mocks do Firestore (ETAPA 1: Leitura)

    mockGetDoc.mockResolvedValue({
      exists: () => true,
      data: () => mockPendingUser,
    });
    mockGetDocs.mockResolvedValue({
      empty: true,
      docs: [],
    });

    // --- AQUI ESTÁ A CORREÇÃO ---
    
    // Referências mockadas
    const userDocRef = { id: USER_ID, path: `users/${USER_ID}` };
    const profCollectionRef = { id: "professionals", path: "professionals" };
    const newProfRef = { id: "new-prof-id-abc", path: "professionals/new-prof-id-abc" };

    // Configura o mock da collection
    mockCollection.mockImplementation((db, path) => {
      if (path === "professionals") return profCollectionRef;
      return { id: path, path };
    });

    // Configura o mock do doc para lidar com AMBOS os casos
    mockDoc.mockImplementation((arg1, arg2, arg3) => {
      // Caso 1: Chamada para auto-gerar ID (ex: doc(profCollectionRef))
      if (arg1 === profCollectionRef) {
        return newProfRef; // Retorna o novo ID mockado
      }
      
      // Caso 2: Chamada com ID (ex: doc(db, "users", USER_ID))
      if (arg2 === "users" && arg3 === USER_ID) {
        return userDocRef;
      }

      // Fallback
      return { id: arg3, path: `${arg2}/${arg3}` };
    });
    // --- FIM DA CORREÇÃO ---


    // 3. Executar a função
    const result = await approveUser(USER_ID);

    // 4. Verificações (Asserts) - ETAPA 2: Escrita (Batch)
    expect(mockWriteBatch).toHaveBeenCalledTimes(1);

    // Verifica se o 'set' (CRIAR) foi chamado com o newProfRef CORRETO
    expect(mockBatch.set).toHaveBeenCalledTimes(1);
    expect(mockBatch.set).toHaveBeenCalledWith(
      newProfRef, // <-- Agora 'newProfRef' deve ser o objeto correto
      expect.anything()
    );

    // Verifica se os dados criados estão corretos
    const professionalData = mockBatch.set.mock.calls[0][1];
    expect(professionalData.name).toBe("Dr. Teste");
    expect(professionalData.cpf).toBe(CPF_NOVO);
    expect(professionalData.userId).toBe(USER_ID);
    expect(professionalData.registrationNumber).toBe("12345");

    // Verifica se o 'update' (ATUALIZAR) foi chamado
    expect(mockBatch.update).toHaveBeenCalledTimes(1);
    expect(mockBatch.update).toHaveBeenCalledWith(
      userDocRef,
      {
        profile: expect.objectContaining({
          status: "aprovado",
          professionalId: "new-prof-id-abc",
        }),
      }
    );

    // Verifica se o lote foi "commitado"
    expect(mockBatch.commit).toHaveBeenCalledTimes(1);
    expect(result.success).toBe(true);
  });
});