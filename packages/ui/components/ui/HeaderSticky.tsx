/** @jsxImportSource nativewind */
"use client";

import { useState, type ReactNode } from "react";
import { View } from "react-native";
import { ArrowLeft } from "lucide-react-native";
import useRouter from "@akindo/ui/router";
import { H1, Header, Pressable } from "../html-elements";

interface HeaderStickyProps {
  titulo: string;
  onBack?: () => void;
  mostrarBack?: boolean;
  derecha?: ReactNode;
}

/**
 * Encabezado con título y botón de volver, fijo arriba al scrollear. En web
 * con `web:sticky`; en nativo lo fija la pantalla (indiceFijo del
 * ContenedorPantalla), porque sticky no existe en RN.
 */
export function HeaderSticky({
  titulo,
  onBack,
  mostrarBack = true,
  derecha
}: HeaderStickyProps) {
  const router = useRouter();
  const [volverEnHover, setVolverEnHover] = useState(false);

  const handleBack = () => {
    if (onBack) {
      onBack();
    } else {
      router.back();
    }
  };

  return (
    <Header className="web:sticky top-0 z-40 bg-white/80 backdrop-blur-md flex flex-row items-center px-4 h-14 border-b border-stone-200/50 shadow-sm transition-all duration-300">
      <View className="flex flex-row items-center w-full max-w-4xl mx-auto">
        {mostrarBack && (
          <Pressable
            role="button"
            onPress={handleBack}
            onHoverIn={() => setVolverEnHover(true)}
            onHoverOut={() => setVolverEnHover(false)}
            // `z-10`: el H1 que sigue es un hermano posterior y en nativo se pinta
            // encima del botón absoluto, que se quedaba sin recibir el toque (en
            // web un absolute ya pinta sobre el contenido en flujo).
            className="absolute z-10 p-2 -ml-2 transition-colors rounded-full hover:bg-stone-100/50"
            accessibilityLabel="Volver"
          >
            {/* text-stone-700, y text-stone-900 en hover. */}
            <ArrowLeft size={20} color={volverEnHover ? "#1C1917" : "#44403C"} />
          </Pressable>
        )}

        <H1 peso="bold" numberOfLines={1} className="text-center text-sm text-stone-900 px-4 flex-1">
          {titulo}
        </H1>

        {derecha && (
          <View className="flex flex-row items-center">
            {derecha}
          </View>
        )}
      </View>
    </Header>
  );
}
