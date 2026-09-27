/** @jsxImportSource nativewind */
"use client";

import { useEffect, useState } from "react";
import { View } from "react-native";
import { Span } from "../html-elements";

interface BannerData {
  title: string;
  description: string;
}

// Simulación de fetch al backend — reemplazar cuando el endpoint esté listo
async function fetchBanner(): Promise<BannerData | null> {
  // Simula un banner activo
  return {
    title: "TIENDA EN BETA",
    description: "actualmente la tienda esta en desarrllo, ESTOS SON PRODUCTOS DE PRUEBA SOLAMENTE",
  };
}

export function InfoBanner() {
  const [banner, setBanner] = useState<BannerData | null>(null);

  useEffect(() => {
    fetchBanner().then(setBanner);
  }, []);

  if (!banner) return null;

  return (
    <View className="flex flex-row items-start gap-3 bg-[#FFFBF0] border border-[#F0D275] rounded-xl px-4 py-3 w-full">
      <View className="flex-shrink-0 w-6 h-6 bg-[#403B34] rounded-full flex items-center justify-center mt-0.5">
        <Span peso="bold" className="text-white text-xs">i</Span>
      </View>
      {/* `shrink`: en CSS un flex item se encoge solo; en RN no (flexShrink 0). */}
      <View className="flex flex-col gap-0.5 shrink">
        <Span peso="semibold" className="text-sm text-[#2B2722]">{banner.title}</Span>
        <Span className="text-xs text-[#7E766A] leading-relaxed">{banner.description}</Span>
      </View>
    </View>
  );
}
