import Link from "next/link";

interface HeroCardProps {
  imageSrc?: string;
}

export function HeroCard({ imageSrc }: HeroCardProps) {
  return (
    <div className="relative w-full rounded-2xl overflow-hidden min-h-[280px] md:min-h-[360px] flex flex-col justify-end bg-[var(--color-neutral-700)]">
      {/* Imagen de fondo */}
      {imageSrc && (
        <img
          src={imageSrc}
          alt="Mercado Akindo"
          className="absolute inset-0 w-full h-full object-cover"
        />
      )}

      {/* Overlay gradient */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />

      {/* Badge */}
      <div className="absolute top-4 left-4 z-10">
        <span className="text-[10px] font-bold uppercase tracking-widest bg-[var(--color-primary-500)] text-white px-3 py-1 rounded-md select-none">
          Calidad Premium
        </span>
      </div>

      {/* Contenido */}
      <div className="relative z-10 p-5 flex flex-col gap-3">
        <h2 className="text-xl font-bold text-white leading-tight">
          El lugar de referencia para el comercio centrado en la calidad.
        </h2>
        <p className="text-xs text-stone-300 leading-relaxed max-w-[300px]">
          Conéctate con distribuidores de primer nivel y gestiona pedidos al por mayor sin complicaciones.
        </p>
        <Link
          href="/catalogo"
          className="self-start bg-[var(--color-primary-500)] hover:bg-[var(--color-primary-600)] text-white text-xs font-medium px-5 py-2.5 rounded-xl transition shadow-md hover:shadow-lg select-none"
        >
          Explora el Mercado
        </Link>
      </div>
    </div>
  );
}
