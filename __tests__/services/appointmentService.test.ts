// __tests__/services/appointmentService.test.ts

import {
    createAppointment,
    deleteAppointment,
    updateAppointment,
    getRenewableAppointments,
    dismissRenewal,
    getOccupiedRoomIdsByTime,
    findAvailableSlots,
    Appointment,
} from '@/services/appointmentService';
import { db } from '@/lib/firebaseConfig';
import {
    collection,
    query,
    where,
    getDocs,
    doc,
    getDoc,
    addDoc,
    updateDoc,
    deleteDoc,
    writeBatch,
    Timestamp,
} from 'firebase/firestore';

// Mock de todos os serviços dependentes
import * as financialService from '@/services/financialService';
import * as professionalService from '@/services/professionalService';
import * as settingsService from '@/services/settingsService';
import * as roomService from '@/services/roomService';
import { ptBR } from 'date-fns/locale';
import { format } from 'date-fns';

// --- Mocks Globais ---
jest.mock('firebase/firestore', () => {
    const originalModule = jest.requireActual('firebase/firestore');
    return {
        ...originalModule,
        Timestamp: {
            fromDate: jest.fn((date) => ({
                toDate: () => date,
                seconds: date.getTime() / 1000,
            })),
        },
        collection: jest.fn(),
        query: jest.fn(),
        where: jest.fn(),
        orderBy: jest.fn(),
        getDocs: jest.fn(),
        doc: jest.fn(),
        getDoc: jest.fn(),
        addDoc: jest.fn(),
        updateDoc: jest.fn(),
        deleteDoc: jest.fn(),
        writeBatch: jest.fn(),
    };
});

jest.mock('@/services/financialService');
jest.mock('@/services/professionalService');
jest.mock('@/services/settingsService');
jest.mock('@/services/roomService');


// --- Mocks Específicos ---
const mockedGetDoc = getDoc as jest.Mock;
const mockedAddDoc = addDoc as jest.Mock;
const mockedUpdateDoc = updateDoc as jest.Mock;
const mockedDeleteDoc = deleteDoc as jest.Mock;
const mockedGetDocs = getDocs as jest.Mock;
const mockedWriteBatch = writeBatch as jest.Mock;
const mockedDoc = doc as jest.Mock;
const mockedQuery = query as jest.Mock;
const mockedWhere = where as jest.Mock;
const mockedTimestamp = Timestamp as jest.Mocked<typeof Timestamp>;

// Mocks dos serviços
const mockedAddTransaction = jest.spyOn(financialService, 'addTransaction');
const mockedDeleteTransaction = jest.spyOn(financialService, 'deleteTransactionByAppointmentId');
const mockedGetProfessionalById = jest.spyOn(professionalService, 'getProfessionalById');
const mockedGetProfessionals = jest.spyOn(professionalService, 'getProfessionals');
const mockedGetRooms = jest.spyOn(roomService, 'getRooms');
const mockedGetBankAccounts = jest.spyOn(financialService, 'getBankAccounts');

const mockBatch = {
    set: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    commit: jest.fn().mockResolvedValue(undefined),
};

// --- Dados de Teste ---
const mockDate = new Date('2025-10-10T10:00:00');
const mockAppointment: Appointment = {
    id: 'app-123',
    title: 'João Paciente - Dra. Ana',
    patientId: 'paciente-123',
    patientName: 'João Paciente',
    professionalId: 'prof-123',
    professionalName: 'Dra. Ana',
    start: mockedTimestamp.fromDate(mockDate),
    end: mockedTimestamp.fromDate(new Date(mockDate.getTime() + 50 * 60000)),
    status: 'agendado',
    tipo: 'Psicologia',
    blockId: 'block-abc',
    valorConsulta: 150,
};

const mockProfessional = {
    id: 'prof-123',
    fullName: 'Dra. Ana',
    especialidade: 'Psicologia',
    status: 'ativo',
    diasAtendimento: ['segunda', 'quarta', 'sexta'],
    horarioInicio: '08:00',
    horarioFim: '18:00',
    financeiro: {
        tipoPagamento: 'repasse',
        percentualRepasse: 60,
    }
};


describe('Appointment Service - Cobertura Completa', () => {

    beforeEach(() => {
        jest.clearAllMocks();
        mockedWriteBatch.mockReturnValue(mockBatch);
        mockedDoc.mockReturnValue({ id: 'mock-generated-id' });
        mockedQuery.mockImplementation((...args) => ({ _query: args }));
        mockedDeleteTransaction.mockResolvedValue({ success: true });
        // Linha corrigida
        mockedAddTransaction.mockResolvedValue({ success: true });
        mockedGetProfessionalById.mockResolvedValue(mockProfessional as any);
        mockedGetProfessionals.mockResolvedValue([mockProfessional] as any);
        mockedGetRooms.mockResolvedValue([{ id: 'sala-1', nome: 'Sala 1', status: 'ativa' }] as any);
        mockedGetDocs.mockResolvedValue({ docs: [], empty: true }); // Reset padrão
        mockedGetBankAccounts.mockResolvedValue([{ id: 'conta-padrao', isDefault: true }] as any); // Mock essencial
    });


    // --- Testes de CRUD (Já existentes e revisados) ---
    describe('CRUD Operations', () => {
        it('should create a single appointment successfully', async () => {
            mockedGetDoc
                .mockResolvedValueOnce({ exists: () => true, data: () => ({ fullName: 'João Paciente' }) })
                .mockResolvedValueOnce({ exists: () => true, data: () => ({ fullName: 'Dra. Ana' }) });

            const appointmentData = {
                patientId: 'paciente-123',
                professionalId: 'prof-123',
                data: '2025-10-10',
                horaInicio: '10:00',
                horaFim: '10:50',
                tipo: 'Psicologia',
            };
            const result = await createAppointment(appointmentData);
            expect(result.success).toBe(true);
            expect(mockedAddDoc).toHaveBeenCalled();
        });

        it('should delete an appointment and its transaction', async () => {
            const result = await deleteAppointment('app-123');
            expect(result.success).toBe(true);
            expect(mockedDeleteTransaction).toHaveBeenCalledWith('app-123');
            expect(mockedDeleteDoc).toHaveBeenCalled();
        });
    });


    // --- Testes da Lógica de Repasse (handleRepasseTransaction) ---
    describe('handleRepasseTransaction', () => {
        it('should create a repasse transaction when appointment is "finalizado"', async () => {
            const finalizadoApp = { ...mockAppointment, status: 'finalizado' as const };
            mockedGetDoc.mockResolvedValue({ exists: () => true, data: () => finalizadoApp });

            await updateAppointment('app-123', { status: 'finalizado' });

            expect(mockedAddTransaction).toHaveBeenCalled();
            expect(mockedAddTransaction).toHaveBeenCalledWith(expect.objectContaining({
                value: 90, // 60% de 150
            }));
        });

        it('should NOT create a repasse transaction if status is "agendado"', async () => {
            const agendadoApp = { ...mockAppointment, status: 'agendado' as const };
            mockedGetDoc.mockResolvedValue({ exists: () => true, data: () => agendadoApp });

            await updateAppointment('app-123', { status: 'agendado' });

            expect(mockedAddTransaction).not.toHaveBeenCalled();
        });

        it('should delete old transaction before creating a new one', async () => {
            const finalizadoApp = { ...mockAppointment, status: 'finalizado' as const };
            mockedGetDoc.mockResolvedValue({ exists: () => true, data: () => finalizadoApp });

            await updateAppointment('app-123', { status: 'finalizado' });
            
            expect(mockedDeleteTransaction).toHaveBeenCalled();
            expect(mockedAddTransaction).toHaveBeenCalled();

            const deleteOrder = mockedDeleteTransaction.mock.invocationCallOrder[0];
            const addOrder = mockedAddTransaction.mock.invocationCallOrder[0];
            expect(deleteOrder).toBeLessThan(addOrder);
        });
    });


    // --- Testes das Funções de Busca e Lógica de Negócio ---
    describe('Business Logic and Search Functions', () => {
        it('should get renewable appointments within the next 7 days', async () => {
            mockedGetDocs.mockResolvedValue({
                docs: [{ id: 'app-renewable', data: () => ({ ...mockAppointment, isLastInBlock: true }) }],
                empty: false
            });

            const result = await getRenewableAppointments();
            expect(mockedWhere).toHaveBeenCalledWith('isLastInBlock', '==', true);
            expect(result.length).toBe(1);
        });

        it('should dismiss a renewal notice', async () => {
            await dismissRenewal('app-123');
            expect(mockedUpdateDoc).toHaveBeenCalledWith(
                expect.anything(),
                { isLastInBlock: false }
            );
        });

        it('should get occupied room IDs for a given time range', async () => {
            mockedGetDocs.mockResolvedValue({
                docs: [{ data: () => ({ ...mockAppointment, sala: 'sala-1' }) }],
                empty: false
            });

            const startTime = new Date('2025-10-10T09:30:00');
            const endTime = new Date('2025-10-10T10:30:00');
            const result = await getOccupiedRoomIdsByTime(startTime, endTime);

            expect(result).toEqual(['sala-1']);
        });
    });


    // --- Testes do Assistente de Agendamento ---
    describe('Schedule Assistant Functions', () => {
        it('should find available slots for a given therapy', async () => {
            mockedGetDocs.mockResolvedValue({ docs: [], empty: true }); // Nenhum agendamento futuro

            const options = {
                semana: new Date('2025-10-06'), // Uma segunda-feira
                terapia: 'Psicologia',
            };
            const slots = await findAvailableSlots(options);
            expect(slots.length).toBeGreaterThan(0);
        });

        it('should NOT find a slot if the professional is busy', async () => {
            const conflictingTime = new Date('2025-10-10T14:10:00');
            const conflictingAppointment = {
                ...mockAppointment,
                professionalId: mockProfessional.id,
                start: mockedTimestamp.fromDate(conflictingTime),
                end: mockedTimestamp.fromDate(new Date(conflictingTime.getTime() + 50 * 60000)),
            };
            // Mock para a busca de agendamentos no findAvailableSlots
            mockedGetDocs.mockImplementation(query => {
                // Simula que a query encontrou o agendamento conflitante
                return Promise.resolve({
                    docs: [{ id: 'conflict', data: () => conflictingAppointment }],
                    empty: false
                });
            });

            const options = {
                semana: new Date('2025-10-06'), // Semana que inclui a sexta-feira do conflito
                terapia: 'Psicologia',
                turno: 'tarde' as const
            };
            const slots = await findAvailableSlots(options);

            // Verifica se o horário conflitante não foi oferecido
            const hasConflictSlot = slots.some(slot => 
                format(slot.dia, 'yyyy-MM-dd HH:mm') === format(conflictingTime, 'yyyy-MM-dd HH:mm')
            );
            expect(hasConflictSlot).toBe(false);
        });
    });
});