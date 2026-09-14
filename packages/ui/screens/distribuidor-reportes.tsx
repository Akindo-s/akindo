/** @jsxImportSource nativewind */
"use client";

import { View } from "react-native";
import { P } from "@akindo/ui/html";

/**
 * Reportes del distribuidor. En web el `page.tsx` pintaba el placeholder
 * directo (no envolvía a ningún componente), así que se convierte en pantalla.
 */
export default function DistribuidorReportes() {
  return (
    // El texto va en un `P`: nativo no admite texto suelto en un View. `text-sm`
    // trae su propio line-height; el div original tenía 20px por la misma clase.
    <View className="flex items-center justify-center min-h-screen">
      <P className="text-stone-400 text-sm">Reportes — próximamente</P>
    </View>
  );
}
