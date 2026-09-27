import { Metadata } from "next";
import Home from "@akindo/ui/screens/home";
import { cargarCategorias } from "@/lib/providers-data";
import { obtenerCategoriasDestacadas } from "@/lib/api/categorias";
import { anuncioBeta } from "@akindo/shared/types/anuncios";
import { listarProductosCatalogo } from "@akindo/shared/api/productos";

export const metadata: Metadata = {
  title: "Inicio",
};

export default async function HomePage() {
  // Antes lo pedía FeaturedCategories por su cuenta (async Server Component).
  // La pantalla compartida es Client Component, así que se carga acá.
  const destacadas = await obtenerCategoriasDestacadas();
  anuncioBeta.internalCover = {uri:'/anuncioBeta.png'}
   const catalogo = await listarProductosCatalogo(1, 8);
  return (
    <Home
      cargarCategorias={cargarCategorias}
      destacadas={destacadas}
      imagenHero={{ uri: "/fondo-inicio.png" }}
      anuncios={[anuncioBeta]}
      recomendaciones={catalogo.productos}
    />
  );
}
