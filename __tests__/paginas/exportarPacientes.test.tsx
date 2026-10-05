// __tests__/paginas/exportarPacientes.test.tsx
// A planilha de pacientes leva a data no nome do arquivo. A data vinha em UTC: a partir das 21h de
// Brasília, o arquivo saía com a data de amanhã.
import '@testing-library/jest-dom';
import { fireEvent, render, screen } from '@testing-library/react';
import PacientesPage from '@/app/(dashboard)/pacientes/page';

jest.mock('@/lib/firebaseConfig', () => ({ db: {}, auth: {} }));
jest.mock('@/context/AuthContext', () => ({
  useAuth: () => ({ firestoreUser: { uid: 'recepcao-uid', profile: { role: 'funcionario' } } }),
}));
jest.mock('@/services/patientService', () => ({
  getPatients: jest.fn().mockResolvedValue([{ id: 'paciente-lucas', fullName: 'Lucas Souza', convenio: 'particular', status: 'ativo' }]),
}));
jest.mock('@/components/pages/patient-client-page', () => ({
  PatientClientPage: ({ data }: { data: unknown[] }) => <p>{data.length} na lista</p>,
}));

afterEach(() => {
  jest.useRealTimers();
  jest.restoreAllMocks();
});

it('à noite, o arquivo sai com a data de hoje, não a de amanhã', async () => {
  // 22h30 no relógio do aparelho (em Brasília, já é o dia seguinte em UTC)
  jest.useFakeTimers({ now: new Date(2026, 9, 1, 22, 30), advanceTimers: true });
  URL.createObjectURL = jest.fn(() => 'blob:planilha');
  let nomeDoArquivo = '';
  jest.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(function (this: HTMLAnchorElement) {
    nomeDoArquivo = this.getAttribute('download') ?? '';
  });

  render(<PacientesPage />);
  // Espera a lista de pacientes chegar antes de baixar
  await screen.findByText('1 na lista');
  fireEvent.click(screen.getByRole('button', { name: /Exportar Excel/ }));
  fireEvent.click(await screen.findByRole('button', { name: /Baixar Excel/ }));

  expect(nomeDoArquivo).toBe('pacientes_todos_2026-10-01.csv');
});
