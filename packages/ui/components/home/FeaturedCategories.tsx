/** @jsxImportSource nativewind */

import { Image, View } from "react-native";
import type { CategoriaDestacada } from "@akindo/shared/api/categorias";
import { H3, Section, Span } from "../html-elements";
import { Link } from "../link";
import { Degradado } from "../ui/Degradado";
import { MachineryIcon, PackagingIcon, ArtsAndCraftsIcon } from "../../icons/CategoriesIcons";

type IconoCategoria = React.ComponentType<{ size?: number; color?: string; className?: string }>;

interface CategoryCardProps {
  label: string;
  slug: string;
  imageSrc?: string;
  Icon?: IconoCategoria;
}

const ICON_MAP: Record<string, IconoCategoria> = {
  "Equipo Industrial": MachineryIcon,
  "Materiales de Embalaje": PackagingIcon,
  "Artesanías": ArtsAndCraftsIcon,
};

// drop-shadow-sm: el filtro de CSS no existe en RN, en texto es un textShadow.
const SOMBRA_TEXTO = { textShadowColor: "rgba(0, 0, 0, 0.05)", textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 1 };

function CategoryCard({ label, slug, imageSrc, Icon }: CategoryCardProps) {
  return (
    <Link
      href={`/mercado/productos?categoria=${slug}`}
      bloque
      className="relative flex flex-col justify-end w-full aspect-square rounded-2xl overflow-hidden group transition-all hover:shadow-lg active:scale-[0.98] select-none"
    >
      {/* Background Image */}
      <View className="absolute inset-0 bg-stone-100">
        {imageSrc ? (
          // `group-hover:` es CSS: en web escala con el hover del link; en nativo no hay hover.
          <Image
            source={{ uri: imageSrc }}
            accessibilityLabel={label}
            resizeMode="cover"
            className="w-full h-full transition-transform duration-500 group-hover:scale-110"
          />
        ) : (
          <View className="w-full h-full flex items-center justify-center">
            {/* bg-gradient-to-br from-stone-100 to-stone-200 */}
            <Degradado
              direccion="to-br"
              paradas={[
                { offset: 0, color: "#F5F5F4" },
                { offset: 1, color: "#E7E5E4" },
              ]}
            />
            {/* Fallback Icon si no hay imagen. text-stone-300; el opacity-20 va
                en un View porque el className de un Svg no llega en web. */}
            {!Icon && (
              <View className="opacity-20">
                <MachineryIcon size={40} color="#D6D3D1" />
              </View>
            )}
          </View>
        )}
      </View>

      {/* bg-gradient-to-t from-black/80 via-black/20 to-transparent */}
      <Degradado
        direccion="to-t"
        paradas={[
          { offset: 0, color: "#000000", opacity: 0.8 },
          { offset: 0.5, color: "#000000", opacity: 0.2 },
          { offset: 1, color: "#000000", opacity: 0 },
        ]}
      />

      {/* Floating Icon */}
      {Icon && (
        <View className="absolute top-3 right-3 z-10 bg-white/90 rounded-lg p-1.5 shadow-sm">
          <Icon size={20} color="#DAA520" />
        </View>
      )}

      {/* Label. El <div> original heredaba del body una línea de 24px (h-6), y
          el texto de 12px quedaba sobre la línea base de la fuente de 16px,
          1.5px más abajo que centrado: de ahí el pt-[5.5px]. */}
      <View className="relative z-10 p-3">
        <View className="h-6 pt-[5.5px]">
          <Span peso="semibold" className="text-xs text-white" style={SOMBRA_TEXTO}>{label}</Span>
        </View>
      </View>
    </Link>
  );
}

interface FeaturedCategoriesProps {
  /**
   * Antes el componente las pedia solo (era async Server Component). Ahora las
   * carga cada plataforma: web en el servidor (page.tsx), mobile en la pantalla.
   */
  destacadas: CategoriaDestacada[] | null;
}

export function FeaturedCategories({ destacadas }: FeaturedCategoriesProps) {
  if (!destacadas || destacadas.length === 0) {
    return null; // O mostrar algo por defecto si prefieres
  }

  return (
    <Section className="flex flex-col gap-3 w-full">
      <View className="flex flex-row items-center justify-between">
        <H3 peso="bold" className="text-sm text-[#2B2722]">Categorías destacadas</H3>
        <Link
          href="/mercado/categorias"
          peso="medium"
          className="text-xs text-[#DAA520] hover:underline transition select-none"
        >
          Ver todas las categorias →
        </Link>
      </View>

      {/* `grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3`: RN no tiene grid.
          Cada celda lleva p-1.5 y la fila -m-1.5, que da los mismos 12px entre
          tarjetas y el mismo ancho que el grid en las dos plataformas. */}
      <View className="flex flex-row flex-wrap -m-1.5">
        {destacadas.map((cat) => (
          <View key={cat.categoria_id} className="w-1/2 md:w-1/3 lg:w-1/4 p-1.5">
            <CategoryCard
              label={cat.nombre}
              slug={cat.categoria_id}
              imageSrc={cat.imagen || undefined}
              Icon={ICON_MAP[cat.nombre]}
            />
          </View>
        ))}
      </View>
    </Section>
  );
}
