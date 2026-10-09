// __tests__/firebase/arquivarConversa.test.ts
// Arquivar e excluir de vez uma conversa: só o admin. Arquivada, ela some da lista de todos e ninguém
// manda mensagem, mas as mensagens ficam guardadas e desarquivar devolve as pessoas. Excluir de vez
// só vale para conversa arquivada e apaga as mensagens junto (senão voltariam num grupo novo da criança).
// Roda contra o emulador: npm run test:firebase
import { RulesTestEnvironment } from '@firebase/rules-unit-testing';
import { arrayUnion, collection, doc, getDoc, getDocs, setDoc, Timestamp, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebaseConfig';
import {
  arquivarGrupo, ChatGroup, desarquivarGrupo, excluirGrupoDeVez, getGroupDetails, getGroupMembers, sendMessage,
} from '@/services/chatService';
import { criarGrupo, criarUsuario, encerrarAmbiente, entrarComo, iniciarAmbiente, limparDados, type UsuarioDeTeste } from './helpers';

let testEnv: RulesTestEnvironment;
let admin: UsuarioDeTeste;
let coordenacao: UsuarioDeTeste;
let familia: UsuarioDeTeste;
let terapeuta: UsuarioDeTeste;
let grupoId: string;

beforeAll(async () => {
  testEnv = await iniciarAmbiente();
});
afterAll(encerrarAmbiente);

beforeEach(async () => {
  await limparDados();
  admin = await criarUsuario('Ana Admin', { role: 'admin' });
  coordenacao = await criarUsuario('Carla Coordenadora', { role: 'coordenador' });
  familia = await criarUsuario('Maria Souza', { role: 'familiar' });
  terapeuta = await criarUsuario('Paula Fonoaudióloga', { role: 'profissional' });
  grupoId = await criarGrupo([familia, terapeuta], coordenacao);
  // Duas mensagens antigas
  await testEnv.withSecurityRulesDisabled(async (contexto) => {
    for (const [i, quem] of [familia, terapeuta].entries()) {
      await setDoc(doc(contexto.firestore(), 'chat_groups', grupoId, 'messages', `antiga-${i}`), {
        senderId: quem.uid, senderName: quem.displayName, senderRole: quem.role, content: `Mensagem ${i}`, type: 'text',
        createdAt: Timestamp.fromMillis(Date.UTC(2026, 0, 2 + i)),
      });
    }
  });
});

const grupo = async () => (await getGroupDetails(grupoId)) as ChatGroup;
const mensagem = (quem: UsuarioDeTeste) => ({ content: 'Olá', senderId: quem.uid, senderName: quem.displayName, senderRole: quem.role });

it('o admin arquiva: a conversa sai da lista de todos, ninguém manda mensagem e as mensagens ficam guardadas', async () => {
  await entrarComo(admin);
  await arquivarGrupo(await grupo(), { nome: 'Ana Admin' });

  const arquivado = await grupo();
  expect(arquivado).toEqual(expect.objectContaining({
    arquivado: true, arquivadoPor: 'Ana Admin', memberIds: [], membrosAntesDeArquivar: [familia.uid, terapeuta.uid],
  }));
  expect(arquivado.arquivadoEm).toBeInstanceOf(Timestamp);
  expect((await getGroupMembers(arquivado)).map((m) => m.uid)).toEqual([familia.uid, terapeuta.uid]);
  expect((await sendMessage(grupoId, mensagem(admin))).success).toBe(false);

  await entrarComo(familia);
  await expect(getDoc(doc(db, 'chat_groups', grupoId))).rejects.toThrow();
  expect((await sendMessage(grupoId, mensagem(familia))).success).toBe(false);

  await entrarComo(coordenacao);
  expect((await getDocs(collection(db, 'chat_groups', grupoId, 'messages'))).size).toBe(2);
  // Enquanto arquivada, a coordenação não põe ninguém de volta
  await expect(updateDoc(doc(db, 'chat_groups', grupoId), { memberIds: arrayUnion(familia.uid) })).rejects.toThrow();
});

it('desarquivar devolve as mesmas pessoas, que voltam a ver as mensagens e a conversar', async () => {
  await entrarComo(admin);
  await arquivarGrupo(await grupo(), { nome: 'Ana Admin' });
  await desarquivarGrupo(await grupo());

  const devolvido = await grupo();
  expect(devolvido.memberIds).toEqual([familia.uid, terapeuta.uid]);
  expect(devolvido.arquivado).toBe(false);
  expect(devolvido.membrosAntesDeArquivar).toBeUndefined();

  await entrarComo(familia);
  expect((await getDocs(collection(db, 'chat_groups', grupoId, 'messages'))).size).toBe(2);
  expect((await sendMessage(grupoId, mensagem(familia))).success).toBe(true);
});

it('só o admin arquiva', async () => {
  for (const pessoa of [coordenacao, terapeuta, familia]) {
    await entrarComo(pessoa);
    await expect(arquivarGrupo((await grupo()) ?? ({ id: grupoId, memberIds: [] } as unknown as ChatGroup), { nome: pessoa.displayName })).rejects.toThrow();
  }
});

it('excluir de vez apaga as mensagens e o grupo; um grupo novo com o mesmo id começa vazio', async () => {
  await entrarComo(admin);
  await arquivarGrupo(await grupo(), { nome: 'Ana Admin' });
  await excluirGrupoDeVez(grupoId);

  expect(await getGroupDetails(grupoId)).toBeNull();
  await testEnv.withSecurityRulesDisabled(async (contexto) => {
    expect((await getDocs(collection(contexto.firestore(), 'chat_groups', grupoId, 'messages'))).size).toBe(0);
  });
});

it('excluir de vez não vale para conversa ativa, nem para quem não é admin', async () => {
  await entrarComo(admin);
  await expect(excluirGrupoDeVez(grupoId)).rejects.toThrow();

  await arquivarGrupo(await grupo(), { nome: 'Ana Admin' });
  await entrarComo(coordenacao);
  await expect(excluirGrupoDeVez(grupoId)).rejects.toThrow();

  await testEnv.withSecurityRulesDisabled(async (contexto) => {
    expect((await getDocs(collection(contexto.firestore(), 'chat_groups', grupoId, 'messages'))).size).toBe(2);
  });
});
