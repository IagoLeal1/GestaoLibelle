// Telas de exemplo dos acessos: Aprovação de Acesso, Minha conta (nome e senha) e a entrada no sistema
// (o login e a troca obrigatória da senha provisória).
import { Aceso, Botao, Campo, Janela, Linha, Titulo } from "./base";

export const ALVOS_DA_APROVACAO = ["pedido", "aprovar"];

export function TelaAprovacao({ alvo }: { alvo?: string }) {
  return (
    <Janela>
      <Titulo>Aprovação de Acesso</Titulo>
      <Aceso nome="pedido" alvo={alvo} className="rounded-lg">
        <Linha>
          <span className="flex min-w-0 flex-1 flex-col"><b>Karla Mendes</b><span className="truncate text-[#52646d]">karla@email.com · Profissional · Pendente</span></span>
          <Aceso nome="aprovar" alvo={alvo} className="flex gap-1 rounded-md">
            <Botao variante="perigo">Rejeitar</Botao>
            <Botao>Aprovar</Botao>
          </Aceso>
        </Linha>
      </Aceso>
      <Linha>
        <span className="flex min-w-0 flex-1 flex-col"><b>Pedro Lima</b><span className="truncate text-[#52646d]">pedro@email.com · Família · Pendente</span></span>
        <Botao variante="perigo">Rejeitar</Botao><Botao>Aprovar</Botao>
      </Linha>
    </Janela>
  );
}

export const ALVOS_DA_MINHA_CONTA = ["nome", "senha"];

export function TelaMinhaConta({ alvo }: { alvo?: string }) {
  return (
    <Janela>
      <Titulo>Configurações</Titulo>
      <Aceso nome="nome" alvo={alvo} className="flex flex-col gap-1.5 rounded-lg border border-[#dde5e9] bg-white p-2">
        <span className="text-[10px] font-extrabold uppercase tracking-wide text-[#52646d]">Perfil</span>
        <Campo rotulo="Nome Completo" valor="Paula Fonoaudióloga" />
        <Botao className="self-end">Salvar Alterações</Botao>
      </Aceso>
      <Aceso nome="senha" alvo={alvo} className="flex flex-col gap-1.5 rounded-lg border border-[#dde5e9] bg-white p-2">
        <span className="text-[10px] font-extrabold uppercase tracking-wide text-[#52646d]">Segurança</span>
        <div className="grid grid-cols-2 gap-1.5">
          <Campo rotulo="Nova Senha" valor="••••••••" />
          <Campo rotulo="Confirmar" valor="••••••••" />
        </div>
        <Botao className="self-end">Atualizar Senha</Botao>
      </Aceso>
    </Janela>
  );
}

export const ALVOS_DA_ENTRADA = ["entrar", "nova-senha", "salvar"];

export function TelaEntrada({ alvo }: { alvo?: string }) {
  const trocando = alvo === "nova-senha" || alvo === "salvar";
  return (
    <div className="flex h-full items-center justify-center overflow-hidden rounded-xl bg-[#eef3f6] p-3 text-[#1c2b33]">
      <div className="flex w-full max-w-[260px] flex-col gap-2 rounded-xl bg-white p-3 shadow-md">
        <span className="text-center text-[13px] font-extrabold text-[#127a7e]">Casa Libelle</span>
        {trocando ? (
          <>
            <Titulo>Crie uma senha nova</Titulo>
            <Aceso nome="nova-senha" alvo={alvo} className="flex flex-col gap-1.5 rounded-lg p-0.5">
              <Campo rotulo="Nova senha" valor="••••••••" />
              <Campo rotulo="Repita a nova senha" valor="••••••••" />
            </Aceso>
            <Aceso nome="salvar" alvo={alvo} className="rounded-md"><Botao className="w-full justify-center">Salvar e entrar</Botao></Aceso>
          </>
        ) : (
          <Aceso nome="entrar" alvo={alvo} className="flex flex-col gap-1.5 rounded-lg p-0.5">
            <Campo rotulo="Email" valor="paula@email.com" />
            <Campo rotulo="Senha" valor="libelle-482193" />
            <Botao className="justify-center">Entrar</Botao>
          </Aceso>
        )}
      </div>
    </div>
  );
}
