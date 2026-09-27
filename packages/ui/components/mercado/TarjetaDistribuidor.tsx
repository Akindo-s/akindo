/** @jsxImportSource nativewind */

import { Image, View } from "react-native";
import { Store, Star } from "lucide-react-native";
import { H3, Span } from "../html-elements";
import { Link } from "../link";
import { Degradado } from "../ui/Degradado";

interface TarjetaDistribuidorProps {
    distribuidorId: string;
    nombreNegocio: string;
    imagenFondo: string | null;
    valoracionPromedio: number | null;
    totalValoraciones: number | null;
    categorias: string[] | null;
}

function Estrellitas({ valor }: { valor: number }) {
    const llenas = Math.floor(valor);
    const media = valor - llenas >= 0.5;
    return (
        <View className="flex flex-row items-center gap-0.5">
            {Array.from({ length: 5 }).map((_, i) => {
                // Trazo y relleno del original: primary-500 llena, primary-400 /
                // primary-200 media, stone-300 / stone-200 vacía.
                const [trazo, relleno] =
                    i < llenas ? ["#DAA520", "#DAA520"]
                    : i === llenas && media ? ["#E6BF45", "#F7E3A6"]
                    : ["#D6D3D1", "#E7E5E4"];
                return <Star key={i} size={11} color={trazo} fill={relleno} />;
            })}
        </View>
    );
}

/**
 * Tarjeta de distribuidor para el catálogo de mercado.
 * Navega a la tienda pública del distribuidor al hacer clic.
 */
export function TarjetaDistribuidor({
    distribuidorId,
    nombreNegocio,
    imagenFondo,
    valoracionPromedio,
    totalValoraciones,
    categorias,
}: TarjetaDistribuidorProps) {
    return (
        // flex-1: en el grid original la tarjeta se estiraba al alto de la fila.
        <Link
            href={`/mercado/distribuidor/tienda?d=${distribuidorId}`}
            bloque
            className="flex-1 group bg-white rounded-2xl border border-stone-100 drop-shadow-sm overflow-hidden hover:shadow-md transition-shadow"
        >
            {/* Imagen de fondo / Hero */}
            <View className="relative w-full h-36 overflow-hidden">
                {/* bg-gradient-to-br from-secondary-200 to-secondary-400 */}
                <Degradado direccion="to-br" paradas={[{ offset: 0, color: "#FBF7EF" }, { offset: 1, color: "#E8DEC8" }]} />
                {imagenFondo ? (
                    // `group-hover:` es CSS: en web escala con el hover del link.
                    <Image
                        source={{ uri: imagenFondo }}
                        accessibilityLabel={nombreNegocio}
                        resizeMode="cover"
                        className="w-full h-full group-hover:scale-105 transition-transform duration-300"
                    />
                ) : (
                    <View className="w-full h-full flex items-center justify-center">
                        <Store size={40} color="#9C968B" />
                    </View>
                )}
                {/* Overlay sutil: bg-gradient-to-t from-black/30 to-transparent */}
                <Degradado direccion="to-t" paradas={[{ offset: 0, color: "#000000", opacity: 0.3 }, { offset: 1, color: "#000000", opacity: 0 }]} />
            </View>

            {/* Contenido */}
            <View className="p-3 flex flex-col gap-1.5">
                <H3 peso="bold" numberOfLines={1} className="text-sm text-stone-900 leading-snug">
                    {nombreNegocio}
                </H3>

                {/* Rating */}
                {valoracionPromedio !== null && (
                    <View className="flex flex-row items-center gap-1.5">
                        <Estrellitas valor={valoracionPromedio} />
                        <Span className="text-[11px] leading-normal text-stone-500">
                            {valoracionPromedio.toFixed(1)}
                            {totalValoraciones ? ` (${totalValoraciones})` : ""}
                        </Span>
                    </View>
                )}

                {/* Categorías */}
                {categorias && categorias.length > 0 && (
                    <View className="flex flex-row flex-wrap gap-1 mt-0.5">
                        {categorias.slice(0, 3).map((cat) => (
                            <View
                                key={cat}
                                className="bg-[#FFFBF0] px-2 py-0.5 rounded-full border border-[#F7E3A6]"
                            >
                                <Span peso="medium" className="text-[10px] leading-normal text-[#9E7517]">{cat}</Span>
                            </View>
                        ))}
                        {categorias.length > 3 && (
                            <Span className="text-[10px] leading-normal text-stone-400 px-1 self-center">
                                +{categorias.length - 3}
                            </Span>
                        )}
                    </View>
                )}
            </View>
        </Link>
    );
}
