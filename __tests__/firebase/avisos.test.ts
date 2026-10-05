// __tests__/firebase/avisos.test.ts
// Os avisos pelo app, com as regras do banco: cada papel recebe a lista do seu público, quem
// recebe confirma a leitura, a recepção envia e edita o próprio aviso e a gestão conta quem leu.
// Roda contra o emulador: npm run test:firebase
import { RulesTestEnvironment } from '@firebase/rules-unit-testing';
import { doc, getDoc, setDoc, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebaseConfig';
import { FirestoreUser } from '@/context/AuthContext';
import {
  Communication, createCommunication, getCommunications, getPessoasDaClinica, markCommunicationAsRead, updateCommunication,
} from '@/services/communicationService';
import { criarUsuario, encerrarAmbiente, entrarComo, iniciarAmbiente, limparDados, UsuarioDeTeste } from './helpers';

let testEnv: RulesTestEnvironment;
let carla: UsuarioDeTeste;
let rafa: UsuarioDeTeste;
let paula: UsuarioDeTeste;
let maria: UsuarioDeTeste;

beforeAll(async () => {
  testEnv = await iniciarAmbiente();
});
afterAll(encerrarAmbiente);

beforeEach(async () => {
  await limparDados();
  carla = await criarUsuario('Carla Coordenadora', { role: 'coordenador' });
  rafa = await criarUsuario('Rafa Recepção', { role: 'funcionario' });
  paula = await criarUsuario('Paula Fonoaudióloga', { role: 'profissional' });
  maria = await criarUsuario('Maria Souza', { role: 'familiar' });
  await criarUsuario('Pedro Pendente', { role: 'familiar', status: 'pendente' });

  // Um aviso para cada público, do mais antigo (equipe, há 3 dias) ao mais novo (famílias, hoje)
  await testEnv.withSecurityRulesDisabled(async (contexto) => {
    const banco = contexto.firestore();
    const publicos: [string, number][] = [['equipe', 3], ['terapeutas', 2], ['coordenador', 1], ['familiar', 0]];
    for (const [targetRole, dias] of publicos) {
      await setDoc(doc(banco, 'communications', `aviso-${targetRole}`), {
        title: `Para ${targetRole}`,
        message: 'Texto do aviso.',
        isImportant: false,
        targetRole,
        authorId: carla.uid,
        authorName: carla.displayName,
        createdAt: Timestamp.fromMillis(Date.now() - dias * 24 * 60 * 60 * 1000),
        readBy: {},
      });
    }
  });
});

const titulos = (avisos: Communication[]) => avisos.map((a) => a.title);
const comoAutor = (usuario: UsuarioDeTeste) => ({ uid: usuario.uid, displayName: usuario.displayName }) as FirestoreUser;

describe('avisos pelo app', () => {
  it('cada papel recebe a lista do seu público, do mais novo para o mais antigo', async () => {
    await entrarComo(paula);
    expect(titulos(await getCommunications('profissional'))).toEqual(['Para terapeutas', 'Para equipe']);

    await entrarComo(maria);
    expect(titulos(await getCommunications('familiar'))).toEqual(['Para familiar']);

    await entrarComo(rafa);
    expect(titulos(await getCommunications('funcionario'))).toEqual(['Para familiar', 'Para coordenador', 'Para terapeutas', 'Para equipe']);
  });

  it('quem recebe confirma a leitura', async () => {
    await entrarComo(maria);

    expect(await markCommunicationAsRead('aviso-familiar', maria.uid)).toMatchObject({ success: true });

    const aviso = await getDoc(doc(db, 'communications', 'aviso-familiar'));
    expect(Object.keys(aviso.data()?.readBy)).toEqual([maria.uid]);
  });

  it('a recepção envia um aviso e edita o próprio', async () => {
    await entrarComo(rafa);

    const envio = await createCommunication(
      { title: 'Novo horário', message: 'Das 7h às 19h.', isImportant: false, targetRole: 'familiar' },
      comoAutor(rafa)
    );
    expect(envio).toMatchObject({ success: true });

    const edicao = await updateCommunication(envio.id!, { title: 'Novo horário da recepção', message: 'Das 7h às 19h.' });
    expect(edicao).toMatchObject({ success: true });
    expect((await getDoc(doc(db, 'communications', envio.id!))).data()?.title).toBe('Novo horário da recepção');
  });

  it('a gestão vê as pessoas aprovadas e o papel de cada uma, para contar quem leu', async () => {
    await entrarComo(carla);

    const pessoas = await getPessoasDaClinica();

    expect(pessoas.map((p) => `${p.displayName} (${p.papel})`).sort()).toEqual([
      'Carla Coordenadora (coordenador)',
      'Maria Souza (familiar)',
      'Paula Fonoaudióloga (profissional)',
      'Rafa Recepção (funcionario)',
    ]);
  });
});
