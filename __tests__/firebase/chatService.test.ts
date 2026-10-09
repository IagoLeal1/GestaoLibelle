// __tests__/firebase/chatService.test.ts
// Roda contra o emulador do Firebase: npm run test:firebase
import { Timestamp } from 'firebase/firestore';
import {
  ChatMessage,
  countUnreadMessages,
  getGroupDetails,
  loadOlderMessages,
  mergeMessages,
  sendMessage,
  subscribeToChatMessages,
  subscribeToUserGroups,
} from '@/services/chatService';
import {
  aguardarGrupos,
  aguardarLeitura,
  criarGrupo,
  criarMensagens,
  criarUsuario,
  encerrarAmbiente,
  entrarComo,
  iniciarAmbiente,
  limparDados,
  removerCadastro,
  UsuarioDeTeste,
} from './helpers';

describe('chatService', () => {
  let familia: UsuarioDeTeste;
  let terapeuta: UsuarioDeTeste;
  let coordenacao: UsuarioDeTeste;

  beforeAll(iniciarAmbiente);
  afterAll(encerrarAmbiente);

  beforeEach(async () => {
    await limparDados();
    familia = await criarUsuario('Maria Souza', { role: 'familiar' });
    terapeuta = await criarUsuario('Paula Fonoaudióloga', { role: 'profissional' });
    coordenacao = await criarUsuario('Carla Coordenadora', { role: 'coordenador' });
  });

  describe('conversa', () => {
    // A conversa abre com as 40 mais recentes (menos leituras); as anteriores carregam ao rolar
    it('mostra as 40 mensagens mais recentes quando o grupo tem mais de 40', async () => {
      const grupoId = await criarGrupo([familia, terapeuta, coordenacao], coordenacao);
      await criarMensagens(grupoId, [familia, terapeuta], 150);
      await entrarComo(familia);

      const mensagens = await aguardarLeitura(grupoId);

      expect(mensagens.map((m) => m.content)).toEqual(
        Array.from({ length: 40 }, (_, i) => `Mensagem ${111 + i}`)
      );
    });

    it('mostra a mensagem recém-enviada mesmo com mais de 40 no grupo', async () => {
      const grupoId = await criarGrupo([familia, terapeuta, coordenacao], coordenacao);
      await criarMensagens(grupoId, [familia, terapeuta], 150);
      await entrarComo(familia);

      // Espera a conversa completa: o Firestore mostra a mensagem enviada antes de o servidor devolver o resto
      const leitura = aguardarLeitura(
        grupoId,
        (m) => m.length === 40 && m.at(-1)?.content === 'Oi, tudo bem?'
      );
      await sendMessage(grupoId, {
        content: 'Oi, tudo bem?',
        senderId: familia.uid,
        senderName: familia.displayName,
        senderRole: familia.role,
      });

      const mensagens = await leitura;
      expect(mensagens.map((m) => m.content)).toEqual([
        ...Array.from({ length: 39 }, (_, i) => `Mensagem ${112 + i}`),
        'Oi, tudo bem?',
      ]);
    });

    it('carrega as mensagens anteriores às que já estão na tela', async () => {
      const grupoId = await criarGrupo([familia, terapeuta, coordenacao], coordenacao);
      await criarMensagens(grupoId, [familia, terapeuta], 150);
      await entrarComo(familia);
      const naTela = await aguardarLeitura(grupoId);

      const pagina = await loadOlderMessages(grupoId, naTela[0], 20);

      expect(pagina.messages.map((m) => m.content)).toEqual(
        Array.from({ length: 20 }, (_, i) => `Mensagem ${91 + i}`)
      );
      expect(pagina.hasMore).toBe(true);
    });

    it('avisa que não há mais nada quando a página traz as primeiras mensagens do grupo', async () => {
      const grupoId = await criarGrupo([familia, terapeuta, coordenacao], coordenacao);
      await criarMensagens(grupoId, [familia, terapeuta], 150);
      await entrarComo(familia);
      const naTela = await aguardarLeitura(grupoId);

      const pagina = await loadOlderMessages(grupoId, naTela[0], 110);

      expect(pagina.messages[0].content).toBe('Mensagem 1');
      expect(pagina.hasMore).toBe(false);
    });

    describe('junção da tela com a janela ao vivo', () => {
      const mensagem = (n: number) =>
        ({ id: `msg-${n}`, content: `Mensagem ${n}`, createdAt: Timestamp.fromMillis(n * 60_000) }) as ChatMessage;

      it('mantém na tela as mensagens que saem da janela ao vivo quando chegam novas', () => {
        const naTela = [1, 2, 3, 4, 5].map(mensagem);
        // A janela ao vivo andou: a 2 saiu dela e a 6 chegou
        const janelaAoVivo = [3, 4, 5, 6].map(mensagem);

        const resultado = mergeMessages(naTela, janelaAoVivo);

        expect(resultado.map((m) => m.content)).toEqual([
          'Mensagem 1', 'Mensagem 2', 'Mensagem 3', 'Mensagem 4', 'Mensagem 5', 'Mensagem 6',
        ]);
      });

      it('tira da tela a mensagem que o servidor recusou', () => {
        // A 6 foi enviada e apareceu na hora, ainda pendente, empurrando a 1 para fora da janela
        const naTela = [1, 2, 3, 4, 5, 6].map(mensagem);
        // O servidor recusou a 6: ela some da janela, que volta a começar na 2
        const janelaAoVivo = [2, 3, 4, 5].map(mensagem);

        const resultado = mergeMessages(naTela, janelaAoVivo);

        expect(resultado.map((m) => m.content)).toEqual([
          'Mensagem 1', 'Mensagem 2', 'Mensagem 3', 'Mensagem 4', 'Mensagem 5',
        ]);
      });

      it('não repete a primeira mensagem da conversa quando o servidor confirma o horário dela', () => {
        // Enviada numa conversa vazia: aparece na hora com o relógio do aparelho...
        const naTela = [mensagem(1)];
        // ...e volta do servidor com o horário dele, um pouco depois
        const confirmada = { ...mensagem(1), createdAt: Timestamp.fromMillis(60_000 + 350) } as ChatMessage;

        const resultado = mergeMessages(naTela, [confirmada]);

        expect(resultado).toEqual([confirmada]);
      });
    });
  });

  describe('envio', () => {
    it('a própria mensagem não conta como nova quando alguém responde depois', async () => {
      const grupoId = await criarGrupo([familia, terapeuta, coordenacao], coordenacao);
      // A terapeuta responde e sai da conversa logo em seguida
      await entrarComo(terapeuta);
      await sendMessage(grupoId, {
        content: 'Até quinta!',
        senderId: terapeuta.uid,
        senderName: terapeuta.displayName,
        senderRole: terapeuta.role,
      });
      await entrarComo(familia);
      await sendMessage(grupoId, {
        content: 'Obrigada!',
        senderId: familia.uid,
        senderName: familia.displayName,
        senderRole: familia.role,
      });

      await entrarComo(terapeuta);
      const grupo = await getGroupDetails(grupoId);

      expect(await countUnreadMessages(grupo!, terapeuta.uid)).toBe(1);
    });

    it('atualiza a prévia da conversa com a mensagem e quem enviou', async () => {
      const grupoId = await criarGrupo([familia, terapeuta, coordenacao], coordenacao);
      await entrarComo(terapeuta);

      await sendMessage(grupoId, {
        content: 'Sessão remarcada para quinta',
        senderId: terapeuta.uid,
        senderName: terapeuta.displayName,
        senderRole: terapeuta.role,
      });

      const grupos = await aguardarGrupos(
        terapeuta.uid,
        (g) => g[0]?.lastMessage?.content === 'Sessão remarcada para quinta'
      );
      expect(grupos[0].lastMessage).toMatchObject({
        content: 'Sessão remarcada para quinta',
        senderName: 'Paula Fonoaudióloga',
        senderId: terapeuta.uid,
      });
    });

    it('registra o horário do servidor, mesmo com o relógio do aparelho errado', async () => {
      const grupoId = await criarGrupo([familia, terapeuta, coordenacao], coordenacao);
      await entrarComo(familia);

      const relogioErrado = jest.spyOn(Date, 'now').mockReturnValue(Date.UTC(2020, 0, 1));
      try {
        await sendMessage(grupoId, {
          content: 'Bom dia',
          senderId: familia.uid,
          senderName: familia.displayName,
          senderRole: familia.role,
        });
      } finally {
        relogioErrado.mockRestore();
      }

      const [mensagem] = await aguardarLeitura(grupoId, (m) => m.length === 1);
      expect(mensagem.createdAt.toDate().getUTCFullYear()).toBeGreaterThan(2020);
    });

    it('mostra a mensagem enviada na hora, antes da confirmação do servidor, já com horário', async () => {
      const grupoId = await criarGrupo([familia, terapeuta, coordenacao], coordenacao);
      await entrarComo(familia);

      // A primeira lista com a mensagem é a local, antes de o servidor confirmar o envio
      const leitura = aguardarLeitura(grupoId, (m) => m.some((x) => x.content === 'Chegando!'));
      const envio = sendMessage(grupoId, {
        content: 'Chegando!',
        senderId: familia.uid,
        senderName: familia.displayName,
        senderRole: familia.role,
      });
      const mensagens = await leitura;
      await envio;

      const enviada = mensagens.find((m) => m.content === 'Chegando!');
      expect(enviada?.createdAt?.toMillis()).toEqual(expect.any(Number));
    });

    it('atualiza a prévia na hora, antes da confirmação do servidor, já com horário', async () => {
      const grupoId = await criarGrupo([familia, terapeuta, coordenacao], coordenacao);
      await entrarComo(familia);

      const leitura = aguardarGrupos(familia.uid, (g) => g[0]?.lastMessage?.content === 'Chegando!');
      const envio = sendMessage(grupoId, {
        content: 'Chegando!',
        senderId: familia.uid,
        senderName: familia.displayName,
        senderRole: familia.role,
      });
      const [grupo] = await leitura;
      await envio;

      expect(grupo.lastMessage?.createdAt?.toMillis()).toEqual(expect.any(Number));
    });
  });

  describe('erros', () => {
    it('avisa quando a pessoa não tem acesso à conversa', async () => {
      const outraFamilia = await criarUsuario('João Lima', { role: 'familiar' });
      const grupoId = await criarGrupo([familia, terapeuta, coordenacao], coordenacao);
      await entrarComo(outraFamilia);

      const erro = await new Promise((resolve) => {
        subscribeToChatMessages(grupoId, () => {}, resolve);
      });

      expect(erro).toMatchObject({ code: 'permission-denied' });
    });

    it('avisa quando a lista de conversas não pode ser carregada', async () => {
      await criarGrupo([familia, terapeuta, coordenacao], coordenacao);
      await removerCadastro(familia);
      await entrarComo(familia);

      const erro = await new Promise((resolve) => {
        subscribeToUserGroups(familia.uid, () => {}, resolve);
      });

      expect(erro).toMatchObject({ code: 'permission-denied' });
    });
  });
});
