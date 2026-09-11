/** @jsxImportSource nativewind */
"use client";

import { useEffect, useId, useRef, useState } from "react";
import { Animated, Easing, Platform, View } from "react-native";
import { fuente } from "../../fonts";
import { Defs, LinearGradient, Rect, Stop, Svg } from "../html-elements";

interface ProgressBarProps {
  currentStep: number;
  totalSteps: number;
  labels?: string[];
}

/** react-native-web no tiene driver nativo. */
const DRIVER_NATIVO = Platform.OS !== "web";
/** `ease-[cubic-bezier(0.34,1.56,0.64,1)]` del relleno: se pasa del objetivo y vuelve. */
const REBOTE = Easing.bezier(0.34, 1.56, 0.64, 1);
/** `ease`, el timing por defecto de una animacion CSS (el brillo). */
const EASE = Easing.bezier(0.25, 0.1, 0.25, 1);
/** `ease-out` de Tailwind (los puntos). */
const EASE_OUT = Easing.bezier(0, 0, 0.2, 1);
/** Timing por defecto de `transition-colors` en Tailwind (las etiquetas). */
const EASE_TRANSICION = Easing.bezier(0.4, 0, 0.2, 1);

const DORADO = "#DAA520";
const STONE_300 = "#D6D3D1";
const STONE_200 = "#E7E5E4";

/**
 * Barra de progreso por pasos.
 *
 * La version web se apoyaba en CSS que React Native no tiene: `linear-gradient`
 * de fondo, transiciones y un `@keyframes shimmer` que movia el
 * `background-position`. Aca los degradados se dibujan con SVG y todo lo que
 * se mueve va con `Animated`, asi se ve y se anima igual en las dos
 * plataformas:
 *
 * - el relleno va al porcentaje del paso en 700ms con la misma curva con rebote;
 * - el brillo es el mismo patron repetido (un degradado blanco del doble del
 *   ancho del relleno) corriendose 4 anchos hacia la izquierda cada 1.8s;
 * - los puntos y las etiquetas cambian de color (y los puntos de tamaño y
 *   brillo) con sus mismas duraciones.
 */
export function ProgressBar({ currentStep, totalSteps, labels = [] }: ProgressBarProps) {
  const percent = Math.round((currentStep / totalSteps) * 100);
  // useId trae caracteres que no sirven en un `url(#...)` de SVG.
  const id = useId().replace(/[^a-zA-Z0-9_-]/g, "");

  // Relleno. Arranca en su valor: una transicion CSS no anima el primer render.
  const progreso = useRef(new Animated.Value(percent)).current;
  useEffect(() => {
    Animated.timing(progreso, { toValue: percent, duration: 700, easing: REBOTE, useNativeDriver: false }).start();
  }, [percent, progreso]);
  const anchoRelleno = progreso.interpolate({ inputRange: [0, 100], outputRange: ["0%", "100%"] });

  // Brillo. Su ancho cambia de golpe (en el original no tenia transicion).
  const [anchoPista, setAnchoPista] = useState(0);
  const anchoBrillo = (anchoPista * percent) / 100;
  const brillo = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    if (anchoBrillo <= 0) return;
    brillo.setValue(0);
    const bucle = Animated.loop(
      Animated.timing(brillo, { toValue: 1, duration: 1800, easing: EASE, useNativeDriver: DRIVER_NATIVO }),
    );
    bucle.start();
    return () => bucle.stop();
  }, [anchoBrillo, brillo]);

  return (
    <View className="w-full flex flex-col gap-2 mb-4">
      {labels.length > 0 && (
        <View className="flex flex-row justify-between px-0.5">
          {labels.map((label, i) => (
            <Etiqueta key={i} texto={label} activa={i <= currentStep} />
          ))}
        </View>
      )}

      <View
        onLayout={(e) => setAnchoPista(e.nativeEvent.layout.width)}
        className="relative w-full h-2 bg-stone-100 rounded-full overflow-hidden"
      >
        <Animated.View
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            height: "100%",
            width: anchoRelleno,
            borderRadius: 9999,
            boxShadow: "0px 0px 8px 1px rgba(218, 165, 32, 0.45)",
          }}
        >
          <Svg width="100%" height="100%">
            <Defs>
              <LinearGradient id={`relleno${id}`} x1="0" y1="0" x2="1" y2="0">
                <Stop offset="0" stopColor="#F0D275" />
                <Stop offset="0.6" stopColor="#DAA520" />
                <Stop offset="1" stopColor="#C1901D" />
              </LinearGradient>
            </Defs>
            {/* rx 4 = rounded-full sobre los 8px de alto de la pista. */}
            <Rect width="100%" height="100%" rx={4} fill={`url(#relleno${id})`} />
          </Svg>
        </Animated.View>

        {anchoBrillo > 0 && (
          <View
            style={{ width: anchoBrillo }}
            className="absolute top-0 left-0 h-full rounded-full overflow-hidden opacity-60"
          >
            <Animated.View
              style={{
                width: anchoBrillo * 8,
                height: "100%",
                transform: [
                  { translateX: brillo.interpolate({ inputRange: [0, 1], outputRange: [0, -4 * anchoBrillo] }) },
                ],
              }}
            >
              <Svg width={anchoBrillo * 8} height="100%">
                <Defs>
                  {/* Blanco con opacidad 0 y no `transparent`: SVG interpola sin
                      premultiplicar y el negro transparente ensuciaria el medio. */}
                  <LinearGradient id={`brillo${id}`} x1="0" y1="0" x2="1" y2="0">
                    <Stop offset="0" stopColor="#FFFFFF" stopOpacity={0} />
                    <Stop offset="0.5" stopColor="#FFFFFF" stopOpacity={0.5} />
                    <Stop offset="1" stopColor="#FFFFFF" stopOpacity={0} />
                  </LinearGradient>
                </Defs>
                {[0, 1, 2, 3].map((k) => (
                  <Rect key={k} x={k * 2 * anchoBrillo} width={2 * anchoBrillo} height="100%" fill={`url(#brillo${id})`} />
                ))}
              </Svg>
            </Animated.View>
          </View>
        )}
      </View>

      <View className="flex flex-row justify-between px-0.5">
        {Array.from({ length: totalSteps + 1 }).map((_, i) => (
          <Punto key={i} activo={i <= currentStep} />
        ))}
      </View>
    </View>
  );
}

/** `text-[10px] font-semibold uppercase tracking-wider` + `transition-colors duration-300`. */
function Etiqueta({ texto, activa }: { texto: string; activa: boolean }) {
  const valor = useRef(new Animated.Value(activa ? 1 : 0)).current;
  useEffect(() => {
    Animated.timing(valor, { toValue: activa ? 1 : 0, duration: 300, easing: EASE_TRANSICION, useNativeDriver: false }).start();
  }, [activa, valor]);

  return (
    <Animated.Text
      style={[
        fuente("semibold"),
        {
          fontSize: 10,
          // En web el span heredaba line-height 1.5 del body.
          lineHeight: 15,
          letterSpacing: 0.5,
          textTransform: "uppercase",
          color: valor.interpolate({ inputRange: [0, 1], outputRange: [STONE_300, DORADO] }),
        },
      ]}
    >
      {texto}
    </Animated.Text>
  );
}

/** `w-2 h-2 rounded-full` + `transition-all duration-500 ease-out`; activo: dorado, scale-125 y brillo. */
function Punto({ activo }: { activo: boolean }) {
  const valor = useRef(new Animated.Value(activo ? 1 : 0)).current;
  useEffect(() => {
    Animated.timing(valor, { toValue: activo ? 1 : 0, duration: 500, easing: EASE_OUT, useNativeDriver: false }).start();
  }, [activo, valor]);

  return (
    <Animated.View
      style={{
        width: 8,
        height: 8,
        borderRadius: 9999,
        backgroundColor: valor.interpolate({ inputRange: [0, 1], outputRange: [STONE_200, DORADO] }),
        transform: [{ scale: valor.interpolate({ inputRange: [0, 1], outputRange: [1, 1.25] }) }],
      }}
    >
      {/* El brillo es una capa con la sombra fija que aparece por opacidad:
          interpolar el string de `boxShadow` rompe en react-native-web (se
          queda solo con el color). */}
      <Animated.View
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          borderRadius: 9999,
          boxShadow: "0px 0px 6px 2px rgba(218, 165, 32, 0.4)",
          opacity: valor,
        }}
      />
    </Animated.View>
  );
}
