// lib/coresDasTerapias.ts
// Cada terapia com a sua cor, das cores da Casa Libelle: a mesma bolinha em todas as telas.

const PALETA = ["#1da7ac", "#b7133f", "#e68b00", "#16375b", "#1dac8c", "#ff8d69"];
const normalizado = (t: string) => t.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
const porHash = (texto: string) => PALETA[[...texto].reduce((soma, c) => soma + c.charCodeAt(0), 0) % PALETA.length];

export function corDaTerapia(terapia: string) {
  const t = normalizado(terapia);
  if (t.includes("fono")) return "#1da7ac";
  if (t.includes("psicoped")) return "#16375b";
  if (t.includes("psico")) return "#b7133f";
  if (t.includes("ocupacional") || t === "to") return "#e68b00";
  if (t.includes("aba")) return "#1dac8c";
  return porHash(t);
}

// As cores das crianças: fortes o bastante para as iniciais em branco (contraste para ler)
const PALETA_DAS_CRIANCAS = ["#127a7e", "#b7133f", "#b86f00", "#16375b", "#13805f", "#b54c2b", "#5b3a96", "#2f6f8f"];

/** Cada criança com uma cor fixa (sempre a mesma), para reconhecer de longe na lista e no prontuário. */
export function corDaCrianca(id: string) {
  let h = 5381;
  for (const c of id) h = ((h * 33) ^ c.charCodeAt(0)) >>> 0;
  return PALETA_DAS_CRIANCAS[h % PALETA_DAS_CRIANCAS.length];
}

/** A mesma cor, mais escura: para texto em cima do fundo clarinho daquela cor. */
export function corEscura(hex: string, quanto = 0.35) {
  const canais = [1, 3, 5].map((i) => Math.round(parseInt(hex.slice(i, i + 2), 16) * (1 - quanto)));
  return `#${canais.map((c) => c.toString(16).padStart(2, "0")).join("")}`;
}
