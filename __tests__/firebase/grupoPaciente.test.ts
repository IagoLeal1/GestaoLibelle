// __tests__/firebase/grupoPaciente.test.ts
// Grupo de conversa ligado ao paciente, participantes e supervisão da coordenação.
// Roda contra o emulador: npm run test:firebase
import {
  addGroupMembers,
  ChatGroup,
  createPatientChatGroup,
  getApprovedPeople,
  getGroupDetails,
  getGroupMembers,
  getPatientTeamSuggestion,
  isLegacyGroup,
  linkGroupToPatient,
  patientGroupId,
  removeGroupMember,
  subscribeToAllGroups,
  subscribeToChatMessages,
} from '@/services/chatService';
import {
  aguardarGrupos,
  criarAgendamento,
  criarGrupo,
  criarPaciente,
  criarProfissional,
  criarUsuario,
  encerrarAmbiente,
  entrarComo,
  iniciarAmbiente,
  limparDados,
  UsuarioDeTeste,
} from './helpers';

// Um ambiente por arquivo: encerrar desliga o Firebase para os blocos seguintes
beforeAll(iniciarAmbiente);
afterAll(encerrarAmbiente);

describe('grupo do paciente', () => {
  let maria: UsuarioDeTeste;
  let joao: UsuarioDeTeste;
  let paula: UsuarioDeTeste;
  let carla: UsuarioDeTeste;

  beforeEach(async () => {
    await limparDados();
    maria = await criarUsuario('Maria Souza', { role: 'familiar' });
    joao = await criarUsuario('João Souza', { role: 'familiar' });
    paula = await criarUsuario('Paula Fonoaudióloga', { role: 'profissional' });
    carla = await criarUsuario('Carla Coordenadora', { role: 'coordenador' });
  });

  const membro = (u: UsuarioDeTeste) => ({ uid: u.uid, nome: u.displayName, papel: u.role });

  it('a coordenação cria o grupo com o nome da criança, e a família passa a vê-lo', async () => {
    const lucas = await criarPaciente('paciente-lucas', 'Lucas Souza', maria);
    await entrarComo(carla);

    const resultado = await createPatientChatGroup({ paciente: lucas, membros: [membro(maria), membro(paula)], criadoPor: carla.uid });

    expect(resultado).toMatchObject({ success: true });
    await entrarComo(maria);
    const [grupo] = await aguardarGrupos(maria.uid, (gs) => gs.length === 1);
    expect(grupo).toMatchObject({ pacienteId: 'paciente-lucas', pacienteNome: 'Lucas Souza' });
  });

  it('não cria um segundo grupo para a mesma criança nem mexe no que já existe', async () => {
    const lucas = await criarPaciente('paciente-lucas', 'Lucas Souza', maria);
    await entrarComo(carla);
    await createPatientChatGroup({ paciente: lucas, membros: [membro(maria)], criadoPor: carla.uid });

    const segunda = await createPatientChatGroup({ paciente: lucas, membros: [membro(maria), membro(joao)], criadoPor: carla.uid });

    expect(segunda).toMatchObject({ success: false, error: 'ja-existe' });
    const grupo = await getGroupDetails(patientGroupId('paciente-lucas'));
    expect(grupo?.memberIds).not.toContain(joao.uid);
  });

  it('não cria grupo novo para a criança que já tem um grupo antigo vinculado', async () => {
    const lucas = await criarPaciente('paciente-lucas', 'Lucas Souza', maria);
    const antigo = await criarGrupo([maria, paula, carla], carla);
    await entrarComo(carla);
    await linkGroupToPatient(antigo, lucas);

    const resultado = await createPatientChatGroup({ paciente: lucas, membros: [membro(maria)], criadoPor: carla.uid });

    expect(resultado).toEqual({ success: false, id: antigo, error: 'ja-existe' });
    expect(await getGroupDetails(patientGroupId('paciente-lucas'))).toBeNull();
  });

  it('lista para escolha só as pessoas com cadastro aprovado, em ordem alfabética', async () => {
    await criarUsuario('Pedro Pendente', { role: 'familiar', status: 'pendente' });
    await entrarComo(carla);

    const pessoas = await getApprovedPeople();

    expect(pessoas.map((p) => p.nome)).toEqual(['Carla Coordenadora', 'João Souza', 'Maria Souza', 'Paula Fonoaudióloga']);
  });

  it('sugere a família vinculada e os terapeutas que atendem a criança', async () => {
    const rui = await criarUsuario('Rui Psicólogo', { role: 'profissional' });
    await criarPaciente('paciente-lucas', 'Lucas Souza', maria);
    await criarProfissional('prof-paula', paula);
    await criarProfissional('prof-rui', rui);
    await criarAgendamento('paciente-lucas', 'prof-paula', -7); // semana passada
    await criarAgendamento('paciente-lucas', 'prof-rui', -200); // há mais de seis meses
    await entrarComo(carla);

    const sugestao = await getPatientTeamSuggestion('paciente-lucas');

    expect(sugestao).toEqual({ familia: [maria.uid], terapeutas: [paula.uid] });
  });

  it('a coordenação liga um grupo antigo (criado com o nome do responsável) à criança', async () => {
    const lucas = await criarPaciente('paciente-lucas', 'Lucas Souza', maria);
    const grupoId = await criarGrupo([maria, paula, carla], carla);
    await entrarComo(carla);
    expect(isLegacyGroup((await getGroupDetails(grupoId))!)).toBe(true);

    const resultado = await linkGroupToPatient(grupoId, lucas);

    expect(resultado).toEqual({ success: true });
    const ligado = await getGroupDetails(grupoId);
    expect(ligado).toMatchObject({ pacienteId: 'paciente-lucas', pacienteNome: 'Lucas Souza' });
    expect(isLegacyGroup(ligado!)).toBe(false);
  });

  it('não liga um grupo antigo à criança que já tem grupo', async () => {
    const lucas = await criarPaciente('paciente-lucas', 'Lucas Souza', maria);
    const antigo = await criarGrupo([maria, paula, carla], carla);
    await entrarComo(carla);
    await createPatientChatGroup({ paciente: lucas, membros: [membro(maria)], criadoPor: carla.uid });

    const resultado = await linkGroupToPatient(antigo, lucas);

    expect(resultado).toEqual({ success: false, id: patientGroupId('paciente-lucas'), error: 'ja-existe' });
    expect(isLegacyGroup((await getGroupDetails(antigo))!)).toBe(true);
  });
});

describe('participantes', () => {
  let maria: UsuarioDeTeste;
  let joao: UsuarioDeTeste;
  let paula: UsuarioDeTeste;
  let carla: UsuarioDeTeste;
  let grupoId: string;

  beforeEach(async () => {
    await limparDados();
    maria = await criarUsuario('Maria Souza', { role: 'familiar' });
    joao = await criarUsuario('João Souza', { role: 'familiar' });
    paula = await criarUsuario('Paula Fonoaudióloga', { role: 'profissional' });
    carla = await criarUsuario('Carla Coordenadora', { role: 'coordenador' });
    const lucas = await criarPaciente('paciente-lucas', 'Lucas Souza', maria);
    await entrarComo(carla);
    const criado = await createPatientChatGroup({
      paciente: lucas,
      membros: [maria, paula].map((u) => ({ uid: u.uid, nome: u.displayName, papel: u.role })),
      criadoPor: carla.uid,
    });
    grupoId = criado.id;
  });

  it('um segundo responsável adicionado pela coordenação passa a ver o grupo', async () => {
    await addGroupMembers(grupoId, [{ uid: joao.uid, nome: joao.displayName, papel: joao.role }]);

    await entrarComo(joao);
    await expect(aguardarGrupos(joao.uid, (gs) => gs.length === 1)).resolves.toHaveLength(1);
  });

  it('a coordenação vê todas as conversas, inclusive as de que não participa', async () => {
    const renata = await criarUsuario('Renata Martins', { role: 'familiar' });
    // Grupo de outra família, do qual a Carla não participa
    await criarGrupo([renata, paula], paula);
    await entrarComo(carla);

    // Espera a resposta do servidor: a cópia local pode ainda ter grupos de testes anteriores
    const nomes = (grupos: ChatGroup[]) => grupos.map((g) => g.pacienteNome).sort().join(' | ');
    const todas = await new Promise<ChatGroup[]>((resolve, reject) => {
      let ultima: ChatGroup[] = [];
      const prazo = setTimeout(() => reject(new Error(`Lista final: ${nomes(ultima)}`)), 3000);
      const cancelar = subscribeToAllGroups((grupos) => {
        ultima = grupos;
        if (nomes(grupos) === 'Lucas Souza | Renata Martins') {
          clearTimeout(prazo);
          cancelar();
          resolve(grupos);
        }
      });
    });

    expect(todas).toHaveLength(2);
  });

  it('a família não consegue listar as conversas dos outros', async () => {
    await entrarComo(maria);

    const erro = await new Promise((resolve) => {
      subscribeToAllGroups(() => {}, resolve);
    });

    expect(erro).toMatchObject({ code: 'permission-denied' });
  });

  it('mostra o nome e o papel de quem está no grupo, na ordem pedida', async () => {
    await entrarComo(maria);

    const equipe = await getGroupMembers([maria.uid, paula.uid, carla.uid]);

    expect(equipe).toEqual([
      { uid: maria.uid, nome: 'Maria Souza', papel: 'familiar' },
      { uid: paula.uid, nome: 'Paula Fonoaudióloga', papel: 'profissional' },
      { uid: carla.uid, nome: 'Carla Coordenadora', papel: 'coordenador' },
    ]);
  });

  it('a terapeuta removida pela coordenação perde o acesso à conversa', async () => {
    await removeGroupMember(grupoId, paula.uid);

    await entrarComo(paula);
    const erro = await new Promise((resolve) => {
      subscribeToChatMessages(grupoId, () => {}, resolve);
    });
    expect(erro).toMatchObject({ code: 'permission-denied' });
  });
});
