"use client";

import { useEffect, useState } from "react";

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
    <div className="flex items-start gap-3 bg-[var(--color-primary-50)] border border-[var(--color-primary-300)] rounded-xl px-4 py-3 w-full">
      <div className="flex-shrink-0 w-6 h-6 bg-[var(--color-neutral-800)] rounded-full flex items-center justify-center mt-0.5">
        <span className="text-white text-xs font-bold">i</span>
      </div>
      <div className="flex flex-col gap-0.5">
        <span className="text-sm font-semibold text-[var(--color-neutral-900)]">{banner.title}</span>
        <span className="text-xs text-[var(--color-neutral-500)] leading-relaxed">{banner.description}</span>
      </div>
    </div>
  );
}
