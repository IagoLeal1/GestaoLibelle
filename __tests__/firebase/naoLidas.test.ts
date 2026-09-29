// __tests__/firebase/naoLidas.test.ts
// Avisos de mensagens não lidas. Roda contra o emulador: npm run test:firebase
import { Timestamp } from 'firebase/firestore';
import {
  ChatGroup,
  countUnreadMessages,
  getGroupDetails,
  hasUnread,
  markChatAsRead,
  sendMessage,
} from '@/services/chatService';
import {
  aguardarGrupos,
  criarGrupo,
  criarUsuario,
  encerrarAmbiente,
  entrarComo,
  iniciarAmbiente,
  limparDados,
  UsuarioDeTeste,
} from './helpers';

// 5 de outubro de 2026, 12h (UTC), mais n minutos: depois da data de corte das não lidas
const depoisDoCorte = (n: number) => Timestamp.fromMillis(Date.UTC(2026, 9, 5, 12, 0) + n * 60_000);

const grupo = (dados: Partial<ChatGroup>) => ({ id: 'g', memberIds: ['maria', 'paula'], ...dados }) as ChatGroup;

describe('não lidas', () => {
  it('mensagem de outra pessoa depois da minha última leitura fica como não lida', () => {
    const g = grupo({
      lastMessage: { content: 'Oi', senderId: 'paula', senderName: 'Paula', createdAt: depoisDoCorte(10) },
      lastReadAt: { maria: depoisDoCorte(5) },
    });

    expect(hasUnread(g, 'maria')).toBe(true);
  });

  it('mensagem que chegou antes da minha última leitura já está lida', () => {
    const g = grupo({
      lastMessage: { content: 'Oi', senderId: 'paula', senderName: 'Paula', createdAt: depoisDoCorte(5) },
      lastReadAt: { maria: depoisDoCorte(10) },
    });

    expect(hasUnread(g, 'maria')).toBe(false);
  });

  it('a minha própria mensagem não conta como não lida', () => {
    const g = grupo({
      lastMessage: { content: 'Oi', senderId: 'maria', senderName: 'Maria', createdAt: depoisDoCorte(10) },
    });

    expect(hasUnread(g, 'maria')).toBe(false);
  });

  it('conversa antiga, sem registro de leitura, conta como lida', () => {
    const g = grupo({
      lastMessage: { content: 'Oi', senderId: 'paula', senderName: 'Paula', createdAt: Timestamp.fromMillis(Date.UTC(2026, 8, 1)) },
    });

    expect(hasUnread(g, 'maria')).toBe(false);
  });

  it('mensagem nova, sem registro de leitura, conta como não lida', () => {
    const g = grupo({
      lastMessage: { content: 'Oi', senderId: 'paula', senderName: 'Paula', createdAt: depoisDoCorte(10) },
    });

    expect(hasUnread(g, 'maria')).toBe(true);
  });

  it('conversa sem mensagens não tem aviso', () => {
    expect(hasUnread(grupo({ lastMessage: undefined }), 'maria')).toBe(false);
  });
});

describe('marcar como lida', () => {
  let maria: UsuarioDeTeste;
  let paula: UsuarioDeTeste;
  let carla: UsuarioDeTeste;

  beforeAll(iniciarAmbiente);
  afterAll(encerrarAmbiente);

  beforeEach(async () => {
    await limparDados();
    maria = await criarUsuario('Maria Souza', { role: 'familiar' });
    paula = await criarUsuario('Paula Fonoaudióloga', { role: 'profissional' });
    carla = await criarUsuario('Carla Coordenadora', { role: 'coordenador' });
  });

  it('abrir a conversa apaga o aviso de não lida', async () => {
    const grupoId = await criarGrupo([maria, paula, carla], carla);
    await entrarComo(paula);
    await sendMessage(grupoId, {
      content: 'Sessão confirmada para amanhã',
      senderId: paula.uid,
      senderName: paula.displayName,
      senderRole: paula.role,
    });
    await entrarComo(maria);

    await markChatAsRead(grupoId, maria.uid);

    const [lido] = await aguardarGrupos(maria.uid, (gs) => gs.length === 1 && !hasUnread(gs[0], maria.uid));
    expect(lido.lastReadAt?.[maria.uid]).toBeDefined();
  });

  it('conta as mensagens que chegaram depois da última leitura', async () => {
    const grupoId = await criarGrupo([maria, paula, carla], carla);
    const enviarComoPaula = (content: string) =>
      sendMessage(grupoId, { content, senderId: paula.uid, senderName: paula.displayName, senderRole: paula.role });

    await entrarComo(paula);
    await enviarComoPaula('Primeira');
    await entrarComo(maria);
    await markChatAsRead(grupoId, maria.uid);
    await entrarComo(paula);
    await enviarComoPaula('Segunda');
    await enviarComoPaula('Terceira');
    await entrarComo(maria);

    const grupo = await getGroupDetails(grupoId);
    expect(await countUnreadMessages(grupo!, maria.uid)).toBe(2);
  });
});
