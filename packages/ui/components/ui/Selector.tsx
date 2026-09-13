/** @jsxImportSource nativewind */
"use client";

import { useState } from "react";
import { View } from "react-native";
import { ChevronDown } from "lucide-react-native";
import { Pressable, Span } from "../html-elements";

export interface OpcionSelector<T extends string> {
  valor: T;
  label: string;
}

interface SelectorProps<T extends string> {
  opciones: OpcionSelector<T>[];
  valor: T;
  onChange: (valor: T) => void;
  /** Clases de la caja, para que mida igual que el `<select>` que reemplaza. */
  className?: string;
  /** Clases del texto de la opción elegida. */
  claseTexto?: string;
  accessibilityLabel?: string;
}

/**
 * Reemplazo del `<select>`, que no existe en React Native (regla 52): un botón
 * con la opción elegida y el ChevronDown, que despliega la lista abajo. En web
 * deja de ser el desplegable del navegador, pero la caja mide igual.
 */
export function Selector<T extends string>({
  opciones,
  valor,
  onChange,
  className = "",
  claseTexto = "text-sm text-stone-800",
  accessibilityLabel,
}: SelectorProps<T>) {
  const [abierto, setAbierto] = useState(false);
  const elegida = opciones.find((o) => o.valor === valor) ?? opciones[0];

  return (
    <View className="relative">
      <Pressable
        role="button"
        accessibilityLabel={accessibilityLabel}
        onPress={() => setAbierto((v) => !v)}
        className={`w-full flex flex-row items-center justify-between ${className}`}
      >
        <Span className={`${claseTexto} shrink`}>{elegida.label}</Span>
        <ChevronDown size={16} color="#A8A29E" />
      </Pressable>
      {abierto && (
        // Va por encima de lo que siga (en nativo también hace falta elevation).
        <View className="absolute top-full left-0 right-0 mt-1 bg-white border border-stone-200 rounded-xl overflow-hidden z-20 elevation-[20] shadow-md">
          {opciones.map((op, i) => (
            <Pressable
              key={op.valor}
              role="button"
              onPress={() => { onChange(op.valor); setAbierto(false); }}
              className={`p-3 ${i > 0 ? "border-t border-stone-100" : ""}`}
            >
              <Span className={`text-sm ${op.valor === valor ? "text-[#C1901D]" : "text-stone-800"}`}>{op.label}</Span>
            </Pressable>
          ))}
        </View>
      )}
    </View>
  );
}
