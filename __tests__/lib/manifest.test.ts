// __tests__/lib/manifest.test.ts
// O site no celular como aplicativo: "Adicionar à tela de início" põe o ícone da Casa Libelle e
// abre o site sem a barra do navegador.
import { existsSync } from 'fs';
import { join } from 'path';
import manifest from '@/app/manifest';

it('abre como aplicativo, com o nome e o ícone da Casa Libelle', () => {
  const app = manifest();

  expect(app).toMatchObject({ name: 'Casa Libelle', short_name: 'Libelle', start_url: '/', display: 'standalone' });
  expect(app.icons?.map((i) => i.sizes)).toEqual(expect.arrayContaining(['192x192', '512x512']));
});

it('os ícones existem na pasta pública', () => {
  for (const icone of manifest().icons ?? []) {
    expect(existsSync(join(process.cwd(), 'public', icone.src))).toBe(true);
  }
});
