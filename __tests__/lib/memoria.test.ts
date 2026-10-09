// __tests__/lib/memoria.test.ts
// Para gastar menos leituras: as listas que várias telas leem (crianças, profissionais, salas, terapias)
// são lidas do banco uma vez e reaproveitadas por 10 minutos, só na memória do site. Quem grava numa
// delas manda esquecer, e a próxima tela lê de novo.
import { esquecer, esquecerTudo, lembrar } from '@/lib/memoria';

beforeEach(() => {
  esquecerTudo();
  jest.useFakeTimers({ now: new Date(2026, 9, 8, 10, 0) });
});
afterEach(() => jest.useRealTimers());

it('a segunda tela reaproveita o que a primeira leu', async () => {
  const buscar = jest.fn().mockResolvedValue(['Lucas']);

  expect(await lembrar('patients:ativo', buscar)).toEqual(['Lucas']);
  expect(await lembrar('patients:ativo', buscar)).toEqual(['Lucas']);
  expect(buscar).toHaveBeenCalledTimes(1);
});

it('duas telas pedindo ao mesmo tempo fazem uma leitura só', async () => {
  const buscar = jest.fn().mockResolvedValue(['Lucas']);

  await Promise.all([lembrar('patients:ativo', buscar), lembrar('patients:ativo', buscar)]);

  expect(buscar).toHaveBeenCalledTimes(1);
});

it('depois de 10 minutos, lê de novo', async () => {
  const buscar = jest.fn().mockResolvedValue(['Lucas']);
  await lembrar('patients:ativo', buscar);

  jest.advanceTimersByTime(10 * 60 * 1000);
  await lembrar('patients:ativo', buscar);

  expect(buscar).toHaveBeenCalledTimes(2);
});

it('esquecer pelo começo do nome apaga as variações da lista (ativos, todos...)', async () => {
  const buscar = jest.fn().mockResolvedValue([]);
  const salas = jest.fn().mockResolvedValue([]);
  await lembrar('patients:ativo', buscar);
  await lembrar('patients:todos', buscar);
  await lembrar('rooms:todas', salas);

  esquecer('patients:');
  await lembrar('patients:ativo', buscar);
  await lembrar('patients:todos', buscar);
  await lembrar('rooms:todas', salas);

  expect(buscar).toHaveBeenCalledTimes(4);
  expect(salas).toHaveBeenCalledTimes(1);
});

it('um erro não fica guardado: a próxima tela tenta de novo', async () => {
  const buscar = jest.fn().mockRejectedValueOnce(new Error('sem internet')).mockResolvedValueOnce(['Lucas']);

  await expect(lembrar('patients:ativo', buscar)).rejects.toThrow('sem internet');
  expect(await lembrar('patients:ativo', buscar)).toEqual(['Lucas']);
});
