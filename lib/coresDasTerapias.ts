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
