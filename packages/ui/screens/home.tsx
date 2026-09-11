/** @jsxImportSource nativewind */
"use client";

import type { ImageSourcePropType } from "react-native";
import type { CargarCategorias } from "@akindo/shared/categorias-context";
import type { CategoriaDestacada } from "@akindo/shared/api/categorias";
import { Titulo } from "@akindo/ui/components";
import { Span } from "@akindo/ui/html";
import { ContenedorPantalla } from "@akindo/ui/components/ui/ContenedorPantalla";
import { MercadoBuscador } from "@akindo/ui/components/mercado/MercadoBuscador";
import { InfoBanner } from "@akindo/ui/components/home/InfoBanner";
import { HeroCard } from "@akindo/ui/components/home/HeroCard";
import { FeaturedCategories } from "@akindo/ui/components/home/FeaturedCategories";

type HomeProps = {
  /** Categorías de los chips del buscador. Web: server action. Mobile: llamada con el token guardado. */
  cargarCategorias: CargarCategorias;
  /** Web las carga en el servidor antes de pintar; mobile en la pantalla. */
  destacadas: CategoriaDestacada[] | null;
  /** Web: `{ uri: "/fondo-inicio.png" }`. Mobile: el `require` del asset. */
  imagenHero: ImageSourcePropType;
};

export default function Home({ cargarCategorias, destacadas, imagenHero }: HomeProps) {
  return (
    // indiceFijo 2: el buscador, tercer hijo.
    <ContenedorPantalla indiceFijo={2} className="flex flex-col gap-5 px-4 md:px-6 py-5 w-full max-w-2xl lg:max-w-5xl mx-auto">
      <InfoBanner />
      <Titulo className="text-lg text-[#2B2722]">
        {/* Un Text anidado no hereda el peso de la fuente: va de nuevo. */}
        ¿Qué quieres <Span peso="bold" className="text-[#DAA520]">comprar</Span> hoy?
      </Titulo>
      <MercadoBuscador cargarCategorias={cargarCategorias} />
      <HeroCard imagen={imagenHero} />
      <FeaturedCategories destacadas={destacadas} />
    </ContenedorPantalla>
  );
}
