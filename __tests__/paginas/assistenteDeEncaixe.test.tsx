// __tests__/paginas/assistenteDeEncaixe.test.tsx
// O assistente de agendamento, como no desenho aprovado: a coordenação procura o encaixe e manda para
// a recepção (com a data de início e um recado) ou diz "Não" com o motivo; a recepção vê em "Para
// agendar" o que falta fazer, agenda cada sessão pelo Novo Agendamento e pode excluir (com aviso).
import '@testing-library/jest-dom';
import React from 'react';
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { AssistenteDeEncaixe } from '@/components/assistente/assistente-de-encaixe';
import { terapiasDaCrianca } from '@/components/assistente/procurar-encaixe';
import { OpcaoDeEncaixe } from '@/lib/encaixes';
import {
  contarParaAgendar, dizerNao, excluirEncaixe, listarParaAgendar, listarRecusados, mandarParaRecepcao,
} from '@/services/encaixeService';
import { getPatients } from '@/services/patientService';
import { getProfessionals } from '@/services/professionalService';
import { getSpecialties } from '@/services/specialtyService';

jest.mock('@/services/encaixeService', () => ({
  contarParaAgendar: jest.fn(), dizerNao: jest.fn(), excluirEncaixe: jest.fn(), listarParaAgendar: jest.fn(),
  listarRecusados: jest.fn(), mandarParaRecepcao: jest.fn(),
}));
jest.mock('@/services/patientService', () => ({ getPatients: jest.fn() }));
jest.mock('@/services/professionalService', () => ({ getProfessionals: jest.fn() }));
jest.mock('@/services/specialtyService', () => ({ getSpecialties: jest.fn() }));
jest.mock('@/lib/firebaseConfig', () => ({ auth: { currentUser: { getIdToken: () => Promise.resolve('login') } }, db: {} }));
jest.mock('@/context/AuthContext', () => ({
  useAuth: () => ({ firestoreUser: { uid: 'coord', displayName: 'Carla Coordenadora', profile: { role: 'coordenador' } } }),
}));
jest.mock('sonner', () => ({ toast: { success: jest.fn(), error: jest.fn() } }));
jest.mock('@/components/ui/multi-select-filter', () => ({ MultiSelectFilter: () => null }));
// O Select do Radix não abre no jsdom: um <select> comum (com o id do gatilho, para o rótulo) faz o mesmo papel
jest.mock('@/components/ui/select', () => {
  const React = jest.requireActual('react');
  return {
    Select: ({ value, onValueChange, disabled, children }: any) => {
      const gatilho = React.Children.toArray(children).find((c: any) => c.props?.id) as any;
      return (
        <select id={gatilho?.props.id} value={value} disabled={disabled} onChange={(e) => onValueChange(e.target.value)}>
          <option value="" />
          {children}
        </select>
      );
    },
    SelectTrigger: () => null,
    SelectValue: () => null,
    SelectContent: ({ children }: any) => <>{children}</>,
    SelectItem: ({ value, children }: any) => <option value={value}>{children}</option>,
  };
});

const ana = { id: 'prof-ana', nome: 'Ana Costa' };
const carla = { id: 'prof-carla', nome: 'Carla Dias' };
const sessao = (profissional: typeof ana, dia: string, horario: string, fim: string, extra = {}) => ({
  terapia: 'Fonoaudiologia', profissional, dia, horario, fim, semanasLivres: 12, sala: null, preferida: false, comTroca: false, ...extra,
});
const livre: OpcaoDeEncaixe = {
  chave: 'livre', sessoes: [sessao(carla, 'terca', '14:10', '15:00')], troca: null, semanasLivres: 12, diasEmendados: [], faltam: [],
};
const comTroca: OpcaoDeEncaixe = {
  chave: 'com-troca',
  sessoes: [sessao(ana, 'terca', '14:10', '15:00', { comTroca: true, preferida: true })],
  troca: {
    chave: 'troca-lucas', paciente: { id: 'paciente-lucas', nome: 'Lucas Souza' }, profissional: ana, terapia: 'Fonoaudiologia',
    dia: 'terca', de: '14:10', para: '15:00', sala: { id: 'sala-1', nome: 'Sala Azul' },
    emendaCom: { horario: '15:50', terapia: 'Terapia Ocupacional' },
  },
  semanasLivres: 12, diasEmendados: [], faltam: [],
};

beforeEach(() => {
  jest.clearAllMocks();
  (contarParaAgendar as jest.Mock).mockResolvedValue(0);
  (getPatients as jest.Mock).mockResolvedValue([{ id: 'paciente-theo', fullName: 'Theo Martins' }]);
  (getSpecialties as jest.Mock).mockResolvedValue([{ id: 'fono', name: 'Fonoaudiologia', value: 150 }]);
  (getProfessionals as jest.Mock).mockResolvedValue([]);
  (mandarParaRecepcao as jest.Mock).mockResolvedValue('novo');
  (dizerNao as jest.Mock).mockResolvedValue('recusa');
  global.fetch = jest.fn().mockResolvedValue({ ok: true, json: () => Promise.resolve({ opcoes: [livre, comTroca] }) }) as jest.Mock;
});

async function procurar() {
  render(<AssistenteDeEncaixe />);
  const crianca = await screen.findByLabelText('Quem precisa de horário');
  await waitFor(() => expect(within(crianca).getByText('Theo Martins')).toBeInTheDocument());
  fireEvent.change(crianca, { target: { value: 'paciente-theo' } });
  fireEvent.change(screen.getByLabelText('Terapia'), { target: { value: 'Fonoaudiologia' } });
  fireEvent.click(screen.getByRole('button', { name: 'Ter' }));
  fireEvent.click(screen.getByRole('button', { name: 'Encontrar encaixes' }));
  await screen.findByText('2 encaixes para Theo');
}

it('a coordenação procura com o que a família pode e vê a opção livre e a com troca explicada', async () => {
  await procurar();

  const pedido = JSON.parse((global.fetch as jest.Mock).mock.calls[0][1].body);
  expect(pedido).toEqual(expect.objectContaining({
    pacienteId: 'paciente-theo', necessidades: [{ terapia: 'Fonoaudiologia', frequencia: 1 }], familia: { dias: ['terca'], desde: '', ate: '' }, emendar: true,
  }));
  const opcao2 = screen.getByRole('article', { name: 'Opção 2' });
  expect(opcao2).toHaveTextContent('A troca: Lucas Souza muda de horário na mesma terça');
  expect(opcao2).toHaveTextContent('Fica emendado com Terapia Ocupacional das 15:50');
  expect(opcao2).toHaveTextContent('A Sala Azul está livre às 15:00');
  expect(screen.getByRole('article', { name: 'Opção 1' })).toHaveTextContent('Não mexe em nenhuma outra criança');
});

it('"Vamos com essa" manda para a recepção com a data de início e o recado', async () => {
  await procurar();

  fireEvent.click(within(screen.getByRole('article', { name: 'Opção 1' })).getByRole('button', { name: /Vamos com essa/ }));
  const janela = await screen.findByRole('dialog', { name: 'Mandar para a recepção' });
  fireEvent.change(within(janela).getByLabelText('Começa em'), { target: { value: '2026-10-13' } });
  fireEvent.change(within(janela).getByLabelText('Recado para a recepção (opcional)'), { target: { value: 'Avisar pelo WhatsApp' } });
  fireEvent.click(within(janela).getByRole('button', { name: 'Mandar para a recepção' }));

  await waitFor(() => expect(mandarParaRecepcao).toHaveBeenCalledWith({
    paciente: { id: 'paciente-theo', nome: 'Theo Martins' }, opcao: livre, comecaEm: '2026-10-13', recado: 'Avisar pelo WhatsApp',
    autor: { uid: 'coord', nome: 'Carla Coordenadora' },
  }));
  expect(await within(screen.getByRole('article', { name: 'Opção 1' })).findByText('Mandado para a recepção')).toBeInTheDocument();
});

it('"Não" guarda o motivo e tira da tela o que não vale mais', async () => {
  await procurar();

  fireEvent.click(within(screen.getByRole('article', { name: 'Opção 2' })).getByRole('button', { name: 'Não' }));
  const janela = await screen.findByRole('dialog', { name: 'Por que não essa opção?' });
  expect(janela).toHaveTextContent('O assistente para de sugerir mexer em Lucas.');
  fireEvent.click(within(janela).getByLabelText(/A família de Lucas não aceita mudar/));
  fireEvent.click(within(janela).getByRole('button', { name: 'Salvar e ver a próxima' }));

  await waitFor(() => expect(dizerNao).toHaveBeenCalledWith(expect.objectContaining({ opcao: comTroca, motivo: 'familia_da_troca', texto: '' })));
  expect(await screen.findByText('1 encaixe para Theo')).toBeInTheDocument();
  expect(screen.queryByRole('article', { name: 'Opção 2' })).not.toBeInTheDocument();
});

it('sem troca, o motivo "a família da outra criança" nem aparece', async () => {
  await procurar();

  fireEvent.click(within(screen.getByRole('article', { name: 'Opção 1' })).getByRole('button', { name: 'Não' }));
  const janela = await screen.findByRole('dialog', { name: 'Por que não essa opção?' });

  expect(within(janela).queryByText(/não aceita mudar/)).not.toBeInTheDocument();
  expect(within(janela).getByLabelText(/O horário é ruim para a família de Theo/)).toBeInTheDocument();
});

describe('Para agendar (a recepção)', () => {
  const encaixe = {
    id: 'e1', status: 'para_agendar', paciente: { id: 'paciente-theo', nome: 'Theo Martins' },
    opcao: { ...comTroca, sessoes: [comTroca.sessoes[0], sessao(ana, 'quinta', '14:10', '15:00')] },
    criadoPor: { uid: 'coord', nome: 'Carla Coordenadora' }, comecaEm: '2026-10-13', recado: 'Avisar pelo WhatsApp', agendadas: { 0: true },
  };

  beforeEach(() => {
    (contarParaAgendar as jest.Mock).mockResolvedValue(1);
    (listarParaAgendar as jest.Mock).mockResolvedValue([encaixe]);
    (excluirEncaixe as jest.Mock).mockResolvedValue(undefined);
  });

  it('mostra o que falta fazer: a troca na agenda e cada sessão para agendar, já preenchida', async () => {
    render(<AssistenteDeEncaixe abaInicial="para-agendar" />);

    const item = await screen.findByRole('article', { name: 'Theo Martins' });
    expect(item).toHaveTextContent('Escolhido por Carla Coordenadora');
    expect(item).toHaveTextContent('Começa: terça, 13/10');
    expect(item).toHaveTextContent('Recado da coordenação: Avisar pelo WhatsApp');
    expect(item).toHaveTextContent('Confirmar com a família de Lucas Souza a mudança de 14:10 para 15:00 na terça.');
    expect(within(item).getByRole('link', { name: 'Abrir a agenda de terça, 13/10' })).toHaveAttribute('href', '/agendamentos?data=2026-10-13');
    expect(within(item).getAllByRole('link', { name: 'Agendar' })).toHaveLength(1);
    expect(within(item).getByRole('link', { name: 'Agendar' })).toHaveAttribute('href', '/agendamentos/novo?encaixe=e1&sessao=1');
    expect(item).toHaveTextContent('Agendada');
    expect(await screen.findByText('para agendar')).toBeInTheDocument(); // o número laranja da aba
  });

  it('excluir avisa que a sugestão pode voltar', async () => {
    render(<AssistenteDeEncaixe abaInicial="para-agendar" />);

    fireEvent.click(within(await screen.findByRole('article', { name: 'Theo Martins' })).getByRole('button', { name: /Excluir/ }));
    const aviso = await screen.findByRole('alertdialog', { name: 'Excluir este encaixe?' });
    expect(aviso).toHaveTextContent('O assistente pode sugerir esse encaixe de novo até a recepção agendar');
    fireEvent.click(within(aviso).getByRole('button', { name: 'Excluir' }));

    await waitFor(() => expect(excluirEncaixe).toHaveBeenCalledWith('e1'));
    await waitFor(() => expect(screen.queryByRole('article', { name: 'Theo Martins' })).not.toBeInTheDocument());
  });
});

it('Recusados mostra o motivo e desfaz', async () => {
  (listarRecusados as jest.Mock).mockResolvedValue([{
    id: 'r1', status: 'recusado', paciente: { id: 'paciente-theo', nome: 'Theo Martins' }, opcao: comTroca,
    criadoPor: { uid: 'coord', nome: 'Carla Coordenadora' }, motivo: { tipo: 'familia_da_troca', texto: 'A mãe não pode' },
  }]);
  (excluirEncaixe as jest.Mock).mockResolvedValue(undefined);
  render(<AssistenteDeEncaixe abaInicial="recusados" />);

  const item = await screen.findByRole('article', { name: 'Theo Martins' });
  expect(item).toHaveTextContent('Motivo: A família de Lucas não aceita mudar · "A mãe não pode"');
  fireEvent.click(within(item).getByRole('button', { name: 'Desfazer' }));

  await waitFor(() => expect(excluirEncaixe).toHaveBeenCalledWith('r1'));
});

it('as terapias oferecidas são as do convênio da criança', () => {
  const especialidades = [
    { id: '1', name: 'Fonoaudiologia', value: 0 }, { id: '2', name: 'Fonoaudiologia Unimed', value: 0 }, { id: '3', name: 'Psicologia Amil', value: 0 },
  ] as any;

  expect(terapiasDaCrianca(especialidades, undefined).map((e) => e.name)).toEqual(['Fonoaudiologia']);
  expect(terapiasDaCrianca(especialidades, 'Unimed').map((e) => e.name)).toEqual(['Fonoaudiologia Unimed']);
  expect(terapiasDaCrianca(especialidades, 'Unimed, Particular').map((e) => e.name)).toEqual(['Fonoaudiologia', 'Fonoaudiologia Unimed']);
});
