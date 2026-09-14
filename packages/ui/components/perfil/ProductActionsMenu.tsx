/** @jsxImportSource nativewind */
"use client";

import { useEffect, useState } from "react";
import { Platform, View } from "react-native";
import { MoreVertical, Edit3, Archive, PackagePlus } from "lucide-react-native";
import useRouter from "@akindo/ui/router";
import { Pressable, Span } from "../html-elements";

interface ProductActionsMenuProps {
  productoId: string;
  /**
   * Abre la confirmación de archivar. El modal lo pinta la pantalla y no este
   * menú: adentro de una tarjeta, en nativo taparía solo la tarjeta (regla 54).
   */
  onPedirArchivar: (productoId: string) => void;
}

/** Una opción del menú. El hover va por estado (regla 5). */
function OpcionMenu({
  Icono,
  texto,
  peligro,
  onPress,
}: {
  Icono: React.ComponentType<{ size?: number; color?: string }>;
  texto: string;
  peligro?: boolean;
  onPress: () => void;
}) {
  const [enHover, setEnHover] = useState(false);
  const color = enHover ? (peligro ? "#EF4444" : "#DAA520") : "#44403C";

  return (
    <Pressable
      role="button"
      onPress={onPress}
      onHoverIn={() => setEnHover(true)}
      onHoverOut={() => setEnHover(false)}
      className="flex flex-row items-center gap-2 px-3 py-2 transition"
      style={enHover ? { backgroundColor: peligro ? "#FEF2F2" : "#FDF2E3" } : undefined}
    >
      <Icono size={14} color={color} />
      <Span className="text-sm" style={{ color }}>{texto}</Span>
    </Pressable>
  );
}

/**
 * Menú de tres puntos de un producto (editar, surtir, archivar).
 *
 * El cierre al hacer clic afuera queda solo en web, donde hay `document`.
 */
export default function ProductActionsMenu({ productoId, onPedirArchivar }: ProductActionsMenuProps) {
  const router = useRouter();
  const [abierto, setAbierto] = useState(false);

  useEffect(() => {
    if (Platform.OS !== "web" || !abierto) return;
    const alTocarFuera = () => setAbierto(false);
    // `setTimeout`: si no, el mismo click que abre el menú lo cierra.
    const id = setTimeout(() => document.addEventListener("mousedown", alTocarFuera), 0);
    return () => {
      clearTimeout(id);
      document.removeEventListener("mousedown", alTocarFuera);
    };
  }, [abierto]);

  const irAEditar = () => {
    setAbierto(false);
    router.push(`/distribuidor/productos/${productoId}/editar` as never);
  };

  return (
    <View className="relative">
      <Pressable
        role="button"
        accessibilityLabel="Acciones del producto"
        onPress={() => setAbierto((v) => !v)}
        className="p-2 rounded-full transition hover:bg-stone-100"
      >
        <MoreVertical size={16} color="#A8A29E" />
      </Pressable>

      {abierto && (
        // `z-10` y `elevation`: va por encima de las tarjetas, que tienen sombra.
        <View className="absolute right-0 bottom-full mt-1 w-40 bg-white rounded-xl shadow-lg border border-stone-100 py-1 z-10 elevation-[10] flex flex-col overflow-hidden">
          <OpcionMenu Icono={Edit3} texto="Editar" onPress={irAEditar} />
          <OpcionMenu Icono={PackagePlus} texto="Surtir existencias" onPress={irAEditar} />
          <View className="h-px bg-stone-100 my-1" />
          <OpcionMenu Icono={Archive} texto="Archivar" peligro onPress={() => { setAbierto(false); onPedirArchivar(productoId); }} />
        </View>
      )}
    </View>
  );
}
