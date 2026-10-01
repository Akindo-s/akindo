"use client";

import Image from "next/image";
import { LogIn, Store } from "lucide-react";
import { Boton } from "@akindo/ui/components/button";

/**
 * Version de pagina completa de components/modal.tsx: Next usa esta cuando
 * se entra a /nosession directo (recarga, link externo, redirect del
 * middleware), caso en el que @modal/(.)nosession no intercepta nada.
 */
export default function NoSessionPage() {
    return (
        <main className="flex h-dvh w-full items-center justify-center bg-surface p-4 bg-[#f9e4ca]">
            
            <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 "
      
    >
      <div
        className="relative w-full max-w-sm  rounded-3xl bg-white/50 backdrop-blur-md p-6 pb-16 shadow-xl z-20"
        onClick={(e) => e.stopPropagation()}
      >
       
        <div className="flex flex-col items-center text-center">
          

          <h2 className="mb-2 text-2xl font-bold text-stone-900">
            Necesitas iniciar sesión
          </h2>
          <p className="mb-8 text-sm text-stone-500">
            Para hacer esto necesitas una cuenta en Akindo. Si prefieres,
            puedes seguir explorando el mercado sin iniciar sesión.
          </p>

          <div className="flex w-full flex-col gap-3">
           
            <Boton
              variante="primario"
              href="/login"
            >
              Iniciar sesión
            </Boton>
            <hr className="border-surface" />
            <Boton
              variante="oscuro"
              href="/mercado"
              Icono={Store}
            //   className="flex w-full items-center justify-center gap-2 rounded-xl border border-stone-200 px-4 py-2.5 text-sm font-medium text-stone-600 transition hover:bg-stone-50"
            >
              
              Explorar el mercado
            </Boton>
          </div>
        </div>

        {/* <Image
          src="/icono.png"
          alt="Akindo"
          width={50}
          height={50}
          className="pointer-events-none absolute top-0 left-0  opacity-70 h-auto w-full blur-3xl saturate-200 -z-10"
        /> */}
      </div>
         <Image
          src="/icono.png"
          alt="Akindo"
          width={300}
          height={300}
          
          className="pointer-events-none absolute  opacity-50 h-full w-full blur-lg -z-20 object-cover"
        />
    </div>
        </main>
    );
}
