import { MercadoBuscador } from "@/components/mercado/MercadoBuscador";
import { InfoBanner } from "@/components/home/InfoBanner";
import { HeroCard } from "@/components/home/HeroCard";
import { FeaturedCategories } from "@/components/home/FeaturedCategories";
import { Titulo } from "@/components/titles";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Inicio",
};

export default function Home() {
  return (
    <div className="flex flex-col gap-5 px-4 md:px-6 py-5 w-full max-w-2xl lg:max-w-5xl mx-auto">
      {/* Título */}
      <InfoBanner />
      <Titulo className="text-lg font-bold text-[var(--color-neutral-900)]">
        ¿Qué quieres <span className="text-[var(--color-primary-500)]">comprar</span> hoy?
      </Titulo>

      {/* Buscador unificado y filtros */}
      <MercadoBuscador />

      {/* Banner informativo */}

      {/* Hero Card */}
      <HeroCard imageSrc="/fondo-inicio.png"/>

      {/* Categorías destacadas */}
      <FeaturedCategories />
    </div>
  );
}
