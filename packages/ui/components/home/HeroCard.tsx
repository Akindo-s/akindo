/** @jsxImportSource nativewind */
"use client";

import { useEffect, useRef, useState } from "react";
import { Animated, Easing, Image, Platform, View, type ImageSourcePropType } from "react-native";
import { Users } from "lucide-react-native";
import { H2, P, Span } from "../html-elements";
import { Link } from "../link";
import { Degradado } from "../ui/Degradado";

const DRIVER_NATIVO = Platform.OS !== "web";
// Curva y duración del `transition-opacity` de Tailwind.
const EASE_TRANSICION = Easing.bezier(0.4, 0, 0.2, 1);

interface HeroCardProps {
  /** Web: `{ uri: "/fondo-inicio.png" }`. Mobile: el `require` del asset. */
  imagen?: ImageSourcePropType;
}
const badges = [
  "Calidad Premium",
  "Variedad de productos",
  "Productos cachanillas"
]
function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

export function HeroCard({ imagen }: HeroCardProps) {
  const [badge, setBadge] = useState("");
  useEffect(() => {
    let isMounted = true;

    (async function () {
      while (isMounted) {
        for (let i = 0; i < badges.length; i++) {
          if (!isMounted) break;

          let currentWord = "";

          // Escribir hacia adelante
          for (const char of badges[i].split("")) {
            if (!isMounted) break;
            currentWord += char;
            setBadge(currentWord);
            await sleep(100);
          }

          if (!isMounted) break;
          await sleep(2000);

          // Borrar hacia atrás
          for (let j = currentWord.length; j > 0; j--) {
            if (!isMounted) break;
            currentWord = currentWord.slice(0, -1);
            setBadge(currentWord);
            await sleep(50);
          }

          if (!isMounted) break;
          await sleep(500);
        }
      }
    })();

    // Cleanup: detener el ciclo si el componente se desmonta
    return () => {
      isMounted = false;
    };
  }, []);

  // `opacity-0` / `opacity-100` con `transition-opacity`.
  const visible = badge.length > 0;
  const opacidad = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(opacidad, { toValue: visible ? 1 : 0, duration: 150, easing: EASE_TRANSICION, useNativeDriver: DRIVER_NATIVO }).start();
  }, [visible, opacidad]);

  return (
    <View className="relative w-full rounded-2xl overflow-hidden min-h-[280px] md:min-h-[360px] flex flex-col justify-between bg-[#565045]">
      {/* Imagen de fondo */}
      {imagen && (
        <Image
          source={imagen}
          accessibilityLabel="Mercado Akindo"
          resizeMode="cover"
          className="absolute inset-0 w-full h-full"
        />
      )}

      {/* bg-gradient-to-t from-black/80 via-black/40 to-transparent */}
      <Degradado
        direccion="to-t"
        paradas={[
          { offset: 0, color: "#000000", opacity: 0.8 },
          { offset: 0.5, color: "#000000", opacity: 0.4 },
          { offset: 1, color: "#000000", opacity: 0 },
        ]}
      />

      {/* Badge */}
      <View className="relative p-4 z-10 flex flex-row gap-6 flex-wrap">
        {/* Animated.View no acepta className: el estilo va en el View de adentro. */}
        <Animated.View style={{ opacity: opacidad }}>
          <View className="bg-[#9E7517] px-3 py-1 rounded-md select-none">
            {/* tracking-widest = 0.1em; a 10px son 1px, y así no depende de
                cómo resuelva `em` cada plataforma. */}
            <Span peso="bold" className="text-[10px] leading-normal uppercase tracking-[1px] text-white">
              {badge}
            </Span>
          </View>
        </Animated.View>
      </View>

      {/* Contenido */}
      <View className="relative z-10 p-5 flex flex-col gap-3">
        <H2 peso="bold" className="text-xl text-white leading-tight">
          El lugar de referencia para el comercio centrado en la calidad.
        </H2>
        <P className="text-xs text-stone-300 leading-relaxed max-w-[300px]">
          Conéctate con distribuidores de primer nivel y gestiona pedidos al por mayor sin complicaciones.
        </P>
        <View className="flex flex-row gap-6">
          <Link
            href="https://akindolandingpage.vercel.app"
            bloque
            className="flex flex-row items-center gap-2 self-start bg-[#DAA520] hover:bg-[#C1901D] px-5 py-2.5 rounded-xl transition shadow-md hover:shadow-lg select-none"
          >
            <Users size={16} color="#FFFFFF" />
            <Span peso="medium" className="text-xs text-white">
              Conocenos
            </Span>
          </Link>
        </View>
      </View>
    </View>
  );
}
