/** @jsxImportSource nativewind */
"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Animated, Easing, PanResponder, Platform, Text, View } from "react-native";
import { fuente } from "../fonts";
import { Pressable, Span } from "./html-elements";

interface VentanaEmergenteProps {
  mensaje: string;
  duracion?: number;
  onClose: () => void;
}

/** El `duration-300` de la version web. */
const DURACION_TRANSICION = 300;
/** Cuanto hay que deslizar a la derecha (px) para descartarla. */
const UMBRAL_DESLIZAR = 80;
/** El `ease-out` de Tailwind: cubic-bezier(0, 0, 0.2, 1). */
const EASE_OUT = Easing.bezier(0, 0, 0.2, 1);
/** react-native-web no tiene driver nativo; pedirlo en web solo tira un warning. */
const DRIVER_NATIVO = Platform.OS !== "web";

/**
 * Aviso flotante arriba a la izquierda que se cierra solo, con la ×, o
 * deslizandolo a la derecha.
 *
 * La version web animaba con clases de transicion CSS y leia el deslizamiento
 * con eventos touch del DOM; ninguna de las dos cosas existe en nativo. Aca
 * la entrada/salida va con `Animated` y el gesto con `PanResponder`, que
 * funcionan igual en React Native y en react-native-web.
 *
 * - Entra desde la izquierda (-100% de su ancho) mientras aparece.
 * - Sale igual, por tiempo (`duracion`), por la × o al soltarla despues de
 *   deslizarla mas de 80px; si no llega, vuelve a su lugar.
 * - `onClose` se llama cuando termino de salir, no antes.
 */
export function VentanaEmergente({ mensaje, duracion = 4000, onClose }: VentanaEmergenteProps) {
  // 0 = oculta (transparente y corrida a la izquierda), 1 = visible.
  const visibilidad = useRef(new Animated.Value(0)).current;
  // Lo que el usuario la deslizo hacia la derecha.
  const arrastre = useRef(new Animated.Value(0)).current;
  const [ancho, setAncho] = useState(0);
  const [xEnHover, setXEnHover] = useState(false);

  // El padre suele pasar una arrow nueva en cada render. Si onClose fuera
  // dependencia del efecto, cada re-render (ej. escribir en un input
  // controlado) reiniciaba el temporizador y la ventana no se iba nunca.
  const onCloseRef = useRef(onClose);
  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  const cerrar = useCallback(() => {
    Animated.timing(visibilidad, {
      toValue: 0,
      duration: DURACION_TRANSICION,
      easing: EASE_OUT,
      useNativeDriver: DRIVER_NATIVO,
    }).start(({ finished }) => {
      if (finished) onCloseRef.current();
    });
  }, [visibilidad]);

  const volverAlOrigen = useCallback(() => {
    Animated.timing(arrastre, {
      toValue: 0,
      duration: DURACION_TRANSICION,
      easing: EASE_OUT,
      useNativeDriver: DRIVER_NATIVO,
    }).start();
  }, [arrastre]);

  // Un mensaje nuevo reinicia la cuenta, igual que en la version web.
  useEffect(() => {
    Animated.timing(visibilidad, {
      toValue: 1,
      duration: DURACION_TRANSICION,
      easing: EASE_OUT,
      useNativeDriver: DRIVER_NATIVO,
    }).start();
    const temporizador = setTimeout(cerrar, duracion);

    return () => {
      clearTimeout(temporizador);
      // Corta una salida a medias: su callback recibe finished=false y ya no
      // llama a onClose (antes quedaba un setTimeout suelto que si lo hacia).
      visibilidad.stopAnimation();
    };
  }, [mensaje, duracion, cerrar, visibilidad]);

  const gesto = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        // Solo hacia la derecha, como la version web.
        onPanResponderMove: (_, { dx }) => arrastre.setValue(Math.max(0, dx)),
        onPanResponderRelease: (_, { dx }) => {
          if (dx > UMBRAL_DESLIZAR) cerrar();
          else volverAlOrigen();
        },
        onPanResponderTerminate: volverAlOrigen,
      }),
    [arrastre, cerrar, volverAlOrigen],
  );

  const desplazamiento = useMemo(
    () =>
      Animated.add(
        visibilidad.interpolate({ inputRange: [0, 1], outputRange: [-ancho, 0] }),
        arrastre,
      ),
    [visibilidad, arrastre, ancho],
  );

  return (
    // `fixed` no existe en nativo: ahi va `absolute`, que respecto de la
    // pantalla da lo mismo. En web se mantiene `fixed` para que no se vaya
    // con el scroll. `elevation-[50]` solo existe en Android: ahi el orden lo
    // decide la elevacion antes que el z-index, y la tarjeta (shadow-sm) tiene.
    <View
      // box-none: mientras entra o sale, el hueco invisible no tapa los toques
      // de lo que haya debajo.
      style={{ pointerEvents: "box-none" }}
      className="absolute web:fixed top-4 left-4 right-4 sm:left-4 sm:right-auto sm:max-w-sm z-50 elevation-[50]"
    >
      {/* Animated.View no tiene cssInterop (y en web no se le puede dar: su
          style se aplana y rompe las clases de nativewind). Por eso anima
          este wrapper y el estilo visual va en el View de adentro. */}
      <Animated.View
        {...gesto.panHandlers}
        onLayout={(e) => setAncho(e.nativeEvent.layout.width)}
        style={{ opacity: visibilidad, transform: [{ translateX: desplazamiento }] }}
      >
        <View className="bg-[#E0533D] p-4 rounded-xl shadow-lg border border-[#FEE2E2]/20 flex flex-row items-center justify-between gap-3 select-none cursor-pointer">
          <Span peso="medium" className="text-xs sm:text-sm text-white shrink">
            {mensaje}
          </Span>
          <Pressable
            role="button"
            accessibilityLabel="Cerrar"
            onPress={cerrar}
            onHoverIn={() => setXEnHover(true)}
            onHoverOut={() => setXEnHover(false)}
            className="p-1 outline-none cursor-pointer select-none"
          >
            <Text
              style={fuente("bold")}
              className={`text-lg leading-none ${xEnHover ? "text-stone-200" : "text-white"}`}
            >
              ×
            </Text>
          </Pressable>
        </View>
      </Animated.View>
    </View>
  );
}
