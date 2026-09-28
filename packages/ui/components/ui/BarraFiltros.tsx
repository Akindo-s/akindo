/** @jsxImportSource nativewind */
"use client";

import { useEffect, useState } from "react";
import { ScrollView, View } from "react-native";
import { twMerge } from "tailwind-merge";
import { Buscador } from "./Buscador";
import { Selector, type OpcionSelector } from "./Selector";
import { Pressable, Span } from "../html-elements";

/**
 * Una pestaña de la fila de filtros rápidos. `valor` es lo que se le pasa al
 * padre; `null` es "todas".
 */
export interface PestanaFiltro {
  valor: string | null;
  etiqueta: string;
  /** Se pinta entre paréntesis, como "Todas (17)". Opcional. */
  cantidad?: number | null;
}

/** Un desplegable de la barra ("Todos los distribuidores", "Cualquier monto"). */
export interface DesplegableFiltro {
  /** Con qué clave viaja al padre en `onDesplegable`. */
  id: string;
  /**
   * `"filtro"` (default) recorta el listado, así que la pantalla debería volver
   * a la página 1 al cambiarlo. `"orden"` solo reordena lo mismo: ahí la página
   * actual se respeta.
   */
  tipo?: "filtro" | "orden";
  valor: string;
  opciones: OpcionSelector[];
  /** Ancho de la caja en web; en móvil todas ocupan la mitad de la fila. */
  className?: string;
}

interface BarraFiltrosProps {
  /** Texto del buscador. */
  placeholder?: string;
  /**
   * Búsqueda vigente (la que ya se aplicó). La barra la usa como valor inicial
   * del campo; mientras el usuario escribe, el texto lo lleva el `Buscador`.
   */
  busqueda: string;
  /** Se llama con el debounce del `Buscador`, no en cada tecla. */
  onBuscar: (q: string) => void;
  /** Milisegundos del debounce. Default 350. */
  debounceMs?: number;
  /** Pestañas de estado. Sin esta prop no se pinta la fila. */
  pestanas?: PestanaFiltro[];
  pestanaActiva?: string | null;
  onPestana?: (valor: string | null) => void;
  /** Desplegables. Sin esta prop no se pinta la fila. */
  desplegables?: DesplegableFiltro[];
  onDesplegable?: (id: string, valor: string) => void;
  className?: string;
}

function Pestana({
  etiqueta,
  cantidad,
  activa,
  onPress,
}: {
  etiqueta: string;
  cantidad?: number | null;
  activa: boolean;
  onPress: () => void;
}) {
  // El className no cambia con el estado: los colores van por `style` y por el
  // `peso` del texto (regla 50).
  return (
    <Pressable
      role="button"
      onPress={onPress}
      style={{ backgroundColor: activa ? "#1C1917" : "#FFFFFF", borderColor: activa ? "#1C1917" : "#E7E5E4" }}
      className="px-3.5 py-1.5 rounded-full border flex flex-row items-center gap-1.5 cursor-pointer"
    >
      <Span peso={activa ? "semibold" : "medium"} className="text-xs leading-5" style={{ color: activa ? "#FFFFFF" : "#57534E" }}>
        {etiqueta}
      </Span>
      {cantidad != null && (
        <Span peso="semibold" className="text-xs leading-5" style={{ color: activa ? "#DAA520" : "#A8A29E" }}>
          {cantidad}
        </Span>
      )}
    </Pressable>
  );
}

/**
 * `BarraFiltros` — buscador + pestañas + desplegables, en una sola barra.
 *
 * Es el bloque de filtros de los listados largos (órdenes de compra y pedidos,
 * del cliente o del distribuidor). No sabe nada de órdenes ni de pedidos: todo
 * lo que muestra entra por props y todo lo que el usuario toca sale por
 * callbacks, así que el estado y la llamada a la API viven en la pantalla.
 *
 * Cómo se acomoda: en móvil, buscador arriba, desplegables en una fila de dos
 * y las pestañas en un carrusel horizontal; desde `md` los tres bloques
 * comparten renglón. Está documentado en `dev-docs/BARRA-FILTROS.md`.
 */
export function BarraFiltros({
  placeholder = "Buscar...",
  busqueda,
  onBuscar,
  debounceMs = 350,
  pestanas,
  pestanaActiva = null,
  onPestana,
  desplegables,
  onDesplegable,
  className = "",
}: BarraFiltrosProps) {
  const [texto, setTexto] = useState(busqueda);

  // Si el padre limpia los filtros desde afuera, el campo se entera.
  useEffect(() => { setTexto(busqueda); }, [busqueda]);

  return (
    <View className={twMerge("w-full flex flex-col gap-3", className)}>
      {/* En móvil el buscador va arriba y ocupa todo el ancho; desde md se
          pone a la derecha de los desplegables. */}
      <View className="flex flex-col md:flex-row-reverse md:items-center gap-3 z-10 flex-wrap">
        {/* El texto lo lleva la barra y la búsqueda sale con el debounce del
            `Buscador`: si `onChange` avisara al padre en cada tecla, cada letra
            sería una llamada a la API. `onChange` solo mantiene el campo al día. */}
        <Buscador
          placeholder={placeholder}
          valor={texto}
          onChange={setTexto}
          onBuscar={onBuscar}
          debounceMs={debounceMs}
          className="w-full md:flex-1 min-w-[150px]"
        />

        {/* `z-10`: los desplegables se abren hacia abajo y las pestañas van
            después en el DOM, así que sin esto las tapaban en web. */}
        {desplegables && desplegables.length > 0 && (
          <View className="flex flex-row flex-wrap items-center gap-3 md:w-auto z-10">
            {desplegables.map((d) => (
              <Selector
                key={d.id}
                modo="simple"
                valor={d.valor}
                opciones={d.opciones}
                onChange={(valor) => onDesplegable?.(d.id, valor)}
                // `min-w`: con tres desplegables en un teléfono las etiquetas
                // quedaban cortadas; así el tercero baja a su propio renglón.
                className={twMerge("flex-1 min-w-[150px] md:min-w-0 md:w-auto", d.className)}
                claseCaja="bg-white border border-stone-200 rounded-xl px-3 py-2.5"
                claseTexto="text-xs leading-5 text-stone-600"
              />
            ))}
          </View>
        )}
      </View>

      {pestanas && pestanas.length > 0 && (
        // `overflow-x-auto` del diseño: en nativo la fila que scrollea es un
        // ScrollView horizontal (regla 17).
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerClassName="gap-2 py-0.5">
          {pestanas.map((p) => (
            <Pestana
              key={p.valor ?? "todas"}
              etiqueta={p.etiqueta}
              cantidad={p.cantidad}
              activa={pestanaActiva === p.valor}
              onPress={() => onPestana?.(p.valor)}
            />
          ))}
        </ScrollView>
      )}
    </View>
  );
}
