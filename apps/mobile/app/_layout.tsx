import { router, Stack, Tabs } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import * as SplashScreen from "expo-splash-screen";
import { useEffect } from "react";
import {
  useFonts,
  PlusJakartaSans_200ExtraLight,
  PlusJakartaSans_300Light,
  PlusJakartaSans_400Regular,
  PlusJakartaSans_500Medium,
  PlusJakartaSans_600SemiBold,
  PlusJakartaSans_700Bold,
  PlusJakartaSans_800ExtraBold,
} from "@expo-google-fonts/plus-jakarta-sans";

import { registrarManejadorSesionInvalida } from "@akindo/shared/sesion";
import { invalidarIdsCarrito } from "@akindo/shared/carrito-context";
import { borrarSesion } from "@/utils/session";

import "../global.css";

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  // Las claves de este objeto son los nombres de familia que despues usa
  // nativewind. Tienen que coincidir con packages/ui/tailwind-tokens.js, que es
  // de donde tailwind.config.js saca las utilidades font-jakarta-*.
  const [fontsCargadas, errorFuentes] = useFonts({
    PlusJakartaSans_200ExtraLight,
    PlusJakartaSans_300Light,
    PlusJakartaSans_400Regular,
    PlusJakartaSans_500Medium,
    PlusJakartaSans_600SemiBold,
    PlusJakartaSans_700Bold,
    PlusJakartaSans_800ExtraBold,
  });

  // Equivalente del `conSesion` de web (`redirect("/login")`): acá el núcleo
  // lanza `TokenExpiradoError` dentro de la pantalla, donde el `catch` solo
  // apaga una sección, así que el token vencido se atiende en un solo lugar.
  useEffect(() => registrarManejadorSesionInvalida(() => {
    borrarSesion();
    invalidarIdsCarrito();
    router.replace("/login");
  }), []);

  useEffect(() => {
    if (fontsCargadas || errorFuentes) {
      SplashScreen.hideAsync();
    }
  }, [fontsCargadas, errorFuentes]);

  // Sin esto se ve un parpadeo con la fuente del sistema antes de la propia.
  if (!fontsCargadas && !errorFuentes) return null;

  return (
    <SafeAreaView style={{ flex: 1}}>
      <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: "#FFFFFF" } }}>
        {/* Espejo nativo de @modal/(.)nosession en web: se presenta encima de
            la pantalla de la que vino el usuario con fondo transparente, y la
            propia pantalla (app/nosession.tsx) anima su entrada/salida, así
            que acá se apaga la transición nativa del Stack. */}
        <Stack.Screen
          name="nosession"
          options={{ presentation: "transparentModal", animation: "none" }}
        />
      </Stack>
    </SafeAreaView>
  );
}
