import { Stack } from "expo-router";
import { ImageBackground, ScrollView } from "react-native";

// Estilos copiados de apps/web/src/app/(auth)/layout.tsx: el <main> con
// `.registro-fondo` (imagen en cover y centrada, ver registro/global.css) que
// centra la tarjeta y scrollea si no entra.
const fondo = require("../../assets/images/fondo-registro.jpg");

export default function AuthLayout() {
  return (
    <ImageBackground source={fondo} resizeMode="cover" className="flex-1 w-full">
      <Stack
        screenOptions={{ headerShown: false, contentStyle: { backgroundColor: "transparent" } }}
        // En web el que scrollea y centra es el <main> del layout; aca cada
        // pantalla del grupo recibe el mismo wrapper.
        screenLayout={({ children }) => (
          <ScrollView
            className="flex-1"
            contentContainerClassName="flex-grow items-center justify-center p-4 py-8"
            // Sin esto, con el teclado abierto el primer toque en "Iniciar
            // Sesion" solo cierra el teclado; en web el click va directo.
            keyboardShouldPersistTaps="handled"
          >
            {children}
          </ScrollView>
        )}
      />
    </ImageBackground>
  );
}
