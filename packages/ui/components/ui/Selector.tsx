/** @jsxImportSource nativewind */
"use client";

import { useEffect, useRef, useState } from "react";
import { Platform, ScrollView, View } from "react-native";
import { ChevronDown, X } from "lucide-react-native";
import { twMerge } from "tailwind-merge";
import { Pressable, Span } from "../html-elements";

/**
 * Opción para el Selector. Cada opción tiene un valor único y una etiqueta visible.
 */
export interface OpcionSelector<T extends string = string> {
  valor: T;
  etiqueta: string;
}

interface SelectorBaseProps<T extends string> {
  /** Etiqueta visible arriba del selector. */
  label?: string;
  /** Texto placeholder cuando no hay selección. */
  placeholder?: string;
  /** Lista de opciones disponibles. */
  opciones: OpcionSelector<T>[];
  /** Clases Tailwind adicionales para el contenedor raíz. */
  className?: string;
  /** Marcar como requerido (muestra asterisco rojo). */
  requerido?: boolean;
  /** Clases de la caja, para que mida igual que un `<select>` que reemplaza (se mezclan con twMerge). */
  claseCaja?: string;
  /** Clases del texto de la caja. Reemplazan a las de por defecto. */
  claseTexto?: string;
  accessibilityLabel?: string;
}

interface SelectorSimpleProps<T extends string> extends SelectorBaseProps<T> {
  /** `"simple"`: solo se puede seleccionar una opción (dropdown clásico). */
  modo: "simple";
  /** Valor actualmente seleccionado. */
  valor: T | "";
  onChange: (valor: T) => void;
}

interface SelectorMultipleProps<T extends string> extends SelectorBaseProps<T> {
  /** `"multiple"`: permite varias opciones, que se muestran como chips. */
  modo: "multiple";
  /** Valores actualmente seleccionados. */
  valor: T[];
  onChange: (valores: T[]) => void;
}

type SelectorProps<T extends string> = SelectorSimpleProps<T> | SelectorMultipleProps<T>;

/** Una opción de la lista. El hover va en el propio Pressable y el "elegida" por style (regla 50). */
function OpcionLista({ etiqueta, seleccionado, conCheck, onPress }: { etiqueta: string; seleccionado: boolean; conCheck: boolean; onPress: () => void }) {
  return (
    <Pressable
      role="button"
      onPress={onPress}
      style={seleccionado ? { backgroundColor: "#FDF2E3" } : undefined}
      className="w-full px-3 py-2.5 flex flex-row items-center justify-between hover:bg-[#FDF2E3] cursor-pointer"
    >
      <Span peso={seleccionado ? "medium" : "normal"} className={`text-sm leading-5 shrink ${seleccionado ? "text-[#DAA520]" : "text-stone-700"}`}>
        {etiqueta}
      </Span>
      {conCheck && seleccionado && <Span peso="bold" className="text-xs leading-4 text-[#DAA520]">✓</Span>}
    </Pressable>
  );
}

/** Chip de una opción elegida, con la X para quitarla (roja en hover, como el original). */
function Chip({ etiqueta, onQuitar }: { etiqueta: string; onQuitar: () => void }) {
  const [hover, setHover] = useState(false);
  return (
    <View className="flex flex-row items-center gap-1 bg-[#FDF2E3] border border-[#E8DEC1] rounded-full px-2.5 py-0.5">
      <Span peso="medium" className="text-xs leading-4 text-[#9A7B24]">{etiqueta}</Span>
      <Pressable
        role="button"
        accessibilityLabel={`Quitar ${etiqueta}`}
        onPress={onQuitar}
        onHoverIn={() => setHover(true)}
        onHoverOut={() => setHover(false)}
        className="cursor-pointer"
      >
        <X size={12} color={hover ? "#EF4444" : "#9A7B24"} />
      </Pressable>
    </View>
  );
}

/**
 * `Selector` — dropdown con selección simple o múltiple.
 *
 * Es el `Selector` de web con componentes de React Native: en `"simple"` es un
 * dropdown clásico; en `"multiple"` las opciones elegidas se muestran como
 * chips removibles debajo. También reemplaza a los `<select>` (regla 52),
 * pasándole `claseCaja` para que mida lo mismo.
 *
 * El desplegable es `absolute`: quien lo use tiene que dejar que se pinte por
 * encima de lo que sigue (un `z-*` en el ancestro que tenga hermanos debajo,
 * regla 54). La raíz sube a `z-40` mientras está abierto.
 *
 * Cerrar al tocar afuera: en web con un listener de `mousedown` en el
 * documento, como el original; en nativo no hay documento, así que se cierra
 * al volver a tocar la caja o al elegir (en `"simple"`).
 */
export function Selector<T extends string>(props: SelectorProps<T>) {
  const {
    label,
    placeholder = "Seleccionar...",
    opciones,
    className = "",
    requerido,
    claseCaja,
    claseTexto,
    accessibilityLabel,
  } = props;
  const [abierto, setAbierto] = useState(false);
  const contenedorRef = useRef<View>(null);

  // Cerrar al hacer click fuera (solo web: en react-native-web el ref es el nodo del DOM).
  useEffect(() => {
    if (Platform.OS !== "web") return;
    const handleClickFuera = (e: MouseEvent) => {
      const nodo = contenedorRef.current as unknown as Node | null;
      if (nodo && !nodo.contains(e.target as Node)) setAbierto(false);
    };
    document.addEventListener("mousedown", handleClickFuera);
    return () => document.removeEventListener("mousedown", handleClickFuera);
  }, []);

  const valores: string[] = props.modo === "multiple" ? props.valor : props.valor ? [props.valor] : [];
  const sinSeleccion = valores.length === 0;

  const textoVisible = (() => {
    if (props.modo === "multiple") {
      if (sinSeleccion) return placeholder;
      return `${valores.length} seleccionada${valores.length > 1 ? "s" : ""}`;
    }
    if (!props.valor) return placeholder;
    return opciones.find((o) => o.valor === props.valor)?.etiqueta ?? props.valor;
  })();

  const handleSeleccionar = (opcion: OpcionSelector<T>) => {
    if (props.modo === "multiple") {
      const existe = props.valor.includes(opcion.valor);
      props.onChange(existe ? props.valor.filter((v) => v !== opcion.valor) : [...props.valor, opcion.valor]);
    } else {
      props.onChange(opcion.valor);
      setAbierto(false);
    }
  };

  const handleRemoverChip = (valor: T) => {
    if (props.modo === "multiple") props.onChange(props.valor.filter((v) => v !== valor));
  };

  return (
    <View ref={contenedorRef} className={twMerge("flex flex-col gap-1 w-full relative", abierto ? "z-40" : "", className)}>
      {label && (
        <Span peso="medium" className="text-xs leading-4 text-stone-600 select-none">
          {label} {requerido && <Span className="text-xs text-red-500">*</Span>}
        </Span>
      )}

      {/* Trigger */}
      <Pressable
        role="button"
        accessibilityLabel={accessibilityLabel ?? label}
        onPress={() => setAbierto((v) => !v)}
        className={twMerge(
          "w-full flex flex-row items-center justify-between bg-[#FCF8F4] border rounded-xl px-3 py-2.5 cursor-pointer",
          abierto ? "border-[#DAA520]" : "border-[#E8DEC1]/60",
          claseCaja,
        )}
      >
        {/* `truncate` → numberOfLines. */}
        <Span
          numberOfLines={1}
          className={`${claseTexto ?? `text-sm leading-5 ${sinSeleccion ? "text-stone-400" : "text-stone-800"}`} shrink`}
        >
          {textoVisible}
        </Span>
        <View style={{ transform: [{ rotate: abierto ? "180deg" : "0deg" }] }}>
          <ChevronDown size={16} color="#A8A29E" />
        </View>
      </Pressable>

      {/* Dropdown. La sombra va en el View de afuera y el recorte en el de
          adentro: en iOS un `overflow-hidden` (o un ScrollView) recorta su
          propia sombra (regla 18). */}
      {abierto && (
        <View className="absolute top-full left-0 right-0 z-40 elevation-[40] mt-1 bg-white border border-[#E8DEC1] rounded-xl shadow-lg">
          <View className="rounded-xl overflow-hidden">
            <ScrollView className="max-h-[190px]" nestedScrollEnabled keyboardShouldPersistTaps="handled">
              {opciones.map((opcion) => (
                <OpcionLista
                  key={opcion.valor}
                  etiqueta={opcion.etiqueta}
                  seleccionado={valores.includes(opcion.valor)}
                  conCheck={props.modo === "multiple"}
                  onPress={() => handleSeleccionar(opcion)}
                />
              ))}
              {opciones.length === 0 && (
                <View className="px-3 py-2.5">
                  <Span className="text-sm leading-5 text-stone-400 text-center">Sin opciones</Span>
                </View>
              )}
            </ScrollView>
          </View>
        </View>
      )}

      {/* Chips de selección múltiple */}
      {props.modo === "multiple" && props.valor.length > 0 && (
        <View className="flex flex-row flex-wrap gap-1.5 mt-1">
          {props.valor.map((val) => (
            <Chip
              key={val}
              etiqueta={opciones.find((o) => o.valor === val)?.etiqueta ?? val}
              onQuitar={() => handleRemoverChip(val)}
            />
          ))}
        </View>
      )}
    </View>
  );
}
