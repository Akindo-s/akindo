/** @jsxImportSource nativewind */
"use client";

import { Platform, ScrollView, View, type ImageSourcePropType } from "react-native";
import type { CargarCategorias } from "@akindo/shared/categorias-context";
import type { CategoriaDestacada } from "@akindo/shared/api/categorias";
import { Titulo } from "@akindo/ui/components";
import { Span } from "@akindo/ui/html";
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

const CLASES = "flex flex-col gap-5 px-4 md:px-6 py-5 w-full max-w-2xl lg:max-w-5xl mx-auto";
// Índice del buscador entre los hijos de abajo: es el que queda fijo arriba.
const INDICE_BUSCADOR = 2;

export default function Home({ cargarCategorias, destacadas, imagenHero }: HomeProps) {
  const secciones = [
    <InfoBanner key="banner" />,
    <Titulo key="titulo" className="text-lg text-[#2B2722]">
      {/* Un Text anidado no hereda el peso de la fuente: va de nuevo. */}
      ¿Qué quieres <Span peso="bold" className="text-[#DAA520]">comprar</Span> hoy?
    </Titulo>,
    <MercadoBuscador key="buscador" cargarCategorias={cargarCategorias} />,
    <HeroCard key="hero" imagen={imagenHero} />,
    <FeaturedCategories key="categorias" destacadas={destacadas} />,
  ];

  // En web scrollea el documento y el buscador queda fijo con `position:
  // sticky` (su propio className). En nativo no hay sticky en CSS: la pantalla
  // es un ScrollView y el buscador se fija con stickyHeaderIndices, que solo
  // funciona con hijos directos.
  if (Platform.OS === "web") {
    return <View className={CLASES}>{secciones}</View>;
  }
  return (
    <ScrollView
      stickyHeaderIndices={[INDICE_BUSCADOR]}
      contentContainerClassName={CLASES}
      keyboardShouldPersistTaps="handled"
    >
      {secciones}
    </ScrollView>
  );
}
