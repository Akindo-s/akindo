/** @jsxImportSource nativewind */

import type { ReactNode } from "react";
import { twMerge } from "tailwind-merge";
import { Footer } from "../html-elements";

/**
 * Barra de acciones pegada abajo (el "Continuar con el pago" del carrito).
 *
 * En web es `fixed` contra la ventana, como el original: queda por encima del
 * BottomNav, que en pantallas chicas se ve detrás. En nativo `fixed` no existe:
 * con `absolute` queda pegada al fondo de la pantalla, o sea arriba del
 * BottomNav (que ahí vive fuera de la pantalla, en la barra de tabs).
 */
export default function FooterFijo({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <Footer
      className={twMerge(
        "z-50 absolute web:fixed bottom-0 left-0 right-0 md:left-56 lg:left-64 bg-white border-t border-stone-100 px-4 py-3 flex flex-row gap-3 max-w-2xl lg:max-w-2xl mx-auto shadow-[0_-4px_12px_rgba(0,0,0,0.06)] rounded-t-2xl",
        className
      )}
    >
      {children}
    </Footer>
  );
}
