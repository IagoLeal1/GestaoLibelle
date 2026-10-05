import type { MetadataRoute } from "next";

// O site no celular como aplicativo: "Adicionar à tela de início" põe o ícone da Casa Libelle e
// abre o site sem a barra do navegador. O ícone do iPhone é o app/apple-icon.png.
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Casa Libelle",
    short_name: "Libelle",
    description: "Sistema de gestão da Casa Libelle",
    lang: "pt-BR",
    start_url: "/",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#fff6da",
    icons: [
      { src: "/icons/icone-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icons/icone-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      // A libélula ocupa 66% da largura: o recorte redondo do Android não corta as asas
      { src: "/icons/icone-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
