// jest.setup.js

// Importa os "matchers" personalizados do jest-dom.
// Isto permite-nos usar verificações mais legíveis como .toBeInTheDocument()
import '@testing-library/jest-dom';
// Adiciona a funcionalidade 'fetch' ao ambiente de teste do Jest
import 'whatwg-fetch'; 

// Importa os "matchers" personalizados do jest-dom.
import '@testing-library/jest-dom';
// A memória das listas (lib/memoria) começa vazia em cada teste
import { esquecerTudo } from '@/lib/memoria';
beforeEach(() => esquecerTudo());
