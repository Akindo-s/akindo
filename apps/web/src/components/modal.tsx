// components/Modal.tsx
"use client";

import { useRouter } from "next/navigation";
import { LogIn, Store, X } from "lucide-react";
import Image from "next/image";
import { Boton } from "@akindo/ui/components/button";

/**
 * Modal de "necesitas sesión": se muestra sobre la ruta protegida que el
 * usuario intentó visitar (interceptada via @modal/(.)nosession). No bloquea
 * el flujo: puede iniciar sesión o seguir explorando el mercado sin cuenta.
 */
export default function Modal() {
  const router = useRouter();
  const cerrar = () => router.back();

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-stone-900/50 backdrop-blur-sm p-4"
      onClick={cerrar}
    >
      <div
        className="relative w-full max-w-sm overflow-hidden rounded-3xl bg-white p-6 pb-16 shadow-xl z-20"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          aria-label="Cerrar"
          onClick={cerrar}
          className="absolute top-4 right-4 z-10 rounded-full p-1 text-stone-400 transition hover:bg-stone-100 hover:text-stone-600"
        >
          <X size={20} />
        </button>

        <div className="flex flex-col items-center text-center">
          

          <h2 className="mb-2 text-2xl font-bold text-stone-900">
            Necesitas iniciar sesión
          </h2>
          <p className="mb-8 text-sm text-stone-500">
            Para hacer esto necesitas una cuenta en Akindo. Si prefieres,
            puedes seguir explorando el mercado sin iniciar sesión.
          </p>

          <div className="flex w-full flex-col gap-3">
            {/* onClick con navegación dura y no `href` (que usaría el <Link>
                del Boton): Next no limpia el slot del modal al navegar hacia
                adelante desde una ruta interceptada (bug de parallel routes),
                así que el modal queda pegado encima de /login. Una
                navegación completa sí lo resetea. */}
            <Boton
              variante="primario"
              onClick={() => { window.location.href = "/login"; }}
            >
              Iniciar sesión
            </Boton>
            <hr className="border-surface" />
            <Boton
              variante="oscuro"
              onClick={cerrar}
              Icono={Store}
            //   className="flex w-full items-center justify-center gap-2 rounded-xl border border-stone-200 px-4 py-2.5 text-sm font-medium text-stone-600 transition hover:bg-stone-50"
            >
              
              Seguir explorando el mercado
            </Boton>
          </div>
        </div>

        <Image
          src="/icono.png"
          alt="Akindo"
          width={50}
          height={50}
          preload
          
          className="pointer-events-none absolute top-0 left-0  opacity-70 h-auto w-full blur-3xl saturate-200 -z-10"
        />
         <Image
          src="/icono.png"
          alt="Akindo"
          width={300}
          height={300}
          preload
          
          className="pointer-events-none absolute -bottom-20 -right-40  opacity-50 h-full w-auto -z-10"
        />
      </div>
    </div>
  );
}
