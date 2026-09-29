// scripts/seed-emulator.mjs
// Popula o emulador local do Firebase com usuários, pacientes e conversas de teste.
//
// Uso:
//   npm run emulators        (em um terminal, deixe rodando)
//   npm run seed:emulator    (em outro terminal)
//
// Só roda contra o emulador: o projeto "demo-libelle" não existe na nuvem,
// e as variáveis abaixo fazem o firebase-admin falar apenas com o emulador.
// Cada execução apaga os dados do emulador e recria tudo do zero.

const PROJECT_ID = 'demo-libelle';
const FIRESTORE_HOST = '127.0.0.1:8080';
const AUTH_HOST = '127.0.0.1:9099';

process.env.FIRESTORE_EMULATOR_HOST = FIRESTORE_HOST;
process.env.FIREBASE_AUTH_EMULATOR_HOST = AUTH_HOST;

const { initializeApp } = await import('firebase-admin/app');
const { getAuth } = await import('firebase-admin/auth');
const { getFirestore, Timestamp } = await import('firebase-admin/firestore');

// Senha de todos os usuários de teste. Existe só no emulador.
const SENHA_TESTE = 'libelle-teste-123';

const USUARIOS = [
  { uid: 'admin-teste', email: 'admin@libelle.test', displayName: 'Ana Admin', role: 'admin', status: 'aprovado' },
  { uid: 'coord-teste', email: 'coordenacao@libelle.test', displayName: 'Carla Coordenadora', role: 'coordenador', status: 'aprovado' },
  { uid: 'terapeuta1-teste', email: 'terapeuta1@libelle.test', displayName: 'Paula Fonoaudióloga', role: 'profissional', status: 'aprovado' },
  { uid: 'terapeuta2-teste', email: 'terapeuta2@libelle.test', displayName: 'Rui Psicólogo', role: 'profissional', status: 'aprovado' },
  { uid: 'familia1-teste', email: 'familia1@libelle.test', displayName: 'Maria Souza', role: 'familiar', status: 'aprovado' },
  { uid: 'familia2-teste', email: 'familia2@libelle.test', displayName: 'João Lima', role: 'familiar', status: 'aprovado' },
  { uid: 'pendente-teste', email: 'pendente@libelle.test', displayName: 'Pedro Pendente', role: 'familiar', status: 'pendente' },
  // Tem login, mas não tem documento em users (é o que o "excluir usuário" deixa para trás)
  { uid: 'removido-teste', email: 'removido@libelle.test', displayName: 'Rita Removida', role: null, status: null },
];

const porUid = Object.fromEntries(USUARIOS.map((u) => [u.uid, u]));

async function garantirEmulador() {
  try {
    const resposta = await fetch(`http://${FIRESTORE_HOST}/`);
    if (!resposta.ok) throw new Error(`status ${resposta.status}`);
  } catch {
    console.error('Emulador do Firestore não encontrado em', FIRESTORE_HOST);
    console.error('Suba o emulador com "npm run emulators" e rode este script de novo.');
    process.exit(1);
  }
}

async function limparEmulador() {
  await fetch(
    `http://${FIRESTORE_HOST}/emulator/v1/projects/${PROJECT_ID}/databases/(default)/documents`,
    { method: 'DELETE' }
  );
  await fetch(`http://${AUTH_HOST}/emulator/v1/projects/${PROJECT_ID}/accounts`, { method: 'DELETE' });
}

function mensagensDoGrupo(membros, total, inicio) {
  return Array.from({ length: total }, (_, i) => {
    const autor = porUid[membros[i % membros.length]];
    return {
      senderId: autor.uid,
      senderName: autor.displayName,
      senderRole: autor.role,
      content: `Mensagem ${i + 1} de ${total}`,
      // Uma mensagem a cada 30 minutos, terminando agora
      createdAt: Timestamp.fromMillis(inicio + i * 30 * 60 * 1000),
      // Formato atual de produção (readBy nunca é atualizado depois)
      readBy: [autor.uid],
      type: 'text',
    };
  });
}

function grupo({ familiaUid, criadorUid, terapeutaUids, mensagens }) {
  const familia = porUid[familiaUid];
  const ultima = mensagens.at(-1);
  // Mesmo formato gravado hoje por createChatGroup (o "paciente" é a conta da família)
  return {
    pacienteId: familia.uid,
    pacienteNome: familia.displayName,
    responsavelId: familia.uid,
    responsavelNome: familia.displayName,
    terapeutaIds: terapeutaUids,
    terapeutaNomes: terapeutaUids.map((uid) => porUid[uid].displayName),
    memberIds: [familia.uid, criadorUid, ...terapeutaUids],
    createdBy: criadorUid,
    createdAt: mensagens[0].createdAt,
    updatedAt: ultima.createdAt,
    unreadCounts: {},
    lastMessage: {
      content: ultima.content,
      senderName: ultima.senderName,
      createdAt: ultima.createdAt,
    },
  };
}

await garantirEmulador();
await limparEmulador();

initializeApp({ projectId: PROJECT_ID });
const auth = getAuth();
const db = getFirestore();
const agora = Timestamp.now();

for (const usuario of USUARIOS) {
  await auth.createUser({
    uid: usuario.uid,
    email: usuario.email,
    password: SENHA_TESTE,
    displayName: usuario.displayName,
  });
}

const batch = db.batch();

for (const usuario of USUARIOS.filter((u) => u.role)) {
  batch.set(db.doc(`users/${usuario.uid}`), {
    uid: usuario.uid,
    displayName: usuario.displayName,
    email: usuario.email,
    profile: {
      role: usuario.role,
      status: usuario.status,
      cpf: null,
      telefone: null,
      createdAt: agora,
      historyHidden: false,
    },
  });
}

for (const [uid, especialidade] of [['terapeuta1-teste', 'Fonoaudiologia'], ['terapeuta2-teste', 'Psicologia']]) {
  batch.set(db.doc(`professionals/${uid}`), {
    userId: uid,
    fullName: porUid[uid].displayName,
    email: porUid[uid].email,
    status: 'ativo',
    especialidade,
    conselho: '',
    numeroConselho: '',
    cpf: '',
    telefone: '',
    celular: '',
    diasAtendimento: ['segunda', 'terca', 'quarta', 'quinta', 'sexta'],
    horarioInicio: '08:00',
    horarioFim: '17:00',
    dataContratacao: agora,
    financeiro: { tipoPagamento: 'repasse', percentualRepasse: 50 },
  });
}

for (const [id, fullName, familiaUid] of [['paciente-lucas', 'Lucas Souza', 'familia1-teste'], ['paciente-bia', 'Bia Lima', 'familia2-teste']]) {
  const familia = porUid[familiaUid];
  batch.set(db.doc(`patients/${id}`), {
    fullName,
    cpf: '000.000.000-00',
    dataNascimento: Timestamp.fromDate(new Date('2019-05-10T00:00:00Z')),
    status: 'ativo',
    dataCadastro: agora,
    emailCadastro: familia.email,
    userId: familia.uid,
    responsavel: { nome: familia.displayName, email: familia.email },
  });
}

// Grupo A: 150 mensagens, para reproduzir o limite de 100
const membrosA = ['familia1-teste', 'coord-teste', 'terapeuta1-teste'];
const mensagensA = mensagensDoGrupo(membrosA, 150, agora.toMillis() - 149 * 30 * 60 * 1000);
batch.set(db.doc('chat_groups/grupo-maria-souza'), grupo({
  familiaUid: 'familia1-teste',
  criadorUid: 'coord-teste',
  terapeutaUids: ['terapeuta1-teste'],
  mensagens: mensagensA,
}));
mensagensA.forEach((mensagem, i) => {
  const id = `msg-${String(i + 1).padStart(3, '0')}`;
  batch.set(db.doc(`chat_groups/grupo-maria-souza/messages/${id}`), mensagem);
});

// Grupo B: poucas mensagens, de outra família
const membrosB = ['familia2-teste', 'admin-teste', 'terapeuta2-teste'];
const mensagensB = mensagensDoGrupo(membrosB, 3, agora.toMillis() - 2 * 30 * 60 * 1000);
batch.set(db.doc('chat_groups/grupo-joao-lima'), grupo({
  familiaUid: 'familia2-teste',
  criadorUid: 'admin-teste',
  terapeutaUids: ['terapeuta2-teste'],
  mensagens: mensagensB,
}));
mensagensB.forEach((mensagem, i) => {
  batch.set(db.doc(`chat_groups/grupo-joao-lima/messages/msg-${i + 1}`), mensagem);
});

await batch.commit();

console.log('Emulador populado. Logins de teste (senha em SENHA_TESTE, neste arquivo):');
for (const usuario of USUARIOS) {
  const perfil = usuario.role ? `${usuario.role}, ${usuario.status}` : 'sem documento em users';
  console.log(`  ${usuario.email.padEnd(26)} ${usuario.displayName} (${perfil})`);
}
console.log('Conversas: grupo-maria-souza (150 mensagens) e grupo-joao-lima (3 mensagens).');
process.exit(0);
