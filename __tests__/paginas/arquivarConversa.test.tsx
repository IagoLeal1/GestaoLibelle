// __tests__/paginas/arquivarConversa.test.tsx
// Arquivar e excluir de vez uma conversa, na tela: só o admin vê os botões; arquivar pede
// confirmação; excluir de vez só aparece na arquivada e pede o nome da criança. Na lista, as
// arquivadas saem e o admin as vê embaixo, em "Arquivadas".
import '@testing-library/jest-dom';
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { Timestamp } from 'firebase/firestore';
import { EquipeDaConversa } from '@/components/mensagens/equipe-da-conversa';
import { ListaDeConversas } from '@/components/mensagens/lista-conversas';
import { useAuth } from '@/context/AuthContext';
import { useContagemDeNaoLidas, useConversas } from '@/hooks/use-conversas';
import { arquivarGrupo, ChatGroup, desarquivarGrupo, excluirGrupoDeVez } from '@/services/chatService';

const push = jest.fn();
jest.mock('next/navigation', () => ({ useRouter: () => ({ push }), usePathname: () => '/mensagens' }));
jest.mock('sonner', () => ({ toast: { success: jest.fn(), error: jest.fn(), info: jest.fn() } }));
jest.mock('@/services/chatService', () => ({
  ...jest.requireActual('@/services/chatService'),
  arquivarGrupo: jest.fn(), desarquivarGrupo: jest.fn(), excluirGrupoDeVez: jest.fn(),
  linkGroupToPatient: jest.fn(), removeGroupMember: jest.fn(),
}));
jest.mock('@/components/modals/add-participants-modal', () => ({ AddParticipantsModal: () => null }));
jest.mock('@/components/modals/create-chat-group-modal', () => ({ CreateChatGroupModal: () => null }));
jest.mock('@/components/mensagens/escolher-paciente', () => ({ EscolherPaciente: () => null }));
jest.mock('@/context/AuthContext', () => ({ useAuth: jest.fn() }));
jest.mock('@/hooks/use-conversas', () => ({ useConversas: jest.fn(), useContagemDeNaoLidas: jest.fn() }));

const grupo = (extra: Partial<ChatGroup> = {}): ChatGroup => ({
  id: 'paciente-theo', pacienteId: 'theo', pacienteNome: 'Théo Martins', responsavelId: 'maria', responsavelNome: 'Maria',
  terapeutaIds: [], terapeutaNomes: [], memberIds: ['maria', 'paula'], createdBy: 'admin',
  createdAt: Timestamp.now(), updatedAt: Timestamp.now(), unreadCounts: {}, ...extra,
});
const membros = [{ uid: 'maria', nome: 'Maria Souza', papel: 'familiar' as const }, { uid: 'paula', nome: 'Paula Fono', papel: 'profissional' as const }];

const abrir = (g: ChatGroup, ehAdmin: boolean) =>
  render(
    <EquipeDaConversa open onOpenChange={jest.fn()} grupo={g} membros={membros} meuUid="admin" podeGerenciar ehAdmin={ehAdmin} meuNome="Ana Admin" onMudou={jest.fn()} />
  );

beforeEach(() => {
  jest.clearAllMocks();
  (arquivarGrupo as jest.Mock).mockResolvedValue(undefined);
  (desarquivarGrupo as jest.Mock).mockResolvedValue(undefined);
  (excluirGrupoDeVez as jest.Mock).mockResolvedValue(undefined);
});

it('a coordenação não vê arquivar nem excluir', () => {
  abrir(grupo(), false);

  expect(screen.queryByRole('button', { name: /Arquivar/ })).not.toBeInTheDocument();
  expect(screen.queryByRole('button', { name: /Excluir de vez/ })).not.toBeInTheDocument();
});

it('o admin arquiva depois de confirmar', async () => {
  abrir(grupo(), true);

  expect(screen.queryByRole('button', { name: /Excluir de vez/ })).not.toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', { name: /Arquivar conversa/ }));
  const confirmar = await screen.findByRole('alertdialog', { name: 'Arquivar a conversa de Théo?' });
  expect(confirmar).toHaveTextContent('As mensagens ficam guardadas');
  fireEvent.click(within(confirmar).getByRole('button', { name: 'Arquivar' }));

  await waitFor(() => expect(arquivarGrupo).toHaveBeenCalledWith(expect.objectContaining({ id: 'paciente-theo' }), { nome: 'Ana Admin' }));
});

it('arquivada: desarquivar, e excluir de vez só depois de escrever o nome da criança', async () => {
  const arquivado = grupo({ arquivado: true, arquivadoPor: 'Ana Admin', memberIds: [], membrosAntesDeArquivar: ['maria', 'paula'] });
  abrir(arquivado, true);

  expect(screen.getByText(/Conversa arquivada/)).toHaveTextContent('por Ana Admin');
  fireEvent.click(screen.getByRole('button', { name: /Excluir de vez/ }));
  const confirmar = await screen.findByRole('alertdialog', { name: 'Excluir de vez a conversa de Théo?' });
  const botao = within(confirmar).getByRole('button', { name: 'Excluir de vez' });
  expect(botao).toBeDisabled();

  fireEvent.change(within(confirmar).getByLabelText(/Para confirmar, escreva/), { target: { value: 'theo' } });
  expect(botao).toBeEnabled();
  fireEvent.click(botao);

  await waitFor(() => expect(excluirGrupoDeVez).toHaveBeenCalledWith('paciente-theo'));
  expect(push).toHaveBeenCalledWith('/mensagens');
});

it('na lista, a arquivada sai e o admin a encontra em "Arquivadas"', () => {
  (useConversas as jest.Mock).mockReturnValue({
    grupos: [grupo(), grupo({ id: 'paciente-bia', pacienteNome: 'Bia Lima', arquivado: true, memberIds: [] })],
    carregando: false, erro: false, uid: 'admin', coordenacao: true,
  });
  (useContagemDeNaoLidas as jest.Mock).mockReturnValue({});
  (useAuth as jest.Mock).mockReturnValue({ firestoreUser: { uid: 'admin', profile: { role: 'admin' } } });
  const { unmount } = render(<ListaDeConversas />);

  expect(screen.getByRole('link', { name: /Théo Martins/ })).toBeInTheDocument();
  expect(screen.queryByRole('link', { name: /Bia Lima/ })).not.toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', { name: /Arquivadas \(1\)/ }));
  expect(screen.getByRole('link', { name: /Bia Lima/ })).toHaveAttribute('href', '/mensagens/paciente-bia');
  unmount();

  // A coordenação não vê as arquivadas
  (useAuth as jest.Mock).mockReturnValue({ firestoreUser: { uid: 'coord', profile: { role: 'coordenador' } } });
  render(<ListaDeConversas />);
  expect(screen.queryByRole('button', { name: /Arquivadas/ })).not.toBeInTheDocument();
});
