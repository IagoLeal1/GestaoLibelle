// __tests__/services/appointmentService.test.ts

import { createAppointment, createAppointmentBlock } from '@/services/appointmentService';
import { db } from '@/lib/firebaseConfig';
import { collection, doc, getDoc, addDoc, writeBatch, Timestamp } from 'firebase/firestore';

// Simulações (Mocks)
jest.mock('firebase/firestore');

const mockedGetDoc = getDoc as jest.Mock;
const mockedAddDoc = addDoc as jest.Mock;
const mockedWriteBatch = writeBatch as jest.Mock;
const mockedDoc = doc as jest.Mock;
const mockedCollection = collection as jest.Mock;

// Mock para o objeto 'batch'
const mockBatch = {
  set: jest.fn(),
  update: jest.fn(),
  commit: jest.fn().mockResolvedValue(undefined),
};

describe('Appointment Service', () => {

  beforeEach(() => {
    jest.clearAllMocks();
    // Configuração para o batch
    mockedWriteBatch.mockReturnValue(mockBatch);
    // --- CORREÇÃO AQUI ---
    // Dizemos ao mock da função 'doc' para sempre retornar um objeto com uma propriedade 'id'.
    // Isto resolve o erro 'cannot read property id of undefined'.
    mockedDoc.mockReturnValue({ id: 'mock-generated-id' });
  });

  // Testes para a função createAppointment (agendamento único)
  describe('createAppointment', () => {
    it('should create a single appointment successfully', async () => {
      // Arrange
      mockedGetDoc
        .mockResolvedValueOnce({ // Simula o retorno para o Paciente
          exists: () => true,
          data: () => ({ fullName: 'João Paciente' }),
        })
        .mockResolvedValueOnce({ // Simula o retorno para o Profissional
          exists: () => true,
          data: () => ({ fullName: 'Dra. Ana' }),
        });

      const appointmentData = {
        patientId: 'paciente-123',
        professionalId: 'prof-123',
        data: '2025-10-10',
        horaInicio: '10:00',
        horaFim: '10:50',
        tipo: 'Psicologia',
      };

      // Act
      const result = await createAppointment(appointmentData);

      // Assert
      expect(result.success).toBe(true);
      expect(mockedAddDoc).toHaveBeenCalled();
      expect(mockedAddDoc).toHaveBeenCalledWith(
        undefined, 
        expect.objectContaining({
          title: 'João Paciente - Dra. Ana',
          status: 'agendado',
        })
      );
    });

    it('should return an error if patient or professional does not exist', async () => {
      // Arrange
      mockedGetDoc.mockResolvedValue({ exists: () => false }); 

      const appointmentData = {
        patientId: 'paciente-invalido',
        professionalId: 'prof-invalido',
        data: '2025-10-10',
        horaInicio: '10:00',
        horaFim: '10:50',
        tipo: 'Psicologia',
      };

      // Act
      const result = await createAppointment(appointmentData);

      // Assert
      expect(result.success).toBe(false);
      expect(result.error).toBe('Falha ao criar agendamento.');
      expect(mockedAddDoc).not.toHaveBeenCalled();
    });
  });

  // Testes para a função createAppointmentBlock (agendamento em bloco)
  describe('createAppointmentBlock', () => {
    it('should create multiple appointments in a batch', async () => {
      // Arrange
      mockedGetDoc.mockResolvedValue({
        exists: () => true,
        data: () => ({ fullName: 'Nome Fictício' }),
      });

      const blockData = {
        patientId: 'paciente-123',
        professionalId: 'prof-123',
        data: '2025-10-10',
        horaInicio: '11:00',
        horaFim: '11:50',
        tipo: 'Fonoaudiologia',
        sessions: 4,
        frequency: 'weekly' as const,
      };

      // Act
      const result = await createAppointmentBlock(blockData);

      // Assert
      expect(result.success).toBe(true);
      expect(mockBatch.set).toHaveBeenCalledTimes(4);
      expect(mockBatch.commit).toHaveBeenCalledTimes(1);
    });
  });
});