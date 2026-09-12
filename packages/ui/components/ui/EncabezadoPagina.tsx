/** @jsxImportSource nativewind */
"use client";

import type { ReactNode } from "react";
import { View } from "react-native";
import { twMerge } from "tailwind-merge";
import { ArrowLeft } from "lucide-react-native";
import { H1, Header, Pressable } from "../html-elements";
import { Link } from "../link";

interface EncabezadoPaginaProps {
  /** Título centrado que aparece en el encabezado. */
  titulo: string;

  /** URL a la que navega el botón de regreso. Si se omite, no se muestra. */
  href?: string;

  /** Alternativa al `href` (tiene prioridad el `href`). */
  onPress?: () => void;

  /** Elemento del lado derecho (ej. un botón de opciones). */
  accionDerecha?: ReactNode;

  /** Clases Tailwind adicionales para el contenedor. */
  className?: string;
}

/**
 * `EncabezadoPagina` — barra de encabezado con botón de regreso opcional y
 * título centrado, fija arriba al scrollear.
 *
 * En web se pega con `web:sticky`; en nativo lo fija la pantalla, que lo pone
 * como hijo fijo del `ContenedorPantalla` (regla 27).
 */
export function EncabezadoPagina({
  titulo,
  href,
  onPress,
  accionDerecha,
  className = "",
}: EncabezadoPaginaProps) {
  const botonRegreso = href ? (
    <Link href={href} bloque className="cursor-pointer">
      <ArrowLeft size={24} color="#292524" />
    </Link>
  ) : onPress ? (
    <Pressable role="button" accessibilityLabel="Volver" onPress={onPress} className="cursor-pointer">
      <ArrowLeft size={24} color="#292524" />
    </Pressable>
  ) : (
    // espaciador para mantener el título centrado
    <View className="w-6" />
  );

  return (
    <Header
      className={twMerge(
        "web:sticky top-0 z-50 flex flex-row items-center justify-between p-4 bg-[#FAF7F2] xl:bg-white rounded-b-2xl",
        className
      )}
    >
      {botonRegreso}
      {/* El título va absoluto y centrado contra el encabezado, como en el
          original: así no se mueve según el ancho de la acción derecha. */}
      <H1
        peso="bold"
        className="text-sm tracking-[1.4px] text-stone-900 uppercase absolute left-1/2 -translate-x-1/2"
      >
        {titulo}
      </H1>
      {accionDerecha ?? <View className="w-6" />}
    </Header>
  );
}
