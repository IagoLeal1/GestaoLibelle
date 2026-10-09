// __tests__/lib/ajuda.test.ts
// A página de Ajuda: cada papel vê só os guias do que pode fazer, a busca ignora acentos e nenhum guia
// manda alguém para uma tela que o papel dele não abre.
import {
  ASSUNTOS, GUIAS, PAPEIS, assuntosDoPapel, buscarGuias, comecePorAqui, duracaoDoGuia, guiaPorId, guiasDoPapel, podeVerGuia,
  proximoGuia, telaParaPasso, temTelas, trechos, type Guia,
} from '@/lib/ajuda';
import { podeAcessar } from '@/lib/permissoes';

describe('os guias', () => {
  it('cada guia tem um endereço único, um assunto que existe e de 1 a 6 passos', () => {
    const ids = GUIAS.map((g) => g.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const g of GUIAS) {
      expect(ASSUNTOS.some((a) => a.id === g.assunto)).toBe(true);
      expect(g.passos.length).toBeGreaterThanOrEqual(1);
      expect(g.passos.length).toBeLessThanOrEqual(6);
      expect(g.papeis.length).toBeGreaterThan(0);
      expect(g.id).toMatch(/^[a-z0-9-]+$/);
    }
  });

  it('o botão "Ir para" de cada guia leva a uma tela que todos os papéis do guia abrem', () => {
    for (const g of GUIAS) {
      if (!g.tela) continue;
      for (const papel of g.papeis) {
        expect([g.id, papel, podeAcessar(g.tela.href, papel)]).toEqual([g.id, papel, true]);
      }
    }
  });

  it('os guias citados em "Veja também" existem', () => {
    for (const g of GUIAS) {
      for (const id of g.relacionados ?? []) expect([g.id, guiaPorId(id)?.id]).toEqual([g.id, id]);
    }
  });

  it('todo papel tem guias e um "Comece por aqui" só com guias que ele vê', () => {
    for (const papel of PAPEIS) {
      expect(guiasDoPapel(papel).length).toBeGreaterThan(3);
      const comeco = comecePorAqui(papel);
      expect(comeco.length).toBeGreaterThanOrEqual(2);
      for (const g of comeco) expect(g.papeis).toContain(papel);
    }
  });
});

describe('cada um vê o seu', () => {
  it('o terapeuta vê como escrever a evolução; a recepção e a família não', () => {
    expect(podeVerGuia(guiaPorId('escrever-evolucao')!, 'profissional')).toBe(true);
    expect(podeVerGuia(guiaPorId('escrever-evolucao')!, 'funcionario')).toBe(false);
    expect(podeVerGuia(guiaPorId('escrever-evolucao')!, 'familiar')).toBe(false);
  });

  it('o Financeiro é só do admin', () => {
    for (const papel of PAPEIS.filter((p) => p !== 'admin')) {
      expect(assuntosDoPapel(papel).map((a) => a.assunto.id)).not.toContain('financeiro');
    }
    expect(assuntosDoPapel('admin').map((a) => a.assunto.id)).toContain('financeiro');
  });

  it('a família não vê a agenda da clínica', () => {
    expect(assuntosDoPapel('familiar').map((a) => a.assunto.id)).not.toContain('agenda');
  });

  it('em "tudo", o admin vê todos os guias, inclusive os do terapeuta e da família', () => {
    expect(guiasDoPapel('tudo')).toHaveLength(GUIAS.length);
    expect(podeVerGuia(guiaPorId('escrever-evolucao')!, 'tudo')).toBe(true);
    expect(guiasDoPapel('admin').length).toBeLessThan(GUIAS.length);
  });

  it('assuntos sem guia para o papel não aparecem', () => {
    for (const papel of PAPEIS) {
      for (const { guias } of assuntosDoPapel(papel)) expect(guias.length).toBeGreaterThan(0);
    }
  });
});

describe('buscarGuias', () => {
  const doTerapeuta = guiasDoPapel('profissional');

  it('acha sem acento e sem maiúscula', () => {
    expect(buscarGuias(doTerapeuta, 'EVOLUCAO').map((g) => g.id)).toContain('escrever-evolucao');
  });

  it('todas as palavras precisam aparecer, em qualquer ordem', () => {
    const achados = buscarGuias(doTerapeuta, 'evolução corrigir').map((g) => g.id);
    expect(achados).toContain('corrigir-evolucao');
    expect(achados).not.toContain('instalar-no-celular');
  });

  it('o título conta mais que o texto dos passos', () => {
    expect(buscarGuias(doTerapeuta, 'celular')[0].id).toBe('instalar-no-celular');
  });

  it('acha pela palavra parecida: "renovação" acha o guia de renovar', () => {
    expect(buscarGuias(guiasDoPapel('funcionario'), 'renovação').map((g) => g.id)).toContain('renovar-pacotes');
    expect(buscarGuias(guiasDoPapel('funcionario'), 'pacotes').map((g) => g.id)).toContain('renovar-pacotes');
  });

  it('busca vazia não acha nada', () => {
    expect(buscarGuias(doTerapeuta, '   ')).toEqual([]);
  });
});

describe('proximoGuia', () => {
  it('é o seguinte do mesmo assunto que o papel vê; no último, não há', () => {
    const daRecepcao = assuntosDoPapel('funcionario').find((a) => a.assunto.id === 'agenda')!.guias;
    expect(proximoGuia(daRecepcao[0], 'funcionario')?.id).toBe(daRecepcao[1].id);
    expect(proximoGuia(daRecepcao[daRecepcao.length - 1], 'funcionario')).toBeUndefined();
  });
});

describe('trechos', () => {
  it('separa o negrito do texto comum', () => {
    expect(trechos('Toque em **Salvar** e pronto.')).toEqual([
      { texto: 'Toque em ', negrito: false },
      { texto: 'Salvar', negrito: true },
      { texto: ' e pronto.', negrito: false },
    ]);
  });
});

// ——— Ajuda nova: cada passo pode mostrar uma tela de exemplo, com o lugar de tocar aceso ———
describe('telaParaPasso', () => {
  const guia = (passos: Guia['passos']) => ({ ...GUIAS[0], passos });

  it('o passo com tela mostra a dele, com o lugar aceso', () => {
    expect(telaParaPasso(guia([{ texto: 'a', tela: { id: 'agenda', alvo: 'novo' } }]), 0)).toEqual({ id: 'agenda', alvo: 'novo' });
  });

  it('o passo sem tela repete a do passo anterior, sem acender nada', () => {
    const g = guia([{ texto: 'a', tela: { id: 'agenda', alvo: 'novo' } }, { texto: 'b' }]);
    expect(telaParaPasso(g, 1)).toEqual({ id: 'agenda' });
  });

  it('o primeiro passo sem tela usa a do próximo passo que tem', () => {
    const g = guia([{ texto: 'a' }, { texto: 'b', tela: { id: 'prontuario', alvo: 'abas' } }]);
    expect(telaParaPasso(g, 0)).toEqual({ id: 'prontuario' });
  });

  it('guia sem nenhuma tela não tem', () => {
    expect(telaParaPasso(guia([{ texto: 'a' }]), 0)).toBeNull();
    expect(temTelas(guia([{ texto: 'a' }]))).toBe(false);
  });
});

it('a duração do guia: uns 2 passos e meio por minuto, no mínimo 1 minuto', () => {
  const passos = (n: number) => ({ ...GUIAS[0], passos: Array.from({ length: n }, () => ({ texto: 'x' })) });
  expect(duracaoDoGuia(passos(2))).toBe('2 passos · 1 minuto');
  expect(duracaoDoGuia(passos(4))).toBe('4 passos · 1 minuto');
  expect(duracaoDoGuia(passos(5))).toBe('5 passos · 2 minutos');
  expect(duracaoDoGuia(passos(1))).toBe('1 passo · 1 minuto');
});
