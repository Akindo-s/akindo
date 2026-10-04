import { Stack } from "expo-router";
import { ImageBackground, ScrollView } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ThemeProvider, DefaultTheme } from "expo-router";

const transparent = {
  ...DefaultTheme,
  colors: { ...DefaultTheme.colors, background: "transparent" },
};
// Estilos copiados de apps/web/src/app/(auth)/layout.tsx: el <main> con
// `.registro-fondo` (imagen en cover y centrada, ver registro/global.css) que
// centra la tarjeta y scrollea si no entra.
const fondo = require("../../assets/images/fondo-registro.jpg");

export default function AuthLayout() {
  const insets = useSafeAreaInsets();
  return (
    <ThemeProvider value={transparent}>
    <ImageBackground
      source={fondo}
      style={{ flex: 1,width:'auto',height:"auto" }}
      resizeMode="cover">
      <Stack
        screenOptions={{ headerShown:false, contentStyle: { backgroundColor: "transparent" } }}
        
        screenLayout={({ children }) => (
          <ScrollView
          className="flex-1"
          contentContainerClassName="flex-grow items-center justify-center p-4 py-8 "
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{ paddingTop: insets.top + 32, paddingBottom: insets.bottom + 32 }}
          >
            {children}
          </ScrollView>
        )}
        />
    </ImageBackground>
    </ThemeProvider>
  );
}
