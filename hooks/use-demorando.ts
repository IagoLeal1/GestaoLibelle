import { useEffect, useState } from "react";

/** Fica true quando algo carrega há mais de `ms` (8 s): a tela avisa que está demorando e oferece tentar de novo. */
export function useDemorando(carregando: boolean, ms = 8000) {
  const [demorando, setDemorando] = useState(false);
  useEffect(() => {
    setDemorando(false);
    if (!carregando) return;
    const relogio = setTimeout(() => setDemorando(true), ms);
    return () => clearTimeout(relogio);
  }, [carregando, ms]);
  return demorando;
}
