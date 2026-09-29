// __tests__/firebase/linhaDoTempo.test.ts
// Como a conversa é montada na tela: divisórias de dia, "Novas mensagens" e agrupamento.
import { Timestamp } from 'firebase/firestore';
import { buildTimeline, ChatMessage } from '@/services/chatService';

// Horário local: 10/10/2026 às hh:mm
const as = (dia: number, h: number, m: number) => Timestamp.fromDate(new Date(2026, 9, dia, h, m));

let seq = 0;
const mensagem = (senderId: string, createdAt: Timestamp, content = `m${++seq}`) =>
  ({ id: `id-${seq}`, senderId, senderName: senderId, senderRole: 'profissional', content, createdAt, type: 'text' }) as ChatMessage;

/** Resume a linha do tempo em texto, para comparar com o esperado. */
const resumo = (itens: ReturnType<typeof buildTimeline>) =>
  itens.map((item) =>
    item.kind === 'day' ? `[dia ${item.date.getDate()}]` : item.kind === 'unread' ? '[novas]' : `${item.senderId}:${item.messages.length}`
  );

describe('linha do tempo da conversa', () => {
  it('separa por dia e junta mensagens seguidas da mesma pessoa', () => {
    const itens = buildTimeline([
      mensagem('paula', as(10, 9, 0)),
      mensagem('paula', as(10, 9, 2)),
      mensagem('maria', as(10, 9, 3)),
      mensagem('paula', as(11, 8, 0)),
    ], 'maria', null);

    expect(resumo(itens)).toEqual(['[dia 10]', 'paula:2', 'maria:1', '[dia 11]', 'paula:1']);
  });

  it('não junta mensagens da mesma pessoa com mais de 5 minutos de diferença', () => {
    const itens = buildTimeline([mensagem('paula', as(10, 9, 0)), mensagem('paula', as(10, 9, 30))], 'maria', null);

    expect(resumo(itens)).toEqual(['[dia 10]', 'paula:1', 'paula:1']);
  });

  it('marca onde começam as mensagens que chegaram depois da minha leitura', () => {
    const itens = buildTimeline([
      mensagem('paula', as(10, 9, 0)),
      mensagem('paula', as(10, 9, 1)),
      mensagem('paula', as(10, 9, 2)),
    ], 'maria', as(10, 9, 0));

    expect(resumo(itens)).toEqual(['[dia 10]', 'paula:1', '[novas]', 'paula:2']);
  });

  it('não marca como nova a minha própria mensagem', () => {
    const itens = buildTimeline([mensagem('paula', as(10, 9, 0)), mensagem('maria', as(10, 9, 5))], 'maria', as(10, 9, 1));

    expect(resumo(itens)).toEqual(['[dia 10]', 'paula:1', 'maria:1']);
  });
});
