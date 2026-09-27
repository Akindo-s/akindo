/** @jsxImportSource nativewind */
"use client";

import { View } from "react-native";
import { Download, Share2, FileSpreadsheet, FileText } from "lucide-react-native";
import { useExportacion, type FormatoExportacion } from "@akindo/shared/exportacion-context";
import { H2, P, Pressable, Section, Span } from "../html-elements";
import { Spinner } from "./Animaciones";

const ICONOS: Partial<Record<FormatoExportacion, React.ComponentType<{ size?: number; color?: string }>>> = {
  xlsx: FileSpreadsheet,
  csv: FileSpreadsheet,
  pdf: FileText,
};

/**
 * La tarjeta de "Exportación Contable Masiva".
 *
 * No decide nada: los formatos, cuáles están disponibles y qué pasa al tocarlos
 * salen de `ExportacionProvider`. Un formato no disponible se pinta apagado.
 */
export function ExportacionMasiva({
  titulo = "Exportación Contable Masiva",
  rotulo = "Reportes de cumplimiento",
  descripcion,
  className = "",
}: {
  titulo?: string;
  rotulo?: string;
  descripcion: string;
  className?: string;
}) {
  const { opciones, generando, error, descargar } = useExportacion();

  if (opciones.length === 0) return null;

  return (
    <Section className={`bg-white border border-stone-100 rounded-2xl p-5 drop-shadow-sm ${className}`}>
      <View className="flex flex-row items-start justify-between gap-3">
        <Span peso="semibold" className="text-[10px] leading-4 uppercase tracking-[0.6px] text-[#B45309]">
          {rotulo}
        </Span>
        <Share2 size={14} color="#A8A29E" />
      </View>

      <H2 peso="bold" className="text-lg leading-7 text-stone-900 mt-2">{titulo}</H2>
      <P className="text-xs leading-5 text-stone-500 mt-1">{descripcion}</P>

      {error && (
        <P peso="medium" className="text-xs leading-5 text-red-600 mt-3">{error}</P>
      )}

      <View className="flex flex-row flex-wrap gap-3 mt-4">
        {opciones.map((opcion) => {
          const Icono = ICONOS[opcion.formato] ?? FileSpreadsheet;
          const ocupado = generando === opcion.formato;
          return (
            // Un `Pressable` y no un `Boton`: adentro van dos renglones de
            // texto y un ícono, y el `Boton` envuelve sus children en un `Text`
            // (regla 70).
            <Pressable
              key={opcion.formato}
              role="button"
              accessibilityLabel={opcion.etiqueta}
              disabled={!opcion.disponible || generando !== null}
              onPress={() => descargar(opcion.formato)}
              style={{ opacity: opcion.disponible ? 1 : 0.5 }}
              className="flex-1 min-w-[150px] border border-stone-200 rounded-xl px-3.5 py-2.5 bg-white cursor-pointer hover:border-[#DAA520]"
            >
              <View className="flex flex-row items-center justify-between gap-2">
                <View className="flex flex-row items-center gap-2 shrink">
                  <Icono size={14} color="#57534E" />
                  <Span peso="semibold" numberOfLines={1} className="text-xs leading-5 text-stone-800 shrink">
                    {opcion.etiqueta}
                  </Span>
                </View>
                {ocupado ? <Spinner /> : <Download size={14} color="#DAA520" />}
              </View>
              <Span numberOfLines={1} className="text-[10px] leading-4 text-stone-400 mt-0.5">
                {opcion.disponible ? opcion.descripcion : "Próximamente"}
              </Span>
            </Pressable>
          );
        })}
      </View>
    </Section>
  );
}
