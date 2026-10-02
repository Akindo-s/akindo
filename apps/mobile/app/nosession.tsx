import { useCallback, useEffect, useState } from "react";
import { Animated, Easing, Image, ImageBackground, ImageBackgroundComponent, ImageComponent, Platform, View } from "react-native";
import { router } from "expo-router";
import { Store, X } from "lucide-react-native";
import { Boton } from "@akindo/ui/components/button";
import { A, H2, P, Pressable } from "@akindo/ui/html";

/**
 * Espejo nativo de apps/web/src/components/modal.tsx: se abre en vez de la
 * ruta protegida cuando no hay sesión (ver (protected)/_layout.tsx) con
 * `presentation: "transparentModal"` (registrado en app/_layout.tsx), así la
 * pantalla de abajo (de donde vino el usuario) se sigue viendo detrás. Web
 * logra lo mismo con una ruta interceptada (@modal/(.)nosession); acá no
 * existe ese mecanismo, así que la transición la maneja este componente con
 * `Animated` en vez de clases de transición CSS.
 */
const DURACION_ENTRADA = 400;
const DURACION_SALIDA = 250;
const EASE_OUT = Easing.bezier(0, 0, 0.2, 1);
const EASE_IN = Easing.bezier(0.4, 0, 1, 1);
/** react-native-web no tiene driver nativo; pedirlo en web solo tira un warning. */
const DRIVER_NATIVO = Platform.OS !== "web";

const LANDING_URL = "https://akindolandingpage.vercel.app/";
// Versión liviana (256px, ~57KB) del ícono completo (assets/images/icono-akindo.png,
// 512px, ~143KB) que se usa para generar icon.png/splash/etc. Acá solo decora
// a opacity-20 de fondo, así que no hace falta cargar/decodificar la fuente
// completa.
const fondoDecorativo = require("../assets/images/icono-akindo-decorativo.png");

export default function NoSessionModal() {
  // 0 = oculto (backdrop transparente, tarjeta achicada y corrida abajo),
  // 1 = visible. Mismos valores que el `animate` de web, pero como progreso
  // continuo en vez de una clase booleana. `useState` y no `useRef`: leer un
  // ref durante el render dispara `react-hooks/refs`, y un `Animated.Value`
  // no necesita re-render para propagar sus cambios (los consume el nodo
  // nativo directo), así que `useState` guarda la misma identidad estable sin
  // ese problema.
  const [progreso] = useState(() => new Animated.Value(0));

  useEffect(() => {
    Animated.timing(progreso, {
      toValue: 1,
      duration: DURACION_ENTRADA,
      easing: EASE_OUT,
      useNativeDriver: DRIVER_NATIVO,
    }).start();
  }, [progreso]);

  // Si no hay pantalla previa en el stack (ej. deep link directo a una ruta
  // protegida), no hay a dónde volver: cae a /mercado, el mismo destino al
  // que manda "Explorar el mercado".
  const cerrar = useCallback(() => {
    Animated.timing(progreso, {
      toValue: 0,
      duration: DURACION_SALIDA,
      easing: EASE_IN,
      useNativeDriver: DRIVER_NATIVO,
    }).start(({ finished }) => {
      if (!finished) return;
      if (router.canGoBack()) router.back();
      else router.replace("/mercado");
    });
  }, [progreso]);

  const irALogin = useCallback(() => {
    // Reemplaza en vez de apilar: volver atrás desde /login no debe caer de
    // nuevo en este modal.
    router.replace("/login");
  }, []);

  const escala = progreso.interpolate({ inputRange: [0, 1], outputRange: [1.5, 1] });
  const traslado = progreso.interpolate({ inputRange: [0, 1], outputRange: [40, 0] });

  return (
    <View className="absolute web:fixed inset-0 z-50 elevation-[50] flex items-center justify-center p-4">
      {/* Animated.View no tiene cssInterop (ver VentanaEmergente.tsx): anima
          solo opacity/transform y el estilo visual va en el View de adentro. */}
      <Animated.View
        pointerEvents="none"
        style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0, opacity: progreso }}
        
      >
        <View className="flex-1  bg-[#ffcb72]" />
      </Animated.View>
      {/* Toque afuera de la tarjeta cierra; se dibuja encima del fondo pero
          debajo de la tarjeta (orden de hermanos = z-order en nativo). */}
      <Pressable className="absolute inset-0" onPress={cerrar} accessibilityLabel="Cerrar" />

      <Animated.View
        style={{
          opacity: progreso,
          transform: [{ translateY: traslado }, { scale: escala }],
        }}
      >
        <View className="relative z-10 w-full max-w-full">
          <View className="relative w-full overflow-hidden rounded-3xl bg-white p-6 pb-10 shadow-xl">
            
            

            <Pressable
              role="button"
              accessibilityLabel="Cerrar"
              onPress={cerrar}
              className="absolute top-4 right-4 z-10 rounded-full p-1"
            >
              <X size={20} color="#A8A29E" />
            </Pressable>

            <View className="flex flex-col items-center">
              <H2 peso="bold" className="mb-2 text-2xl text-stone-900 text-center">
                Necesitas iniciar sesión
              </H2>
              <P className="mb-8 text-sm text-stone-500 text-center">
                Para hacer esto necesitas una cuenta en Akindo. Si prefieres,
                puedes seguir explorando el mercado sin iniciar sesión.
              </P>

              <View className="flex w-full flex-col gap-3">
                <Boton variante="primario" onClick={irALogin}>
                  Iniciar sesión
                </Boton>
                {/* Web usa `border-surface` en el <hr>, pero ese token no está
                    definido en ningún lado (ver apps/web/src/components/modal.tsx):
                    el divisor le sale invisible. Acá sí se ve. */}
                <View className="h-px w-full bg-stone-200" />
                <Boton variante="oscuro" onClick={cerrar} Icono={Store}>
                  Ir al mercado
                </Boton>
              </View>
            </View>
          </View>

          <View className="mt-4 w-full rounded-3xl bg-white/90 p-5">
            <P className="text-sm text-stone-600 text-center">
              ¿No sabes qué haces aquí? ¿No conoces Akindo?{" "}
              <A
                href={LANDING_URL}
                target="_blank"
                peso="semibold"
                className="text-stone-900 underline"
              >
                Conócenos aquí
              </A>
            </P>
          </View>
        </View>
      </Animated.View>
    </View>
  );
}
