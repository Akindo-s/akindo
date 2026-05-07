'use client'
import { UsersIcon } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

interface HeroCardProps {
  imageSrc?: string;
}
const badges = [
  "Calidad Premium",
  "Variedad de productos",
  "Productos cachanillas"
]
function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

export function HeroCard({ imageSrc }: HeroCardProps) {
  const [badge, setBadge] = useState("");
  useEffect(() => {
    let isMounted = true;

    (async function () {
      while (isMounted) {
        for (let i = 0; i < badges.length; i++) {
          if (!isMounted) break;

          let currentWord = "";

          // Escribir hacia adelante
          for (const char of badges[i].split("")) {
            if (!isMounted) break;
            currentWord += char;
            setBadge(currentWord);
            await sleep(100);
          }

          if (!isMounted) break;
          await sleep(2000);

          // Borrar hacia atrás
          for (let j = currentWord.length; j > 0; j--) {
            if (!isMounted) break;
            currentWord = currentWord.slice(0, -1);
            setBadge(currentWord);
            await sleep(50);
          }

          if (!isMounted) break;
          await sleep(500);
        }
      }
    })();

    // Cleanup: detener el ciclo si el componente se desmonta
    return () => {
      isMounted = false;
    };
  }, []);
  return (
    <div className="relative w-full rounded-2xl overflow-hidden min-h-[280px] md:min-h-[360px] h-fit flex flex-col justify-between bg-[var(--color-neutral-700)]">
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
      <div className="relative p-4 z-10 flex flex-row gap-6 opacity-100 flex-wrap">
        <span className={`${badge.length === 0 ? "opacity-0" : "opacity-100"} transition-opacity h-5.5 text-[10px] font-bold uppercase tracking-widest bg-[var(--color-primary-700)] text-white px-3 py-1 rounded-md select-none text-nowrap`}>
          {badge}
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
        <div className="flex flex-row gap-6">

          
          <Link
            href="/sobrenosotros"
            className="flex flex-row items-center gap-2 self-start bg-[var(--color-primary-500)] hover:bg-[var(--color-primary-600)] text-white text-xs font-medium px-5 py-2.5 rounded-xl transition shadow-md hover:shadow-lg select-none"
          >
            <UsersIcon className="w-fit h-4"/>
            <span className="text-xs">
            Conocenos
            </span>
          </Link>
        </div>
      </div>
    </div>
  );
}
