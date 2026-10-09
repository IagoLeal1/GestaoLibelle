// Tela de exemplo: Gerenciar Usuários (Controle de Acessos), com as caixas da senha provisória, do elo
// (ligar ao cadastro de profissional) e de excluir o acesso, que abrem quando o alvo é parte delas.
import { AlertTriangle, KeyRound, Link2, Search, Trash2 } from "lucide-react";
import { Aceso, Botao, Caixa, Janela, Linha, Titulo } from "./base";

export const ALVOS_DE_GERENCIAR_USUARIOS = [
  "abas", "linha", "papel", "elo", "chave", "lixeira", "definir", "copiar", "ligar-busca", "ligar-aviso", "ligar", "confirmar-exclusao",
];

const Icone = ({ children }: { children: React.ReactNode }) => (
  <span className="flex h-5 w-5 items-center justify-center rounded border border-[#cfd9de] bg-white text-[#52646d]">{children}</span>
);

export function TelaGerenciarUsuarios({ alvo }: { alvo?: string }) {
  const senha = alvo === "definir" || alvo === "copiar";
  const elo = alvo === "ligar-busca" || alvo === "ligar-aviso" || alvo === "ligar";
  return (
    <Janela>
      <Titulo>Controle de Acessos</Titulo>
      <Aceso nome="abas" alvo={alvo} className="flex gap-1 self-start rounded-full bg-[#e2e9ed] p-0.5 text-[9.5px]">
        {["Todos", "Admins", "Coordenadores", "Profissionais", "Funcionários"].map((aba, i) => (
          <span key={aba} className={i === 0 ? "rounded-full bg-white px-2 py-0.5 font-semibold" : "px-2 py-0.5 text-[#52646d]"}>{aba}</span>
        ))}
      </Aceso>
      <Linha>
        <span className="min-w-0 flex-1 truncate"><b>Paula Fonoaudióloga</b></span>
        <span className="rounded border border-[#cfd9de] bg-white px-1.5 py-0.5 text-[9.5px]">Profissional ▾</span>
        <Icone><Link2 aria-hidden className="h-3 w-3" /></Icone><Icone><KeyRound aria-hidden className="h-3 w-3" /></Icone><Icone><Trash2 aria-hidden className="h-3 w-3" /></Icone>
      </Linha>
      <Aceso nome="linha" alvo={alvo} className="rounded-lg">
        <Linha>
          <span className="min-w-0 flex-1 truncate"><b>Thays Rocha</b></span>
          <Aceso nome="papel" alvo={alvo} className="rounded"><span className="block rounded border border-[#cfd9de] bg-white px-1.5 py-0.5 text-[9.5px]">Profissional ▾</span></Aceso>
          <Aceso nome="elo" alvo={alvo} className="rounded"><Icone><Link2 aria-hidden className="h-3 w-3" /></Icone></Aceso>
          <Aceso nome="chave" alvo={alvo} className="rounded"><Icone><KeyRound aria-hidden className="h-3 w-3" /></Icone></Aceso>
          <Aceso nome="lixeira" alvo={alvo} className="rounded"><Icone><Trash2 aria-hidden className="h-3 w-3" /></Icone></Aceso>
        </Linha>
      </Aceso>
      <Linha>
        <span className="min-w-0 flex-1 truncate"><b>Rafa Recepção</b></span>
        <span className="rounded border border-[#cfd9de] bg-white px-1.5 py-0.5 text-[9.5px]">Funcionário ▾</span>
        <Icone><KeyRound aria-hidden className="h-3 w-3" /></Icone><Icone><Trash2 aria-hidden className="h-3 w-3" /></Icone>
      </Linha>

      {senha && (
        <Caixa titulo="Senha provisória">
          <span className="text-[10px] text-[#52646d]">Thays Rocha · thays@email.com</span>
          {alvo === "definir" ? (
            <>
              <span className="flex h-7 items-center rounded-md border border-[#cfd9de] px-2 text-[11px] font-semibold">libelle-482193</span>
              <div className="flex justify-end gap-1.5">
                <Botao variante="contorno">Gerar outra</Botao>
                <Aceso nome="definir" alvo={alvo} className="rounded-md"><Botao>Definir senha</Botao></Aceso>
              </div>
            </>
          ) : (
            <>
              <span className="text-[10.5px] font-semibold text-[#146b55]">Senha definida</span>
              <div className="flex items-center gap-1.5 rounded-md border px-2 py-1">
                <span className="flex-1 text-[12px] font-bold">libelle-482193</span>
                <Aceso nome="copiar" alvo={alvo} className="rounded-md"><Botao variante="contorno">Copiar</Botao></Aceso>
              </div>
            </>
          )}
        </Caixa>
      )}
      {elo && (
        <Caixa titulo="Cadastro de profissional">
          <Aceso nome="ligar-busca" alvo={alvo} className="flex h-7 items-center gap-1.5 rounded-md border border-[#cfd9de] px-2 text-[10px] text-[#52646d]">
            <Search aria-hidden className="h-3 w-3" /> thays
          </Aceso>
          <span className="rounded-lg border border-[#1da7ac] bg-[#e3f4f4] px-2 py-1.5 text-[10.5px]"><b>Thays Rocha</b> · Fonoaudiologia</span>
          <Aceso nome="ligar-aviso" alvo={alvo} className="flex gap-1.5 rounded-md border border-[#f3d27a] bg-[#fff8e1] p-1.5 text-[9.5px] text-[#6b4a00]">
            <AlertTriangle aria-hidden className="h-3 w-3 shrink-0" /> Este cadastro já está ligado à conta de outra pessoa.
          </Aceso>
          <Aceso nome="ligar" alvo={alvo} className="self-end rounded-md"><Botao>Ligar mesmo assim</Botao></Aceso>
        </Caixa>
      )}
      {alvo === "confirmar-exclusao" && (
        <Caixa titulo="Excluir Usuário do Sistema">
          <span className="text-[10px] text-[#52646d]">Remover o acesso de <b>Thays Rocha</b>?</span>
          <div className="flex justify-end gap-1.5">
            <Botao variante="contorno">Cancelar</Botao>
            <Aceso nome="confirmar-exclusao" alvo={alvo} className="rounded-md"><Botao className="bg-red-600">Sim, excluir acesso</Botao></Aceso>
          </div>
        </Caixa>
      )}
    </Janela>
  );
}
