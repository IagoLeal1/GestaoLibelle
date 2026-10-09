// Telas de exemplo do agendamento: o formulário de Novo Agendamento e a janela de editar uma sessão
// (status, data e horário, a série do horário fixo, salvar e excluir).
import { Aceso, Botao, Campo, Chave, Janela, Titulo } from "./base";

export const ALVOS_DO_NOVO_AGENDAMENTO = ["quem", "quando", "repete", "salvar"];

export function TelaNovoAgendamento({ alvo }: { alvo?: string }) {
  return (
    <Janela>
      <Titulo>Novo Agendamento</Titulo>
      <Aceso nome="quem" alvo={alvo} className="grid grid-cols-3 gap-1.5 rounded-lg p-0.5">
        <Campo rotulo="Paciente" valor="Lucas Souza ▾" />
        <Campo rotulo="Profissional" valor="Paula ▾" />
        <Campo rotulo="Especialidade" valor="Fono ▾" />
      </Aceso>
      <Aceso nome="quando" alvo={alvo} className="grid grid-cols-4 gap-1.5 rounded-lg p-0.5">
        <Campo rotulo="Data" valor="14/10/2026" />
        <Campo rotulo="Horário Inicial" valor="09:00" />
        <Campo rotulo="Horário Final" valor="09:50" />
        <Campo rotulo="Sala" valor="Sala Azul" />
      </Aceso>
      <Aceso nome="repete" alvo={alvo} className="flex items-center gap-2 rounded-lg p-1 text-[10.5px] font-semibold">
        <Chave ligada /> Criar agendamento recorrente
        <span className="ml-auto font-normal text-[#52646d]">Semanal · 10 sessões</span>
      </Aceso>
      <Aceso nome="salvar" alvo={alvo} className="mt-auto self-end rounded-md"><Botao>Salvar Agendamento(s)</Botao></Aceso>
    </Janela>
  );
}

export const ALVOS_DE_EDITAR_SESSAO = ["status", "quando", "serie", "salvar", "salvar-serie", "excluir", "excluir-serie"];

export function TelaEditarSessao({ alvo }: { alvo?: string }) {
  const serie = alvo === "serie" || alvo === "salvar-serie" || alvo === "excluir-serie";
  return (
    <Janela>
      <div className="flex flex-col">
        <Titulo>Editar Agendamento</Titulo>
        <span className="text-[10.5px] text-[#52646d]">Lucas Souza · Fonoaudiologia</span>
      </div>
      <Aceso nome="status" alvo={alvo} className="rounded-lg p-0.5">
        <Campo rotulo="Status" valor="Agendado ▾" />
      </Aceso>
      <Aceso nome="quando" alvo={alvo} className="grid grid-cols-3 gap-1.5 rounded-lg p-0.5">
        <Campo rotulo="Data" valor="16/10/2026" />
        <Campo rotulo="Início" valor="09:00" />
        <Campo rotulo="Fim" valor="09:50" />
      </Aceso>
      <Aceso nome="serie" alvo={alvo} className="flex items-center gap-2 rounded-lg p-1 text-[10.5px] font-semibold">
        <Chave ligada={serie} /> Aplicar a toda a série?
      </Aceso>
      <div className="mt-auto flex items-center justify-between gap-2">
        {serie ? (
          <>
            <Aceso nome="excluir-serie" alvo={alvo} className="rounded-md"><Botao variante="perigo">Excluir Série Futura</Botao></Aceso>
            <Aceso nome="salvar-serie" alvo={alvo} className="rounded-md"><Botao>Salvar Série Inteira</Botao></Aceso>
          </>
        ) : (
          <>
            <Aceso nome="excluir" alvo={alvo} className="rounded-md"><Botao variante="perigo">Excluir</Botao></Aceso>
            <Aceso nome="salvar" alvo={alvo} className="rounded-md"><Botao>Salvar Alterações</Botao></Aceso>
          </>
        )}
      </div>
    </Janela>
  );
}
