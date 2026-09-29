// jest.firebase.config.mjs
// Testes que rodam contra o emulador do Firebase (regras do Firestore e serviços).
// Use: npm run test:firebase (sobe e derruba o emulador sozinho).
import nextJest from 'next/jest.js'

const createJestConfig = nextJest({
  dir: './',
})

const customJestConfig = {
  // O SDK do Firebase usa a versão para Node fora do navegador
  testEnvironment: 'node',

  testMatch: ['<rootDir>/__tests__/firebase/**/*.test.ts'],

  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1',
  },

  // Todos os arquivos usam o mesmo emulador; em paralelo, um apagaria os dados do outro
  maxWorkers: 1,

  // Lista cada teste; as regras são lidas como especificação
  verbose: true,
}

export default createJestConfig(customJestConfig)
