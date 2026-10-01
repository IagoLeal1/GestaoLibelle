# Casa Libelle — Gestão Clínica

Sistema da clínica de terapias Casa Libelle: agenda, pacientes, profissionais, financeiro, comunicados e mensagens com as famílias.

Next.js 16, TypeScript, Firebase (Authentication e Firestore), Tailwind e shadcn/ui.

## Quem vê o quê

| Papel | Acesso |
| --- | --- |
| Admin | Tudo, inclusive Financeiro e aprovação de contas |
| Coordenação e recepção | Agenda, pacientes, profissionais e comunicados |
| Profissional | Consulta a agenda e os pacientes |
| Família | Atendimentos, avisos e mensagens das suas crianças |

Quem garante isso é o `firestore.rules`, não as telas.

## Rodar no computador

Precisa do Node 20.9 ou mais novo.

```bash
npm install
npm run dev
```

O `npm run dev` usa o banco **de produção**, com as chaves do `.env.local`, que nunca vai para o Git:

- `NEXT_PUBLIC_FIREBASE_*`: as chaves do app, no console do Firebase;
- `FIREBASE_PROJECT_ID`, `FIREBASE_CLIENT_EMAIL` e `FIREBASE_PRIVATE_KEY`: a conta de serviço, usada pelo servidor.

## Testar sem tocar na produção

Precisa do Java 21. No Mac: `brew install openjdk@21` e `export PATH="/opt/homebrew/opt/openjdk@21/bin:$PATH"`.

```bash
npm run emulators        # deixe rodando
npm run seed:emulator    # cria usuários e dados de teste
npm run dev:emulator     # abre em http://localhost:3001
```

Os logins de teste estão em `scripts/seed-emulator.mjs`.

## Verificações

```bash
npm run typecheck        # erros de tipo
npx jest                 # testes rápidos
npm run test:firebase    # regras do banco e serviços, no emulador
```

## Publicar

1. **Código:** o push no `main` publica o site.
2. **Regras:** se o `firestore.rules` mudou, publique no console do Firebase **depois** do código. Antes, guarde uma cópia das regras atuais.

---

Feito por Iago Leal de Mattos ([@IagoLeal1](https://github.com/IagoLeal1)).
