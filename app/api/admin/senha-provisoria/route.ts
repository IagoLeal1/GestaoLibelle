// app/api/admin/senha-provisoria/route.ts
// O admin define a senha provisória de uma pessoa (lib/senhaProvisoria). A senha nunca é registrada.
import { NextRequest, NextResponse } from "next/server";
import { definirSenhaProvisoria } from "@/lib/senhaProvisoria";

export async function POST(req: NextRequest) {
  try {
    const pedido = await req.json().catch(() => ({}));
    const { status, corpo } = await definirSenhaProvisoria(req.headers.get("authorization"), pedido);
    return NextResponse.json(corpo, { status });
  } catch (e) {
    console.error("Erro ao definir a senha provisória:", (e as Error)?.message);
    return NextResponse.json({ erro: "Não foi possível definir a senha agora. Tente de novo em alguns minutos." }, { status: 500 });
  }
}
