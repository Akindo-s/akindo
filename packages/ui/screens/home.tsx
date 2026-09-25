/** @jsxImportSource nativewind */
"use client";

import { FlatList, Text, View, type ImageSourcePropType } from "react-native";
import type { CargarCategorias } from "@akindo/shared/categorias-context";
import type { CategoriaDestacada } from "@akindo/shared/api/categorias";
import { Titulo } from "@akindo/ui/components";
import { Span } from "@akindo/ui/html";
import { ContenedorPantalla } from "@akindo/ui/components/ui/ContenedorPantalla";
import { MercadoBuscador } from "@akindo/ui/components/mercado/MercadoBuscador";
import { InfoBanner } from "@akindo/ui/components/home/InfoBanner";
import { HeroCard } from "@akindo/ui/components/home/HeroCard";
import { FeaturedCategories } from "@akindo/ui/components/home/FeaturedCategories";
import { useEffect, useState } from "react";
import { anuncioBeta, AnuncioDestacado } from '@akindo/shared/types/anuncios';

type HomeProps = {
  /** Categorías de los chips del buscador. Web: server action. Mobile: llamada con el token guardado. */
  cargarCategorias: CargarCategorias;
  /** Web las carga en el servidor antes de pintar; mobile en la pantalla. */
  destacadas: CategoriaDestacada[] | null;
  /** Web: `{ uri: "/fondo-inicio.png" }`. Mobile: el `require` del asset. */
  imagenHero: ImageSourcePropType;
  anuncios: AnuncioDestacado[];
};

export default function Home({ cargarCategorias, destacadas, imagenHero, anuncios = [] }: HomeProps) {
  const [anunciosItems,setAnunciosItems] = useState<AnuncioDestacado[]>([
    {internalCover:imagenHero,internal:true},
    anuncioBeta,
    ...anuncios])
  const ITEM_MARGIN = 12; // el margin real que uses en HeroCard
  const SNAP_INTERVAL = 340 + ITEM_MARGIN;
  const snapOffsets = anuncios.map((_, i) => i * SNAP_INTERVAL);

  return (
    // indiceFijo 2: el buscador, tercer hijo.
    <ContenedorPantalla indiceFijo={2} className="flex flex-col gap-5 py-5 w-full items-center  ">
      <View className='px-0 flex flex-col gap-5 w-full max-w-4xl'>

        <InfoBanner />
        <Titulo className="text-lg text-[#2B2722] px-6 md:px-0">
          {/* Un Text anidado no hereda el peso de la fuente: va de nuevo. */}
          ¿Qué quieres <Span peso="bold" className="text-[#DAA520]">comprar</Span> hoy?
        </Titulo>
        <MercadoBuscador cargarCategorias={cargarCategorias} />
      </View>

      <FlatList
        data={anunciosItems}
        // keyExtractor={(item) => `${item.id}`}
        horizontal
        showsHorizontalScrollIndicator={false}
        snapToInterval={SNAP_INTERVAL}
        snapToAlignment="start"
        decelerationRate="fast"
        disableIntervalMomentum
        contentContainerStyle={{ paddingHorizontal: 24, paddingVertical: 8 }}
        snapToOffsets={snapOffsets}

        renderItem={({ item, index }) => {
          if (item.internal) {
            return (
              <View style={{ marginRight: ITEM_MARGIN }}>
                <HeroCard imagen={item.internalCover} width={56.25} />
              </View>
            )
          }
          return(
            <View style={{ marginRight: ITEM_MARGIN }}>
                <Text>uwu</Text>
              </View>
          )
        }}
      />


      <FeaturedCategories destacadas={destacadas} />
    </ContenedorPantalla>
  );
}
