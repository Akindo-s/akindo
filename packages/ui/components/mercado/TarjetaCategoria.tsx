/** @jsxImportSource nativewind */

import { Image, View } from "react-native";
import { Package } from "lucide-react-native";
import { Span } from "../html-elements";
import { Link } from "../link";
import { Degradado } from "../ui/Degradado";

interface TarjetaCategoriaProps {
    id: string;
    nombre: string;
    imagen: string | null;
    tipo: "producto" | "distribuidor";
}

// drop-shadow-sm: el filtro de CSS no existe en RN, en texto es un textShadow.
const SOMBRA_TEXTO = { textShadowColor: "rgba(0, 0, 0, 0.05)", textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 1 };

/**
 * Tarjeta visual de categoría para el mercado.
 * Al hacer clic navega a la página de productos o distribuidores con el filtro aplicado.
 */
export function TarjetaCategoria({ id, nombre, imagen, tipo }: TarjetaCategoriaProps) {
    const href =
        tipo === "producto"
            ? `/mercado/productos?categoria=${id}`
            : `/mercado/distribuidores?categoria=${id}`;

    const badgeLabel = tipo === "producto" ? "Productos" : "Distribuidores";
    // bg-primary-500 / bg-neutral-700
    const badgeColor = tipo === "producto" ? "bg-[#DAA520]" : "bg-[#565045]";

    return (
        <Link
            href={href}
            bloque
            className="relative rounded-2xl overflow-hidden aspect-square flex flex-col justify-end bg-[#D1CEC8] hover:scale-[1.02] active:scale-[0.98] transition-transform shadow-sm"
        >
            {/* Imagen de fondo */}
            {imagen ? (
                <Image
                    source={{ uri: imagen }}
                    accessibilityLabel={nombre}
                    resizeMode="cover"
                    className="absolute inset-0 w-full h-full"
                />
            ) : (
                <View className="absolute inset-0 flex items-center justify-center">
                    {/* bg-gradient-to-br from-secondary-200 to-secondary-400 */}
                    <Degradado direccion="to-br" paradas={[{ offset: 0, color: "#FBF7EF" }, { offset: 1, color: "#E8DEC8" }]} />
                    <Package size={36} color="#9C968B" />
                </View>
            )}

            {/* Overlay: bg-gradient-to-t from-black/70 via-black/10 to-transparent */}
            <Degradado
                direccion="to-t"
                paradas={[
                    { offset: 0, color: "#000000", opacity: 0.7 },
                    { offset: 0.5, color: "#000000", opacity: 0.1 },
                    { offset: 1, color: "#000000", opacity: 0 },
                ]}
            />

            {/* Badge de tipo */}
            {/* El original era un <span> en línea dentro de un <div> con la
                línea de 24px del body: el fondo medía 16px (el alto de la letra
                + py-0.5) y quedaba 6px más abajo. De ahí leading-3 y mt-1.5. */}
            <View className="absolute top-2.5 left-2.5 z-10">
                <View className={`mt-1.5 px-2 py-0.5 rounded-full ${badgeColor}`}>
                    <Span peso="semibold" className="text-[10px] leading-3 text-white">{badgeLabel}</Span>
                </View>
            </View>

            {/* Nombre */}
            <View className="relative z-10 p-3">
                <Span peso="bold" numberOfLines={2} className="text-xs text-white leading-snug" style={SOMBRA_TEXTO}>
                    {nombre}
                </Span>
            </View>
        </Link>
    );
}
