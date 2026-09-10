import { Stack } from "expo-router";
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
} from "@expo-google-fonts/plus-jakarta-sans";

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
  });

  useEffect(() => {
    if (fontsCargadas || errorFuentes) {
      SplashScreen.hideAsync();
    }
  }, [fontsCargadas, errorFuentes]);

  // Sin esto se ve un parpadeo con la fuente del sistema antes de la propia.
  if (!fontsCargadas && !errorFuentes) return null;

  return (
    <SafeAreaView style={{ flex: 1}}>
      <Stack screenOptions={{ headerShown: false ,contentStyle:{backgroundColor:'red'}}}/>
    </SafeAreaView>
  );
}
