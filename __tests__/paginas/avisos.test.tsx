// __tests__/paginas/avisos.test.tsx
// A tela de Avisos. Quem recebe lê no mural: entrar já conta como lido, e os importantes pedem
// "Estou ciente". A gestão acompanha pelo painel, que conta quem leu sem contar quem escreveu.
import '@testing-library/jest-dom';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MuralDeAvisos } from '@/components/avisos/mural-de-avisos';
import { PainelDeAvisos } from '@/components/avisos/painel-de-avisos';
import { useAuth } from '@/context/AuthContext';
import { getCommunications, getPessoasDaClinica, markCommunicationAsRead } from '@/services/communicationService';

jest.mock('@/context/AuthContext', () => ({ useAuth: jest.fn() }));
jest.mock('@/lib/firebaseConfig', () => ({ db: {}, auth: {} }));
jest.mock('@/services/communicationService', () => ({
  getCommunications: jest.fn(),
  getPessoasDaClinica: jest.fn(),
  markCommunicationAsRead: jest.fn(),
  createCommunication: jest.fn(),
  updateCommunication: jest.fn(),
  deleteCommunication: jest.fn(),
}));

const em = (data: string) => ({ toDate: () => new Date(data), toMillis: () => new Date(data).getTime() });
const HOJE = em('2026-10-04T09:00:00-03:00');

const aviso = (id: string, extra: Record<string, unknown> = {}) => ({
  id,
  title: id,
  message: `Texto de ${id}.`,
  authorId: 'ana',
  authorName: 'Ana Admin',
  createdAt: HOJE,
  isImportant: false,
  targetRole: 'familiar',
  readBy: {},
  ...extra,
});

const entrarComo = (uid: string, role: string) =>
  (useAuth as jest.Mock).mockReturnValue({ firestoreUser: { uid, displayName: uid, profile: { role } }, fetchUnreadCount: jest.fn() });

beforeEach(() => {
  jest.clearAllMocks();
  (markCommunicationAsRead as jest.Mock).mockResolvedValue({ success: true });
});

describe('mural de quem recebe', () => {
  it('entrar já conta como lido; o aviso importante espera o "Estou ciente"', async () => {
    entrarComo('maria', 'familiar');
    (getCommunications as jest.Mock).mockResolvedValue([
      aviso('Feriado de 12/10', { isImportant: true }),
      aviso('Novo horário da recepção'),
      aviso('Festa da primavera', { readBy: { maria: HOJE } }),
    ]);

    render(<MuralDeAvisos />);

    await waitFor(() => expect(markCommunicationAsRead).toHaveBeenCalledWith('Novo horário da recepção', 'maria'));
    expect(markCommunicationAsRead).toHaveBeenCalledTimes(1);

    fireEvent.click(screen.getByRole('button', { name: /Estou ciente/ }));

    await waitFor(() => expect(markCommunicationAsRead).toHaveBeenCalledWith('Feriado de 12/10', 'maria'));
    expect(await screen.findByText(/Você confirmou que leu/)).toBeInTheDocument();
  });
});

describe('painel da gestão', () => {
  it('conta quem leu entre os destinatários, sem quem escreveu', async () => {
    entrarComo('carla', 'coordenador');
    (getCommunications as jest.Mock).mockResolvedValue([
      aviso('Reunião de equipe', { targetRole: 'equipe', authorId: 'carla', readBy: { carla: HOJE, rafa: HOJE } }),
    ]);
    (getPessoasDaClinica as jest.Mock).mockResolvedValue([
      { uid: 'ana', displayName: 'Ana Admin', papel: 'admin' },
      { uid: 'carla', displayName: 'Carla Coordenadora', papel: 'coordenador' },
      { uid: 'rafa', displayName: 'Rafa Recepção', papel: 'funcionario' },
      { uid: 'paula', displayName: 'Paula Fonoaudióloga', papel: 'profissional' },
      { uid: 'maria', displayName: 'Maria Souza', papel: 'familiar' },
    ]);

    render(<PainelDeAvisos />);

    expect((await screen.findAllByText('1 de 3')).length).toBeGreaterThan(0);
  });
});
