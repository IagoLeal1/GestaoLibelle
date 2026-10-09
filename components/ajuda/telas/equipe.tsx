// Telas de exemplo da equipe: a lista de Profissionais e o cadastro (dados, horários e repasse), as
// Especialidades (terapias e valores) e o Mapeamento de Salas.
import { MoreHorizontal } from "lucide-react";
import { Aceso, Botao, Caixa, Campo, Janela, Linha, Titulo } from "./base";

export const ALVOS_DE_PROFISSIONAIS = ["novo", "acoes", "editar"];

export function TelaProfissionais({ alvo }: { alvo?: string }) {
  return (
    <Janela>
      <div className="flex items-center">
        <Titulo>Profissionais</Titulo>
        <Aceso nome="novo" alvo={alvo} className="ml-auto rounded-md"><Botao>+ Novo Profissional</Botao></Aceso>
      </div>
      <div className="relative">
        <Linha>
          <span className="flex flex-1 flex-col"><b>Paula Fonoaudióloga</b><span className="text-[#52646d]">Fonoaudiologia · Repasse 70%</span></span>
          <Aceso nome="acoes" alvo={alvo} className="rounded"><MoreHorizontal aria-hidden className="h-3.5 w-3.5 text-[#52646d]" /></Aceso>
        </Linha>
        {(alvo === "acoes" || alvo === "editar") && (
          <div className="absolute right-0 top-full z-10 mt-1 rounded-lg border bg-white p-1 text-[10.5px] shadow-lg">
            <Aceso nome="editar" alvo={alvo} className="rounded-md px-2 py-1">Editar</Aceso>
          </div>
        )}
      </div>
      <Linha><span className="flex flex-1 flex-col"><b>Rui Psicólogo</b><span className="text-[#52646d]">Psicologia · Repasse 70%</span></span><MoreHorizontal aria-hidden className="h-3.5 w-3.5 text-[#52646d]" /></Linha>
    </Janela>
  );
}

export const ALVOS_DO_FORMULARIO_DE_PROFISSIONAL = ["dados", "horarios", "salvar", "tipo-pagamento", "repasse", "regras", "salvar-alteracoes"];

export function TelaFormularioDeProfissional({ alvo }: { alvo?: string }) {
  const repasse = ["tipo-pagamento", "repasse", "regras", "salvar-alteracoes"].includes(alvo ?? "");
  return (
    <Janela>
      <Titulo>{repasse ? "Editar Profissional" : "Novo Profissional"}</Titulo>
      {repasse ? (
        <>
          <Aceso nome="tipo-pagamento" alvo={alvo} className="rounded-lg p-0.5"><Campo rotulo="Tipo de Pagamento" valor="Repasse (porcentagem) ▾" /></Aceso>
          <Aceso nome="repasse" alvo={alvo} className="w-1/2 rounded-lg p-0.5"><Campo rotulo="Repasse Padrão (%)" valor="70" /></Aceso>
          <Aceso nome="regras" alvo={alvo} className="flex flex-col gap-1 rounded-lg p-0.5">
            <span className="text-[10px] font-extrabold uppercase tracking-wide text-[#52646d]">Regras Especiais de Repasse</span>
            <div className="grid grid-cols-[minmax(0,1fr)_3.5rem_auto] items-end gap-1.5">
              <Campo rotulo="Especialidade" valor="Psicopedagogia ▾" />
              <Campo rotulo="%" valor="60" />
              <Botao variante="contorno">Adicionar Regra</Botao>
            </div>
          </Aceso>
          <Aceso nome="salvar-alteracoes" alvo={alvo} className="mt-auto self-end rounded-md"><Botao>Salvar Alterações</Botao></Aceso>
        </>
      ) : (
        <>
          <Aceso nome="dados" alvo={alvo} className="grid grid-cols-3 gap-1.5 rounded-lg p-0.5">
            <Campo rotulo="Nome Completo" valor="Ana Souza" />
            <Campo rotulo="Especialidade" valor="T. Ocupacional ▾" />
            <Campo rotulo="CPF" valor="000.000.000-00" />
          </Aceso>
          <Aceso nome="horarios" alvo={alvo} className="flex flex-col gap-1 rounded-lg p-0.5">
            <span className="text-[10px] font-extrabold uppercase tracking-wide text-[#52646d]">Dias e Horários de Atendimento</span>
            <span className="flex flex-wrap gap-1 text-[9.5px]">
              {["Seg", "Ter", "Qua", "Qui", "Sex"].map((d, i) => (
                <span key={d} className={i % 2 === 0 ? "rounded-md bg-[#127a7e] px-2 py-0.5 font-bold text-white" : "rounded-md border bg-white px-2 py-0.5"}>{d}</span>
              ))}
              <span className="ml-1 rounded-md border bg-white px-2 py-0.5">08:00 às 18:00</span>
            </span>
          </Aceso>
          <Aceso nome="salvar" alvo={alvo} className="mt-auto self-end rounded-md"><Botao>Salvar Profissional</Botao></Aceso>
        </>
      )}
    </Janela>
  );
}

export const ALVOS_DE_ESPECIALIDADES = ["nova", "campos", "salvar"];

export function TelaEspecialidades({ alvo }: { alvo?: string }) {
  const criando = alvo === "campos" || alvo === "salvar";
  return (
    <Janela>
      <div className="flex items-center">
        <Titulo>Especialidades</Titulo>
        <Aceso nome="nova" alvo={alvo} className="ml-auto rounded-md"><Botao>+ Nova Especialidade</Botao></Aceso>
      </div>
      <Linha><b className="flex-1">Fonoaudiologia</b><span className="text-[#52646d]">R$ 150,00</span></Linha>
      <Linha><b className="flex-1">Psicologia</b><span className="text-[#52646d]">R$ 160,00</span></Linha>
      {criando && (
        <Caixa titulo="Nova Especialidade">
          <Aceso nome="campos" alvo={alvo} className="grid grid-cols-2 gap-1.5 rounded-lg p-0.5">
            <Campo rotulo="Nome da Especialidade" valor="Musicoterapia" />
            <Campo rotulo="Valor da Consulta (R$)" valor="140,00" />
          </Aceso>
          <Aceso nome="salvar" alvo={alvo} className="self-end rounded-md"><Botao>Salvar</Botao></Aceso>
        </Caixa>
      )}
    </Janela>
  );
}

export const ALVOS_DAS_SALAS = ["sala", "data", "gerir", "campos", "salvar", "editar"];

export function TelaSalas({ alvo }: { alvo?: string }) {
  const criando = alvo === "campos" || alvo === "salvar";
  return (
    <Janela>
      <div className="flex flex-wrap items-center gap-1.5">
        <Titulo>Mapeamento de Salas</Titulo>
        <span className="ml-auto" />
        <Aceso nome="data" alvo={alvo} className="rounded-md"><span className="flex h-7 items-center rounded-md border border-[#cfd9de] bg-white px-2 text-[10px]">09/10/2026</span></Aceso>
        <Aceso nome="gerir" alvo={alvo} className="rounded-md"><Botao>Gerir Salas</Botao></Aceso>
      </div>
      <div className="grid grid-cols-2 gap-1.5">
        <Aceso nome="sala" alvo={alvo} className="flex flex-col gap-1 rounded-lg border border-[#dde5e9] bg-white p-2">
          <span className="flex items-center justify-between text-[10.5px] font-bold">Sala Azul <span className="rounded-full bg-red-50 px-1.5 text-[8.5px] text-red-700">Ocupada</span></span>
          <span className="text-[9.5px] text-[#52646d]">Agenda do Dia: 09:00, 10:00, 14:00</span>
          {alvo === "editar" && <Aceso nome="editar" alvo={alvo} className="self-start rounded-md"><Botao variante="contorno">Editar Sala</Botao></Aceso>}
        </Aceso>
        <div className="flex flex-col gap-1 rounded-lg border border-[#dde5e9] bg-white p-2">
          <span className="flex items-center justify-between text-[10.5px] font-bold">Sala Verde <span className="rounded-full bg-green-100 px-1.5 text-[8.5px] text-green-800">Livre</span></span>
          <span className="text-[9.5px] text-[#52646d]">Agenda do Dia: 11:00</span>
        </div>
      </div>
      {criando && (
        <Caixa titulo="Nova Sala">
          <Aceso nome="campos" alvo={alvo} className="grid grid-cols-2 gap-1.5 rounded-lg p-0.5">
            <Campo rotulo="Nome da Sala" valor="Sala Amarela" />
            <Campo rotulo="Número · Andar" valor="3 · 1º" />
          </Aceso>
          <Aceso nome="salvar" alvo={alvo} className="self-end rounded-md"><Botao>Salvar</Botao></Aceso>
        </Caixa>
      )}
    </Janela>
  );
}
