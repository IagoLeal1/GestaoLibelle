// scripts/dev-emulator.mjs
// Sobe o app apontado para o emulador local do Firebase (npm run dev:emulator).
//
// As variáveis do .env.emulator entram no ambiente antes do Next. Como o Next não
// sobrescreve variáveis que já existem, os valores de produção do .env.local
// para essas mesmas chaves são ignorados.
// (node --env-file não serve aqui: o Next repassa as opções do Node via NODE_OPTIONS,
// onde --env-file é proibido.)
import { spawn } from 'node:child_process';

process.loadEnvFile('.env.emulator');

const next = spawn(process.execPath, ['node_modules/next/dist/bin/next', 'dev', '-p', '3001'], {
  stdio: 'inherit',
});

for (const sinal of ['SIGINT', 'SIGTERM']) {
  process.on(sinal, () => next.kill(sinal));
}
next.on('exit', (code) => process.exit(code ?? 0));
