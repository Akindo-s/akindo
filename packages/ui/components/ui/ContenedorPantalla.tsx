/** @jsxImportSource nativewind */
"use client";

import { createContext, useCallback, useContext, useEffect, useRef } from "react";
import { Platform, ScrollView, View, type NativeScrollEvent } from "react-native";

interface ContenedorPantallaProps {
  /** Clases del contenedor de la página (padding, gap, max-w...). */
  className: string;
  /** Índice, entre los hijos directos, del que queda fijo arriba al scrollear. */
  indiceFijo?: number;
  children: React.ReactNode;
}

/** Cuánto antes del final (px) se avisa a los `Centinela`. */
const MARGEN_FINAL = 80;

type Registrar = (alLlegar: () => void) => () => void;
const FinalContext = createContext<Registrar | null>(null);

/**
 * Raíz de una pantalla con un hijo fijo arriba (el buscador).
 *
 * En web scrollea el `<main>` del layout y el hijo se fija con `web:sticky` en
 * su propio className. En nativo no hay sticky en CSS: la pantalla es un
 * ScrollView y el hijo se fija con stickyHeaderIndices, que solo funciona con
 * hijos directos. En nativo también avisa a los `Centinela` cuando el scroll
 * llega al final (en web lo resuelve cada Centinela con IntersectionObserver).
 */
export function ContenedorPantalla({ className, indiceFijo, children }: ContenedorPantallaProps) {
  const oyentes = useRef(new Set<() => void>());
  const alto = useRef(0);

  const registrar = useCallback<Registrar>((alLlegar) => {
    oyentes.current.add(alLlegar);
    return () => { oyentes.current.delete(alLlegar); };
  }, []);

  const avisar = () => oyentes.current.forEach((alLlegar) => alLlegar());

  if (Platform.OS === "web") {
    return <View className={className}>{children}</View>;
  }

  const alScrollear = ({ contentOffset, layoutMeasurement, contentSize }: NativeScrollEvent) => {
    if (contentOffset.y + layoutMeasurement.height >= contentSize.height - MARGEN_FINAL) avisar();
  };

  return (
    <FinalContext.Provider value={registrar}>
      <ScrollView
        stickyHeaderIndices={indiceFijo === undefined ? undefined : [indiceFijo]}
        contentContainerClassName={className}
        keyboardShouldPersistTaps="handled"
        scrollEventThrottle={100}
        onScroll={(e) => alScrollear(e.nativeEvent)}
        onLayout={(e) => { alto.current = e.nativeEvent.layout.height; }}
        // Si el contenido no llena la pantalla no hay scroll que avise: el
        // IntersectionObserver de web, en cambio, vería el centinela a la vista.
        onContentSizeChange={(_, altoContenido) => {
          if (alto.current && altoContenido <= alto.current + MARGEN_FINAL) avisar();
        }}
      >
        {children}
      </ScrollView>
    </FinalContext.Provider>
  );
}

/**
 * Marca el final de una lista con scroll infinito: llama a `onVisible` cuando
 * queda a la vista. Web: IntersectionObserver (threshold 0.1, como el hook
 * original). Nativo: el aviso de fin de scroll del `ContenedorPantalla`.
 */
export function Centinela({ onVisible, className, children }: { onVisible: () => void; className?: string; children?: React.ReactNode }) {
  const registrar = useContext(FinalContext);
  const ref = useRef<View>(null);
  const onVisibleRef = useRef(onVisible);
  useEffect(() => { onVisibleRef.current = onVisible; }, [onVisible]);

  useEffect(() => {
    if (Platform.OS === "web") {
      // En react-native-web el ref de un View es el nodo del DOM.
      const nodo = ref.current as unknown as Element | null;
      if (!nodo) return;
      const observador = new IntersectionObserver((entradas) => {
        if (entradas[0].isIntersecting) onVisibleRef.current();
      }, { threshold: 0.1 });
      observador.observe(nodo);
      return () => observador.disconnect();
    }
    return registrar?.(() => onVisibleRef.current());
  }, [registrar]);

  return <View ref={ref} className={className}>{children}</View>;
}
