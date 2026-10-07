// app/api/conta/trocar-senha/route.ts
// Quem entrou com a senha provisória cria a senha dela (lib/senhaProvisoria). A senha nunca é registrada.
import { NextRequest, NextResponse } from "next/server";
import { trocarSenhaProvisoria } from "@/lib/senhaProvisoria";

export async function POST(req: NextRequest) {
  try {
    const pedido = await req.json().catch(() => ({}));
    const { status, corpo } = await trocarSenhaProvisoria(req.headers.get("authorization"), pedido);
    return NextResponse.json(corpo, { status });
  } catch (e) {
    console.error("Erro ao trocar a senha provisória:", (e as Error)?.message);
    return NextResponse.json({ erro: "Não foi possível trocar a senha agora. Tente de novo em alguns minutos." }, { status: 500 });
  }
}
