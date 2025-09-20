// jest.config.mjs
import nextJest from 'next/jest.js'

const createJestConfig = nextJest({
  // Fornece o caminho para o seu aplicativo Next.js para carregar os ficheiros next.config.mjs e .env no seu ambiente de teste
  dir: './',
})

// Adicione qualquer configuração personalizada para o Jest aqui
const customJestConfig = {
  // Adiciona mais matchers do jest-dom e permite que os utilize nos seus testes
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  
  // Define o ambiente de teste como o jsdom (simula um navegador)
  testEnvironment: 'jest-environment-jsdom',
  
  // Mapeia o alias de importação '@/*' que está no seu tsconfig.json para o Jest entender
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1',
  },
}

// createJestConfig é exportado desta forma para garantir que o next/jest possa carregar a configuração do Next.js
export default createJestConfig(customJestConfig)