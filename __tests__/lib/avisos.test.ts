// __tests__/lib/avisos.test.ts
// Os avisos da clínica: para quem vai cada aviso, quem leu, o que é novo para cada pessoa e quem
// pode editar ou excluir. As regras do banco (firestore.rules) seguem o mesmo desenho.
import {
  contarNovos, destinatarios, leitura, novoParaMim, PapelDeUsuario, possoMexer, PUBLICOS_PARA_ENVIAR,
  publicosQueRecebe, PublicoDoAviso,
} from '@/lib/avisos';

const pessoas: { uid: string; papel: PapelDeUsuario }[] = [
  { uid: 'ana', papel: 'admin' },
  { uid: 'carla', papel: 'coordenador' },
  { uid: 'rafa', papel: 'funcionario' },
  { uid: 'paula', papel: 'profissional' },
  { uid: 'rui', papel: 'profissional' },
  { uid: 'maria', papel: 'familiar' },
  { uid: 'joao', papel: 'familiar' },
];

const aviso = (targetRole: PublicoDoAviso, extra: { authorId?: string; readBy?: Record<string, unknown> } = {}) => ({
  targetRole,
  authorId: 'carla',
  readBy: {},
  ...extra,
});

const uids = (lista: { uid: string }[]) => lista.map((p) => p.uid);
const paula = { uid: 'paula', papel: 'profissional' as const };

describe('para quem vai cada aviso', () => {
  it('a equipe toda: terapeutas, recepção, coordenação e administração, sem quem escreveu', () => {
    expect(uids(destinatarios(aviso('equipe'), pessoas))).toEqual(['ana', 'rafa', 'paula', 'rui']);
  });

  it('aviso para as famílias não conta a gestão como destinatária', () => {
    expect(uids(destinatarios(aviso('familiar', { authorId: 'ana' }), pessoas))).toEqual(['maria', 'joao']);
  });

  it('terapeutas são só os terapeutas; coordenação inclui a administração', () => {
    expect(uids(destinatarios(aviso('terapeutas'), pessoas))).toEqual(['paula', 'rui']);
    expect(uids(destinatarios(aviso('coordenador', { authorId: 'rafa' }), pessoas))).toEqual(['ana', 'carla']);
  });

  it('os avisos internos antigos ("profissional") eram para a equipe toda', () => {
    expect(uids(destinatarios(aviso('profissional', { authorId: 'ana' }), pessoas))).toEqual(['carla', 'rafa', 'paula', 'rui']);
  });

  it('para enviar há quatro públicos', () => {
    expect(PUBLICOS_PARA_ENVIAR).toEqual(['equipe', 'terapeutas', 'coordenador', 'familiar']);
  });
});

describe('quem leu', () => {
  it('conta só os destinatários: a leitura de quem escreveu não entra', () => {
    const resultado = leitura(aviso('equipe', { readBy: { carla: 1, rafa: 1, rui: 1 } }), pessoas);

    expect(uids(resultado.leram)).toEqual(['rafa', 'rui']);
    expect(uids(resultado.naoLeram)).toEqual(['ana', 'paula']);
    expect(resultado.total).toBe(4);
  });
});

describe('o que é novo para cada pessoa', () => {
  it('novo é o aviso para mim que eu ainda não li', () => {
    expect(novoParaMim(aviso('equipe'), paula)).toBe(true);
    expect(novoParaMim(aviso('equipe', { readBy: { paula: 1 } }), paula)).toBe(false);
  });

  it('para quem escreveu, e para a gestão nos avisos das famílias, nada é novo', () => {
    expect(novoParaMim(aviso('equipe'), { uid: 'carla', papel: 'coordenador' })).toBe(false);
    expect(novoParaMim(aviso('familiar'), { uid: 'ana', papel: 'admin' })).toBe(false);
  });

  it('o sininho conta só os avisos novos para a pessoa', () => {
    const avisos = [aviso('equipe'), aviso('familiar'), aviso('terapeutas', { readBy: { paula: 1 } })];

    expect(contarNovos(avisos, paula)).toBe(1);
    expect(contarNovos(avisos, { uid: 'ana', papel: 'admin' })).toBe(1);
  });
});

describe('quem vê e quem mexe', () => {
  it('o terapeuta recebe os avisos da equipe, dos terapeutas e os internos antigos; a família, os das famílias', () => {
    expect(publicosQueRecebe('profissional')).toEqual(['equipe', 'terapeutas', 'profissional']);
    expect(publicosQueRecebe('familiar')).toEqual(['familiar']);
  });

  it('editar e excluir: quem escreveu, a administração e a coordenação', () => {
    const doRafa = aviso('familiar', { authorId: 'rafa' });

    expect(possoMexer(doRafa, { uid: 'rafa', papel: 'funcionario' })).toBe(true);
    expect(possoMexer(aviso('familiar', { authorId: 'ana' }), { uid: 'rafa', papel: 'funcionario' })).toBe(false);
    expect(possoMexer(doRafa, { uid: 'carla', papel: 'coordenador' })).toBe(true);
    expect(possoMexer(doRafa, { uid: 'ana', papel: 'admin' })).toBe(true);
    expect(possoMexer(doRafa, paula)).toBe(false);
  });
});
