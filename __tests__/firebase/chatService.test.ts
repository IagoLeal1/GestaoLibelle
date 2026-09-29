// __tests__/firebase/chatService.test.ts
// Roda contra o emulador do Firebase: npm run test:firebase
import { Timestamp } from 'firebase/firestore';
import {
  ChatGroup,
  ChatMessage,
  loadOlderMessages,
  mergeMessages,
  sendMessage,
  subscribeToChatMessages,
  subscribeToUserGroups,
} from '@/services/chatService';
import {
  criarGrupo,
  criarMensagens,
  criarUsuario,
  encerrarAmbiente,
  entrarComo,
  iniciarAmbiente,
  limparDados,
  UsuarioDeTeste,
} from './helpers';

/**
 * Assina a conversa e resolve com a primeira lista que atende a condição.
 * Se ela não aparecer no prazo, falha mostrando como terminava a última lista recebida.
 */
function aguardarLeitura(
  grupoId: string,
  condicao: (mensagens: ChatMessage[]) => boolean = () => true,
  prazoMs = 3000
): Promise<ChatMessage[]> {
  return new Promise((resolve, reject) => {
    let ultima: ChatMessage[] = [];
    const prazo = setTimeout(() => {
      cancelar();
      reject(new Error(`Condição não atendida em ${prazoMs} ms; a última lista terminava em "${ultima.at(-1)?.content}"`));
    }, prazoMs);
    const cancelar = subscribeToChatMessages(grupoId, (mensagens) => {
      ultima = mensagens;
      if (condicao(mensagens)) {
        clearTimeout(prazo);
        cancelar();
        resolve(mensagens);
      }
    });
  });
}

/** Igual a aguardarLeitura, mas para a lista de conversas do usuário. */
function aguardarGrupos(
  uid: string,
  condicao: (grupos: ChatGroup[]) => boolean,
  prazoMs = 3000
): Promise<ChatGroup[]> {
  return new Promise((resolve, reject) => {
    let ultima: ChatGroup[] = [];
    const prazo = setTimeout(() => {
      cancelar();
      reject(new Error(`Condição não atendida em ${prazoMs} ms; última prévia: ${JSON.stringify(ultima[0]?.lastMessage)}`));
    }, prazoMs);
    const cancelar = subscribeToUserGroups(uid, (grupos) => {
      ultima = grupos;
      if (condicao(grupos)) {
        clearTimeout(prazo);
        cancelar();
        resolve(grupos);
      }
    });
  });
}

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
    it('mostra as 100 mensagens mais recentes quando o grupo tem mais de 100', async () => {
      const grupoId = await criarGrupo([familia, terapeuta, coordenacao], coordenacao);
      await criarMensagens(grupoId, [familia, terapeuta], 150);
      await entrarComo(familia);

      const mensagens = await aguardarLeitura(grupoId);

      expect(mensagens.map((m) => m.content)).toEqual(
        Array.from({ length: 100 }, (_, i) => `Mensagem ${51 + i}`)
      );
    });

    it('mostra a mensagem recém-enviada mesmo com mais de 100 no grupo', async () => {
      const grupoId = await criarGrupo([familia, terapeuta, coordenacao], coordenacao);
      await criarMensagens(grupoId, [familia, terapeuta], 150);
      await entrarComo(familia);

      // Espera a conversa completa: o Firestore mostra a mensagem enviada antes de o servidor devolver o resto
      const leitura = aguardarLeitura(
        grupoId,
        (m) => m.length === 100 && m.at(-1)?.content === 'Oi, tudo bem?'
      );
      await sendMessage(grupoId, {
        content: 'Oi, tudo bem?',
        senderId: familia.uid,
        senderName: familia.displayName,
        senderRole: familia.role,
      });

      const mensagens = await leitura;
      expect(mensagens.map((m) => m.content)).toEqual([
        ...Array.from({ length: 99 }, (_, i) => `Mensagem ${52 + i}`),
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
        Array.from({ length: 20 }, (_, i) => `Mensagem ${31 + i}`)
      );
      expect(pagina.hasMore).toBe(true);
    });

    it('avisa que não há mais nada quando a página traz as primeiras mensagens do grupo', async () => {
      const grupoId = await criarGrupo([familia, terapeuta, coordenacao], coordenacao);
      await criarMensagens(grupoId, [familia, terapeuta], 150);
      await entrarComo(familia);
      const naTela = await aguardarLeitura(grupoId);

      const pagina = await loadOlderMessages(grupoId, naTela[0], 50);

      expect(pagina.messages[0].content).toBe('Mensagem 1');
      expect(pagina.hasMore).toBe(false);
    });

    it('mantém na tela as mensagens que saem da janela ao vivo quando chegam novas', () => {
      const mensagem = (n: number) =>
        ({ id: `msg-${n}`, content: `Mensagem ${n}`, createdAt: Timestamp.fromMillis(n * 60_000) }) as ChatMessage;
      const naTela = [1, 2, 3, 4, 5].map(mensagem);
      // A janela ao vivo andou: a 2 saiu dela e a 6 chegou
      const janelaAoVivo = [3, 4, 5, 6].map(mensagem);

      const resultado = mergeMessages(naTela, janelaAoVivo);

      expect(resultado.map((m) => m.content)).toEqual([
        'Mensagem 1', 'Mensagem 2', 'Mensagem 3', 'Mensagem 4', 'Mensagem 5', 'Mensagem 6',
      ]);
    });
  });

  describe('envio', () => {
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
  });
});
