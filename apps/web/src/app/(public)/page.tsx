import { SearchBar } from "@/components/home/SearchBar";
import { CategoryChips } from "@/components/home/CategoryChips";
import { InfoBanner } from "@/components/home/InfoBanner";
import { HeroCard } from "@/components/home/HeroCard";
import { FeaturedCategories } from "@/components/home/FeaturedCategories";

export default function Home() {
  return (
    <div className="flex flex-col gap-5 px-4 md:px-6 py-5 w-full max-w-2xl lg:max-w-5xl mx-auto">
      {/* Título */}
      <h1 className="text-lg font-bold text-[var(--color-neutral-900)]">
        ¿Qué quieres <span className="text-[var(--color-primary-500)]">comprar</span> hoy?
      </h1>

      {/* Barra de búsqueda */}
      <SearchBar />

      {/* Chips de categorías */}
      <CategoryChips />

      {/* Banner informativo */}
      <InfoBanner />

      {/* Hero Card */}
      <HeroCard />

      {/* Categorías destacadas */}
      <FeaturedCategories />
    </div>
  );
}
