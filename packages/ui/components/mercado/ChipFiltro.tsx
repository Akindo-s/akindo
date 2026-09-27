/** @jsxImportSource nativewind */

import { useState } from "react";
import { Text } from "react-native";
import { Pressable } from "../html-elements";
import { fuente } from "../../fonts";

type IconoChip = React.ComponentType<{ size?: number; color?: string }>;

interface ChipFiltroProps {
    activo: boolean;
    onPress: () => void;
    etiqueta: string;
    Icono?: IconoChip;
}

/**
 * Chip de filtro de las barras de mercado (categorías, tipo). El texto y el
 * ícono no heredan el color del botón: va en cada uno.
 */
export function ChipFiltro({ activo, onPress, etiqueta, Icono }: ChipFiltroProps) {
    // `hover:bg-stone-50` (solo inactivo) con estado y no por className: una
    // clase `hover:` que aparece y desaparece hace que nativewind "mejore" el
    // componente en caliente, y en nativo eso reventaba (ver migracion-progreso).
    const [enHover, setEnHover] = useState(false);
    return (
        <Pressable
            role="button"
            onPress={onPress}
            onHoverIn={() => setEnHover(true)}
            onHoverOut={() => setEnHover(false)}
            className={`flex-shrink-0 flex flex-row items-center gap-1.5 px-3 py-1.5 rounded-full border transition-colors cursor-pointer ${
                activo
                    ? "bg-[#DAA520] border-[#DAA520]"
                    : `${enHover ? "bg-stone-50" : "bg-transparent"} border-stone-200`
            }`}
        >
            {/* text-white activo, text-stone-600 inactivo. */}
            {Icono && <Icono size={12} color={activo ? "#FFFFFF" : "#57534E"} />}
            <Text style={fuente("medium")} className={`text-xs ${activo ? "text-white" : "text-stone-600"}`}>
                {etiqueta}
            </Text>
        </Pressable>
    );
}
