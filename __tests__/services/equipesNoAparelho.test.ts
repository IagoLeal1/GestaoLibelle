// __tests__/services/equipesNoAparelho.test.ts
// Para gastar menos leituras: ao abrir o site, o terapeuta conferia no banco, criança por criança, se
// já estava na equipe de cada uma. Agora o aparelho lembra as que já foram conferidas (só os códigos
// das crianças) e só confere as novas. Se o prontuário falhar, aquela criança é conferida de novo.
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { entrarNaEquipeDaCrianca, entrarNasEquipes, esquecerEquipe } from '@/services/evolucaoService';

jest.mock('firebase/firestore');

const sessao = (id: string, patientId: string) => ({ id, patientId, status: 'agendado' });

beforeEach(() => {
  jest.clearAllMocks();
  localStorage.clear();
  (doc as jest.Mock).mockImplementation((_db, ...caminho: string[]) => caminho.join('/'));
  (getDoc as jest.Mock).mockResolvedValue({ exists: () => true });
  (setDoc as jest.Mock).mockResolvedValue(undefined);
});

it('confere cada criança no banco uma vez só; depois, só as crianças novas', async () => {
  await entrarNasEquipes('paula', [sessao('s1', 'lucas'), sessao('s2', 'bia')]);
  expect(getDoc).toHaveBeenCalledTimes(2);

  await entrarNasEquipes('paula', [sessao('s3', 'lucas'), sessao('s4', 'bia'), sessao('s5', 'theo')]);

  expect(getDoc).toHaveBeenCalledTimes(3);
  expect(getDoc).toHaveBeenLastCalledWith('patients/theo/equipe/paula');
});

it('o aparelho guarda só os códigos das crianças, por terapeuta', async () => {
  await entrarNasEquipes('paula', [sessao('s1', 'lucas')]);

  expect(JSON.parse(localStorage.getItem('libelle:equipes:paula')!)).toEqual(['lucas']);
  await entrarNasEquipes('rui', [sessao('s1', 'lucas')]);
  expect(getDoc).toHaveBeenCalledTimes(2); // outra pessoa no mesmo aparelho confere de novo
});

it('ao abrir o prontuário de uma criança já conferida, não lê o banco', async () => {
  await entrarNasEquipes('paula', [sessao('s1', 'lucas')]);
  (getDoc as jest.Mock).mockClear();

  expect(await entrarNaEquipeDaCrianca('paula', 'lucas', 'prof-paula')).toBe(true);
  expect(getDoc).not.toHaveBeenCalled();
});

it('esquecer uma criança faz conferir de novo (quando o prontuário dela falhou)', async () => {
  await entrarNasEquipes('paula', [sessao('s1', 'lucas')]);
  (getDoc as jest.Mock).mockClear();

  esquecerEquipe('paula', 'lucas');
  await entrarNaEquipeDaCrianca('paula', 'lucas', 'prof-paula');

  expect(getDoc).toHaveBeenCalledWith('patients/lucas/equipe/paula');
});
