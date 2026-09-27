/** @jsxImportSource nativewind */
"use client";

import { View } from "react-native";
import { Pressable, Span } from "../html-elements";

interface QuantityStepperProps {
  value: number;
  min?: number;
  suffix?: string;
  disabled?: boolean;
  onDecrease: () => void;
  onIncrease: () => void;
}

/** Los `-` y `+` son texto: el `<button>` de web los centraba solo. */
function BotonPaso({
  signo,
  etiqueta,
  disabled,
  onPress,
}: {
  signo: "-" | "+";
  etiqueta: string;
  disabled: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      role="button"
      accessibilityLabel={etiqueta}
      onPress={onPress}
      disabled={disabled}
      className="h-9 w-9 flex items-center justify-center"
      // `disabled:opacity-50` es una variante de CSS que en nativo no existe.
      style={disabled ? { opacity: 0.5 } : undefined}
    >
      <Span className="text-3xl leading-none text-stone-700">{signo}</Span>
    </Pressable>
  );
}

export default function QuantityStepper({
  value,
  min = 1,
  suffix = "pz",
  disabled = false,
  onDecrease,
  onIncrease,
}: QuantityStepperProps) {
  return (
    <View className="flex flex-row items-center rounded-full border border-[#D7CCBA] bg-[#F7F1E7]">
      <BotonPaso signo="-" etiqueta="Disminuir cantidad" disabled={disabled || value <= min} onPress={onDecrease} />
      {/* El original era un solo `<span>` con el sufijo anidado; el `ml-1` de un
          Text dentro de otro no existe en RN, así que es una fila. */}
      <View className="min-w-16 px-1 flex flex-row items-baseline justify-center">
        <Span peso="medium" className="text-lg text-stone-800">{value}</Span>
        <Span className="ml-1 text-xs text-stone-500">{suffix}</Span>
      </View>
      <BotonPaso signo="+" etiqueta="Aumentar cantidad" disabled={disabled} onPress={onIncrease} />
    </View>
  );
}
