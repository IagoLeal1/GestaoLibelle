// Telas de exemplo das crianças: a lista de Pacientes (busca, Exportar Excel, Novo Paciente e o menu dos
// três pontinhos), a ficha (Detalhes, com as abas e o diagnóstico), o cadastro/edição e a lista de
// Prontuários.
import { MoreHorizontal, Search } from "lucide-react";
import { Aceso, Botao, Caixa, Campo, Janela, Linha, Titulo } from "./base";

export const ALVOS_DE_PACIENTES = ["novo", "exportar", "busca", "acoes", "ver-detalhes", "editar", "desativar", "filtro-exportar", "baixar"];

export function TelaPacientes({ alvo }: { alvo?: string }) {
  const menu = alvo === "acoes" || alvo === "ver-detalhes" || alvo === "editar" || alvo === "desativar";
  const exportar = alvo === "filtro-exportar" || alvo === "baixar";
  return (
    <Janela>
      <div className="flex flex-wrap items-center gap-1.5">
        <Titulo>Pacientes</Titulo>
        <span className="ml-auto" />
        <Aceso nome="exportar" alvo={alvo} className="rounded-md"><Botao className="bg-[#1f6b45]">Exportar Excel</Botao></Aceso>
        <Aceso nome="novo" alvo={alvo} className="rounded-md"><Botao>+ Novo Paciente</Botao></Aceso>
      </div>
      <Aceso nome="busca" alvo={alvo} className="flex h-7 items-center gap-1.5 rounded-md border border-[#cfd9de] bg-white px-2 text-[10px] text-[#52646d]">
        <Search aria-hidden className="h-3 w-3" /> Nome, CPF ou responsável…
      </Aceso>
      <div className="relative">
        <Linha>
          <b className="min-w-0 flex-1 truncate">Lucas Souza</b>
          <span className="text-[#52646d]">Maria Souza</span>
          <span className="rounded-full bg-green-100 px-1.5 py-0.5 text-[9px] font-semibold text-green-800">Ativo</span>
          <Aceso nome="acoes" alvo={alvo} className="rounded"><MoreHorizontal aria-hidden className="h-3.5 w-3.5 text-[#52646d]" /></Aceso>
        </Linha>
        {menu && (
          <div className="absolute right-0 top-full z-10 mt-1 flex w-32 flex-col gap-0.5 rounded-lg border bg-white p-1 text-[10.5px] shadow-lg">
            <Aceso nome="ver-detalhes" alvo={alvo} className="rounded-md px-2 py-1">Ver Detalhes</Aceso>
            <Aceso nome="editar" alvo={alvo} className="rounded-md px-2 py-1">Editar</Aceso>
            <Aceso nome="desativar" alvo={alvo} className="rounded-md px-2 py-1 text-red-700">Desativar</Aceso>
          </div>
        )}
      </div>
      <Linha><b className="min-w-0 flex-1 truncate">Bia Lima</b><span className="text-[#52646d]">João Lima</span><span className="rounded-full bg-green-100 px-1.5 py-0.5 text-[9px] font-semibold text-green-800">Ativo</span><MoreHorizontal aria-hidden className="h-3.5 w-3.5 text-[#52646d]" /></Linha>
      {exportar && (
        <Caixa titulo="Exportar pacientes">
          <Aceso nome="filtro-exportar" alvo={alvo} className="rounded-lg p-0.5"><Campo rotulo="Filtrar por Status" valor="Só os ativos ▾" /></Aceso>
          <Aceso nome="baixar" alvo={alvo} className="self-end rounded-md"><Botao className="bg-[#1f6b45]">Baixar Excel</Botao></Aceso>
        </Caixa>
      )}
    </Janela>
  );
}

export const ALVOS_DA_FICHA = ["abas", "aba-diagnostico", "editar-diagnostico", "diagnostico-campos", "diagnostico-salvar"];

export function TelaFicha({ alvo }: { alvo?: string }) {
  const editando = alvo === "diagnostico-campos" || alvo === "diagnostico-salvar";
  const naAbaDiagnostico = alvo !== "abas";
  return (
    <Janela>
      <div className="flex flex-col">
        <Titulo>Detalhes do Paciente</Titulo>
        <span className="text-[10.5px] text-[#52646d]">Theo Martins · 6 anos · Resp.: Renata</span>
      </div>
      <Aceso nome="abas" alvo={alvo} className="grid grid-cols-3 gap-0.5 rounded-lg bg-[#e2e9ed] p-0.5 text-center text-[10px]">
        <span className={naAbaDiagnostico ? "py-1 text-[#52646d]" : "rounded-md bg-white py-1 font-bold"}>Dados</span>
        <Aceso nome="aba-diagnostico" alvo={alvo} className={naAbaDiagnostico ? "rounded-md bg-white py-1 font-bold" : "py-1 text-[#52646d]"}>Diagnóstico</Aceso>
        <span className="py-1 text-[#52646d]">Observações</span>
      </Aceso>
      {naAbaDiagnostico ? (
        <>
          <Linha><b className="flex-1">TEA · nível 1</b><span className="rounded-full bg-green-100 px-1.5 py-0.5 text-[9px] font-bold text-green-800">Confirmado</span></Linha>
          <Linha><b className="flex-1">TDAH</b><span className="rounded-full bg-[#fff3cf] px-1.5 py-0.5 text-[9px] font-bold text-[#6b4a00]">Em investigação</span></Linha>
          <Aceso nome="editar-diagnostico" alvo={alvo} className="mt-auto self-start rounded-md"><Botao>Editar diagnóstico</Botao></Aceso>
        </>
      ) : (
        <div className="grid grid-cols-2 gap-1.5">
          <Campo rotulo="Data de Nascimento" valor="15/02/2020" />
          <Campo rotulo="Convênio" valor="Particular" />
        </div>
      )}
      {editando && (
        <Caixa titulo="Diagnóstico de Theo Martins">
          <Aceso nome="diagnostico-campos" alvo={alvo} className="flex flex-col gap-1.5 rounded-lg p-0.5">
            <div className="grid grid-cols-[minmax(0,1fr)_4.5rem] gap-1.5">
              <Campo rotulo="Diagnóstico" valor="TEA · nível 1" />
              <Campo rotulo="CID (opcional)" valor="F84.0" />
            </div>
            <span className="flex gap-1 text-[9.5px]">
              <span className="rounded-full bg-[#127a7e] px-2 py-0.5 font-bold text-white">Confirmado</span>
              <span className="rounded-full border px-2 py-0.5">Em investigação</span>
            </span>
          </Aceso>
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-[#127a7e]">+ Adicionar diagnóstico</span>
            <Aceso nome="diagnostico-salvar" alvo={alvo} className="rounded-md"><Botao>Salvar diagnóstico</Botao></Aceso>
          </div>
        </Caixa>
      )}
    </Janela>
  );
}

export const ALVOS_DO_FORMULARIO_DE_PACIENTE = ["dados", "vinculo", "responsavel", "salvar", "salvar-alteracoes"];

export function TelaFormularioDePaciente({ alvo }: { alvo?: string }) {
  const editando = alvo === "salvar-alteracoes";
  return (
    <Janela>
      <Titulo>{editando ? "Editar Paciente" : "Novo Paciente"}</Titulo>
      <Aceso nome="dados" alvo={alvo} className="grid grid-cols-3 gap-1.5 rounded-lg p-0.5">
        <Campo rotulo="Nome Completo *" valor="Lucas Souza" />
        <Campo rotulo="Data de Nascimento *" valor="10/05/2019" />
        <Campo rotulo="CPF *" valor="000.000.000-00" />
      </Aceso>
      <Aceso nome="vinculo" alvo={alvo} className="rounded-lg p-0.5">
        <Campo rotulo="E-mail para Login (Vínculo)" valor="maria.souza@email.com" />
      </Aceso>
      <Aceso nome="responsavel" alvo={alvo} className="flex flex-col gap-1 rounded-lg p-0.5">
        <span className="text-[10px] font-extrabold uppercase tracking-wide text-[#52646d]">Contato do Responsável · Endereço</span>
        <div className="grid grid-cols-2 gap-1.5">
          <Campo rotulo="Nome Completo *" valor="Maria Souza" />
          <Campo rotulo="Celular *" valor="(21) 98888-7777" />
        </div>
      </Aceso>
      <div className="mt-auto self-end">
        {editando
          ? <Aceso nome="salvar-alteracoes" alvo={alvo} className="rounded-md"><Botao>Salvar Alterações</Botao></Aceso>
          : <Aceso nome="salvar" alvo={alvo} className="rounded-md"><Botao>Salvar Paciente</Botao></Aceso>}
      </div>
    </Janela>
  );
}

export const ALVOS_DA_LISTA_DE_PRONTUARIOS = ["busca", "crianca"];

export function TelaListaDeProntuarios({ alvo }: { alvo?: string }) {
  return (
    <Janela>
      <Titulo>Prontuários</Titulo>
      <Aceso nome="busca" alvo={alvo} className="flex h-7 items-center gap-1.5 rounded-md border border-[#cfd9de] bg-white px-2 text-[10px] text-[#52646d]">
        <Search aria-hidden className="h-3 w-3" /> Buscar criança
      </Aceso>
      <Aceso nome="crianca" alvo={alvo} className="rounded-lg">
        <Linha>
          <span className="flex h-7 w-7 items-center justify-center rounded-md bg-[#2f6f8f] text-[10px] font-bold text-white">TM</span>
          <span className="flex flex-col"><b>Theo Martins</b><span className="text-[#127a7e]">Hoje às 14:00</span></span>
        </Linha>
      </Aceso>
      <Linha>
        <span className="flex h-7 w-7 items-center justify-center rounded-md bg-[#b7133f] text-[10px] font-bold text-white">LS</span>
        <span className="flex flex-col"><b>Lucas Souza</b><span className="text-[#127a7e]">Próxima: sex, 10/10</span></span>
      </Linha>
    </Janela>
  );
}
