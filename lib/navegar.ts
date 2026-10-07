// lib/navegar.ts
// Abrir um endereço recarregando o site do zero (o perfil e as telas são lidos de novo).
export const abrirDoZero = (endereco: string) => window.location.assign(endereco);
