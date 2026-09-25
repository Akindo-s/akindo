/** @jsxImportSource nativewind */
"use client";

import { FlatList, Text, View, type ImageSourcePropType } from "react-native";
import type { CargarCategorias } from "@akindo/shared/categorias-context";
import type { CategoriaDestacada } from "@akindo/shared/api/categorias";
import { Link, Titulo } from "@akindo/ui/components";
import { H2, Section, Span } from "@akindo/ui/html";
import { ContenedorPantalla } from "@akindo/ui/components/ui/ContenedorPantalla";
import { MercadoBuscador } from "@akindo/ui/components/mercado/MercadoBuscador";
import { InfoBanner } from "@akindo/ui/components/home/InfoBanner";
import { HeroCard } from "@akindo/ui/components/home/HeroCard";
import { FeaturedCategories } from "@akindo/ui/components/home/FeaturedCategories";
import { useEffect, useState } from "react";
import { anuncioBeta, AnuncioDestacado } from '@akindo/shared/types/anuncios';
import type { ProductoCatalogoResponse } from "@akindo/shared/api/productos";
import { TarjetaProductoCatalogo } from "../components/mercado/TarjetaProductoCatalogo";

type HomeProps = {
  /** Categorías de los chips del buscador. Web: server action. Mobile: llamada con el token guardado. */
  cargarCategorias: CargarCategorias;
  /** Web las carga en el servidor antes de pintar; mobile en la pantalla. */
  destacadas: CategoriaDestacada[] | null;
  /** Web: `{ uri: "/fondo-inicio.png" }`. Mobile: el `require` del asset. */
  imagenHero: ImageSourcePropType;
  anuncios: AnuncioDestacado[];
  recomendaciones:ProductoCatalogoResponse[]
};

export default function Home({ cargarCategorias, destacadas, imagenHero, anuncios = [],recomendaciones=[] }: HomeProps) {
  const [anunciosItems, setAnunciosItems] = useState<AnuncioDestacado[]>([
    {
      internalCover: imagenHero, internal: true, badges: [
        "Calidad Premium",
        "Variedad de productos",
        "Productos cachanillas"
      ],
      titulo:'El lugar de referencia para el comercio centrado en la calidad.',
      description:"Conéctate con distribuidores de primer nivel y gestiona pedidos al por mayor sin complicaciones.",
      link:"https://akindolandingpage.vercel.app",
      style:'default'
    },
    
    ...anuncios])
  const ITEM_MARGIN = 12; // el margin real que uses en HeroCard
  const SNAP_INTERVAL = 325 + ITEM_MARGIN;
  const snapOffsets = anuncios.map((_, i) => i * SNAP_INTERVAL);

  return (
    // indiceFijo 2: el buscador, tercer hijo.
    <ContenedorPantalla indiceFijo={2} className="flex flex-col gap-5 py-5 w-full items-center  ">
      <View className='px-0 flex flex-col gap-5 w-full max-w-4xl'>

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
          
              return(<View style={{ marginRight: ITEM_MARGIN }}>
                <HeroCard 
                  internal={item.internal} 
                  badges={item.badges} 
                  coverImage={item.coverImage} 
                  description={item.description} 
                  internalCover={item.internalCover} 
                  link={item.link} 
                  titulo={item.titulo} 
                  key={`anuncio-item-card-${index}`}
                  style={item.style}
                  />
              </View>
            )
          }
          
        }
      />


      <FeaturedCategories destacadas={destacadas} />
      {recomendaciones.length > 0 && (
                      <Section className="flex flex-col gap-3 px-4 md:px-0">
                          <View className="flex flex-row items-center justify-between">
                              {/* shrink: en CSS el título se encoge si no entra junto al link. */}
                              <H2 peso="bold" className="text-sm text-[#2B2722] shrink">
                                  Productos que podrían interesarte
                              </H2>
                              <Link
                                  href="/mercado/productos"
                                  peso="medium"
                                  className="text-xs text-[#DAA520] hover:underline transition select-none"
                              >
                                  Ver todos →
                              </Link>
                          </View>
      
                          {/* `grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3` (ver FeaturedCategories). */}
                          <View className="flex flex-row flex-wrap -m-1.5">
                              {recomendaciones.map((p) => (
                                  <View key={p.producto_id} className="w-1/2 md:w-1/3 lg:w-1/6 p-1.5">
                                      <TarjetaProductoCatalogo
                                          productoId={p.producto_id}
                                          nombre={p.nombre}
                                          costo={p.costo}
                                          unidad={p.unidad}
                                          imagen={p.imagen}
                                          disponible={p.disponible}
                                      />
                                  </View>
                              ))}
                          </View>
                      </Section>
                  )}
    </ContenedorPantalla>
  );
}
